import type { DatabaseSync } from "node:sqlite";

/** Creates the two signature-queue documents for a commitment (CLONE-PROMPT §17.5 step 1–2):
 *  a personalised Subscription Booklet instance and the W-9 packet instance, both PENDING_SIGNATURE with a signature request.
 *  PDF generation (phase e) fills generated_file_path. */
export function createSignatureDocuments(d: DatabaseSync, commitmentId: number, opts: { bookletPageId?: number; w9PageId?: number; bookletRequested?: string; w9Requested?: string } = {}) {
  const c = d.prepare(`SELECT c.id, c.offering_id, c.investing_entity_id eid, e.client_id cid FROM commitments c JOIN investing_entities e ON e.id = c.investing_entity_id WHERE c.id = ?`).get(commitmentId) as any;
  if (!c) throw new Error("commitment not found");
  const booklet = d.prepare("SELECT id FROM document_templates WHERE doc_type='SUBSCRIPTION_BOOKLET' AND offering_id = ?").get(c.offering_id) as any;
  const w9 = d.prepare("SELECT id FROM document_templates WHERE doc_type='W9' AND offering_id IS NULL").get() as any;
  if (!booklet || !w9) throw new Error("missing booklet/W-9 template for offering " + c.offering_id);
  const nextPage = () => ((d.prepare("SELECT MAX(signature_page_id) m FROM signature_requests").get() as any).m ?? 31900) + 1;
  const out: number[] = [];
  for (const [tpl, page, req] of [[booklet.id, opts.bookletPageId, opts.bookletRequested], [w9.id, opts.w9PageId, opts.w9Requested]] as const) {
    const at = req ?? new Date().toISOString().slice(0, 10);
    const inst = Number(d.prepare(`INSERT INTO document_instances (template_id, client_id, investing_entity_id, commitment_id, status, requested_at) VALUES (?,?,?,?, 'PENDING_SIGNATURE', ?)`)
      .run(tpl, c.cid, c.eid, c.id, at).lastInsertRowid);
    d.prepare("INSERT INTO signature_requests (document_instance_id, investing_entity_id, requested_at, status, signature_page_id) VALUES (?,?,?, 'PENDING', ?)")
      .run(inst, c.eid, at, page ?? nextPage());
    out.push(inst);
  }
  return out;
}
