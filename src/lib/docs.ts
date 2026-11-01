import { must, supabase } from "./supabase";
import { mdyFromISO } from "./catalog";

export interface TemplateRow { id: number; offeringId: number | null; offeringPortalId: number | null; offeringName: string | null; docType: string; displayName: string; path: string; year: number | null; shared: string; sharedISO: string; label: string; appearsIn: string[]; personalised: boolean }

const norm = (s: string) => s.toLowerCase().replace(/\.pdf$/, "").replace(/\s*\(1\)/g, "").replace(/[^a-z0-9]/g, "");

export async function listTemplates(): Promise<TemplateRow[]> {
  const rows = must(await supabase().from("document_templates").select(`
      id, offering_id, doc_type, display_name, master_file_path, year, shared_date, doc_type_label, appears_in, is_personalised,
      offerings ( portal_id, name )`)
    .order("shared_date", { ascending: false }).order("id")) as any[];
  return rows.map((r) => ({
    id: r.id, offeringId: r.offering_id, offeringPortalId: r.offerings?.portal_id ?? null, offeringName: r.offerings?.name ?? null,
    docType: r.doc_type, displayName: r.display_name, path: r.master_file_path, year: r.year,
    shared: mdyFromISO(r.shared_date), sharedISO: r.shared_date, label: r.doc_type_label,
    appearsIn: r.appears_in ?? [], personalised: !!r.is_personalised,
  }));
}
/** Resolve a document name as shown on the portal (".pdf"/"(1)" variants tolerated) to its master template. */
export async function findTemplateByDisplay(name: string): Promise<TemplateRow | undefined> {
  const k = norm(name);
  return (await listTemplates()).find((t) => norm(t.displayName) === k);
}
export const templateHref = (id: number) => `/investor/files/templates/${id}`;
