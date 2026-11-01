import { must, supabase } from "./supabase";
import type { Offering } from "@/data/types";
import { decryptSecret, maskTaxId } from "./crypto";

export const getOfferings = async (kind: "new" | "recent"): Promise<Offering[]> =>
  (must(await supabase().from("offerings").select("data").eq("kind", kind).order("sort_order")) as any[]).map((r) => r.data as Offering);
export const getOffering = async (kind: "new" | "recent", portalId: number): Promise<Offering | null> => {
  const r = must(await supabase().from("offerings").select("data").eq("kind", kind).eq("portal_id", portalId).maybeSingle()) as any;
  return r ? (r.data as Offering) : null;
};
export const offeringInternalIdByPortal = async (kind: "new" | "recent", portalId: number) =>
  (must(await supabase().from("offerings").select("id").eq("kind", kind).eq("portal_id", portalId).maybeSingle()) as any)?.id as number | undefined;

export interface EntityRow {
  id: number; name: string; entity_type: string | null; is_disregarded: boolean; holding_title: string | null;
  tax_address: any; tax_id_encrypted: string | null; k1_name: string | null; distribution_method: any;
}
export async function getEntities(clientId: number): Promise<EntityRow[]> {
  // tax_address / distribution_method are jsonb: PostgREST returns them already parsed.
  return must(await supabase().from("investing_entities").select("*").eq("client_id", clientId).order("id")) as any[];
}
export async function getEntity(clientId: number, entityId: number): Promise<EntityRow | null> {
  return (await getEntities(clientId)).find((e) => e.id === entityId) ?? null;
}
/** UI-safe: never includes the full Tax ID. */
export const entityMaskedTaxId = (e: Pick<EntityRow, "tax_id_encrypted">) => (e.tax_id_encrypted ? maskTaxId(decryptSecret(e.tax_id_encrypted)) : "--");
export const formatAddress = (a: any) => (a ? [a.address, a.address2, a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "--");

export interface CommitmentRow { id: number; offeringPortalId: number; offeringName: string; entityId: number; entityName: string; holdingTitle: string | null; desired: number; contributed: number | null }
export async function getCommitments(clientId: number): Promise<CommitmentRow[]> {
  const rows = must(await supabase().from("commitments").select(`
      id, desired_commitment, contributed,
      investing_entities!inner ( id, name, holding_title ),
      offerings!inner ( portal_id, name )`)
    .eq("investing_entities.client_id", clientId).eq("offerings.kind", "new").order("id")) as any[];
  return rows.map((r) => ({
    id: r.id, offeringPortalId: r.offerings.portal_id, offeringName: r.offerings.name,
    entityId: r.investing_entities.id, entityName: r.investing_entities.name, holdingTitle: r.investing_entities.holding_title,
    desired: r.desired_commitment, contributed: r.contributed,
  }));
}

export interface PendingSig { id: number; pageId: number; requestedAt: string; documentName: string; investment: string; entityName: string; status: string; offeringPortalId: number }
export async function getPendingSignatures(clientId: number): Promise<PendingSig[]> {
  const rows = must(await supabase().from("signature_requests").select(`
      id, signature_page_id, requested_at, status,
      investing_entities!inner ( name ),
      document_instances!inner ( document_templates!inner ( display_name ), commitments!inner ( offerings!inner ( name, portal_id ) ) )`)
    .eq("document_instances.client_id", clientId).eq("status", "PENDING")
    .order("requested_at", { ascending: false }).order("id", { ascending: false })) as any[];
  return rows.map((r) => ({
    id: r.id, pageId: r.signature_page_id, requestedAt: r.requested_at, documentName: r.document_instances.document_templates.display_name,
    investment: r.document_instances.commitments.offerings.name, entityName: r.investing_entities.name, status: r.status,
    offeringPortalId: r.document_instances.commitments.offerings.portal_id,
  }));
}
export const getClient = async (clientId: number) =>
  (must(await supabase().from("clients").select("*").eq("id", clientId).maybeSingle()) as any) ?? undefined;
