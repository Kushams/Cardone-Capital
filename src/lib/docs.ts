import { db } from "./db";
import { mdyFromISO } from "./catalog";

export interface TemplateRow { id: number; offeringId: number | null; offeringPortalId: number | null; offeringName: string | null; docType: string; displayName: string; path: string; year: number | null; shared: string; sharedISO: string; label: string; appearsIn: string[]; personalised: boolean }

const norm = (s: string) => s.toLowerCase().replace(/\.pdf$/, "").replace(/\s*\(1\)/g, "").replace(/[^a-z0-9]/g, "");

export function listTemplates(): TemplateRow[] {
  return (db().prepare(`SELECT t.id, t.offering_id offeringId, o.portal_id offeringPortalId, o.name offeringName, t.doc_type docType, t.display_name displayName,
      t.master_file_path path, t.year, t.shared_date sharedISO, t.doc_type_label label, t.appears_in ap, t.is_personalised p
    FROM document_templates t LEFT JOIN offerings o ON o.id = t.offering_id ORDER BY t.shared_date DESC, t.id`).all() as any[])
    .map((r) => ({ ...r, shared: mdyFromISO(r.sharedISO), appearsIn: JSON.parse(r.ap), personalised: !!r.p }));
}
/** Resolve a document name as shown on the portal (".pdf"/"(1)" variants tolerated) to its master template. */
export function findTemplateByDisplay(name: string): TemplateRow | undefined {
  const k = norm(name);
  return listTemplates().find((t) => norm(t.displayName) === k);
}
export const templateHref = (id: number) => `/investor/files/templates/${id}`;
