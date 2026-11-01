"use server";
import { redirect } from "next/navigation";
import { must, supabase } from "@/lib/supabase";
import { verifyPassword } from "@/lib/crypto";
import { createSession, destroySession, safeReturn } from "@/lib/auth";

export interface LoginState { error?: string; email?: string }
const GENERIC = "Invalid email or password."; // identical for unknown / non-allowlisted / revoked / wrong password

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ret = String(form.get("return") ?? "");
  const a = must(await supabase().from("authorized_emails").select("status, users ( id, password_hash )").eq("email", email).maybeSingle()) as any;
  const u = a ? (Array.isArray(a.users) ? a.users[0] : a.users) : null;
  const row = u ? { id: u.id, password_hash: u.password_hash, status: a.status } : null;
  // always spend comparable time to avoid revealing allowlist membership
  const ok = row ? verifyPassword(password, row.password_hash) : verifyPassword(password, "s1:AAAAAAAAAAAAAAAAAAAAAA==:" + "A".repeat(86) + "==");
  if (!row || !ok || row.status === "REVOKED") return { error: GENERIC, email };
  await createSession(row.id);
  redirect(safeReturn(ret));
}

export async function logoutAction() {
  await destroySession();
  redirect("/investor/login");
}
