/* Seed: offerings (28), document templates (19 masters from manifest.json), fictional demo clients.
   Usage: npm run db:seed   (drops and recreates storage/db/portal.sqlite) */
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { openDb } from "../src/lib/db";
import { encryptSecret, hashPassword } from "../src/lib/crypto";
import { ALL_OFFERINGS, DEMO } from "../src/data/seed-data";
import { createSignatureDocuments } from "../src/lib/instances";
import { classify, isoFromMDY, offeringInternalId } from "../src/lib/catalog";

const root = process.cwd();
const dbPath = process.env.DB_PATH ?? path.join(root, "storage", "db", "portal.sqlite");
for (const ext of ["", "-wal", "-shm"]) if (existsSync(dbPath + ext)) rmSync(dbPath + ext);
const db = openDb(dbPath);

// ---- offerings ----
const insOff = db.prepare("INSERT INTO offerings (id, portal_id, kind, name, slug, sort_order, data) VALUES (?,?,?,?,?,?,?)");
for (const o of ALL_OFFERINGS) insOff.run(offeringInternalId(o), o.portalId, o.kind, o.name, o.slug, o.sortOrder, JSON.stringify(o));

// ---- document templates from the manifest (masters only; signatures-pending is NEVER read) ----
const manifest = JSON.parse(readFileSync(path.join(root, "storage/templates/manifest.json"), "utf8"));
const folderToOffering: Record<string, number> = { "fund-29": 81, "fund-30": 86, "fund-31": 87, "fund-32": 88 };
const insTpl = db.prepare(`INSERT INTO document_templates
  (offering_id, doc_type, display_name, master_file_path, is_personalised, field_map, year, shared_date, appears_in)
  VALUES (?,?,?,?,?,?,?,?,?)`);
const BOOKLET_FIELD_MAP = JSON.stringify({
  fills: [
    { field: "Name of Subscriber:", source: "investing_entities.name" },
    { field: "Social Security or Taxpayer ID No.:", source: "investing_entities.tax_id_encrypted", decryptAtGenerationOnly: true },
    { field: "Member Name as it appears on your Schedule K-1 (please print):", source: "investing_entities.k1_name" },
    { field: "Email Address:", source: "clients.email" },
    { field: "Commitment amount", source: "commitments.desired_commitment" },
  ],
  appendPage: "summary",
});
let count = 0;
for (const d of manifest.documents) {
  if (d.folder === "signatures-pending") throw new Error("signatures-pending must never be a template source");
  const diskName: string = d.path.split("/").pop();
  const file = path.join("storage/templates", d.folder, diskName);
  if (!existsSync(path.join(root, file))) throw new Error("Missing master: " + file);
  const { docType, personalised } = classify(d.fileName);
  insTpl.run(folderToOffering[d.folder], docType, d.fileName, file, personalised ? 1 : 0, docType === "SUBSCRIPTION_BOOKLET" ? BOOKLET_FIELD_MAP : null,
    d.year ?? null, isoFromMDY(d.shared), JSON.stringify(d.appearsIn));
  count++;
}
// Fund 32's W-9 is the fund-independent blank master used to build every W-9 packet
db.prepare("UPDATE document_templates SET offering_id = NULL, field_map = ? WHERE doc_type = 'W9'")
  .run(JSON.stringify({ fills: [], appendPage: "summary" }));

// ---- fictional demo clients (login works; already onboarded) ----
const insAuth = db.prepare("INSERT INTO authorized_emails (email, invited_by, status, activated_at) VALUES (?, 'seed', 'ACTIVE', datetime('now'))");
const insClient = db.prepare("INSERT INTO clients (full_name, email, phone, address, onboarding_completed_at) VALUES (?,?,?,?, datetime('now'))");
const insUser = db.prepare("INSERT INTO users (client_id, email, password_hash) VALUES (?,?,?)");
const insEnt = db.prepare(`INSERT INTO investing_entities (client_id, name, entity_type, holding_title, tax_address, tax_id_encrypted, k1_name)
  VALUES (?,?,?,?,?,?,?)`);
const insContact = db.prepare("INSERT INTO entity_contacts (entity_id, name, emails, phones, is_primary, document_access, required_signer) VALUES (?,?,?,?,1,'All Documents',1)");
const insCommit = db.prepare("INSERT INTO commitments (investing_entity_id, offering_id, desired_commitment) VALUES (?,?,?)");
for (const c of DEMO.clients) {
  insAuth.run(c.email);
  const cid = Number(insClient.run(c.full_name, c.email, c.phone, c.address).lastInsertRowid);
  insUser.run(cid, c.email, hashPassword(DEMO.password));
  const eid = Number(insEnt.run(cid, c.entity.name, c.entity.entity_type, c.entity.holding_title, JSON.stringify(c.entity.tax_address), encryptSecret(c.entity.tax_id), c.entity.k1_name).lastInsertRowid);
  insContact.run(eid, c.full_name, JSON.stringify([c.email]), JSON.stringify([c.phone]));
  const commitId = Number(insCommit.run(eid, 81, c.commitment).lastInsertRowid);
  // First demo client gets the same signature-page ids/dates the portal shows (31731 / 31578); the rest get fresh ids.
  const first = c === DEMO.clients[0];
  createSignatureDocuments(db, commitId, first ? { bookletPageId: 31731, w9PageId: 31578, bookletRequested: "2026-08-07", w9Requested: "2026-08-03" } : { bookletRequested: "2026-08-07", w9Requested: "2026-08-03" });
}
// an invited-but-not-onboarded email (allowlist demo)
db.prepare("INSERT INTO authorized_emails (email, invited_by, status) VALUES (?, 'seed', 'INVITED')").run(DEMO.invitedNotOnboarded);

console.log(`Seeded: ${ALL_OFFERINGS.length} offerings, ${count} document templates, ${DEMO.clients.length} fictional demo clients -> ${dbPath}`);
