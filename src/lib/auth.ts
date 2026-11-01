import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
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
  db().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)").run(sha256(token), userId, exp.toISOString());
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: exp });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (t) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(t));
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const row = db().prepare(`
    SELECT u.id userId, c.id clientId, u.email, c.full_name fullName, c.dark_theme dark, c.onboarding_completed_at ob, a.status
    FROM sessions s JOIN users u ON u.id = s.user_id JOIN clients c ON c.id = u.client_id
    JOIN authorized_emails a ON a.email = u.email
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha256(t), new Date().toISOString()) as any;
  if (!row || row.status === "REVOKED") return null; // revoking the allowlist entry kills access immediately
  return { userId: row.userId, clientId: row.clientId, email: row.email, fullName: row.fullName, darkTheme: !!row.dark, onboarded: !!row.ob };
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
