"use server";
import { redirect } from "next/navigation";
import { must, supabase } from "@/lib/supabase";
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

  // The SQLite build wrapped these four writes in one transaction; PostgREST has no
  // multi-statement transactions, so they run in dependency order with the client's
  // onboarding flag flipped LAST — a failure mid-way leaves the client not-onboarded
  // (and able to retry) instead of onboarded without an investing entity.
  const sb = supabase();
  const now = new Date().toISOString();
  const ent = must(await sb.from("investing_entities").insert({
    client_id: u.clientId, name: entName, entity_type: type, is_disregarded: !!f.get("disregarded"), holding_title: holding,
    tax_address: ta, tax_id_encrypted: encryptSecret(tin), k1_name: k1,
    distribution_method: anyDist ? { payment_method: method, bank_account_id: null, is_custodian_fbo: !!f.get("custodian"), payee_name: payee, payment_address: addr(f, "pay") } : null,
  }).select("id").single()) as any;
  must(await sb.from("entity_contacts").insert({
    entity_id: ent.id, name: full, emails: [email], phones: [phone], is_primary: true, document_access: "All Documents", required_signer: true,
  }));
  must(await sb.from("clients").update({
    full_name: full, phone, address: [ta.address, ta.city, `${ta.state} ${ta.zip}`].join(", "), onboarding_completed_at: now,
  }).eq("id", u.clientId));
  must(await sb.from("authorized_emails").update({ status: "ACTIVE", activated_at: now }).eq("email", u.email));
  redirect("/investor/investments");
}
