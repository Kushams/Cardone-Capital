/* One-time (re-runnable) dev tool: locates the fillable positions in each Subscription Booklet master by LABEL TEXT
   (pdftotext -bbox) and writes src/data/booklet-field-coords.json. Runtime generation needs only pdf-lib.
   Anchors/offsets were measured from the structure of the personalised reference (positions only — no values were copied). */
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

interface W { x0: number; y0: number; x1: number; y1: number; t: string }
const root = process.cwd();
function pages(file: string): W[][] {
  const html = execFileSync("pdftotext", ["-bbox", file, "-"], { maxBuffer: 1 << 28 }).toString();
  return [...html.matchAll(/<page [^>]*>([\s\S]*?)<\/page>/g)].map((m) =>
    [...m[1].matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)].map((w) => ({ x0: +w[1], y0: +w[2], x1: +w[3], y1: +w[4], t: w[5] })));
}
/** Finds a consecutive word sequence on one page; returns the bbox of its LAST word. */
function seq(pg: W[], words: string[], from = 0): W | null {
  for (let i = from; i <= pg.length - words.length; i++)
    if (words.every((w, k) => pg[i + k].t === w && (k === 0 || Math.abs(pg[i + k].y0 - pg[i].y0) < 3))) return pg[i + words.length - 1];
  return null;
}
const BASE = 2.7; // baseline sits this far above the label's bottom edge (matches the reference)

const out: Record<string, { key: string; page: number; x: number; baseline: number }[]> = {};
for (const dir of ["fund-29", "fund-30", "fund-31", "fund-32"]) {
  const d = path.join(root, "storage/templates", dir);
  for (const f of readdirSync(d).filter((n) => /Subscription Booklet/i.test(n))) {
    const P = pages(path.join(d, f));
    const fields: { key: string; page: number; x: number; baseline: number }[] = [];
    const need = (key: string, page: number, w: W | null, x: (w: W) => number, base: (w: W) => number) => {
      if (!w) throw new Error(`${f}: anchor not found for ${key}`);
      fields.push({ key, page, x: +x(w).toFixed(1), baseline: +base(w).toFixed(1) });
    };
    const p1 = P.findIndex((pg) => seq(pg, ["Name", "of", "Subscriber:"]));
    if (p1 < 0) throw new Error(`${f}: Part 1 page not found`);
    need("name", p1, seq(P[p1], ["Name", "of", "Subscriber:"]), (w) => w.x1 + 2.6, (w) => w.y1 - BASE);
    need("tin", p1, seq(P[p1], ["Social", "Security", "or", "Taxpayer", "ID", "No.:"]), (w) => w.x1 + 6.9, (w) => w.y1 - BASE);
    need("address", p1, seq(P[p1], ["Address", "(Principal", "Place", "of", "Residence", "or", "Business):"]), () => 71.2, (w) => w.y1 + 40.4);
    need("phone", p1, seq(P[p1], ["Telephone", "number:"]), (w) => w.x1 + 7.4, (w) => w.y1 - BASE);
    need("email", p1, seq(P[p1], ["Email:"]), (w) => w.x1 + 8.3, (w) => w.y1 - BASE);
    const pa = P.findIndex((pg) => seq(pg, ["Dollar", "Amount", "of", "Capital", "Commitment"]));
    const dollar = P[pa]?.filter((w) => w.t === "$").sort((a, b) => b.y0 - a.y0).find((w) => w.y0 < (seq(P[pa], ["Dollar", "Amount", "of", "Capital", "Commitment"])?.y0 ?? 0));
    need("amount", pa, dollar ?? null, (w) => w.x1 + 8.3 - (w.x1 - w.x0), (w) => w.y1 - BASE);
    const ps = P.findIndex((pg) => seq(pg, ["(mailing", "address)"]));
    need("signerAddress", ps, P[ps].find((w) => w.t === "(mailing") ?? null, () => 74.5, (w) => w.y0 - 2.3);
    need("signerEmail", ps, seq(P[ps], ["(email)"]), () => 75.3, (w) => w.y0 - 2.3);
    const pk = P.findIndex((pg) => seq(pg, ["Schedule", "K-1", "(please", "print):"]));
    need("k1", pk, seq(P[pk], ["Schedule", "K-1", "(please", "print):"]), (w) => w.x1 + 3, (w) => w.y1 - BASE);
    need("k1Email", pk, seq(P[pk], ["Email", "Address:"]), (w) => w.x1 + 4, (w) => w.y1 - BASE);
    need("k1Phone", pk, seq(P[pk], ["Phone:"]), (w) => w.x1 + 4, (w) => w.y1 - BASE);
    out[f] = fields;
    console.log(f.slice(0, 60), "pages:", P.length, fields.map((x) => `${x.key}@p${x.page + 1}`).join(" "));
  }
}
writeFileSync(path.join(root, "src/data/booklet-field-coords.json"), JSON.stringify(out, null, 1));
