import { PDFDocument, PDFName, StandardFonts, degrees, rgb, type PDFFont } from "pdf-lib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { decryptSecret } from "./crypto";
import { fmtUSD } from "./catalog";
import coords from "@/data/booklet-field-coords.json";

/**
 * Personalisation pipeline (CLONE-PROMPT §17). Masters are NEVER edited: every instance is a new PDF.
 *  - SUBSCRIPTION_BOOKLET = master + in-body fills (field map) + diagonal entity-name watermark on every page + Summary page (last)
 *  - W9                   = blank W-9 master + watermark on every page + Summary page (last)   [no fills inside the form itself]
 * The full Tax ID is decrypted ONLY in this module, at generation time, and written only into the output PDF.
 */
const ROOT = process.cwd();
// Helvetica/Times are WinAnsi-only: replace anything unencodable so generation never throws on unusual names.
const safe = (s: string) => s.replace(/[^\x20-\x7E -ÿ‘’“”–—•]/g, "?");

export interface EntityData { name: string; entityType: string; holdingTitle: string; taxId: string; taxAddress: string; k1Name: string; email: string; phone: string; address: string; committed: string; committedNumber: string }

/** Display file name of a generated packet: the W-9 master is named for Fund 32; each packet is named for ITS fund. */
export function packetName(templateDisplayName: string, doc_type: string, fundNumber: number | null): string {
  if (doc_type === "W9" && fundNumber) return `UPDATED W-9 Fund ${fundNumber}.pdf`;
  return templateDisplayName;
}
const fundNumberOf = (offeringName: string) => Number(/Fund (\d+)/.exec(offeringName)?.[1] ?? 0) || null;

function loadInstance(d: DatabaseSync, instanceId: number) {
  const r = d.prepare(`SELECT di.id, di.client_id cid, di.status, t.doc_type, t.display_name, t.master_file_path master, o.name offeringName,
      e.name ename, e.entity_type etype, e.holding_title htitle, e.tax_id_encrypted tid, e.tax_address taddr, e.k1_name k1, c.desired_commitment amt,
      cl.email, cl.phone, cl.address
    FROM document_instances di JOIN document_templates t ON t.id = di.template_id JOIN investing_entities e ON e.id = di.investing_entity_id
    JOIN clients cl ON cl.id = di.client_id JOIN commitments c ON c.id = di.commitment_id JOIN offerings o ON o.id = c.offering_id WHERE di.id = ?`).get(instanceId) as any;
  if (!r) throw new Error("instance not found: " + instanceId);
  return r;
}
export function taxAddressLine(json: string | null): string {
  if (!json) return "";
  const a = JSON.parse(json);
  return [a.address, a.address2, a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

async function watermark(pdf: PDFDocument, text: string) {
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const unit = font.widthOfTextAtSize(safe(text), 1);
  const size = Math.min(40, 320 / unit);
  const w = unit * size, a = (30 * Math.PI) / 180;
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const cx = width / 2, cy = height * 0.47;
    page.drawText(safe(text), { x: cx - (w / 2) * Math.cos(a), y: cy - (w / 2) * Math.sin(a), size, font, rotate: degrees(30), color: rgb(0.8, 0.8, 0.8), opacity: 0.45 });
  }
}

async function summaryPage(pdf: PDFDocument, e: EntityData, fileName: string) {
  const page = pdf.addPage([612, 792]);
  const H = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.06, 0.06, 0.06);
  const y = (top: number) => 792 - top;
  page.drawText("Summary", { x: 36, y: y(72), size: 20, font: H, color: ink });
  page.drawText("By signing your name below, you declare that all details listed are true and complete.", { x: 36, y: y(106), size: 9.5, font: H, color: ink });
  const rows: [string, string][] = [["COMMITTED", e.committed], ["INVESTING ENTITY", e.name], ["ENTITY TYPE", e.entityType], ["HOLDING TITLE", e.holdingTitle], ["TAX ID NUMBER", e.taxId], ["TAX ADDRESS", e.taxAddress]];
  rows.forEach(([label, value], i) => {
    const top = 146.8 + i * 55.45;
    page.drawText(label, { x: 36, y: y(top + 8), size: 7.5, font: H, color: ink });
    page.drawText(safe(value), { x: 36, y: y(top + 22.6), size: 11, font: H, color: ink });
  });
  const fn = safe(fileName), fs = 6.5;
  page.drawText(fn, { x: 306 - H.widthOfTextAtSize(fn, fs) / 2, y: y(752), size: fs, font: H, color: rgb(0.2, 0.2, 0.2) });
}

function fillBooklet(pdf: PDFDocument, masterFile: string, e: EntityData, H: PDFFont) {
  const fields = (coords as any)[path.basename(masterFile)] as { key: string; page: number; x: number; baseline: number }[] | undefined;
  if (!fields) throw new Error("No field map for " + masterFile + " (run scripts/map-booklet-fields.ts)");
  const val: Record<string, string> = { name: e.name, tin: e.taxId, address: e.address, phone: e.phone, email: e.email, amount: e.committedNumber, signerAddress: e.address, signerEmail: e.email, k1: e.k1Name, k1Email: e.email, k1Phone: e.phone };
  const pages = pdf.getPages();
  for (const f of fields) {
    const text = val[f.key]; if (!text) continue; // empty values (e.g. phone not given) stay blank; Date of Birth/Formation is left fillable, never invented
    pages[f.page].drawText(safe(text), { x: f.x, y: pages[f.page].getHeight() - f.baseline, size: 10, font: H, color: rgb(0.05, 0.05, 0.12) });
  }
}

