import type { PortalDb } from "./db";

/** Creates the two signature-queue documents for a commitment (CLONE-PROMPT §17.5 step 1–2):
 *  a personalised Subscription Booklet instance and the W-9 packet instance, both PENDING_SIGNATURE with a signature request.
 *  PDF generation (phase e) fills generated_file_path. */
export async function createSignatureDocuments(d: PortalDb, commitmentId: number, opts: { bookletPageId?: number; w9PageId?: number; bookletRequested?: string; w9Requested?: string } = {}) {
  const c = await d.commitmentContext(commitmentId);
  if (!c) throw new Error("commitment not found");
  const booklet = await d.bookletTemplateId(c.offering_id);
  const w9 = await d.w9TemplateId();
  if (booklet == null || w9 == null) throw new Error("missing booklet/W-9 template for offering " + c.offering_id);
  const nextPage = async () => ((await d.maxSignaturePageId()) ?? 31900) + 1;
  const out: number[] = [];
  for (const [tpl, page, req] of [[booklet, opts.bookletPageId, opts.bookletRequested], [w9, opts.w9PageId, opts.w9Requested]] as const) {
    const at = req ?? new Date().toISOString().slice(0, 10);
    const inst = await d.insertDocumentInstance({ template_id: tpl, client_id: c.cid, investing_entity_id: c.eid, commitment_id: c.id, requested_at: at });
    await d.insertSignatureRequest({ document_instance_id: inst, investing_entity_id: c.eid, requested_at: at, signature_page_id: page ?? (await nextPage()) });
    out.push(inst);
  }
  return out;
}
