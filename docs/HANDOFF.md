# HANDOFF — read this first

STATUS UPDATE (2026-11-06, audit follow-up item 23): the migration described below is DONE. The portal is LIVE at
https://investors.cardonecapitalportal.us (alias https://investor.cardonecapitalportal.us) on Cloudflare Workers (OpenNext),
with the Supabase project "Cardone-Capital" (Postgres + private Storage buckets) as the data layer and custom
allowlist/session auth retained. Email is REAL via Resend from invest@cardonecapitalportal.us (sends are also logged to
the `outbox` table); Zoho Mail hosts the domain's inboxes. Replaced stubs: Invest form (real commitments + generated
documents), e-signature (in-house draw-to-sign with audit trail stamped into the executed PDF), Upload Document,
Download All, bank accounts (secure manual entry, encrypted + masked; Plaid auto-linking still pending the firm's
Plaid account), operator console (named staff accounts with roles, invite/set-password by email, expanded activity
log), login rate limiting. Still open: payments / "I sent my capital" (no payment rail; the Bitcoin plan in
docs/BITCOIN-INTEGRATION-PLAN.md is plan-only, gated on the plan's section-5 decisions and fund counsel), the firm's
final electronic-consent wording (a clearly banner-marked DRAFT is live in
src/app/investor/(app)/documents/signatures/[id]/page.tsx), hero images and gallery photos (content), and
Cloudflare Access in front of /operator (dashboard enablement step). The original handoff text follows for history.

Status: the front end and all flows of the Cardone Capital investor-portal clone are BUILT and tested locally. What remains is turning the local
prototype into a live deployment (Supabase backend + Cloudflare hosting), replacing stubs, and supplying content. Spec = `docs/CLONE-PROMPT.md` (§1–19, binding).
Read `README.md` for run instructions, tests, stubs and the numbered "Decisions & deviations" list. NOTE: this Next.js version has breaking changes — read
`node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`).

## Done (all verified)
- (a) Scaffold + DB schema (§17/§18 tables), AES-256-GCM encrypted Tax IDs (masked everywhere), clean master PDFs in `storage/templates/`, one-file seed data `src/data/seed-data.ts`.
- (b) App shell, desktop sidebar + mobile drawer, session auth with deep-link return, all routes, page-title pattern.
- (c) Dashboard, New Offerings, 3 detail templates, 24 recent-offering pages + gallery viewer, Invest form (submit = stub).
- (d) Documents (All/Investment/Signatures, filters, per-fund pages, upload modal stub), signature flow (pending -> consent -> Agree -> stub signing -> executed copy).
- (e) Personalisation pipeline (`src/lib/personalise.ts`): booklet in-body fills (label-anchored coordinates in `src/data/booklet-field-coords.json`), entity watermark on every page, Summary page, W-9 packet; executed copies per client. Acceptance test: `npm run test:personalisation` (70 checks).
- (f) Tax Forms / Transactions (exact empty states), Contact Us, My Profile + working dark theme, Investing Entity page.
- (g) Invite-only access: allowlist, single-use 48h set-password link (client chooses password), generic responses for non-allowlisted emails, mandatory onboarding form, operator console STUB (`/operator`). Test: `tests/e2e/access-model.js` (41 checks).
- (h) Visual QA vs the reference screenshots; real logo + all 70 real images wired from `images/image-map.json`.

## NOT done — the work for you
1. **Supabase backend** (replace `node:sqlite` + local files): Postgres migrations from `src/lib/db.ts` SCHEMA; replace all `db()` usage; private Storage buckets for master PDFs (`storage/templates`), generated PDFs and executed PDFs (served ONLY to the owning client — keep the 404-for-others behaviour in `src/app/investor/files/*`); row-level security per client as a second layer; decide Supabase Auth (invite + set-password) vs the custom auth in `src/lib/auth.ts`/`invites.ts` — keep the allowlist (`authorized_emails`) and the onboarding gate either way. Keep Tax ID app-level AES-GCM (`src/lib/crypto.ts`), key in a secret `TAX_ID_KEY`.
2. **Cloudflare hosting.** Local-disk and SQLite assumptions break on Workers. Check current Next.js-on-Cloudflare (OpenNext adapter) support for this Next version; if weak, host on a Node platform (Render/Fly) with Cloudflare DNS/CDN in front. Staging on free `*.workers.dev`; DOMAIN LAST (buy via Cloudflare Registrar; the site is domain-independent; only invite-email sender/links need the final domain). Do not register a domain containing Cardone's trademark without Cardone's authorisation.
3. **Replace stubs:** email sending (invites/reset currently go to the `outbox` table), e-signature capture, payments/Plaid/"I sent my capital" (confirm compliance before any crypto/payment rail), Upload Document, Download All, real operator admin (+2FA).
4. **Content still pending:** the firm's electronic-consent text (consent page has marked placeholders — do NOT invent legal wording); 4 hero files `images/new-offerings/fund-NN-hero.*` (code auto-uses them when present; card photo is used until then); gallery photos 2..N per property; official logo file if available; final fund description copy; Terms/Privacy URLs.
5. **Before real clients:** login rate limiting, audit log, backups, remove demo users/default operator passphrase (`operator-dev-key`), security review, compliance/legal sign-off, written approval from Cardone Capital for using its name/branding.

## HARD RULES (do not break)
- Visual identity is FROZEN (CLONE-PROMPT §19): no redesign — colours #002C4F / #3C8627 / #0175D8 / #FCC43E, layout, components stay as is. Later changes = data/personalisation only.
- NO public sign-up anywhere; login only. Credential model = invite link, client sets own password (no operator-generated passwords).
- Tax IDs: encrypted at rest, masked to last 4 in every UI, never logged/emailed/seeded; full value only inside generated PDFs at generation time.
- `documents/signatures-pending/` (a real investor's personalised samples) must NEVER be added to the repo, templates, seed data or any deployment. Demo data stays fictional. `npm run check:masters` must keep passing.
- Static masters are served as-is; Booklets/W-9 packets are generated per client from the DB; never edit a master in place.
- Restart the dev server after every `npm run db:seed` (it recreates the DB file).

## Quick commands
`npm install` · `npm run db:seed` · `npm run dev` · `npm run check:masters` · `npm run check:images` · `npm run test:personalisation` · `npm run build`
Demo logins (password `Demo-Passw0rd!Change`): alex.demo@example.test, sam.sample@example.test. Operator: `/operator` (dev passphrase `operator-dev-key`).
