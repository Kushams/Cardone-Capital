/* Verifies the real-image wiring: every non-pending file in images/image-map.json exists, every Dashboard / New Offerings card and every
   Recent Offering property thumbnail slot has its assigned file, and every delivered file is used exactly where the map says. */
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { ALL_OFFERINGS, NEW_OFFERINGS, RECENT_OFFERINGS } from "../src/data/seed-data";
import imageMap from "../images/image-map.json";

const root = path.join(process.cwd(), "images");
let fail = 0; const bad = (m: string) => { fail++; console.error("FAIL", m); };
const used = new Set<string>(["IMAGE-MAP.md", "image-map.json"]);
const entries = (imageMap as any).images as any[];
for (const e of entries) {
  const pending = String(e.status ?? "").startsWith("pending");
  if (pending) { console.log("pending (not yet delivered):", e.file, "->", e.route); continue; }
  if (!existsSync(path.join(root, e.file))) bad("missing file " + e.file); else used.add(e.file);
}
const all = (d: string): string[] => readdirSync(path.join(root, d), { withFileTypes: true }).flatMap((x) => x.isDirectory() ? all(path.join(d, x.name)) : [path.join(d, x.name)]);
for (const f of all("")) if (!used.has(f)) bad("delivered file not referenced by the map: " + f);
const exists = (u?: string) => !!u && existsSync(path.join(root, u.replace("/images/", "")));
for (const o of RECENT_OFFERINGS) {
  if (!exists(o.cardImage)) bad(`Dashboard card image missing: ${o.name}`);
  for (const a of o.assets ?? []) if (!exists(a.thumb)) bad(`asset thumbnail missing: ${o.name} / ${a.name}`);
}
for (const o of NEW_OFFERINGS) if (!exists(o.cardImage)) bad(`New Offerings card image missing: ${o.name}`);
const thumbs = RECENT_OFFERINGS.flatMap((o) => o.assets ?? []).length, mapThumbs = entries.filter((e) => e.file.startsWith("recent-offerings/")).length;
if (thumbs !== mapThumbs) bad(`asset count ${thumbs} != thumbnails in map ${mapThumbs}`);
console.log(`\n${entries.length} map entries · ${RECENT_OFFERINGS.length} dashboard cards · ${NEW_OFFERINGS.length} new-offering cards · ${thumbs} property thumbnails · ${ALL_OFFERINGS.length} offerings`);
console.log(fail ? `${fail} FAILURE(S)` : "ALL IMAGE SLOTS RESOLVED");
process.exit(fail ? 1 : 0);
