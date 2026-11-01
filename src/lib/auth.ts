import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { must, supabase } from "./supabase";
import { newToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "cc_portal_session";
const SESSION_DAYS = 7;

export interface CurrentUser {
  userId: number; clientId: number; email: string; fullName: string | null;
  darkTheme: boolean; onboarded: boolean;
}

export async function createSession(userId: number) {
  const token = newToken();
  const exp = new Date(Date.now() + SESSION_DAYS * 864e5);
  must(await supabase().from("sessions").insert({ token_hash: sha256(token), user_id: userId, expires_at: exp.toISOString() }));
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: exp });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (t) must(await supabase().from("sessions").delete().eq("token_hash", sha256(t)));
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const s = must(await supabase().from("sessions").select(`
      users!inner ( id, email, clients!inner ( id, full_name, dark_theme, onboarding_completed_at ) )`)
    .eq("token_hash", sha256(t)).gt("expires_at", new Date().toISOString()).maybeSingle()) as any;
  if (!s) return null;
  const u = s.users, c = u.clients;
  const a = must(await supabase().from("authorized_emails").select("status").eq("email", u.email).maybeSingle()) as any;
  if (!a || a.status === "REVOKED") return null; // revoking the allowlist entry kills access immediately
  return { userId: u.id, clientId: c.id, email: u.email, fullName: c.full_name, darkTheme: !!c.dark_theme, onboarded: !!c.onboarding_completed_at };
}

/** Pages inside the portal shell: must be logged in AND have completed the mandatory onboarding form. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/investor/login${returnTo ? `?return=${encodeURIComponent(returnTo)}` : ""}`);
  return u;
}

/** Only same-site portal paths are valid return targets (prevents open redirects). */
export function safeReturn(p: string | null | undefined): string {
  if (p && /^\/(investor|documents|opportunities)(\/|$|\?)/.test(p) && !p.startsWith("//") && !p.includes("\\")) return p;
  return "/investor/investments";
}
