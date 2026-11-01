"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { burnToken, lookupToken } from "@/lib/invites";
import { createSession } from "@/lib/auth";

export interface SetPwState { error?: string }
export async function setPasswordAction(_: SetPwState, f: FormData): Promise<SetPwState> {
  const info = lookupToken(String(f.get("token") ?? ""));
  if (!info) return { error: "This link is invalid or has expired. Ask the firm to send a new one." };
  const pw = String(f.get("password") ?? ""), pw2 = String(f.get("confirm") ?? "");
  if (pw.length < 12) return { error: "Your password must be at least 12 characters." };
  if (pw.toLowerCase().includes(info.email.split("@")[0].toLowerCase()) && info.email.split("@")[0].length > 3) return { error: "Your password must not contain your email name." };
  if (pw !== pw2) return { error: "The passwords do not match." };
  const d = db();
  let user = d.prepare("SELECT id FROM users WHERE email = ?").get(info.email) as any;
  if (user) d.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(pw), user.id);
  else {
    const cid = Number(d.prepare("INSERT INTO clients (email) VALUES (?)").run(info.email).lastInsertRowid);
    user = { id: Number(d.prepare("INSERT INTO users (client_id, email, password_hash) VALUES (?,?,?)").run(cid, info.email, hashPassword(pw)).lastInsertRowid) };
  }
  burnToken(info.email); // single use
  d.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id); // a reset signs out every other session
  await createSession(user.id);
  redirect("/investor/onboarding");
}
