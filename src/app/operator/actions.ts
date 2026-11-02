"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { must, supabase } from "@/lib/supabase";
import { portalDb } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { operatorKey } from "@/lib/operator";
import { inviteEmail, normEmail, revokeEmail } from "@/lib/invites";
import { createSignatureDocuments } from "@/lib/instances";
import { generateInstance } from "@/lib/personalise";
import { createOperatorAccount, endOperatorSession, issueOperatorToken, listOperators, loginOperator, lookupOperatorToken, operatorBySession, removeOperatorAccount, setOperatorPassword, type OperatorRow } from "@/lib/operators";
import { notifyClient } from "@/lib/notify";
import { logActivity } from "@/lib/activity";
import { checkLock, lockMessage, recordFailure, recordSuccess } from "@/lib/ratelimit";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

/** OPERATOR CONSOLE (§18). Access: named operator accounts (email + password; invest@ is the
 * founding SUPERADMIN) OR the legacy shared passphrase, kept as a break-glass fallback. */
const key = operatorKey;
const COOKIE = "cc_operator";
const SESSION_COOKIE = "cc_op_session";

export async function currentOperator(): Promise<{ kind: "account"; operator: OperatorRow } | { kind: "passphrase" } | null> {
  const op = await operatorBySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (op) return { kind: "account", operator: op };
  if ((await cookies()).get(COOKIE)?.value === sha256("op:" + key())) return { kind: "passphrase" };
  return null;
}
export async function isOperator() { return (await currentOperator()) !== null; }
async function guard() { if (!(await isOperator())) redirect("/operator"); }
async function actorName() { const c = await currentOperator(); return c?.kind === "account" ? c.operator.email : "operator (passphrase)"; }

export async function operatorLogin(_: { error?: string }, f: FormData) {
  const rlKey = `operator-ip:${await clientIp()}`;
  const lock = await checkLock(rlKey);
  if (lock.locked) return { error: lockMessage(lock.retryMinutes) };
  if (String(f.get("key") ?? "") !== key()) {
    if (await recordFailure(rlKey)) await logActivity({ actorType: "SYSTEM", action: "LOGIN_LOCKED", detail: "operator passphrase" });
    return { error: "Incorrect passphrase." };
  }
  await recordSuccess(rlKey);
  (await cookies()).set(COOKIE, sha256("op:" + key()), { httpOnly: true, sameSite: "strict", path: "/operator", maxAge: 8 * 3600, secure: process.env.NODE_ENV === "production" });
  await logActivity({ actorType: "OPERATOR", actorEmail: "operator (passphrase)", action: "OPERATOR_LOGIN", detail: "via recovery passphrase" });
  redirect("/operator");
}
export async function operatorAccountLogin(_: { error?: string }, f: FormData) {
  const email = String(f.get("email") ?? "");
  const rlKey = `operator:${email.trim().toLowerCase()}`;
  const lock = await checkLock(rlKey);
  if (lock.locked) return { error: lockMessage(lock.retryMinutes) };
  const r = await loginOperator(email, String(f.get("password") ?? ""));
  if (!r) {
    if (await recordFailure(rlKey)) await logActivity({ actorType: "SYSTEM", action: "LOGIN_LOCKED", detail: `operator ${email.trim().toLowerCase()}` });
    return { error: "Incorrect email or password." };
  }
  await recordSuccess(rlKey);
  (await cookies()).set(SESSION_COOKIE, r.token, { httpOnly: true, sameSite: "strict", path: "/operator", maxAge: 8 * 3600, secure: process.env.NODE_ENV === "production" });
  await logActivity({ actorType: "OPERATOR", actorEmail: email.trim().toLowerCase(), action: "OPERATOR_LOGIN" });
  redirect("/operator");
}
export async function operatorLogout() {
  await endOperatorSession((await cookies()).get(SESSION_COOKIE)?.value);
  (await cookies()).delete(SESSION_COOKIE);
  (await cookies()).delete(COOKIE);
  redirect("/operator");
}
export async function setPasswordAction(token: string, _: { error?: string }, f: FormData) {
  const info = await lookupOperatorToken(token);
  if (!info) return { error: "This link is invalid or has expired. Ask the super admin to issue a new one." };
  const pw = String(f.get("password") ?? "");
  if (pw.length < 12) return { error: "Use at least 12 characters." };
  if (pw !== String(f.get("confirm") ?? "")) return { error: "Passwords do not match." };
  await setOperatorPassword(info.email, pw);
  await logActivity({ actorType: "OPERATOR", actorEmail: info.email, action: "OPERATOR_PASSWORD_SET" });
  redirect("/operator?pwset=1");
}

