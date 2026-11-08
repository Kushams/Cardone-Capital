import { must, supabase } from "./supabase";
import { hashPassword, newToken, sha256, verifyPassword } from "./crypto";
import { portalEmailHtml, sendMail } from "./mailer";
import { normEmail } from "./invites";

/**
 * Named operator (staff) accounts for /operator — migration 0003.
 * invest@cardonecapitalportal.us is the founding SUPERADMIN (user decision 2026-11-02);
 * further staff accounts are added later at the user's direction.
 * Passwords are scrypt-hashed (same helpers as investor accounts); sessions and
 * set-password tokens follow the investor model: only SHA-256 hashes are stored.
 */
export const OPERATOR_TOKEN_HOURS = 48;
export const OPERATOR_SESSION_HOURS = 8;
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export interface OperatorRow { id: number; email: string; role: "SUPERADMIN" | "STAFF"; password_hash: string | null; last_login_at: string | null; created_at: string }

export async function getOperatorByEmail(email: string): Promise<OperatorRow | null> {
  return (must(await supabase().from("operators").select("id, email, role, password_hash, last_login_at, created_at").eq("email", normEmail(email)).maybeSingle()) as any) ?? null;
}

export async function listOperators(): Promise<OperatorRow[]> {
  return must(await supabase().from("operators").select("id, email, role, password_hash, last_login_at, created_at").order("id")) as any[];
}

/** Issue a single-use set/reset-password token for an operator and email the link via Resend. */
export async function issueOperatorToken(emailRaw: string, purpose: "INVITE" | "RESET"): Promise<{ link: string } | { error: string }> {
  const email = normEmail(emailRaw);
  const op = await getOperatorByEmail(email);
  if (!op) return { error: "No operator account for that email." };
  const token = newToken();
  must(await supabase().from("operators").update({
    invite_token_hash: sha256(token),
    invite_expires_at: new Date(Date.now() + OPERATOR_TOKEN_HOURS * 3600e3).toISOString(),
    token_purpose: purpose,
  }).eq("email", email));
  const link = `${appUrl()}/operator/set-password?token=${token}`;
  const subject = purpose === "INVITE" ? "Set your Cardone Capital operator password" : "Reset your Cardone Capital operator password";
  const intro = purpose === "INVITE"
    ? "Your operator account for the Cardone Capital Investor Portal staff console is ready. Use the button below to choose your password."
    : "We received a request to reset the password for your Cardone Capital operator account. Use the button below to choose a new password.";
  const text = `${intro}\n\nUse this single-use link within ${OPERATOR_TOKEN_HOURS} hours:\n${link}\n\nIf you didn't expect this email, you can ignore it — the link expires on its own.`;
  const html = portalEmailHtml(
    purpose === "INVITE" ? "Set your operator password" : "Reset your operator password",
    intro,
    purpose === "INVITE" ? "Set your password" : "Reset your password",
    link,
    `This link is single-use and expires in ${OPERATOR_TOKEN_HOURS} hours. If you didn't expect this email, you can ignore it.`,
  );
  const result = await sendMail(email, subject, text, html);
  must(await supabase().from("outbox").insert({
    to_email: email,
    subject,
    body: `${result.sent ? `[SENT via Resend${result.id ? ` — id ${result.id}` : ""}]` : `[NOT SENT — ${result.error}]`}\n\n${text}`,
  }));
  return { link };
}

/** Create a staff account (audit item 18) and email its set-password invite. */
export async function createOperatorAccount(emailRaw: string, role: "SUPERADMIN" | "STAFF"): Promise<{ link: string } | { error: string }> {
  const email = normEmail(emailRaw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (await getOperatorByEmail(email)) return { error: "That email already has an operator account." };
  must(await supabase().from("operators").insert({ email, role }));
  return issueOperatorToken(email, "INVITE");
}

/** Remove a staff account and end its sessions. Guards live in the action layer. */
export async function removeOperatorAccount(id: number): Promise<void> {
  must(await supabase().from("operator_sessions").delete().eq("operator_id", id));
  must(await supabase().from("operators").delete().eq("id", id));
}

export async function lookupOperatorToken(token: string | undefined | null): Promise<{ email: string; purpose: "INVITE" | "RESET" } | null> {
  if (!token) return null;
  const r = must(await supabase().from("operators").select("email, token_purpose, invite_expires_at")
    .eq("invite_token_hash", sha256(token)).maybeSingle()) as any;
  if (!r || !r.invite_expires_at || new Date(r.invite_expires_at) < new Date()) return null;
  return { email: r.email, purpose: r.token_purpose };
}

export async function setOperatorPassword(email: string, password: string): Promise<void> {
  must(await supabase().from("operators").update({
    password_hash: hashPassword(password),
    invite_token_hash: null, invite_expires_at: null, token_purpose: null,
  }).eq("email", email));
  const op = await getOperatorByEmail(email);
  if (op) must(await supabase().from("operator_sessions").delete().eq("operator_id", op.id));
}

/** Verify credentials; on success create a session and return its raw token. */
export async function loginOperator(emailRaw: string, password: string): Promise<{ token: string; operator: OperatorRow } | null> {
  const op = await getOperatorByEmail(emailRaw);
  if (!op || !op.password_hash || !verifyPassword(password, op.password_hash)) return null;
  const token = newToken();
  must(await supabase().from("operator_sessions").insert({
    token_hash: sha256(token),
    operator_id: op.id,
    expires_at: new Date(Date.now() + OPERATOR_SESSION_HOURS * 3600e3).toISOString(),
  }));
  must(await supabase().from("operators").update({ last_login_at: new Date().toISOString() }).eq("id", op.id));
  return { token, operator: op };
}

export async function operatorBySession(token: string | undefined | null): Promise<OperatorRow | null> {
  if (!token) return null;
  const s = must(await supabase().from("operator_sessions").select("operator_id, expires_at").eq("token_hash", sha256(token)).maybeSingle()) as any;
  if (!s || new Date(s.expires_at) < new Date()) return null;
  return (must(await supabase().from("operators").select("id, email, role, password_hash, last_login_at, created_at").eq("id", s.operator_id).maybeSingle()) as any) ?? null;
}

export async function endOperatorSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  must(await supabase().from("operator_sessions").delete().eq("token_hash", sha256(token)));
}
