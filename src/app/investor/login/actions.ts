"use server";
import { redirect } from "next/navigation";
import { must, supabase } from "@/lib/supabase";
import { verifyPassword } from "@/lib/crypto";
import { createSession, destroySession, safeReturn } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { checkLock, lockMessage, recordFailure, recordSuccess } from "@/lib/ratelimit";

export interface LoginState { error?: string; email?: string }
const GENERIC = "Invalid email or password."; // identical for unknown / non-allowlisted / revoked / wrong password

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ret = String(form.get("return") ?? "");
  const rlKey = `investor:${email}`;
  const lock = await checkLock(rlKey);
  if (lock.locked) return { error: lockMessage(lock.retryMinutes), email };
  const a = must(await supabase().from("authorized_emails").select("status, users ( id, password_hash )").eq("email", email).maybeSingle()) as any;
  const u = a ? (Array.isArray(a.users) ? a.users[0] : a.users) : null;
  const row = u ? { id: u.id, password_hash: u.password_hash, status: a.status } : null;
  // always spend comparable time to avoid revealing allowlist membership
  const ok = row ? verifyPassword(password, row.password_hash) : verifyPassword(password, "s1:AAAAAAAAAAAAAAAAAAAAAA==:" + "A".repeat(86) + "==");
  if (!row || !ok || row.status === "REVOKED") {
    if (await recordFailure(rlKey)) await logActivity({ actorType: "SYSTEM", action: "LOGIN_LOCKED", detail: `investor ${email}` });
    return { error: GENERIC, email };
  }
  await recordSuccess(rlKey);
  await createSession(row.id);
  await logActivity({ actorType: "CLIENT", actorEmail: email, clientEmail: email, action: "CLIENT_LOGIN" });
  redirect(safeReturn(ret));
}

export async function logoutAction() {
  await destroySession();
  redirect("/investor/login");
}
