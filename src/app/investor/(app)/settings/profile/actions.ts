"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { regeneratePendingForEntity } from "@/lib/personalise";
import { PAYMENT_METHODS } from "@/lib/constants";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const addr = (f: FormData, p: string) => ({ address: s(f, `${p}_address`), address2: s(f, `${p}_address2`), city: s(f, `${p}_city`), state: s(f, `${p}_state`), zip: s(f, `${p}_zip`), country: s(f, `${p}_country`) || "United States" });

async function ownEntity(entityId: number) {
  const u = await requireUser();
  const e = db().prepare("SELECT id FROM investing_entities WHERE id = ? AND client_id = ?").get(entityId, u.clientId);
  if (!e) throw new Error("Not found"); // not distinguishable from a missing record
  return u;
}

export async function setDarkTheme(on: boolean) {
  const u = await requireUser();
  db().prepare("UPDATE clients SET dark_theme = ? WHERE id = ?").run(on ? 1 : 0, u.clientId);
  revalidatePath("/", "layout");
}

export interface FormState { ok?: boolean; errors?: Record<string, string> }

export async function updateContact(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const name = s(f, "name"); if (name.length < 2) return { errors: { name: "Please enter your name" } };
  db().prepare("UPDATE clients SET full_name = ?, phone = ?, address = ? WHERE id = ?").run(name, s(f, "phone") || null, s(f, "address") || null, u.clientId);
  revalidatePath("/", "layout"); return { ok: true };
}

/** Client edits the Tax Address (+ disregarded flag). Tax ID / Entity Type are operator-controlled after creation. */
export async function updateEntityTax(entityId: number, _: FormState, f: FormData): Promise<FormState> {
  await ownEntity(entityId);
  const a = addr(f, "tax");
  if (!a.address || !a.city || !a.state || !a.zip) return { errors: { tax: "Please complete the tax address" } };
  db().prepare("UPDATE investing_entities SET tax_address = ?, is_disregarded = ? WHERE id = ?").run(JSON.stringify(a), f.get("disregarded") ? 1 : 0, entityId);
  await regeneratePendingForEntity(db(), entityId); // unsigned documents pick up the corrected data; executed ones are untouched
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
}

export async function saveDistribution(entityId: number, _: FormState, f: FormData): Promise<FormState> {
  await ownEntity(entityId);
  const method = s(f, "payment_method");
  const errors: Record<string, string> = {};
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) errors.payment_method = "Please select a payment method";
  if (!s(f, "payee_name")) errors.payee_name = "Please enter the payee name";
  if (Object.keys(errors).length) return { errors };
  db().prepare("UPDATE investing_entities SET distribution_method = ? WHERE id = ?").run(JSON.stringify({
    payment_method: method, bank_account_id: null, is_custodian_fbo: !!f.get("custodian"), payee_name: s(f, "payee_name"), payment_address: addr(f, "pay") }), entityId);
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
}

export async function addContact(entityId: number, _: FormState, f: FormData): Promise<FormState> {
  await ownEntity(entityId);
  const name = s(f, "name"); if (!name) return { errors: { name: "Please enter a name" } };
  db().prepare("INSERT INTO entity_contacts (entity_id, name, emails, phones, is_primary, document_access, required_signer) VALUES (?,?,?,?,?,?,?)")
    .run(entityId, name, JSON.stringify(s(f, "email") ? [s(f, "email")] : []), JSON.stringify(s(f, "phone") ? [s(f, "phone")] : []), f.get("primary") ? 1 : 0, "All Documents", f.get("signer") ? 1 : 0);
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
}
export async function removeContact(entityId: number, contactId: number) {
  await ownEntity(entityId);
  db().prepare("DELETE FROM entity_contacts WHERE id = ? AND entity_id = ?").run(contactId, entityId);
  revalidatePath("/investor/settings/profile", "layout");
}
