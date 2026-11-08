import { supabase } from "./supabase";
import { portalEmailHtml, sendMail } from "./mailer";

/** Two-way email notifications (audit item 17): clients hear about things that
 * need them (documents awaiting signature, submission confirmations); staff hear
 * about client activity (investments, signings, uploads). Every send is recorded
 * in the outbox so it shows in the console Email log. Best-effort: a failed
 * email never breaks the action that triggered it. */
export const STAFF_INBOX = "invest@cardonecapitalportal.us";
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

async function deliver(to: string, subject: string, heading: string, intro: string, ctaLabel: string, link: string, footnote: string): Promise<void> {
  try {
    const text = `${intro}\n\n${ctaLabel}: ${link}\n\n${footnote}`;
    const html = portalEmailHtml(heading, intro, ctaLabel, link, footnote);
    const result = await sendMail(to, subject, text, html);
    await supabase().from("outbox").insert({
      to_email: to, subject,
      body: `${result.sent ? `[SENT via Resend${result.id ? ` — id ${result.id}` : ""}]` : `[NOT SENT — ${result.error}]`}\n\n${text}`,
    });
  } catch { /* notifications must never break the underlying action */ }
}

export async function notifyStaff(subject: string, intro: string): Promise<void> {
  await deliver(STAFF_INBOX, subject, subject, intro, "Open the operator console", `${appUrl()}/operator`,
    "This is an automatic notification from the Cardone Capital Investor Portal.");
}

export async function notifyClient(email: string, subject: string, heading: string, intro: string, ctaLabel: string, path: string, footnote: string): Promise<void> {
  await deliver(email, subject, heading, intro, ctaLabel, `${appUrl()}${path}`, footnote);
}
