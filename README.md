# Cardone Capital Investor Portal — clone (user-facing side)

Pixel-faithful rebuild of the investor portal per `docs/CLONE-PROMPT.md` (§1–19). Next.js (App Router) + TypeScript + Tailwind,
Supabase (Postgres + private Storage buckets) as the data layer, `pdf-lib` for per-client documents, AES-256-GCM for Tax IDs.
Live on Cloudflare Workers (OpenNext) at https://investors.cardonecapitalportal.us.

## Run
```bash
npm install
# .env.local needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (and TAX_ID_KEY for any shared environment)
npm run db:seed            # seeds the fictional demo dataset into the configured Supabase project
npm run dev                # http://localhost:3000  ->  redirects to /investor/login
```
Fictional demo logins (password `Demo-Passw0rd!Change`): `alex.demo@example.test` (Harbor View Holdings, LLC), `sam.sample@example.test` (Lakeside Capital Partners, LLC).
Operator console: `/operator` — named staff accounts (email + password, SUPERADMIN/STAFF roles) plus a recovery passphrase taken from the `OPERATOR_KEY` secret. The console refuses to run when `OPERATOR_KEY` is unset or set to the old public dev value. **Set `TAX_ID_KEY` (32 bytes, base64) in any non-dev environment** — without it dev mode creates a git-ignored local key and production refuses to start.

## Tests / checks
| Command | What it proves |
|---|---|
| `npm run check:images` | every image-map entry exists, every card/thumbnail slot has its file, no delivered file unused |
| `npm run check:masters` | every master in the template store: no sample-investor identifiers (word-boundary denylist + optional git-ignored `storage/.denylist-extra`), no PDF metadata, nothing outside `storage/templates/`, never `signatures-pending/` |
| `npm run test:personalisation` | §17-D: Booklet = master+1 pages, W-9 packet = 6+1; Summary values/positions; in-body fills; no cross-entity data; no sample identifiers; metadata stripped (70 checks) |
| `BASE=http://localhost:3000 node tests/e2e/access-model.supabase.js` | §18 end-to-end in a browser against the Supabase-backed app (needs a local server + Playwright): no sign-up, generic responses, hashed single-use 48h link, client-chosen password, onboarding gate, encrypted Tax ID, cross-client PDF isolation, revoke (47 checks) |
| `tests/e2e/documents-counts.js`, `sign-flow.js`, `screenshots.js`, `visual-qa.js` | document counts/dots/filters; consent→Agree→sign→executed copy + 404 isolation; screenshot batches; side-by-side vs `storage/reference/` |

## Where things live
- `src/data/seed-data.ts` — the ONE data file: all 28 offerings, document previews, fictional demo investors, sample-identifier denylist.
- `storage/templates/` — clean masters (19 PDFs, metadata stripped) + `manifest.json`. `signatures-pending/` is **excluded and git-ignored**.
- `src/lib/personalise.ts` — generator (booklet fills by label-anchored coordinates in `src/data/booklet-field-coords.json`, entity watermark, Summary page, executed copy).
- `src/lib/invites.ts`, `src/app/investor/{login,forgot-password,set-password,onboarding}`, `src/app/operator` — invite-only access.

## What is REAL now (no longer stubs)
Email sending via Resend from invest@ (invites, resets, notifications; every send also logged to the `outbox` table, visible in the operator console), e-signature (in-house draw-to-sign; the drawn signature image + audit record are stamped into the executed PDF — no DEMO/STUB marking), Invest-form Submit (creates real commitments + documents), Upload Document, Download All (ZIP of the client's All Documents), bank accounts (secure manual entry, ABA-validated, encrypted + masked like Tax IDs), operator console (named staff accounts, roles, activity log), login rate limiting, Google Maps embed on offering pages.

## STUBS / still pending
Payments / “I sent my capital” (no payment or funds-transfer rail exists; funding is by wire per the Wire Instructions document, confirmed by the firm), Plaid automatic bank linking (plugs into the same bank-accounts table once the firm opens a Plaid account), the electronic-consent wording (a clearly banner-marked DRAFT is live; the firm's final text replaces it in `src/app/investor/(app)/documents/signatures/[id]/page.tsx`), the 4 hero images and gallery photos 2…N (content), and Cloudflare Access in front of `/operator` (dashboard enablement step; the console is meanwhile guarded by staff accounts + the recovery passphrase).

## Decisions & deviations — please review
1. **Consent text is a placeholder.** The kit has no electronic-consent wording and §10 forbids inventing legal text; the page has the specified section structure with clearly marked placeholders. Supply the firm's text.
2. **Real images** are in `images/` (delivered as-is, assigned by `images/image-map.json`; served from `/images/*`). Logo, 24 Dashboard cards, 4 New Offerings cards and 41 property thumbnails are wired. **Pending:** the 4 detail-page hero files (`images/new-offerings/fund-NN-hero.*`) — until they arrive the fund's card photo fills the hero slot, and a hero file dropped into that folder is picked up automatically (`src/lib/images.ts`). **Pending:** gallery photos 2…N (slide 1 is the thumbnail; later slides show placeholders). Font: Nunito Sans (closest free match; the original face could not be identified).
3. **Personalised docs also carry a diagonal entity-name watermark on every page** — found by inspecting the reference sample; the prompt's text (“everything else byte-identical”) omits it. Reproduced for Booklet and W-9 packet. Other fills (page 14 name/TIN/address/phone/email, page 22 amount, signature page address/email, K-1 name/email/phone) are anchored by label text so they work on all four fund booklets (Fund 32's is one page longer).
4. **Tax ID “Show” link vs. §17.** §14 says Show reveals the Tax ID; §17 (binding) says never display more than the last 4 anywhere. I followed §17: “…1234” plus a Show link that explains the full number is never displayed. Tell me if you want a reveal.
5. **Tax ID is stored as digits only** (dashes stripped), matching how the reference Summary page prints it.
6. **Onboarding is a hard redirect gate** (all portal pages → `/investor/onboarding` until submitted), rather than only a Dashboard action item.
7. **Documents “Investing Entity” filter** keeps shared (entity-less) documents visible and narrows entity-specific ones; the original's behaviour wasn't observed.
8. Preserved quirks: sidebar badge 3 vs 4 cards; “Square Feet 760”; Fund 31 OA year “--”; double comma in Miami River address; “Ciry”; asset-card field omissions; Fund 32's H1-only recent page; the Documents-tab dot column (7 of 19 rows, unlabelled).
9. Asset/recent-offering descriptions are short placeholder copy based on the audit gists (§16 says to use the firm's own text).
10. The W-9 master is XFA; generated packets drop the XFA entry so viewers show the standard AcroForm.
