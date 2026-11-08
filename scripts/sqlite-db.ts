import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PortalDb } from "../src/lib/db";

/**
 * DEV-ONLY SQLite tooling. The app runtime no longer uses SQLite (Phase 1 moved
 * data to Supabase — see src/lib/supabase.ts); this module exists so the seed and
 * the personalisation acceptance test can still run against a scratch SQLite file.
 * Never import this from src/.
 */
export const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  date_of_birth_or_formation TEXT,
  fincen_id TEXT,
  dark_theme INTEGER NOT NULL DEFAULT 0,
  onboarding_completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS authorized_emails (
  email TEXT PRIMARY KEY,
  invited_by TEXT,
  status TEXT NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED','ACTIVE','REVOKED')),
  invite_token_hash TEXT,
  invite_expires_at TEXT,
  token_purpose TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  activated_at TEXT
);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL UNIQUE REFERENCES clients(id),
  email TEXT NOT NULL UNIQUE REFERENCES authorized_emails(email),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS investing_entities (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  entity_type TEXT,
  is_disregarded INTEGER NOT NULL DEFAULT 0,
  holding_title TEXT,
  tax_address TEXT,
  tax_id_encrypted TEXT,
  k1_name TEXT,
  formation_date TEXT,
  distribution_method TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entity_contacts (
  id INTEGER PRIMARY KEY,
  entity_id INTEGER NOT NULL REFERENCES investing_entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emails TEXT NOT NULL DEFAULT '[]',
  phones TEXT NOT NULL DEFAULT '[]',
  is_primary INTEGER NOT NULL DEFAULT 0,
  document_access TEXT NOT NULL DEFAULT 'All Documents',
  required_signer INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY,
  entity_id INTEGER NOT NULL REFERENCES investing_entities(id) ON DELETE CASCADE,
  nickname TEXT, bank_name TEXT, account_type TEXT,
  routing_encrypted TEXT, account_encrypted TEXT
);

CREATE TABLE IF NOT EXISTS offerings (
  id INTEGER PRIMARY KEY,
  portal_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('new','recent')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL,
  data TEXT NOT NULL,
  UNIQUE (kind, portal_id)
);

CREATE TABLE IF NOT EXISTS commitments (
  id INTEGER PRIMARY KEY,
  investing_entity_id INTEGER NOT NULL REFERENCES investing_entities(id),
  offering_id INTEGER NOT NULL REFERENCES offerings(id),
  desired_commitment INTEGER NOT NULL,
  contributed INTEGER,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS'
);

CREATE TABLE IF NOT EXISTS document_templates (
  id INTEGER PRIMARY KEY,
  offering_id INTEGER REFERENCES offerings(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('PPM','OPERATING_AGREEMENT','SUBSCRIPTION_BOOKLET','W9','WIRE_INSTRUCTIONS','MEMORANDUM')),
  display_name TEXT NOT NULL,
  master_file_path TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1',
  is_personalised INTEGER NOT NULL DEFAULT 0,
  field_map TEXT,
  year INTEGER,
  shared_date TEXT NOT NULL,
  doc_type_label TEXT NOT NULL DEFAULT 'Agreements',
  appears_in TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS document_instances (
  id INTEGER PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES document_templates(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  investing_entity_id INTEGER NOT NULL REFERENCES investing_entities(id),
  commitment_id INTEGER REFERENCES commitments(id),
  generated_file_path TEXT,
  executed_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_SIGNATURE','SIGNED','EXECUTED')),
  requested_at TEXT,
  signed_at TEXT
);

CREATE TABLE IF NOT EXISTS signature_requests (
  id INTEGER PRIMARY KEY,
  document_instance_id INTEGER NOT NULL REFERENCES document_instances(id),
  investing_entity_id INTEGER NOT NULL REFERENCES investing_entities(id),
  requested_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','AGREED','SIGNED')),
  signature_page_id INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tax_forms (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), investing_entity_id INTEGER REFERENCES investing_entities(id),
  name TEXT NOT NULL, investment TEXT, tax_year INTEGER, shared_date TEXT NOT NULL, file_path TEXT
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), investing_entity_id INTEGER REFERENCES investing_entities(id),
  tx_date TEXT NOT NULL, kind TEXT NOT NULL, description TEXT, investment TEXT, amount_cents INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entities_client ON investing_entities(client_id);
CREATE INDEX IF NOT EXISTS idx_instances_client ON document_instances(client_id, status);
CREATE INDEX IF NOT EXISTS idx_sigreq_entity ON signature_requests(investing_entity_id, status);
`;

export function openDb(p: string): DatabaseSync {
  mkdirSync(path.dirname(p), { recursive: true });
  const d = new DatabaseSync(p);
  d.exec(SCHEMA);
  return d;
}

/** PortalDb backed by a scratch SQLite file — same SQL the app used before Phase 1. */
export function sqlitePortalDb(d: DatabaseSync): PortalDb {
  return {
    async loadInstanceRow(instanceId) {
      const r = d.prepare(`SELECT di.id, di.client_id cid, di.status, t.doc_type, t.display_name, t.master_file_path master, o.name offeringName,
          e.name ename, e.entity_type etype, e.holding_title htitle, e.tax_id_encrypted tid, e.tax_address taddr, e.k1_name k1, c.desired_commitment amt,
          cl.email, cl.phone, cl.address
        FROM document_instances di JOIN document_templates t ON t.id = di.template_id JOIN investing_entities e ON e.id = di.investing_entity_id
        JOIN clients cl ON cl.id = di.client_id JOIN commitments c ON c.id = di.commitment_id JOIN offerings o ON o.id = c.offering_id WHERE di.id = ?`).get(instanceId) as any;
      if (!r) return null;
      return { ...r, taddr: r.taddr ? JSON.parse(r.taddr) : null };
    },
    async setGeneratedFilePath(instanceId, rel) {
      d.prepare("UPDATE document_instances SET generated_file_path = ? WHERE id = ?").run(rel, instanceId);
    },
    async generatedFilePath(instanceId) {
      const r = d.prepare("SELECT generated_file_path p FROM document_instances WHERE id = ?").get(instanceId) as any;
      return r?.p ?? null;
    },
    async markExecuted(instanceId, rel) {
      d.prepare("UPDATE document_instances SET executed_file_path = ?, status = 'EXECUTED', signed_at = datetime('now') WHERE id = ?").run(rel, instanceId);
      d.prepare("UPDATE signature_requests SET status = 'SIGNED' WHERE document_instance_id = ?").run(instanceId);
    },
    async pendingInstanceIdsForEntity(entityId) {
      return (d.prepare("SELECT id FROM document_instances WHERE investing_entity_id = ? AND status IN ('DRAFT','PENDING_SIGNATURE')").all(entityId) as { id: number }[]).map((r) => r.id);
    },
    async commitmentContext(commitmentId) {
      const r = d.prepare(`SELECT c.id, c.offering_id, c.investing_entity_id eid, e.client_id cid FROM commitments c JOIN investing_entities e ON e.id = c.investing_entity_id WHERE c.id = ?`).get(commitmentId) as any;
      return r ?? null;
    },
    async bookletTemplateId(offeringId) {
      const r = d.prepare("SELECT id FROM document_templates WHERE doc_type='SUBSCRIPTION_BOOKLET' AND offering_id = ?").get(offeringId) as any;
      return r?.id ?? null;
    },
    async w9TemplateId() {
      const r = d.prepare("SELECT id FROM document_templates WHERE doc_type='W9' ORDER BY id LIMIT 1").get() as any;
      return r?.id ?? null;
    },
    async maxSignaturePageId() {
      const r = d.prepare("SELECT MAX(signature_page_id) m FROM signature_requests").get() as any;
      return r?.m ?? null;
    },
    async insertDocumentInstance(v) {
      return Number(d.prepare(`INSERT INTO document_instances (template_id, client_id, investing_entity_id, commitment_id, status, requested_at) VALUES (?,?,?,?, 'PENDING_SIGNATURE', ?)`)
        .run(v.template_id, v.client_id, v.investing_entity_id, v.commitment_id, v.requested_at).lastInsertRowid);
    },
    async insertSignatureRequest(v) {
      d.prepare("INSERT INTO signature_requests (document_instance_id, investing_entity_id, requested_at, status, signature_page_id) VALUES (?,?,?, 'PENDING', ?)")
        .run(v.document_instance_id, v.investing_entity_id, v.requested_at, v.signature_page_id);
    },
  };
}
