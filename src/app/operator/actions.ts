"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { operatorKey } from "@/lib/operator";
import { inviteEmail, normEmail, revokeEmail } from "@/lib/invites";
import { createSignatureDocuments } from "@/lib/instances";
import { generateInstance } from "@/lib/personalise";

/** OPERATOR SIDE IS A STUB (§18: "a minimal operator-only list screen or config file is an acceptable stub"). Not part of the client-facing product. */
const key = operatorKey;
const COOKIE = "cc_operator";
export async function isOperator() { return (await cookies()).get(COOKIE)?.value === sha256("op:" + key()); }
async function guard() { if (!(await isOperator())) redirect("/operator"); }

export async function operatorLogin(_: { error?: string }, f: FormData) {
  if (String(f.get("key") ?? "") !== key()) return { error: "Incorrect passphrase." };
  (await cookies()).set(COOKIE, sha256("op:" + key()), { httpOnly: true, sameSite: "strict", path: "/operator", maxAge: 8 * 3600, secure: process.env.NODE_ENV === "production" });
  redirect("/operator");
}
export async function operatorLogout() { (await cookies()).delete(COOKIE); redirect("/operator"); }

export async function inviteAction(f: FormData) {
  await guard();
  const r = inviteEmail(String(f.get("email") ?? ""), "operator");
  redirect("/operator?" + ("error" in r ? "err=" + encodeURIComponent(r.error) : "ok=1"));
}
export async function reissueAction(email: string) { await guard(); inviteEmail(email, "operator"); redirect("/operator?ok=1"); }
export async function revokeAction(email: string) { await guard(); revokeEmail(email); redirect("/operator"); }

/** Operator creates a commitment for an ONBOARDED client -> generates their personalised Booklet + W-9 packet and queues them for signature (§17.5). */
export async function commitmentAction(f: FormData) {
  await guard();
  const email = normEmail(String(f.get("email") ?? "")); const offering = Number(f.get("offering")); const amount = Math.round(Number(String(f.get("amount") ?? "").replace(/[^0-9.]/g, "")));
  const ent = db().prepare(`SELECT e.id eid FROM investing_entities e JOIN clients c ON c.id = e.client_id WHERE c.email = ? AND c.onboarding_completed_at IS NOT NULL ORDER BY e.id LIMIT 1`).get(email) as any;
  if (!ent) redirect("/operator?err=" + encodeURIComponent("That client has not completed onboarding yet — documents cannot be generated."));
  if (!(amount >= 200000)) redirect("/operator?err=" + encodeURIComponent("Minimum commitment is $200,000."));
  const o = db().prepare("SELECT id FROM offerings WHERE kind = 'new' AND portal_id = ?").get(offering) as any;
  if (!o) redirect("/operator?err=" + encodeURIComponent("Unknown offering."));
  const cid = Number(db().prepare("INSERT INTO commitments (investing_entity_id, offering_id, desired_commitment) VALUES (?,?,?)").run(ent.eid, o.id, amount).lastInsertRowid);
  for (const inst of createSignatureDocuments(db(), cid)) await generateInstance(db(), inst);
  redirect("/operator?ok=1");
}
