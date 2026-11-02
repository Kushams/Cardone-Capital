"use server";
import { must, supabase } from "@/lib/supabase";
import { portalDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { getOffering, offeringInternalIdByPortal } from "@/lib/queries";
import { createSignatureDocuments } from "@/lib/instances";
import { generateInstance } from "@/lib/personalise";
import { logActivity } from "@/lib/activity";
import { notifyClient, notifyStaff } from "@/lib/notify";
import { ENTITY_TYPES } from "@/lib/constants";

export interface InvestState { error?: string; done?: boolean }
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const addr = (f: FormData, p: string) => ({
  address: s(f, `${p}_address`), address2: s(f, `${p}_address2`), city: s(f, `${p}_city`),
  state: s(f, `${p}_state`), zip: s(f, `${p}_zip`), country: s(f, `${p}_country`) || "United States",
});
const money = (v: string) => Math.round(Number(v.replace(/[^0-9.]/g, "")));

/** Invest / Submit Interest (§16) — REAL submit: saves the commitment (creating the
 * investing entity first when the client adds a new one), then generates the client's
 * personalised Subscription Booklet + W-9 packet and queues them for signature,
 * mirroring the operator-side commitment flow. */
export async function investAction(offeringPortalId: number, prospectId: string | null, _prev: InvestState, f: FormData): Promise<InvestState> {
  const u = await requireUser(`/investor/opportunities/${offeringPortalId}/invest`);
  const sb = supabase();
  const offering = await getOffering("new", offeringPortalId);
  const offeringId = await offeringInternalIdByPortal("new", offeringPortalId);
  if (!offering || !offeringId) return { error: "That offering could not be found." };

  const amount = money(s(f, "commitment"));
  const min = money(String(offering.minimumInvestment ?? ""));
  if (!amount) return { error: "Enter your desired commitment." };
  if (min && amount < min) return { error: `The minimum commitment for this offering is $${min.toLocaleString()}.` };

  // Investing entity: one of the client's own, or a new one created from the form.
  const asSel = s(f, "investingAs");
  let entityId: number;
  if (asSel && asSel !== "new") {
    const ent = must(await sb.from("investing_entities").select("id").eq("id", Number(asSel)).eq("client_id", u.clientId).maybeSingle()) as any;
    if (!ent) return { error: "Please choose one of your investing entities." };
    entityId = ent.id;
  } else {
    const name = s(f, "newName");
    const tin = s(f, "taxId").replace(/\D/g, "");
    const type = s(f, "entityType");
    const holding = s(f, "holdingTitle");
    if (name.length < 2) return { error: "Enter the new entity's name." };
    if (!/^\d{9}$/.test(tin)) return { error: "Enter a valid 9-digit Tax ID (EIN or SSN) for the new entity." };
    if (!(ENTITY_TYPES as readonly string[]).includes(type)) return { error: "Select the entity type." };
    if (!holding) return { error: "Enter the holding title." };
    const ent = must(await sb.from("investing_entities").insert({
      client_id: u.clientId, name, entity_type: type, is_disregarded: !!f.get("disregarded"), holding_title: holding,
      tax_address: addr(f, "tax"), tax_id_encrypted: encryptSecret(tin), k1_name: name, distribution_method: null,
    }).select("id").single()) as any;
    entityId = ent.id;
  }

  const phone = s(f, "phone");
  if (phone) await sb.from("clients").update({ phone }).eq("id", u.clientId);

  // Reuse the prospect commitment when the form was opened from one and it has
  // no documents yet; otherwise create a fresh commitment.
  const commitmentId = await (async (): Promise<number> => {
    if (prospectId) {
      const existing = must(await sb.from("commitments").select("id, investing_entities!inner ( client_id )").eq("id", Number(prospectId)).maybeSingle()) as any;
      if (existing && (existing.investing_entities as any)?.client_id === u.clientId) {
        const docs = must(await sb.from("document_instances").select("id").eq("commitment_id", existing.id).limit(1)) as any[];
        if (!docs.length) {
          must(await sb.from("commitments").update({ investing_entity_id: entityId, offering_id: offeringId, desired_commitment: amount }).eq("id", existing.id));
          return existing.id as number;
        }
      }
    }
    const c = must(await sb.from("commitments").insert({ investing_entity_id: entityId, offering_id: offeringId, desired_commitment: amount }).select("id").single()) as any;
    return c.id as number;
  })();

  for (const inst of await createSignatureDocuments(portalDb(), commitmentId)) await generateInstance(portalDb(), inst);
  await logActivity({ actorType: "CLIENT", actorEmail: u.email, clientEmail: u.email, action: "INVEST_SUBMITTED", detail: `${offering.name}, $${amount.toLocaleString()}` });
  await notifyStaff("New investment submitted", `${u.email} submitted an investment of $${amount.toLocaleString()} in ${offering.name}. Their subscription documents have been generated and are awaiting signature.`);
  await notifyClient(u.email, "We've received your investment submission",
    "Investment submitted",
    `Thank you — your commitment of $${amount.toLocaleString()} to ${offering.name} has been saved, and your subscription documents are ready for your signature.`,
    "Review and sign your documents", "/investor/documents/signatures",
    "If you didn't make this submission, contact us at invest@cardonecapitalportal.us.");
  return { done: true };
}
