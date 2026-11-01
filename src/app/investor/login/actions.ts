"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createSession, destroySession, safeReturn } from "@/lib/auth";

export interface LoginState { error?: string; email?: string }
const GENERIC = "Invalid email or password."; // identical for unknown / non-allowlisted / revoked / wrong password

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ret = String(form.get("return") ?? "");
  const row = db().prepare(`SELECT u.id, u.password_hash, a.status FROM authorized_emails a JOIN users u ON u.email = a.email WHERE a.email = ?`).get(email) as any;
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
