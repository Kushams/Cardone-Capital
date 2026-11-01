# Cardone Capital Investor Portal — clone (user-facing side)

Pixel-faithful rebuild of the investor portal per `docs/CLONE-PROMPT.md` (§1–19). Next.js (App Router) + TypeScript + Tailwind,
SQLite (`node:sqlite`), `pdf-lib` for per-client documents, AES-256-GCM for Tax IDs.

## Run
```bash
npm install
npm run db:seed            # recreates storage/db/portal.sqlite (RESTART the dev server after every reseed)
npm run dev                # http://localhost:3000  ->  redirects to /investor/login
```
Fictional demo logins (password `Demo-Passw0rd!Change`): `alex.demo@example.test` (Harbor View Holdings, LLC), `sam.sample@example.test` (Lakeside Capital Partners, LLC).
Operator stub: `/operator` (dev passphrase `operator-dev-key`; set `OPERATOR_KEY` anywhere shared). **Set `TAX_ID_KEY` (32 bytes, base64) in any non-dev environment** — without it dev mode creates a git-ignored local key and production refuses to start.

## Tests / checks
| Command | What it proves |
|---|---|
| `npm run check:masters` | every master in the template store: no sample-investor identifiers (word-boundary denylist + optional git-ignored `storage/.denylist-extra`), no PDF metadata, nothing outside `storage/templates/`, never `signatures-pending/` |
| `npm run test:personalisation` | §17-D: Booklet = master+1 pages, W-9 packet = 6+1; Summary values/positions; in-body fills; no cross-entity data; no sample identifiers; metadata stripped (70 checks) |
| `node tests/e2e/access-model.js screenshots` | §18 end-to-end in a browser (needs the dev server + Playwright): no sign-up, generic responses, hashed single-use 48h link, client-chosen password, onboarding gate, encrypted Tax ID, isolation, revoke (41 checks) |
| `tests/e2e/documents-counts.js`, `sign-flow.js`, `screenshots.js`, `visual-qa.js` | document counts/dots/filters; consent→Agree→sign→executed copy + 404 isolation; screenshot batches; side-by-side vs `storage/reference/` |

## Where things live
- `src/data/seed-data.ts` — the ONE data file: all 28 offerings, document previews, fictional demo investors, sample-identifier denylist.
- `storage/templates/` — clean masters (19 PDFs, metadata stripped) + `manifest.json`. `signatures-pending/` is **excluded and git-ignored**.
- `src/lib/personalise.ts` — generator (booklet fills by label-anchored coordinates in `src/data/booklet-field-coords.json`, entity watermark, Summary page, executed copy).
- `src/lib/invites.ts`, `src/app/investor/{login,forgot-password,set-password,onboarding}`, `src/app/operator` — invite-only access.

## STUBS (nothing external is real)
Payments / “I sent my capital”, Plaid bank linking, e-signature capture (typed name only; stored copy is stamped *DEMO/STUB*), email sending (written to the `outbox` table, visible in the operator console), Invest-form Submit, Upload Document, Download All, contact-edit menu “Edit”, operator console (stub by design), Google Maps embed (loads only with network access).

## Decisions & deviations — please review
1. **Consent text is a placeholder.** The kit has no electronic-consent wording and §10 forbids inventing legal text; the page has the specified section structure with clearly marked placeholders. Supply the firm's text.
2. **Logo and property photos are recreations/placeholders** (no artwork in the kit). Slots are `components/Logo.tsx` and `components/Photo.tsx`. Font: Nunito Sans (closest free match to the original's humanist sans; the original face could not be identified).
3. **Personalised docs also carry a diagonal entity-name watermark on every page** — found by inspecting the reference sample; the prompt's text (“everything else byte-identical”) omits it. Reproduced for Booklet and W-9 packet. Other fills (page 14 name/TIN/address/phone/email, page 22 amount, signature page address/email, K-1 name/email/phone) are anchored by label text so they work on all four fund booklets (Fund 32's is one page longer).
4. **Tax ID “Show” link vs. §17.** §14 says Show reveals the Tax ID; §17 (binding) says never display more than the last 4 anywhere. I followed §17: “…1234” plus a Show link that explains the full number is never displayed. Tell me if you want a reveal.
5. **Tax ID is stored as digits only** (dashes stripped), matching how the reference Summary page prints it.
6. **Onboarding is a hard redirect gate** (all portal pages → `/investor/onboarding` until submitted), rather than only a Dashboard action item.
7. **Documents “Investing Entity” filter** keeps shared (entity-less) documents visible and narrows entity-specific ones; the original's behaviour wasn't observed.
8. Preserved quirks: sidebar badge 3 vs 4 cards; “Square Feet 760”; Fund 31 OA year “--”; double comma in Miami River address; “Ciry”; asset-card field omissions; Fund 32's H1-only recent page; the Documents-tab dot column (7 of 19 rows, unlabelled).
9. Asset/recent-offering descriptions are short placeholder copy based on the audit gists (§16 says to use the firm's own text).
10. The W-9 master is XFA; generated packets drop the XFA entry so viewers show the standard AcroForm.
