/**
 * Transactional email via Resend (invites + password resets).
 * Active only when RESEND_API_KEY is set (Worker secret); without it, callers keep the
 * outbox-only behaviour and the operator console shows the message as NOT SENT.
 * From stays invest@cardonecapitalportal.us (the staff mailbox on Zoho receives replies);
 * Resend sends for the verified domain cardonecapitalportal.us.
 */
export const MAIL_FROM = "Cardone Capital Investor Portal <invest@cardonecapitalportal.us>";

export interface MailResult { sent: boolean; id?: string; error?: string }

export async function sendMail(to: string, subject: string, text: string, html: string): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, error: "RESEND_API_KEY is not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], reply_to: "invest@cardonecapitalportal.us", subject, text, html }),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) return { sent: false, error: `Resend ${res.status}: ${data?.message ?? "send failed"}` };
    return { sent: true, id: data?.id };
  } catch (e: any) {
    return { sent: false, error: `Resend request failed: ${e?.message ?? e}` };
  }
}

/** Branded HTML wrapper for portal emails (visual identity: navy #002C4F / green #3C8627). */
export function portalEmailHtml(heading: string, intro: string, ctaLabel: string, link: string, footnote: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#212529">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #dde3e8">
    <div style="background:#002C4F;padding:20px 28px"><span style="color:#ffffff;font-size:18px;font-weight:bold">Cardone Capital</span> <span style="color:#FCC43E;font-size:13px">INVESTOR PORTAL</span></div>
    <div style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 12px;color:#002C4F">${heading}</h1>
      <p style="line-height:1.6;margin:0 0 20px">${intro}</p>
      <p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#3C8627;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px">${ctaLabel}</a></p>
      <p style="line-height:1.6;margin:0 0 8px;font-size:13px;color:#5a6a75">Or copy this link into your browser:<br><a href="${link}" style="color:#0175D8;word-break:break-all">${link}</a></p>
      <p style="line-height:1.6;margin:16px 0 0;font-size:13px;color:#5a6a75">${footnote}</p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #dde3e8;font-size:12px;color:#5a6a75">Cardone Capital Investor Portal · Questions? Email invest@cardonecapitalportal.us or call +1 302 627 3325</div>
  </div></body></html>`;
}
