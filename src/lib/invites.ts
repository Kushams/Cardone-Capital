import { must, supabase } from "./supabase";
import { newToken, sha256 } from "./crypto";
import { portalEmailHtml, sendMail } from "./mailer";

/**
 * Invite-only access (CLONE-PROMPT §18). No public registration exists anywhere.
 * Credential model (DECIDED): operator allowlists an email -> system emails a single-use, 48h set-password link ->
 * the CLIENT chooses their own password (no operator ever sees one). Tokens are stored only as SHA-256 hashes.
 * EMAIL SENDING: real delivery via Resend when RESEND_API_KEY is configured (see mailer.ts); every message is
 * also written to the `outbox` table as the audit log shown in the operator console, marked SENT or NOT SENT.
 */
export const INVITE_HOURS = 48;
export const normEmail = (e: string) => e.trim().toLowerCase();
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export async function issueToken(email: string, purpose: "INVITE" | "RESET"): Promise<string> {
  const token = newToken();
  must(await supabase().from("authorized_emails").update({
    invite_token_hash: sha256(token),
    invite_expires_at: new Date(Date.now() + INVITE_HOURS * 3600e3).toISOString(),
    token_purpose: purpose,
  }).eq("email", email));
  const link = `${appUrl()}/investor/set-password?token=${token}`;
  const subject = purpose === "INVITE" ? "You're invited to the Cardone Capital Investor Portal" : "Reset your Investor Portal password";
  const action = purpose === "INVITE" ? "set your password" : "reset your password";
  const intro = purpose === "INVITE"
    ? "You've been invited to join the Cardone Capital Investor Portal. Use the button below to set your password and complete your investor profile."
    : "We received a request to reset the password for your Cardone Capital Investor Portal account. Use the button below to choose a new password.";
  const text = `${intro}\n\nUse this single-use link within ${INVITE_HOURS} hours to ${action}:\n${link}\n\nIf you didn't expect this email, you can ignore it — the link expires on its own.`;
  const html = portalEmailHtml(
    purpose === "INVITE" ? "You're invited" : "Reset your password",
    intro,
    purpose === "INVITE" ? "Set your password" : "Reset your password",
    link,
    `This link is single-use and expires in ${INVITE_HOURS} hours. If you didn't expect this email, you can ignore it.`,
  );
  const result = await sendMail(email, subject, text, html);
  must(await supabase().from("outbox").insert({
    to_email: email,
    subject,
    body: `${result.sent ? `[SENT via Resend${result.id ? ` — id ${result.id}` : ""}]` : `[NOT SENT — ${result.error}]`}\n\n${text}`,
  }));
  return link;
}

/** Operator action: add (or re-issue / re-activate) an allowlisted email and issue a fresh invite link. */
export async function inviteEmail(emailRaw: string, invitedBy: string): Promise<{ link: string } | { error: string }> {
  const email = normEmail(emailRaw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  const existing = must(await supabase().from("authorized_emails").select("status").eq("email", email).maybeSingle()) as any;
  const hasUser = !!(must(await supabase().from("users").select("id").eq("email", email).maybeSingle()) as any);
  if (!existing) must(await supabase().from("authorized_emails").insert({ email, invited_by: invitedBy, status: "INVITED" }));
  else if (existing.status === "REVOKED") must(await supabase().from("authorized_emails").update({ status: hasUser ? "ACTIVE" : "INVITED", invited_by: invitedBy }).eq("email", email));
  return { link: await issueToken(email, hasUser ? "RESET" : "INVITE") };
}

export async function revokeEmail(email: string) {
  must(await supabase().from("authorized_emails").update({ status: "REVOKED", invite_token_hash: null, invite_expires_at: null }).eq("email", email));
  const u = must(await supabase().from("users").select("id").eq("email", email).maybeSingle()) as any;
  if (u) must(await supabase().from("sessions").delete().eq("user_id", u.id));
}

/** Forgot-password: works only for allowlisted, non-revoked emails that already have credentials. Caller shows ONE generic message regardless. */
export async function requestReset(emailRaw: string) {
  const email = normEmail(emailRaw);
  const a = must(await supabase().from("authorized_emails").select("status, users ( id )").eq("email", email).maybeSingle()) as any;
  const hasUser = !!(a && (Array.isArray(a.users) ? a.users[0] : a.users));
  if (a && a.status !== "REVOKED" && hasUser) await issueToken(email, "RESET");
}

export interface TokenInfo { email: string; purpose: "INVITE" | "RESET" }
export async function lookupToken(token: string | undefined | null): Promise<TokenInfo | null> {
  if (!token) return null;
  const r = must(await supabase().from("authorized_emails").select("email, token_purpose, invite_expires_at, status")
    .eq("invite_token_hash", sha256(token)).maybeSingle()) as any;
  if (!r || r.status === "REVOKED" || !r.invite_expires_at || new Date(r.invite_expires_at) < new Date()) return null;
  return { email: r.email, purpose: r.token_purpose };
}
export async function burnToken(email: string) {
  must(await supabase().from("authorized_emails").update({ invite_token_hash: null, invite_expires_at: null, token_purpose: null }).eq("email", email));
}
