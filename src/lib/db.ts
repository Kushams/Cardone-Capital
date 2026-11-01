import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "storage", "db", "portal.sqlite");

/**
 * Schema = CLONE-PROMPT §17 (clients, investing_entities, offerings, commitments, document_templates,
 * document_instances, signature_requests) + §18 (authorized_emails) + §14 additions
 * (entity_contacts, bank_accounts) + credentials (users, sessions).
 * Taxpayer IDs exist ONLY as investing_entities.tax_id_encrypted (AES-256-GCM).
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
  token_purpose TEXT,           -- 'INVITE' | 'RESET' (single-use, 48h)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  activated_at TEXT
);

-- STUB: no email is ever sent. Messages that would be emailed are recorded here and shown in the operator console.
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
  tax_address TEXT,            -- JSON {address,address2,city,state,zip,country}
  tax_id_encrypted TEXT,       -- AES-256-GCM blob; never rendered in full
  k1_name TEXT,
  formation_date TEXT,
  distribution_method TEXT,    -- JSON {payment_method,bank_account_id,is_custodian_fbo,payee_name,payment_address{}} ; NULL => "Missing Information"
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
  routing_encrypted TEXT, account_encrypted TEXT   -- same encryption/masking rules as tax IDs
);

CREATE TABLE IF NOT EXISTS offerings (
  id INTEGER PRIMARY KEY,           -- internal id
  portal_id INTEGER NOT NULL,       -- the original portal's numeric route id (81, 86, 87, 88, 76, ...)
  kind TEXT NOT NULL CHECK (kind IN ('new','recent')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL,
  data TEXT NOT NULL,               -- JSON, from src/data/seed-data.ts
  UNIQUE (kind, portal_id)          -- 88 exists as both /opportunities/88 and /recent_offerings/88
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
  display_name TEXT NOT NULL,         -- file name exactly as shown on the portal
  master_file_path TEXT NOT NULL,     -- relative to repo root; only storage/templates/** (never signatures-pending)
  version TEXT NOT NULL DEFAULT '1',
  is_personalised INTEGER NOT NULL DEFAULT 0,
  field_map TEXT,                     -- JSON, personalised types only
  year INTEGER,
  shared_date TEXT NOT NULL,          -- ISO yyyy-mm-dd
  doc_type_label TEXT NOT NULL DEFAULT 'Agreements',
  appears_in TEXT NOT NULL DEFAULT '[]'   -- from manifest.json
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

declare global { var __db: DatabaseSync | undefined }

export function db(): DatabaseSync {
  if (!globalThis.__db) {
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec(SCHEMA);
    globalThis.__db = d;
  }
  return globalThis.__db;
}

export function openDb(p: string): DatabaseSync {
  mkdirSync(path.dirname(p), { recursive: true });
  const d = new DatabaseSync(p);
  d.exec(SCHEMA);
  return d;
}
