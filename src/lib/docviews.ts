import { db } from "./db";
import { listTemplates, templateHref, findTemplateByDisplay } from "./docs";
import { DOC_PREVIEW, dotRule } from "@/data/seed-data";
import { mdyFromISO } from "./catalog";
import { packetName } from "./personalise";

export interface DocRow { id: string; name: string; href: string; investment: string; investmentPortalId: number; entity: string | null; type: string; year: number | null; shared: string; sharedISO: string; dot: boolean }
export interface SigRow { id: number; pageId: number; requested: string; requestedISO: string; docName: string; docHref: string; investment: string; entity: string }

/** Static shared masters (per fund) + the client's own signed/executed instances. Membership comes from manifest `appearsIn`. */
export function documentsFor(clientId: number): { all: DocRow[]; byFund: Map<number, DocRow[]>; fundNames: Map<number, string> } {
  const tpls = listTemplates().filter((t) => t.offeringPortalId != null);
  const toRow = (t: (typeof tpls)[number]): DocRow => ({ id: "t" + t.id, name: t.displayName, href: templateHref(t.id), investment: t.offeringName!, investmentPortalId: t.offeringPortalId!, entity: null,
    type: t.label, year: t.year, shared: t.shared, sharedISO: t.sharedISO, dot: dotRule(t.offeringPortalId, t.docType) });
  const inst = db().prepare(`SELECT di.id, t.display_name n, t.year, di.signed_at sa, o.name inv, o.portal_id pid, e.name en
    FROM document_instances di JOIN document_templates t ON t.id = di.template_id JOIN investing_entities e ON e.id = di.investing_entity_id
    JOIN commitments c ON c.id = di.commitment_id JOIN offerings o ON o.id = c.offering_id
    WHERE di.client_id = ? AND di.status IN ('SIGNED','EXECUTED')`).all(clientId) as any[];
  const instRows: DocRow[] = inst.map((r) => ({ id: "i" + r.id, name: "EXECUTED " + r.n, href: `/investor/files/instances/${r.id}`, investment: r.inv, investmentPortalId: r.pid, entity: r.en, type: "Agreements",
    year: new Date(r.sa).getFullYear(), shared: mdyFromISO(r.sa.slice(0, 10)), sharedISO: r.sa.slice(0, 10), dot: false }));
  const all = [...tpls.filter((t) => t.appearsIn.includes("all-documents")).map(toRow), ...instRows].sort((a, b) => b.sharedISO.localeCompare(a.sharedISO));
  const byFund = new Map<number, DocRow[]>(); const fundNames = new Map<number, string>();
  for (const pid of [81, 86, 87, 88]) {
    const fundTpls = tpls.filter((t) => t.offeringPortalId === pid && t.appearsIn.some((a) => a.startsWith("by-investment:")));
    const mine = instRows.filter((r) => r.investmentPortalId === pid);
    byFund.set(pid, [...fundTpls.map(toRow), ...mine].sort((a, b) => b.sharedISO.localeCompare(a.sharedISO)));
    fundNames.set(pid, tpls.find((t) => t.offeringPortalId === pid)?.offeringName ?? "");
  }
  return { all, byFund, fundNames };
}
export function previewFor(pid: number, rows: DocRow[]): DocRow[] {
  const names = DOC_PREVIEW[pid] ?? [];
  return names.map((n) => { const t = findTemplateByDisplay(n); return rows.find((r) => t && r.id === "t" + t.id); }).filter(Boolean) as DocRow[];
}
export function signatureRows(clientId: number): SigRow[] {
  return (db().prepare(`SELECT sr.id, sr.signature_page_id pageId, sr.requested_at iso, t.display_name n, di.id instId, o.name inv, e.name en, t.doc_type dt
    FROM signature_requests sr JOIN document_instances di ON di.id = sr.document_instance_id JOIN document_templates t ON t.id = di.template_id
    JOIN investing_entities e ON e.id = sr.investing_entity_id JOIN commitments c ON c.id = di.commitment_id JOIN offerings o ON o.id = c.offering_id
    WHERE di.client_id = ? AND sr.status IN ('PENDING','AGREED') ORDER BY sr.requested_at DESC, sr.id DESC`).all(clientId) as any[])
    .map((r) => ({ id: r.id, pageId: r.pageId, requested: mdyFromISO(r.iso), requestedISO: r.iso, docName: packetName(r.n.replace(/^EXECUTED /, ""), r.dt, Number(/Fund (\d+)/.exec(r.inv)?.[1]) || null), docHref: `/investor/files/instances/${r.instId}`, investment: r.inv, entity: r.en }));
}
