"use server";
import { redirect } from "next/navigation";
import { must, supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/crypto";
import { burnToken, lookupToken } from "@/lib/invites";
import { createSession } from "@/lib/auth";

export interface SetPwState { error?: string }
export async function setPasswordAction(_: SetPwState, f: FormData): Promise<SetPwState> {
  const info = await lookupToken(String(f.get("token") ?? ""));
  if (!info) return { error: "This link is invalid or has expired. Ask the firm to send a new one." };
  const pw = String(f.get("password") ?? ""), pw2 = String(f.get("confirm") ?? "");
  if (pw.length < 12) return { error: "Your password must be at least 12 characters." };
  if (pw.toLowerCase().includes(info.email.split("@")[0].toLowerCase()) && info.email.split("@")[0].length > 3) return { error: "Your password must not contain your email name." };
  if (pw !== pw2) return { error: "The passwords do not match." };
  const sb = supabase();
  let user = must(await sb.from("users").select("id").eq("email", info.email).maybeSingle()) as any;
  if (user) must(await sb.from("users").update({ password_hash: hashPassword(pw) }).eq("id", user.id));
  else {
    const c = must(await sb.from("clients").insert({ email: info.email }).select("id").single()) as any;
    user = must(await sb.from("users").insert({ client_id: c.id, email: info.email, password_hash: hashPassword(pw) }).select("id").single()) as any;
  }
  await burnToken(info.email); // single use
  must(await sb.from("sessions").delete().eq("user_id", user.id)); // a reset signs out every other session
  await createSession(user.id);
  redirect("/investor/onboarding");
}
