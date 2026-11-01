# Supabase + Cloudflare — migration & hosting plan

Owner decision (2026-11-01): Muse handles this end-to-end. The user supplies
account access (below); Muse does the migration, the hosting setup, and pushes
every step to this repo so nothing exists only on one machine. Claude Code and
Muse both work from this repo — branch + PR for changes, pull before starting,
never commit `documents/signatures-pending/` or any real `.env` / secret.

## Where the code stands (inspected 2026-11-01, commit ef8af92)

- Next.js 16.4 (App Router) + TypeScript + Tailwind. See `AGENTS.md`: this Next
  version has breaking changes — read `node_modules/next/dist/docs/` first.
- Data layer is `node:sqlite` (`src/lib/db.ts`, 185 lines). The `SCHEMA` string
  there defines **15 tables**: clients, authorized_emails, outbox, users,
  sessions, investing_entities, entity_contacts, bank_accounts, offerings,
  commitments, document_templates, document_instances, signature_requests,
  tax_forms, transactions.
- `db()` is used in ~54 places across ~20 files (pages, actions, route
  handlers, `src/lib/{auth,docs,docviews,invites,queries}.ts`, scripts).
- Files on local disk today: `storage/templates/` = 19 master PDFs, ~53 MB;
  generated/executed PDFs are written per client and served only to the owning
  client (`src/app/investor/files/*`, 404 for everyone else — must be kept).
- Secrets the app already expects: `TAX_ID_KEY` (AES-256-GCM, Tax IDs),
  `OPERATOR_KEY`, `APP_URL` (`.env.example`).

## Phase 1 — Supabase (Postgres + Storage)

1. **Schema migration** (`supabase/migrations/0001_init.sql`, generated from
   `src/lib/db.ts` SCHEMA):
   - `INTEGER PRIMARY KEY` → `bigint GENERATED ALWAYS AS IDENTITY`
   - SQLite 0/1 flags (`dark_theme`, `is_disregarded`, …) → `boolean`
   - `datetime('now')` defaults → `timestamptz NOT NULL DEFAULT now()`
   - JSON-in-TEXT columns → `jsonb`: `investing_entities.tax_address`,
     `investing_entities.distribution_method`, `offerings.data`,
     `document_templates.field_map`, `document_templates.appears_in`,
     `entity_contacts.emails/phones`
   - Keep all CHECK constraints (doc_type, statuses, offering kind) and indexes.
2. **Storage buckets (all private, no public access):**
   `templates` (the 19 masters), `generated`, `executed`. Upload masters from
   `storage/templates/`; `check:masters` rules still apply — nothing from
   `signatures-pending/` is ever uploaded.
3. **Data layer:** add `@supabase/supabase-js`; a server-only client using the
   service-role key. Replace `db()` call sites module by module
   (`queries.ts`/`docs.ts`/`docviews.ts` first, then actions/routes).
   `personalise.ts` keeps working unchanged apart from where it reads rows /
   writes PDFs — generated PDFs go to Storage instead of local disk.
4. **Auth — keep the custom model for this phase.** The allowlist
   (`authorized_emails`), single-use 48h set-password links, hashed sessions
   and the onboarding gate are spec'd (§18) and covered by
   `tests/e2e/access-model.js` (41 checks). Moving to Supabase Auth is a
   separate, later decision; if adopted, the allowlist + onboarding gate stay.
5. **RLS:** enable Row Level Security on all 15 tables with no anon policies
   (deny-by-default); the server uses the service-role key, which bypasses
   RLS. RLS becomes an active per-client layer only if/when Supabase Auth lands.
6. **Seed:** port `scripts/seed.ts` to load `src/data/seed-data.ts` into
   Supabase (demo data stays fictional).
7. **Gate before Phase 2:** `npm run check:masters`, `check:images`,
   `test:personalisation` (70 checks), and the access-model e2e must pass
   against Supabase, locally.

## Phase 2 — Hosting (Cloudflare)

Per HANDOFF §2: the site is domain-independent; **domain comes last**.

1. First verify current OpenNext / Next 16.4 support for Cloudflare Workers.
   - If solid → deploy to a `*.workers.dev` staging URL.
   - If weak → host the Node app on Render/Fly (SQLite/local-disk assumptions
     are gone after Phase 1, so this is straightforward) with Cloudflare
     DNS/CDN in front; staging URL first either way.
2. Production secrets set as platform secrets, never in the repo:
   `TAX_ID_KEY` (freshly generated), `OPERATOR_KEY` (replace the dev
   passphrase), `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL` (staging URL for now).
3. When the user buys the domain (Cloudflare Registrar): attach it, update
   `APP_URL`, and only then do invite-email sender/links need it.
   Do not register a domain containing Cardone's trademark without Cardone's
   authorisation (HANDOFF hard rule).

## Phase 3 — after hosting (separate work, not in this plan's scope)

Replace stubs: real email sending (outbox → provider), e-signature capture,
operator admin + 2FA, login rate limiting, audit log, backups.

## What the user needs to give Muse (one time)

### Supabase
1. Create a free account at supabase.com and a project named
   `cardone-capital` (set a strong database password and keep it).
2. Give Muse, **via Muse's secure entry — never in chat, never in GitHub**:
   - Project URL and anon key (Project Settings → API) — low sensitivity
   - `service_role` key (same page) — **secret**
   - Database password — **secret**
   - A Supabase access token (supabase.com/dashboard/account/tokens) —
     **secret**; this is what lets Muse run migrations and manage the
     project directly.

### Cloudflare
1. Create a free account at cloudflare.com; under Workers & Pages, choose a
   `workers.dev` subdomain. No domain purchase needed yet.
2. Give Muse, via secure entry:
   - A Cloudflare API token (My Profile → API Tokens → use the
     "Edit Cloudflare Workers" template) — **secret**
   - The Account ID (Workers overview page) — not a secret

When those are in, Muse runs Phase 1, then Phase 2, pushing to GitHub at
each step.
