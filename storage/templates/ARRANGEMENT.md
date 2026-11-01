# Arrangement — every document exactly where the portal puts it

The PDFs are stored ONCE, in `documents/fund-29/`, `fund-30/`, `fund-31/`, `fund-32/` and `documents/signatures-pending/`.
The folders under `documents/views/` mirror every place the portal shows documents, in the portal's exact order and membership, with a CONTENTS.md and one pointer file per document naming its stored location:

- `views/01-all-documents/` — Documents → All: all 19 documents, in displayed (Shared-descending) order.
- `views/02-by-investment/<fund>/` — Documents → Investment: the 4 per-fund groups (29: 6 files, 30: 4, 31: 4, 32: 5).
- `views/03-signatures-pending/` — Documents → Signatures: the 2 pending items (Fund 29 Subscription Booklet, UPDATED W-9 Fund 29) — these are the personalised copies.
- `views/04-offering-page-documents/<page>/` — the Documents card on each offering detail page (Fund 29: 6 files; Fund 30: 3 — no Operating Agreement; Fund 31: 3; Fund 32: 4 — includes its W-9).
- `views/05-tax-forms/` — empty on the portal; nothing belongs here.

Nothing is duplicated and nothing is unfiled: every one of the 20 unique documents appears in the All view and/or the Signatures view, its fund group, and (for Funds 29–32) its offering page where the portal lists it. `documents/manifest.json` carries the same membership in machine-readable form (see "appearsIn").