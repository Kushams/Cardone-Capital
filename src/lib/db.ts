import { must, supabase } from "./supabase";

/**
 * Data layer (Phase 1 of docs/SUPABASE-CLOUDFLARE-PLAN.md): the portal's data now
 * lives in Supabase Postgres, reached with @supabase/supabase-js + the service-role
 * key (see ./supabase.ts). Most modules query through the client directly; the
 * document pipeline (personalise.ts / instances.ts) goes through the small async
 * PortalDb interface below so the dev-only scripts (seed, personalisation test)
 * can drive the same code against a scratch SQLite file via scripts/sqlite-db.ts.
 * The old node:sqlite SCHEMA moved to scripts/sqlite-db.ts; the Postgres schema
 * lives in supabase/migrations/0001_init.sql.
 */

export interface InstanceJoinRow {
  id: number; cid: number; status: string;
  doc_type: string; display_name: string; master: string; offeringName: string;
  ename: string; etype: string | null; htitle: string | null; tid: string | null;
  taddr: unknown; // investing_entities.tax_address (jsonb object, or null)
  k1: string | null; amt: number;
  email: string | null; phone: string | null; address: string | null;
}

export interface PortalDb {
  loadInstanceRow(instanceId: number): Promise<InstanceJoinRow | null>;
  setGeneratedFilePath(instanceId: number, rel: string): Promise<void>;
  generatedFilePath(instanceId: number): Promise<string | null>;
  markExecuted(instanceId: number, rel: string): Promise<void>;
  pendingInstanceIdsForEntity(entityId: number): Promise<number[]>;
  commitmentContext(commitmentId: number): Promise<{ id: number; offering_id: number; eid: number; cid: number } | null>;
  bookletTemplateId(offeringId: number): Promise<number | null>;
  w9TemplateId(): Promise<number | null>;
  maxSignaturePageId(): Promise<number | null>;
  insertDocumentInstance(v: { template_id: number; client_id: number; investing_entity_id: number; commitment_id: number; requested_at: string }): Promise<number>;
  insertSignatureRequest(v: { document_instance_id: number; investing_entity_id: number; requested_at: string; signature_page_id: number }): Promise<void>;
}

function supabasePortalDb(): PortalDb {
  const sb = () => supabase();
  return {
    async loadInstanceRow(instanceId) {
      const r = must(await sb().from("document_instances").select(`
        id, client_id, status,
        document_templates!inner ( doc_type, display_name, master_file_path ),
        investing_entities!inner ( name, entity_type, holding_title, tax_id_encrypted, tax_address, k1_name ),
        clients!inner ( email, phone, address ),
        commitments!inner ( desired_commitment, offerings!inner ( name ) )`)
        .eq("id", instanceId).maybeSingle()) as any;
      if (!r) return null;
      return {
        id: r.id, cid: r.client_id, status: r.status,
        doc_type: r.document_templates.doc_type, display_name: r.document_templates.display_name,
        master: r.document_templates.master_file_path, offeringName: r.commitments.offerings.name,
        ename: r.investing_entities.name, etype: r.investing_entities.entity_type, htitle: r.investing_entities.holding_title,
        tid: r.investing_entities.tax_id_encrypted, taddr: r.investing_entities.tax_address, k1: r.investing_entities.k1_name,
        amt: r.commitments.desired_commitment,
        email: r.clients.email, phone: r.clients.phone, address: r.clients.address,
      };
    },
    async setGeneratedFilePath(instanceId, rel) {
      must(await sb().from("document_instances").update({ generated_file_path: rel }).eq("id", instanceId));
    },
    async generatedFilePath(instanceId) {
      const r = must(await sb().from("document_instances").select("generated_file_path").eq("id", instanceId).maybeSingle()) as any;
      return r?.generated_file_path ?? null;
    },
    async markExecuted(instanceId, rel) {
      must(await sb().from("document_instances")
        .update({ executed_file_path: rel, status: "EXECUTED", signed_at: new Date().toISOString() }).eq("id", instanceId));
      must(await sb().from("signature_requests").update({ status: "SIGNED" }).eq("document_instance_id", instanceId));
    },
    async pendingInstanceIdsForEntity(entityId) {
      const rows = must(await sb().from("document_instances").select("id")
        .eq("investing_entity_id", entityId).in("status", ["DRAFT", "PENDING_SIGNATURE"])) as any[];
      return rows.map((r) => r.id);
    },
    async commitmentContext(commitmentId) {
      const r = must(await sb().from("commitments").select("id, offering_id, investing_entity_id, investing_entities!inner ( client_id )")
        .eq("id", commitmentId).maybeSingle()) as any;
      return r ? { id: r.id, offering_id: r.offering_id, eid: r.investing_entity_id, cid: r.investing_entities.client_id } : null;
    },
    async bookletTemplateId(offeringId) {
      const rows = must(await sb().from("document_templates").select("id")
        .eq("doc_type", "SUBSCRIPTION_BOOKLET").eq("offering_id", offeringId).limit(1)) as any[];
      return rows[0]?.id ?? null;
    },
    async w9TemplateId() {
      const rows = must(await sb().from("document_templates").select("id")
        .eq("doc_type", "W9").order("id").limit(1)) as any[];
      return rows[0]?.id ?? null;
    },
    async maxSignaturePageId() {
      const rows = must(await sb().from("signature_requests").select("signature_page_id")
        .order("signature_page_id", { ascending: false }).limit(1)) as any[];
      return rows[0]?.signature_page_id ?? null;
    },
    async insertDocumentInstance(v) {
      const r = must(await sb().from("document_instances").insert({
        template_id: v.template_id, client_id: v.client_id, investing_entity_id: v.investing_entity_id,
        commitment_id: v.commitment_id, status: "PENDING_SIGNATURE", requested_at: v.requested_at,
      }).select("id").single()) as any;
      return r.id;
    },
    async insertSignatureRequest(v) {
      must(await sb().from("signature_requests").insert({
        document_instance_id: v.document_instance_id, investing_entity_id: v.investing_entity_id,
        requested_at: v.requested_at, status: "PENDING", signature_page_id: v.signature_page_id,
      }));
    },
  };
}

let cached: PortalDb | null = null;
/** The app's document-pipeline data handle (Supabase-backed). */
export function portalDb(): PortalDb {
  return (cached ??= supabasePortalDb());
}
