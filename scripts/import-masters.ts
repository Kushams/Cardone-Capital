/* Strips metadata from every master in storage/templates/fund-*. Idempotent. Run once after adding/replacing masters. */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { stripMetadata } from "../src/lib/pdf-clean";

async function main() {
const base = path.join(process.cwd(), "storage", "templates");
for (const dir of readdirSync(base).filter((d) => d.startsWith("fund-"))) {
  for (const f of readdirSync(path.join(base, dir)).filter((n) => n.endsWith(".pdf"))) {
    const p = path.join(base, dir, f);
    const before = statSync(p).size;
    const out = await stripMetadata(readFileSync(p));
    writeFileSync(p, out);
    console.log(`stripped ${dir}/${f}  ${before} -> ${out.length} bytes`);
  }
}
}
main();
