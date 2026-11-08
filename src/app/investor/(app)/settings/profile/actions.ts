"use server";
import { revalidatePath } from "next/cache";
import { must, supabase } from "@/lib/supabase";
import { portalDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { regeneratePendingForEntity } from "@/lib/personalise";
import { PAYMENT_METHODS } from "@/lib/constants";
import { encryptSecret } from "@/lib/crypto";
import { abaValid } from "@/lib/banks";
import { logActivity } from "@/lib/activity";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const addr = (f: FormData, p: string) => ({ address: s(f, `${p}_address`), address2: s(f, `${p}_address2`), city: s(f, `${p}_city`), state: s(f, `${p}_state`), zip: s(f, `${p}_zip`), country: s(f, `${p}_country`) || "United States" });

async function ownEntity(entityId: number) {
  const u = await requireUser();
  const e = must(await supabase().from("investing_entities").select("id").eq("id", entityId).eq("client_id", u.clientId).maybeSingle()) as any;
  if (!e) throw new Error("Not found"); // not distinguishable from a missing record
  return u;
}

export async function setDarkTheme(on: boolean) {
  const u = await requireUser();
  must(await supabase().from("clients").update({ dark_theme: on }).eq("id", u.clientId));
  revalidatePath("/", "layout");
}

export interface FormState { ok?: boolean; errors?: Record<string, string> }

export async function updateContact(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const name = s(f, "name"); if (name.length < 2) return { errors: { name: "Please enter your name" } };
  must(await supabase().from("clients").update({ full_name: name, phone: s(f, "phone") || null, address: s(f, "address") || null }).eq("id", u.clientId));
  revalidatePath("/", "layout"); return { ok: true };
}

/** Client edits the Tax Address (+ disregarded flag). Tax ID / Entity Type are operator-controlled after creation. */
export async function updateEntityTax(entityId: number, _: FormState, f: FormData): Promise<FormState> {
  await ownEntity(entityId);
  const a = addr(f, "tax");
  if (!a.address || !a.city || !a.state || !a.zip) return { errors: { tax: "Please complete the tax address" } };
  must(await supabase().from("investing_entities").update({ tax_address: a, is_disregarded: !!f.get("disregarded") }).eq("id", entityId));
  await regeneratePendingForEntity(portalDb(), entityId); // unsigned documents pick up the corrected data; executed ones are untouched
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
}

export async function saveDistribution(entityId: number, _: FormState, f: FormData): Promise<FormState> {
  await ownEntity(entityId);
  const method = s(f, "payment_method");
  const errors: Record<string, string> = {};
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) errors.payment_method = "Please select a payment method";
  if (!s(f, "payee_name")) errors.payee_name = "Please enter the payee name";
  // A chosen bank account must belong to THIS entity.
  let bankAccountId: number | null = null;
  const rawBank = Number(f.get("bank_account_id") || 0);
  if (rawBank) {
    const acct = must(await supabase().from("bank_accounts").select("id").eq("id", rawBank).eq("entity_id", entityId).maybeSingle()) as any;
    if (!acct) errors.bank_account_id = "That bank account doesn't belong to this entity";
    else bankAccountId = rawBank;
  }
  if (Object.keys(errors).length) return { errors };
  must(await supabase().from("investing_entities").update({ distribution_method: {
    payment_method: method, bank_account_id: bankAccountId, is_custodian_fbo: !!f.get("custodian"), payee_name: s(f, "payee_name"), payment_address: addr(f, "pay") } }).eq("id", entityId));
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
}

/** Secure manual bank entry (audit item 6): routing + account numbers are stored
 * AES-256-GCM encrypted (same protection as Tax IDs) and only ever shown masked.
 * Plaid can write into this same table later once the firm opens a Plaid account. */
export async function addBankAccount(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const entityId = Number(f.get("entity_id") || 0);
  const e = must(await supabase().from("investing_entities").select("id, name").eq("id", entityId).eq("client_id", u.clientId).maybeSingle()) as any;
  if (!e) return { errors: { bank: "Please choose one of your investing entities" } };
  const errors: Record<string, string> = {};
  const nickname = s(f, "nickname"), bankName = s(f, "bank_name"), type = s(f, "account_type");
  const routing = s(f, "routing").replace(/\D/g, ""), account = s(f, "account").replace(/[\s-]/g, ""), confirm = s(f, "account_confirm").replace(/[\s-]/g, "");
  if (!nickname) errors.nickname = "Give the account a nickname";
  if (!bankName) errors.bank_name = "Enter the bank name";
  if (!["Checking", "Savings"].includes(type)) errors.account_type = "Choose Checking or Savings";
  if (!abaValid(routing)) errors.routing = "That routing number doesn't look right — US routing numbers are 9 digits";
  if (!/^\d{4,17}$/.test(account)) errors.account = "Account numbers are 4–17 digits";
  if (account && confirm !== account) errors.account_confirm = "The account numbers don't match";
  if (Object.keys(errors).length) return { errors };
  must(await supabase().from("bank_accounts").insert({
    entity_id: entityId, nickname, bank_name: bankName, account_type: type,
    routing_encrypted: encryptSecret(routing), account_encrypted: encryptSecret(account),
  }));
  await logActivity({ actorType: "CLIENT", actorEmail: u.email, clientEmail: u.email, action: "BANK_ACCOUNT_ADDED", detail: `${nickname} (${bankName}) for ${e.name}, acct ••••${account.slice(-4)}` });
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
}

export async function removeBankAccount(accountId: number) {
  const u = await requireUser();
  const acct = must(await supabase().from("bank_accounts").select("id, entity_id, nickname, investing_entities!inner ( client_id )").eq("id", accountId).maybeSingle()) as any;
  if (!acct || (acct.investing_entities as any).client_id !== u.clientId) throw new Error("Not found");
  must(await supabase().from("bank_accounts").delete().eq("id", accountId));
  // Clear any distribution selection pointing at the removed account.
  const ents = must(await supabase().from("investing_entities").select("id, distribution_method").eq("client_id", u.clientId)) as any[];
  for (const en of ents) {
    if (en.distribution_method?.bank_account_id === accountId) {
      must(await supabase().from("investing_entities").update({ distribution_method: { ...en.distribution_method, bank_account_id: null } }).eq("id", en.id));
    }
  }
  await logActivity({ actorType: "CLIENT", actorEmail: u.email, clientEmail: u.email, action: "BANK_ACCOUNT_REMOVED", detail: acct.nickname ?? String(accountId) });
  revalidatePath("/investor/settings/profile", "layout");
}

export async function addContact(entityId: number, _: FormState, f: FormData): Promise<FormState> {
  await ownEntity(entityId);
  const name = s(f, "name"); if (!name) return { errors: { name: "Please enter a name" } };
  must(await supabase().from("entity_contacts").insert({
    entity_id: entityId, name, emails: s(f, "email") ? [s(f, "email")] : [], phones: s(f, "phone") ? [s(f, "phone")] : [],
    is_primary: !!f.get("primary"), document_access: "All Documents", required_signer: !!f.get("signer"),
  }));
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
}
export async function removeContact(entityId: number, contactId: number) {
  await ownEntity(entityId);
  must(await supabase().from("entity_contacts").delete().eq("id", contactId).eq("entity_id", entityId));
  revalidatePath("/investor/settings/profile", "layout");
}
