"use server";
import { revalidatePath } from "next/cache";
import { must, supabase } from "@/lib/supabase";
import { portalDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { regeneratePendingForEntity } from "@/lib/personalise";
import { PAYMENT_METHODS } from "@/lib/constants";

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
  if (Object.keys(errors).length) return { errors };
  must(await supabase().from("investing_entities").update({ distribution_method: {
    payment_method: method, bank_account_id: null, is_custodian_fbo: !!f.get("custodian"), payee_name: s(f, "payee_name"), payment_address: addr(f, "pay") } }).eq("id", entityId));
  revalidatePath("/investor/settings/profile", "layout"); return { ok: true };
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
