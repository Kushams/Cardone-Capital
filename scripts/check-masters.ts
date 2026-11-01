/* AUTOMATED MASTER-TEMPLATE CHECK (CLONE-PROMPT §17.6). Fails (exit 1) if any master in the template store
   - is outside storage/templates/** or lives in a signatures-pending path,
   - has a text layer matching the sample-investor denylist (word-boundary, case-insensitive),
   - carries Author/Title/Creator/Producer metadata that is not empty.
   Extra private identifiers (sample email domain, sample amounts) can be listed one per line in the git-ignored
   file storage/.denylist-extra — they are deliberately NOT stored in the repo. Needs `pdftotext`/`pdfinfo` (poppler). */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { openDb } from "../src/lib/db";
import { SAMPLE_INVESTOR_DENYLIST } from "../src/data/seed-data";

const root = process.cwd();
const extraFile = path.join(root, "storage", ".denylist-extra");
const extra = existsSync(extraFile) ? readFileSync(extraFile, "utf8").split("\n").map((s) => s.trim()).filter(Boolean) : [];
const deny = [...SAMPLE_INVESTOR_DENYLIST, ...extra];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = deny.map((d) => ({ d, re: new RegExp(`(^|[^A-Za-z0-9])${esc(d)}([^A-Za-z0-9]|$)`, "i") }));

const db = openDb(process.env.DB_PATH ?? path.join(root, "storage", "db", "portal.sqlite"));
const rows = db.prepare("SELECT display_name, master_file_path FROM document_templates").all() as { display_name: string; master_file_path: string }[];
let failures = 0, noText = 0;
for (const r of rows) {
  const p = r.master_file_path;
  if (!p.startsWith("storage/templates/") || /signatures-pending/i.test(p)) { console.error(`FAIL path outside template store: ${p}`); failures++; continue; }
  const full = path.join(root, p);
  const text = execFileSync("pdftotext", ["-layout", full, "-"], { maxBuffer: 1 << 28 }).toString();
  const meta = execFileSync("pdfinfo", [full]).toString();
  const hits = rx.filter((x) => x.re.test(text) || x.re.test(meta)).map((x) => x.d);
  const bad = meta.split("\n").filter((l) => /^(Title|Author|Creator|Producer|Subject|Keywords):\s*\S/.test(l));
  if (text.replace(/\s+/g, "").length < 500) { noText++; console.warn(`WARN image-based / no text layer (cannot text-verify): ${r.display_name}`); }
  if (hits.length) { console.error(`FAIL ${r.display_name}: matches denylist [${hits.join(", ")}]`); failures++; }
  if (bad.length) { console.error(`FAIL ${r.display_name}: metadata present -> ${bad.join(" | ")}`); failures++; }
}
console.log(`\nChecked ${rows.length} masters; denylist terms: ${deny.length}; image-based (unverifiable by text): ${noText}; failures: ${failures}`);
process.exit(failures ? 1 : 0);