export async function buildInstancePdf(d: DatabaseSync, instanceId: number): Promise<{ bytes: Uint8Array; fileName: string }> {
  const r = loadInstance(d, instanceId);
  const e: EntityData = {
    name: r.ename, entityType: r.etype ?? "", holdingTitle: r.htitle ?? "", taxId: r.tid ? decryptSecret(r.tid) : "", taxAddress: taxAddressLine(r.taddr),
    k1Name: r.k1 ?? r.ename, email: r.email ?? "", phone: r.phone ?? "", address: taxAddressLine(r.taddr), committed: fmtUSD(r.amt), committedNumber: r.amt.toLocaleString("en-US"),
  };
  const pdf = await PDFDocument.load(readFileSync(path.join(ROOT, r.master)), { ignoreEncryption: true, updateMetadata: false });
  try { pdf.catalog.lookup(PDFName.of("AcroForm"), (await import("pdf-lib")).PDFDict).delete(PDFName.of("XFA")); } catch { /* no XFA */ }
  const H = await pdf.embedFont(StandardFonts.Helvetica);
  if (r.doc_type === "SUBSCRIPTION_BOOKLET") fillBooklet(pdf, r.master, e, H);
  await watermark(pdf, e.name);
  const fileName = packetName(r.display_name, r.doc_type, fundNumberOf(r.offeringName));
  await summaryPage(pdf, e, fileName);
  pdf.setTitle(""); pdf.setAuthor(""); pdf.setSubject(""); pdf.setCreator(""); pdf.setProducer("");
  return { bytes: await pdf.save(), fileName };
}

/** Generates and stores the per-client instance. Returns the repo-relative path. */
export async function generateInstance(d: DatabaseSync, instanceId: number): Promise<string> {
  const r = loadInstance(d, instanceId);
  const { bytes } = await buildInstancePdf(d, instanceId);
  const rel = path.join("storage", "generated", String(r.cid), `${instanceId}.pdf`);
  mkdirSync(path.join(ROOT, path.dirname(rel)), { recursive: true });
  writeFileSync(path.join(ROOT, rel), bytes);
  d.prepare("UPDATE document_instances SET generated_file_path = ? WHERE id = ?").run(rel, instanceId);
  return rel;
}

/** After a Tax ID / address correction: unsigned instances are regenerated; executed ones are historical and untouched (§17). */
export async function regeneratePendingForEntity(d: DatabaseSync, entityId: number) {
  const rows = d.prepare("SELECT id FROM document_instances WHERE investing_entity_id = ? AND status IN ('DRAFT','PENDING_SIGNATURE')").all(entityId) as { id: number }[];
  for (const r of rows) await generateInstance(d, r.id);
  return rows.length;
}

/** STUB e-signature: stamps a typed-name signature block on a COPY of the generated PDF and stores it as the client's executed copy. */
export async function executeInstance(d: DatabaseSync, instanceId: number, signerName: string): Promise<string> {
  const r = loadInstance(d, instanceId);
  let src = (d.prepare("SELECT generated_file_path p FROM document_instances WHERE id = ?").get(instanceId) as any)?.p as string | null;
  if (!src) src = await generateInstance(d, instanceId);
  const pdf = await PDFDocument.load(readFileSync(path.join(ROOT, src)));
  const page = pdf.getPages().at(-1)!; // Summary page
  const H = await pdf.embedFont(StandardFonts.Helvetica), HB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  page.drawText("Signature", { x: 36, y: 792 - 520, size: 7.5, font: H });
  page.drawText(safe(signerName), { x: 36, y: 792 - 542, size: 20, font: await pdf.embedFont(StandardFonts.TimesRomanItalic) });
  page.drawLine({ start: { x: 36, y: 792 - 548 }, end: { x: 330, y: 792 - 548 }, thickness: 0.6 });
  page.drawText(`Signed electronically on ${when}`, { x: 36, y: 792 - 562, size: 8, font: H });
  page.drawText("DEMO / STUB SIGNATURE — typed-name capture only; not a legally executed signature.", { x: 36, y: 792 - 575, size: 7, font: HB, color: rgb(0.7, 0.1, 0.1) });
  const rel = path.join("storage", "executed", String(r.cid), `${instanceId}.pdf`);
  mkdirSync(path.join(ROOT, path.dirname(rel)), { recursive: true });
  writeFileSync(path.join(ROOT, rel), await pdf.save());
  d.prepare("UPDATE document_instances SET executed_file_path = ?, status = 'EXECUTED', signed_at = datetime('now') WHERE id = ?").run(rel, instanceId);
  d.prepare("UPDATE signature_requests SET status = 'SIGNED' WHERE document_instance_id = ?").run(instanceId);
  return rel;
}
