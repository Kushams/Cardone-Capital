import { db } from "./db";
import type { Offering } from "@/data/types";
import { decryptSecret, maskTaxId } from "./crypto";

const parse = (r: any): Offering => JSON.parse(r.data);
export const getOfferings = (kind: "new" | "recent"): Offering[] =>
  (db().prepare("SELECT data FROM offerings WHERE kind = ? ORDER BY sort_order").all(kind) as any[]).map(parse);
export const getOffering = (kind: "new" | "recent", portalId: number): Offering | null => {
  const r = db().prepare("SELECT data FROM offerings WHERE kind = ? AND portal_id = ?").get(kind, portalId) as any;
  return r ? parse(r) : null;
};
export const offeringInternalIdByPortal = (kind: "new" | "recent", portalId: number) =>
  (db().prepare("SELECT id FROM offerings WHERE kind = ? AND portal_id = ?").get(kind, portalId) as any)?.id as number | undefined;

export interface EntityRow {
  id: number; name: string; entity_type: string | null; is_disregarded: number; holding_title: string | null;
  tax_address: any; tax_id_encrypted: string | null; k1_name: string | null; distribution_method: any;
}
export function getEntities(clientId: number): EntityRow[] {
  return (db().prepare("SELECT * FROM investing_entities WHERE client_id = ? ORDER BY id").all(clientId) as any[]).map((r) => ({
    ...r, tax_address: r.tax_address ? JSON.parse(r.tax_address) : null, distribution_method: r.distribution_method ? JSON.parse(r.distribution_method) : null,
  }));
}
export function getEntity(clientId: number, entityId: number): EntityRow | null {
  return getEntities(clientId).find((e) => e.id === entityId) ?? null;
}
/** UI-safe: never includes the full Tax ID. */
export const entityMaskedTaxId = (e: Pick<EntityRow, "tax_id_encrypted">) => (e.tax_id_encrypted ? maskTaxId(decryptSecret(e.tax_id_encrypted)) : "--");
export const formatAddress = (a: any) => (a ? [a.address, a.address2, a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "--");

export interface CommitmentRow { id: number; offeringPortalId: number; offeringName: string; entityId: number; entityName: string; holdingTitle: string | null; desired: number; contributed: number | null }
export function getCommitments(clientId: number): CommitmentRow[] {
  return db().prepare(`SELECT c.id, o.portal_id offeringPortalId, o.name offeringName, e.id entityId, e.name entityName, e.holding_title holdingTitle,
      c.desired_commitment desired, c.contributed contributed
    FROM commitments c JOIN investing_entities e ON e.id = c.investing_entity_id JOIN offerings o ON o.id = c.offering_id
    WHERE e.client_id = ? AND o.kind = 'new' ORDER BY c.id`).all(clientId) as any;
}

export interface PendingSig { id: number; pageId: number; requestedAt: string; documentName: string; investment: string; entityName: string; status: string; offeringPortalId: number }
export function getPendingSignatures(clientId: number): PendingSig[] {
  return db().prepare(`SELECT sr.id, sr.signature_page_id pageId, sr.requested_at requestedAt, t.display_name documentName, o.name investment,
      e.name entityName, sr.status, o.portal_id offeringPortalId
    FROM signature_requests sr JOIN document_instances di ON di.id = sr.document_instance_id
    JOIN document_templates t ON t.id = di.template_id JOIN investing_entities e ON e.id = sr.investing_entity_id
    JOIN commitments c ON c.id = di.commitment_id JOIN offerings o ON o.id = c.offering_id
    WHERE di.client_id = ? AND sr.status = 'PENDING' ORDER BY sr.requested_at DESC, sr.id DESC`).all(clientId) as any;
}
export const getClient = (clientId: number) => db().prepare("SELECT * FROM clients WHERE id = ?").get(clientId) as any;
