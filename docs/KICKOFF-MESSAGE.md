# The message to paste into Claude Code (copy everything in the box)

```
I am rebuilding an investor portal (a clone of the Cardone Capital investor portal on AppFolio, user-facing side only). This folder is the complete project kit — everything you need is already here, so tackle the whole build as ONE project, not piece by piece.

START BY READING, in this order:
1. CLONE-PROMPT.md — the master instruction. It contains EVERYTHING: the full site spec (login, app shell, Dashboard, New Offerings, all offering detail templates, Documents, Signatures, Tax Forms, Transactions, Contact Us, My Profile), all seed data (all 28 offerings with their properties, all 20 documents), Section 17 has the complete document-template, de-personalisation and database instruction; Section 18 the invite-only access model and onboarding form; Section 19 the frozen visual identity. Follow it exactly, including the quirks it says to preserve.
2. documents/manifest.json and documents/STATUS.md — the document index (complete: 21 PDF files, 20 unique documents). Also read documents/ARRANGEMENT.md — the views/ folders mirror exactly where each document appears on the portal.
3. documents/ folders — the actual PDFs. Treat the PDFs in documents/fund-29/, fund-30/, fund-31/ and fund-32/ as the clean master templates/source files and serve them from the matching offering and Documents pages.

YOUR PLAN MUST COVER ALL OF THESE MAIN PARTS AT ONCE, in this order, before you start changing details:
(a) Project scaffold + the database schema from Section 17 (clients, investing_entities, commitments, document_templates, document_instances, signature_requests), with taxpayer IDs encrypted and never displayed in full.
(b) App shell, authentication with deep-link return, and all routes.
(c) Dashboard, New Offerings, the 3 offering-detail templates, and the Invest/Submit-Interest form, driven by the seed data in the prompt.
(d) The Documents system (All / Investment / Signatures tabs, filters, per-fund pages, upload modal stub) and the signature flow (pending list → consent page showing the investing entity → stub signing step).
(e) The document personalisation pipeline: static documents served as-is; Subscription Booklets and W-9 packets generated per client from the database using the field map in Section 17; executed copies stored per client after signing.
(f) Tax Forms and Transactions with their exact empty states, Contact Us, and My Profile with dark theme.
(g) The invite-only access model and first-time onboarding form from Section 18: NO public sign-up anywhere (login only), an operator-managed email allowlist with the DECIDED credential model (single-use expiring invite link; the client sets their own password — do NOT build operator-generated passwords), and a mandatory first-login form (name, entity/LLC name, entity type, Tax ID, tax address, K-1 name, contacts, distribution method) whose data populates the client's profile and personalises their documents per Section 17.

(h) VISUAL IDENTITY IS FROZEN (Section 19): the site must look identical to the original — same Cardone Capital logo and branding, same colours (sidebar navy #002C4F, active green #3C8627, blue #0175D8, badge yellow #FCC43E), same fonts, layout and components, desktop and mobile. Use the reference screenshots in this kit as ground truth and do the side-by-side visual QA in Section 19. Later changes will be personalisation/data only, never visual.

HARD RULES:
- The two files in documents/signatures-pending/ are personalised samples from a real investor (one contains a filled taxpayer ID). NEVER use them as templates, NEVER copy their values into seed/demo data, and EXCLUDE that folder from any deployment. Demo data must use clearly fictional investors.
- Master templates must contain no sample-investor data — implement the automated check described in Section 17.
- Nothing external is real: payments, Plaid, e-signature capture, email sending are stubs, clearly marked.
- Work through the phases in order, keep going without stopping to ask me about minor details — make sensible decisions consistent with the prompt and note them. We will make minor changes later; the goal of this run is the complete, working whole against the acceptance criteria at the end of CLONE-PROMPT.md and Section 17.


Confirm you have read CLONE-PROMPT.md in full, show me the complete build plan covering (a)–(h), then start with (a) and continue.
```
