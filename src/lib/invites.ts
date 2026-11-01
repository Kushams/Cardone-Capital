import { db } from "./db";
import { newToken, sha256 } from "./crypto";

/**
 * Invite-only access (CLONE-PROMPT §18). No public registration exists anywhere.
 * Credential model (DECIDED): operator allowlists an email -> system "emails" a single-use, 48h set-password link ->
 * the CLIENT chooses their own password (no operator ever sees one). Tokens are stored only as SHA-256 hashes.
 * EMAIL SENDING IS A STUB: messages are written to the `outbox` table and shown in the operator console.
 */
export const INVITE_HOURS = 48;
export const normEmail = (e: string) => e.trim().toLowerCase();
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export function issueToken(email: string, purpose: "INVITE" | "RESET"): string {
  const token = newToken();
  db().prepare("UPDATE authorized_emails SET invite_token_hash = ?, invite_expires_at = ?, token_purpose = ? WHERE email = ?")
    .run(sha256(token), new Date(Date.now() + INVITE_HOURS * 3600e3).toISOString(), purpose, email);
  const link = `${appUrl()}/investor/set-password?token=${token}`;
  db().prepare("INSERT INTO outbox (to_email, subject, body) VALUES (?,?,?)").run(email,
    purpose === "INVITE" ? "You're invited to the Cardone Capital Investor Portal" : "Reset your Investor Portal password",
    `[STUB — not actually sent]\n\nUse this single-use link within ${INVITE_HOURS} hours to ${purpose === "INVITE" ? "set your password" : "reset your password"}:\n${link}`);
  return link;
}

/** Operator action: add (or re-issue / re-activate) an allowlisted email and issue a fresh invite link. */
export function inviteEmail(emailRaw: string, invitedBy: string): { link: string } | { error: string } {
  const email = normEmail(emailRaw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  const existing = db().prepare("SELECT status FROM authorized_emails WHERE email = ?").get(email) as any;
  const hasUser = !!db().prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (!existing) db().prepare("INSERT INTO authorized_emails (email, invited_by, status) VALUES (?,?, 'INVITED')").run(email, invitedBy);
  else if (existing.status === "REVOKED") db().prepare("UPDATE authorized_emails SET status = ?, invited_by = ? WHERE email = ?").run(hasUser ? "ACTIVE" : "INVITED", invitedBy, email);
  return { link: issueToken(email, hasUser ? "RESET" : "INVITE") };
}

export function revokeEmail(email: string) {
  db().prepare("UPDATE authorized_emails SET status = 'REVOKED', invite_token_hash = NULL, invite_expires_at = NULL WHERE email = ?").run(email);
  db().prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
}

/** Forgot-password: works only for allowlisted, non-revoked emails that already have credentials. Caller shows ONE generic message regardless. */
export function requestReset(emailRaw: string) {
  const email = normEmail(emailRaw);
  const ok = db().prepare("SELECT 1 FROM authorized_emails a JOIN users u ON u.email = a.email WHERE a.email = ? AND a.status != 'REVOKED'").get(email);
  if (ok) issueToken(email, "RESET");
}

export interface TokenInfo { email: string; purpose: "INVITE" | "RESET" }
export function lookupToken(token: string | undefined | null): TokenInfo | null {
  if (!token) return null;
  const r = db().prepare("SELECT email, token_purpose p, invite_expires_at x, status FROM authorized_emails WHERE invite_token_hash = ?").get(sha256(token)) as any;
  if (!r || r.status === "REVOKED" || !r.x || new Date(r.x) < new Date()) return null;
  return { email: r.email, purpose: r.p };
}
export function burnToken(email: string) {
  db().prepare("UPDATE authorized_emails SET invite_token_hash = NULL, invite_expires_at = NULL, token_purpose = NULL WHERE email = ?").run(email);
}
