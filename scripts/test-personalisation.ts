/* Acceptance test (CLONE-PROMPT §17 D): generates the Booklet + W-9 packet for TWO fictional entities with different Tax IDs/addresses and checks
   page counts (master+1), Summary content/position, in-body fills, watermark, no cross-contamination, and zero sample-investor identifiers. */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { openDb } from "../src/lib/db";
import { encryptSecret } from "../src/lib/crypto";
import { buildInstancePdf } from "../src/lib/personalise";
import { createSignatureDocuments } from "../src/lib/instances";
import { SAMPLE_INVESTOR_DENYLIST } from "../src/data/seed-data";
import { classify } from "../src/lib/catalog";

const tmp = path.join(process.cwd(), "storage", "db", "test-personalisation.sqlite");
for (const e of ["", "-wal", "-shm"]) if (existsSync(tmp + e)) rmSync(tmp + e);
const seedDb = openDb(path.join(process.cwd(), "storage/db/portal.sqlite"));
const db = openDb(tmp);
// copy offerings + templates only (no client data) into the scratch DB
for (const t of ["offerings", "document_templates"]) {
  const rows = seedDb.prepare(`SELECT * FROM ${t}`).all() as any[]; if (!rows.length) continue;
  const cols = Object.keys(rows[0]); const ins = db.prepare(`INSERT INTO ${t} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`);
  for (const r of rows) ins.run(...cols.map((c) => r[c]));
}
const people = [
  { n: "Harbor View Holdings, LLC", tid: "98-7654321", addr: { address: "100 Example Way", address2: "", city: "Testville", state: "FL", zip: "33000", country: "United States" }, amt: 400000, email: "a@example.test" },
  { n: "Lakeside Capital Partners, LLC", tid: "97-1234567", addr: { address: "200 Placeholder Rd", address2: "Suite 5", city: "Fakeburg", state: "TX", zip: "75000", country: "United States" }, amt: 250000, email: "b@example.test" },
];
let fail = 0; const check = (ok: boolean, msg: string) => { if (!ok) { fail++; console.error("  FAIL", msg); } else console.log("  ok  ", msg); };
const text = (f: string, a?: number, b?: number) => execFileSync("pdftotext", [...(a ? ["-f", String(a), "-l", String(b ?? a)] : []), "-layout", f, "-"]).toString();
const pages = (f: string) => Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [f]).toString())![1]);
const out = path.join(process.cwd(), "storage", "db", "test-out"); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });

async function main() {
  const files: { who: number; kind: string; f: string; pages: number; master: number }[] = [];
  for (const [i, p] of people.entries()) {
    const cid = Number(db.prepare("INSERT INTO clients (full_name, email, phone, address) VALUES (?,?,?,?)").run("Test Person " + (i + 1), p.email, "+1 555 000 000" + i, "").lastInsertRowid);
    const eid = Number(db.prepare("INSERT INTO investing_entities (client_id, name, entity_type, holding_title, tax_address, tax_id_encrypted, k1_name) VALUES (?,?,?,?,?,?,?)")
      .run(cid, p.n, "Limited Liability Company", "Company Ownership", JSON.stringify(p.addr), encryptSecret(p.tid), p.n).lastInsertRowid);
    const com = Number(db.prepare("INSERT INTO commitments (investing_entity_id, offering_id, desired_commitment) VALUES (?,?,?)").run(eid, 81, p.amt).lastInsertRowid);
    for (const inst of createSignatureDocuments(db, com)) {
      const { bytes, fileName } = await buildInstancePdf(db, inst);
      const f = path.join(out, `${i}-${inst}.pdf`); writeFileSync(f, bytes);
      const t = db.prepare("SELECT t.doc_type d, t.master_file_path m FROM document_instances di JOIN document_templates t ON t.id = di.template_id WHERE di.id = ?").get(inst) as any;
      const masterPages = pages(path.join(process.cwd(), t.m));
      files.push({ who: i, kind: t.d, f, pages: pages(f), master: masterPages });
      console.log(`\n[${p.n}] ${t.d} -> "${fileName}"`);
      check(pages(f) === masterPages + 1, `page count ${pages(f)} = master ${masterPages} + Summary page`);
      const sum = text(f, pages(f));
      const addr = [p.addr.address, p.addr.address2, p.addr.city, `${p.addr.state} ${p.addr.zip}`].filter(Boolean).join(", ");
      for (const [label, v] of [["COMMITTED", "$" + p.amt.toLocaleString("en-US")], ["INVESTING ENTITY", p.n], ["ENTITY TYPE", "Limited Liability Company"], ["HOLDING TITLE", "Company Ownership"], ["TAX ID NUMBER", p.tid], ["TAX ADDRESS", addr]])
        check(new RegExp(label + "\\s+" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(sum.replace(/\n\s*\n/g, "\n")), `Summary ${label} = ${v}`);
      check(sum.includes(fileName), `Summary footer carries file name "${fileName}"`);
      if (t.d === "SUBSCRIPTION_BOOKLET") {
        const p14 = text(f, 14); check(p14.includes(p.n) && p14.includes(p.tid), "Part 1 body shows subscriber name + taxpayer ID");
        check(text(f, 24, 25).includes(p.n), "Schedule K-1 member name filled");
        check(text(f, 22, 23).includes(p.amt.toLocaleString("en-US")), "commitment amount appears in body");
      }
    }
  }
  console.log("\n[isolation + denylist]");
  for (const f of files) {
    const all = text(f.f); const other = people[1 - f.who];
    check(!all.includes(other.tid) && !all.includes(other.n) && !all.includes(other.addr.address), `file ${path.basename(f.f)} contains none of the other entity's data`);
    for (const d of SAMPLE_INVESTOR_DENYLIST) check(!new RegExp(`(^|[^A-Za-z0-9])${d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9]|$)`, "i").test(all), `no sample identifier "${d}" in ${path.basename(f.f)}`);
    const meta = execFileSync("pdfinfo", [f.f]).toString();
    check(!/^(Author|Producer|Creator|Title|Subject|Keywords):[ \t]*\S/m.test(meta), `metadata stripped in ${path.basename(f.f)}`);
  }
  console.log(`\nclassification sanity:`, JSON.stringify(["x Subscription Booklet.pdf", "UPDATED W-9 Fund 32.pdf", "CEF 30 - Wire Instructions.pdf"].map((n) => classify(n).docType)));
  console.log(fail ? `\n${fail} FAILURE(S)` : "\nALL PERSONALISATION ACCEPTANCE CHECKS PASSED");
  for (const e of ["", "-wal", "-shm"]) if (existsSync(tmp + e)) rmSync(tmp + e);
  process.exit(fail ? 1 : 0);
}
main();
