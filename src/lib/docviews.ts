import { must, supabase } from "./supabase";
import { listTemplates, templateHref, findTemplateByDisplay } from "./docs";
import { DOC_PREVIEW, dotRule } from "@/data/seed-data";
import { mdyFromISO } from "./catalog";
import { packetName } from "./personalise";

export interface DocRow { id: string; name: string; href: string; investment: string; investmentPortalId: number; entity: string | null; type: string; year: number | null; shared: string; sharedISO: string; dot: boolean }
export interface SigRow { id: number; pageId: number; requested: string; requestedISO: string; docName: string; docHref: string; investment: string; entity: string }

/** Static shared masters (per fund) + the client's own signed/executed instances. Membership comes from manifest `appearsIn`. */
export async function documentsFor(clientId: number): Promise<{ all: DocRow[]; byFund: Map<number, DocRow[]>; fundNames: Map<number, string> }> {
  const tpls = (await listTemplates()).filter((t) => t.offeringPortalId != null);
  const toRow = (t: (typeof tpls)[number]): DocRow => ({ id: "t" + t.id, name: t.displayName, href: templateHref(t.id), investment: t.offeringName!, investmentPortalId: t.offeringPortalId!, entity: null,
    type: t.label, year: t.year, shared: t.shared, sharedISO: t.sharedISO, dot: dotRule(t.offeringPortalId, t.docType) });
  const inst = must(await supabase().from("document_instances").select(`
      id, signed_at,
      document_templates!inner ( display_name, year ),
      investing_entities!inner ( name ),
      commitments!inner ( offerings!inner ( name, portal_id ) )`)
    .eq("client_id", clientId).in("status", ["SIGNED", "EXECUTED"])) as any[];
  const instRows: DocRow[] = inst.map((r) => {
    const sa = String(r.signed_at).slice(0, 10); // signed_at is timestamptz in Postgres; the UI works in yyyy-mm-dd
    return { id: "i" + r.id, name: "EXECUTED " + r.document_templates.display_name, href: `/investor/files/instances/${r.id}`, investment: r.commitments.offerings.name, investmentPortalId: r.commitments.offerings.portal_id, entity: r.investing_entities.name, type: "Agreements",
      year: new Date(r.signed_at).getFullYear(), shared: mdyFromISO(sa), sharedISO: sa, dot: false };
  });
  const ups = must(await supabase().from("client_uploads").select("id, original_name, uploaded_at").eq("client_id", clientId)) as any[];
  const upRows: DocRow[] = ups.map((r) => {
    const iso = String(r.uploaded_at).slice(0, 10);
    const ext = String(r.original_name).split(".").pop()?.toUpperCase() ?? "FILE";
    return { id: "u" + r.id, name: r.original_name, href: `/investor/files/uploads/${r.id}`, investment: "Your uploads", investmentPortalId: 0, entity: null,
      type: ext === "PDF" ? "PDF" : ["PNG", "JPG", "JPEG"].includes(ext) ? "Image" : "Document", year: new Date(r.uploaded_at).getFullYear(), shared: mdyFromISO(iso), sharedISO: iso, dot: false };
  });
  const all = [...tpls.filter((t) => t.appearsIn.includes("all-documents")).map(toRow), ...instRows, ...upRows].sort((a, b) => b.sharedISO.localeCompare(a.sharedISO));
  const byFund = new Map<number, DocRow[]>(); const fundNames = new Map<number, string>();
  for (const pid of [81, 86, 87, 88]) {
    const fundTpls = tpls.filter((t) => t.offeringPortalId === pid && t.appearsIn.some((a) => a.startsWith("by-investment:")));
    const mine = instRows.filter((r) => r.investmentPortalId === pid);
    byFund.set(pid, [...fundTpls.map(toRow), ...mine].sort((a, b) => b.sharedISO.localeCompare(a.sharedISO)));
    fundNames.set(pid, tpls.find((t) => t.offeringPortalId === pid)?.offeringName ?? "");
  }
  return { all, byFund, fundNames };
}
export async function previewFor(pid: number, rows: DocRow[]): Promise<DocRow[]> {
  const names = DOC_PREVIEW[pid] ?? [];
  const found = await Promise.all(names.map(async (n) => { const t = await findTemplateByDisplay(n); return rows.find((r) => t && r.id === "t" + t.id); }));
  return found.filter(Boolean) as DocRow[];
}
export async function signatureRows(clientId: number): Promise<SigRow[]> {
  const rows = must(await supabase().from("signature_requests").select(`
      id, signature_page_id, requested_at,
      investing_entities!inner ( name ),
      document_instances!inner ( id, document_templates!inner ( display_name, doc_type ), commitments!inner ( offerings!inner ( name ) ) )`)
    .eq("document_instances.client_id", clientId).in("status", ["PENDING", "AGREED"])
    .order("requested_at", { ascending: false }).order("id", { ascending: false })) as any[];
  return rows.map((r) => {
    const iso = String(r.requested_at).slice(0, 10); // requested_at is timestamptz in Postgres; UI works in yyyy-mm-dd (as the SQLite dates were stored)
    const di = r.document_instances;
    return { id: r.id, pageId: r.signature_page_id, requested: mdyFromISO(iso), requestedISO: iso, docName: packetName(di.document_templates.display_name.replace(/^EXECUTED /, ""), di.document_templates.doc_type, Number(/Fund (\d+)/.exec(di.commitments.offerings.name)?.[1]) || null), docHref: `/investor/files/instances/${di.id}`, investment: di.commitments.offerings.name, entity: r.investing_entities.name };
  });
}
