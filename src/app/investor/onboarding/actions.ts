"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { requireUser } from "@/lib/auth";
import { ENTITY_TYPES, PAYMENT_METHODS } from "@/lib/constants";

export interface OnbState { errors?: Record<string, string>; values?: Record<string, string> }
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const addr = (f: FormData, p: string) => ({ address: s(f, `${p}_address`), address2: s(f, `${p}_address2`), city: s(f, `${p}_city`), state: s(f, `${p}_state`), zip: s(f, `${p}_zip`), country: s(f, `${p}_country`) || "United States" });

/** Mandatory first-login form (§18). Data feeds My Profile, the Investing Entity page and document personalisation (§17). */
export async function onboardingAction(_: OnbState, f: FormData): Promise<OnbState> {
  const u = await requireUser("/investor/onboarding");
  if (u.onboarded) redirect("/investor/investments");
  const v: Record<string, string> = {}; f.forEach((val, k) => { if (typeof val === "string" && !/tax_?id/i.test(k)) v[k] = val; }); // never echo the Tax ID back
  const e: Record<string, string> = {};
  const full = s(f, "full_name"), entName = s(f, "entity_name"), type = s(f, "entity_type"), holding = s(f, "holding_title");
  const tin = s(f, "tax_id").replace(/[\s-]/g, ""), phone = s(f, "phone"), email = s(f, "contact_email").toLowerCase();
  const ta = addr(f, "tax"), k1 = s(f, "k1_name") || entName;
  if (full.length < 2) e.full_name = "Enter your full legal name";
  if (entName.length < 2) e.entity_name = "Enter the investing entity name";
  if (!ENTITY_TYPES.includes(type)) e.entity_type = "Select an entity type";
  if (!holding) e.holding_title = "Enter the holding title";
  if (!/^\d{9}$/.test(tin)) e.tax_id = "Enter a valid 9-digit Tax ID (EIN or SSN)";
  if (!ta.address || !ta.city || !ta.state || !ta.zip) e.tax = "Complete the tax address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.contact_email = "Enter a valid email";
  if (phone.replace(/\D/g, "").length < 7) e.phone = "Enter a phone number";
  const method = s(f, "payment_method"), payee = s(f, "payee_name"), anyDist = !!(method || payee || s(f, "pay_address") || f.get("custodian"));
  if (anyDist) { // Distribution Method may be completed later; once started, Payment Method is required (§14/§18)
    if (!(PAYMENT_METHODS as readonly string[]).includes(method)) e.payment_method = "Please select a payment method";
    if (!payee) e.payee_name = "Please enter the payee name";
  }
  if (Object.keys(e).length) return { errors: e, values: v };

  const d = db();
  d.exec("BEGIN");
  try {
    d.prepare("UPDATE clients SET full_name = ?, phone = ?, address = ?, onboarding_completed_at = datetime('now') WHERE id = ?")
      .run(full, phone, [ta.address, ta.city, `${ta.state} ${ta.zip}`].join(", "), u.clientId);
    const eid = Number(d.prepare(`INSERT INTO investing_entities (client_id, name, entity_type, is_disregarded, holding_title, tax_address, tax_id_encrypted, k1_name, distribution_method)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(u.clientId, entName, type, f.get("disregarded") ? 1 : 0, holding, JSON.stringify(ta), encryptSecret(tin), k1,
      anyDist ? JSON.stringify({ payment_method: method, bank_account_id: null, is_custodian_fbo: !!f.get("custodian"), payee_name: payee, payment_address: addr(f, "pay") }) : null).lastInsertRowid);
    d.prepare("INSERT INTO entity_contacts (entity_id, name, emails, phones, is_primary, document_access, required_signer) VALUES (?,?,?,?,1,'All Documents',1)")
      .run(eid, full, JSON.stringify([email]), JSON.stringify([phone]));
    d.prepare("UPDATE authorized_emails SET status = 'ACTIVE', activated_at = datetime('now') WHERE email = ?").run(u.email);
    d.exec("COMMIT");
  } catch (err) { d.exec("ROLLBACK"); throw err; }
  redirect("/investor/investments");
}