export async function inviteAction(f: FormData) {
  await guard();
  const target = String(f.get("email") ?? "");
  const r = await inviteEmail(target, await actorName());
  if (!("error" in r)) await logActivity({ actorType: "OPERATOR", actorEmail: await actorName(), clientEmail: normEmail(target), action: "CLIENT_INVITED" });
  redirect("/operator?" + ("error" in r ? "err=" + encodeURIComponent(r.error) : "ok=1"));
}
export async function reissueAction(email: string) { await guard(); await inviteEmail(email, await actorName()); await logActivity({ actorType: "OPERATOR", actorEmail: await actorName(), clientEmail: normEmail(email), action: "CLIENT_INVITE_REISSUED" }); redirect("/operator?ok=1"); }
export async function revokeAction(email: string) { await guard(); await revokeEmail(email); await logActivity({ actorType: "OPERATOR", actorEmail: await actorName(), clientEmail: normEmail(email), action: "CLIENT_REVOKED" }); redirect("/operator"); }

/** Operator creates a commitment for an ONBOARDED client -> generates their personalised Booklet + W-9 packet and queues them for signature (§17.5). */
export async function commitmentAction(f: FormData) {
  await guard();
  const email = normEmail(String(f.get("email") ?? "")); const offering = Number(f.get("offering")); const amount = Math.round(Number(String(f.get("amount") ?? "").replace(/[^0-9.]/g, "")));
  const ent = must(await supabase().from("investing_entities")
    .select("id, clients!inner ( email, onboarding_completed_at )")
    .eq("clients.email", email).not("clients.onboarding_completed_at", "is", null)
    .order("id").limit(1).maybeSingle()) as any;
  if (!ent) redirect("/operator?err=" + encodeURIComponent("That client has not completed onboarding yet — documents cannot be generated."));
  if (!(amount >= 200000)) redirect("/operator?err=" + encodeURIComponent("Minimum commitment is $200,000."));
  const o = must(await supabase().from("offerings").select("id").eq("kind", "new").eq("portal_id", offering).maybeSingle()) as any;
  if (!o) redirect("/operator?err=" + encodeURIComponent("Unknown offering."));
  const c = must(await supabase().from("commitments").insert({ investing_entity_id: ent.id, offering_id: o.id, desired_commitment: amount }).select("id").single()) as any;
  for (const inst of await createSignatureDocuments(portalDb(), c.id)) await generateInstance(portalDb(), inst);
  await logActivity({ actorType: "OPERATOR", actorEmail: await actorName(), clientEmail: email, action: "COMMITMENT_CREATED", detail: `offering ${offering}, $${amount.toLocaleString()}` });
  await notifyClient(email, "Documents awaiting your signature",
    "Your investment documents are ready to sign",
    `Your subscription documents for a $${amount.toLocaleString()} commitment have been prepared and are waiting for your signature in the investor portal.`,
    "Review and sign", "/investor/documents/signatures",
    "Sign in with your portal email and password to review and sign.");
  redirect("/operator?ok=1");
}

/** Staff account management (audit item 18) — super admins (and the recovery
 * passphrase) only; staff accounts can view but not manage operators. */
async function guardSuperAdmin() {
  const me = await currentOperator();
  if (!me || (me.kind === "account" && me.operator.role !== "SUPERADMIN")) redirect("/operator?err=" + encodeURIComponent("Only the super admin can manage staff accounts."));
  return me;
}

export async function addOperatorAction(f: FormData) {
  const me = await guardSuperAdmin();
  const email = String(f.get("email") ?? "");
  const role = String(f.get("role") ?? "STAFF") === "SUPERADMIN" ? "SUPERADMIN" : "STAFF";
  const r = await createOperatorAccount(email, role as "SUPERADMIN" | "STAFF");
  if ("error" in r) redirect("/operator?err=" + encodeURIComponent(r.error));
  await logActivity({ actorType: "OPERATOR", actorEmail: me!.kind === "account" ? me!.operator.email : "operator (passphrase)", action: "OPERATOR_ADDED", detail: `${normEmail(email)} (${role})` });
  redirect("/operator?ok=1");
}

export async function resetOperatorAction(id: number) {
  await guardSuperAdmin();
  const ops = await listOperators();
  const target = ops.find((o) => o.id === id);
  if (!target) redirect("/operator?err=" + encodeURIComponent("Operator not found."));
  const r = await issueOperatorToken(target!.email, "RESET");
  if ("error" in r) redirect("/operator?err=" + encodeURIComponent(r.error));
  await logActivity({ actorType: "OPERATOR", actorEmail: await actorName(), action: "OPERATOR_RESET_SENT", detail: target!.email });
  redirect("/operator?ok=1");
}

export async function removeOperatorAction(id: number) {
  const me = await guardSuperAdmin();
  const ops = await listOperators();
  const target = ops.find((o) => o.id === id);
  if (!target) redirect("/operator?err=" + encodeURIComponent("Operator not found."));
  if (me!.kind === "account" && me!.operator.id === id) redirect("/operator?err=" + encodeURIComponent("You can't remove your own account."));
  if (target!.role === "SUPERADMIN" && ops.filter((o) => o.role === "SUPERADMIN").length <= 1) redirect("/operator?err=" + encodeURIComponent("There must always be at least one super admin."));
  await removeOperatorAccount(id);
  await logActivity({ actorType: "OPERATOR", actorEmail: await actorName(), action: "OPERATOR_REMOVED", detail: target!.email });
  redirect("/operator?ok=1");
}
