# PROMPT FOR CLAUDE CODE — Rebuild the Cardone Capital Investor Portal (user-facing side)

Copy everything below the line into Claude Code.

---

Build a pixel-faithful, fully navigable front-end clone of the Cardone Capital investor portal (hosted on AppFolio Investment Management at `investors.appfolioim.com/cardonecapital/investor/...`) as seen by a logged-in, non-admin investor. This is a rebuild project: match the structure, layout, pages, tables and flows described below exactly, using the seed data provided. Use placeholder personal data for the demo investor (name, entity names and amounts below are the sample account's). Do not connect any real backend, payment, e-signature, or Plaid service — stub those flows.

Suggested stack: React + TypeScript + Tailwind CSS (Next.js App Router is fine), a local seed-data file (`seed.ts`) for all offerings/documents/entities, and client-side routing that mirrors the original URL paths.

## 1. Global design system

- Clean sans-serif throughout. Large bold dark-grey H1 page titles; bold section headings inside cards; small grey field labels with black values.
- Page background white / very light grey. Content cards: white, rounded corners, thin light-grey border, subtle shadow, generous padding, stacked with gaps.
- Colours (approximate the original from these roles — exact hexes were not readable):
  - Dark navy: left sidebar background and the Cardone Capital wordmark.
  - Green: active sidebar item (solid fill), the INVEST button.
  - Blue: primary buttons (Log In, Agree, Sign), all text links, file names.
  - Light grey: secondary buttons (View Offering, Learn More, Sign Documents, View Investing Entities, View Offering Memorandum, Edit, Add Bank Account).
  - Yellow: "NEW" pill on offering cards, circular count badges (New Offerings = 3, Signatures = 2), Action Items bell icon.
  - Red: alert icon for incomplete steps / missing information. Green check: completed step.
- Loading state: brief circular light-blue spinner with the text "Please wait while your document is being loaded..." on document pages; show a short spinner on page transitions.
- Empty states are centred text, reproduced in the page specs below.
- Tables: sortable column headers (bold, with sort arrows), thin row dividers, blue links for fund/file names. Collapsible cards use a chevron.

## 2. App shell (logged-in)

Desktop layout:
- Top header (white, left to right): Cardone Capital logo (dark-navy stylised "C", "CARDONE" bold capitals, "CAPITAL" letter-spaced beneath) linking to Dashboard; "Knowledge Base" link with external-link icon; right-aligned user-name dropdown containing only "My Profile" and "Log Out".
- Left sidebar (dark navy, white text, top to bottom, in this exact order): Dashboard · New Offerings (yellow circular badge "3") · Tax Forms · Documents · Transactions · Contact Us · My Profile. Active item has a solid green background.
- No global search, notifications bell, inbox, settings gear or admin area exists for this account.
- Only footer in the app: centred small grey "Terms of Service | Privacy Policy" at the bottom of My Profile.

Mobile layout (verified from user screenshots): top bar (white) with a blue hamburger icon captioned "MENU" on the left, "Knowledge Base ↗" link centre-right, user-name dropdown on the right. Tapping the hamburger opens the dark-navy menu as a **slide-over drawer** covering the left ~half of the screen and overlaying the page content (content remains visible on the right); menu items are large white left-aligned rows in the same order, the active item is a full-width solid-green row, and the New Offerings yellow "3" badge is retained in the drawer. Cards stack in one column; dashboard and profile cards as described below.

Routes to implement (mirror the originals):
- `/investor/login`
- `/investor/investments` (Dashboard — this is also the portfolio view; there is no separate Portfolio page)
- `/investor/opportunities` (New Offerings) and `/investor/opportunities/:id`
- `/investor/recent_offerings/:id`
- `/investor/documents`, `/investor/documents/signatures`, `/investor/documents/signatures/:id`
- `/investor/taxes` (Tax Forms)
- `/investor/transactions`
- `/investor/contact_us`
- `/investor/settings/profile` (My Profile)

## 3. Data model

- `User` { name, phone, address?, loginEmail, email, fincenId?, darkTheme: boolean }
- `InvestingEntity` { id, name, holdingTitle?, investments: [], distributionMethod: null | string } — distribution method missing shows the red-alert "Missing Information" state.
- `BankAccount` { id, entityId, last4 } — seed with none (empty state).
- `Offering` { id, name, status: "new" | "in-progress" | "funded", isNew, heroPhotos[], pricePerShare?, targetRaise, minimumInvestment, investmentPeriod?, preferredReturn?, distributionSchedule?, targetIrr?, targetCashOnCash?, targetEquityMultiple?, fundedOn?, descriptionSummary, documents: Document[], property?: Property }
- `Property` { name, address, assetType, propertyClass, units, stories, parkingSpaces, yearBuilt, acquired?, squareFeet?, rentableSF?, landAcres?, photoCount?, hasMap }
- `Document` { id, name, investment, investingEntity?, asset?, type: "Agreements", year, sharedDate }
- `SignatureRequest` { id, requestedDate, documentName, investment, investingEntity, status: "pending" }
- `Commitment` { offeringId, entityId, holdingTitle, desiredCommitment, contributed }
- `Transaction` and `TaxForm` — seed both empty.

## 4. Page: Login

- Plain white page, one centred white card with light border. No nav/sidebar.
- Card: Cardone Capital logo at top, heading "Log in to your Investor Portal", `Email` text field, `Password` masked field, solid blue "Log In" button (bottom-left), "Forgot password?" link (bottom-right), "Knowledge Base" external link. No remember-me, SSO, social login, or sign-up link.
- Centred footer under the card: company name, phone "+1 305 407 0276", email "invest@cardonecapital.com".
- Behaviour: a successful (mock) login returns the user to the page they originally requested (deep-link redirect), e.g. a signature page.

## 5. Page: Dashboard (`/investor/investments`)

- H1 "Dashboard". Top-right text links: "Cardone Capital Website" and "Refer a Friend".
- Card "Action Items" (yellow bell icon), two sub-sections separated by a horizontal rule:
  1. Blue heading "Documents to Sign" — body text reporting that 2 documents need review and signature — grey button "Sign Documents" → Signatures view.
  2. Blue heading "Payment Information" — body text asking the user to set up a distribution bank account for their investing entities — grey button "View Investing Entities" → My Profile.
- Card "Welcome to your Investor Portal" (heading in green): a short welcome paragraph explaining secure access to investments, followed by a bullet list of exactly these six items: Position Details · Asset Information · Tax Forms · Reports & Documents · Distributions · Contributions — then a closing line that the user will be notified when new items are shared and to contact the firm with questions. (Use the original short welcome copy from the supplied screenshots.)
- Collapsible card "New Offerings": sortable table, columns `New Offering | Investing As | Desired Commitment | Contributed`. One seed row: "Cardone Equity Fund 29, LLC" | "Puza, LLC — Individual Ownership" | "$400,000" | "--".
- Section "Recent Offerings": responsive card grid, one card per funded offering: large property photo, fund name, "Funded on <date>", target metrics where listed in the seed data, grey "Learn More" button → recent offering detail. The two newest cards (Fund 32 and 10X Space Coast) show the funded date only, no target metrics.

## 6. Page: New Offerings (`/investor/opportunities`)

- H1 "New Offerings". No search, sort or filter controls.
- Responsive 3-column card grid. Card pattern: top property photo, centred bold fund name, optional yellow "NEW" pill, left/right label–value metric rows, centred light-grey "View Offering" button.
- Seed cards:
  1. Cardone Equity Fund 29, LLC — Preferred Return 8.00% · Target Raise $53,000,000 · Minimum Investment $200,000. No NEW pill (this is the in-progress one).
  2. Cardone Equity Fund 30, LLC — NEW · Target Raise $150,000,000 · Minimum Investment $200,000.
  3. Cardone Equity Fund 31, LLC — NEW · Target Raise $150,000,000 · Minimum Investment $200,000. Hero image is a high-rise with a large gold Bitcoin graphic.
  4. Cardone Equity Fund 32, LLC — NEW · Price Per Share $1,000 · Target Raise $150,000,000 · Minimum Investment $200,000.
- Note the preserved quirk: the sidebar badge says 3 while there are 4 cards — the badge counts NEW flags.

## 7. Page template: Offering detail — new offerings (`/investor/opportunities/:id`)

- Header: H1 fund name; subheading "Prepared for <Investor Name>"; top-right action — green "INVEST" button for fresh offerings (30/31/32), light-grey "Invest Again" for the in-progress offering (29).
- Hero: large property photo with a slide control ("Go to Slide 1").
- Right rail card "Offering Terms" — label/value rows in this order where present: Price Per Share (Fund 32 only: $1,000) · Target Raise · Minimum Investment ($200,000 all) · Investment Period (Fund 29: 10 Years; Funds 30/31/32: 7-10 Years) · Preferred Return (Fund 29 only: 8%) · Distribution Schedule (Monthly, all).
- Card "Offering Highlights": contains a single light-grey button "View Offering Memorandum".
- Card "Documents": simple list of blue PDF links (no icons, sizes or dates here).
- Card "Offering Description": rich-text block ending with small-print risk disclosure text that links to investor.gov and the firm's disclosures page.
- Property blocks differ per fund (implement as optional sections driven by seed data):
  - Fund 30 (10X Westshore South): property fact card plus an embedded Google Map (street/satellite toggle, fullscreen, Street View control). Facts: Address 6301 S West Shore Blvd, Tampa, FL 33616 · Asset Type Multi-Family · Property Class A · Total Units 608 · Square Feet 760 · Rentable SF 462,225 · Land Acres 51 · Stories 3 · Parking Spaces 1219 · Year Built 1989. Description in summary: a 608-unit multifamily acquisition on roughly 52 acres of waterfront land on Old Tampa Bay in South Tampa, positioned as a cash-flow asset (targeted ~5% cash flow), with renovated interiors, two resort-style pools, a two-storey fitness centre, and direct bay access with a kayak launch.
  - Fund 31: no map or address. Asset block only: Asset Type Mixed-Use · Year Built 2026. Description in summary: a vehicle for accredited investors targeting up to $150M of commitments, primarily multifamily assets in high-growth markets across the risk spectrum, plus opportunistic commercial real estate.
  - Fund 32 (10X Westshore): description only. In summary: acquisition of a 587-unit waterfront multifamily community built in 2020 on about 10 acres on Old Tampa Bay in South Tampa, Class A, cash-flow focused, two pools, two-storey fitness centre, yoga/spin studios, clubhouse, next to 10X Westshore South.

### Variant: in-progress offering detail (Fund 29)

- Instead of "Offering Highlights", show:
  - Card "Your Commitment": Investing entity "Puza, LLC" · Holding Title "Individual Ownership" · Desired Commitment "$400,000" (rendered as a blue link) · Contributed "--".
  - Card "Steps To Invest": table `Step | Status | Actions` with three rows:
    1. Investing Entity Details — green check — "Edit" action.
    2. Sign Documents — red alert icon — blue "Sign" button → signature consent page.
    3. Send Funds — red alert icon — "I sent my capital" link.
- Hero photo carries a "10X NAPLES + BITCOIN FUND" overlay graphic.
- Offering Terms for Fund 29: Target Raise $53,000,000 · Minimum Investment $200,000 · Investment Period 10 Years · Preferred Return 8% · Distribution Schedule Monthly.
- Description in summary: the "10X Naples + Bitcoin Fund" — acquisition of Orchid Run, a 282-unit, 2015-vintage, all-concrete multifamily asset in Central Naples, combined with Bitcoin exposure.

## 8. Page template: Recent / funded offering detail (`/investor/recent_offerings/:id`)

A deliberately simpler template: NO invest button, NO Offering Terms card, NO documents list, NO commitment/steps.
- H1 fund name.
- H4 "Investment Description" — bordered text card.
- H4 "Asset Details" — one asset card per property: H5 property name; address with a "Map" link; photo thumbnail with a photo-count label (e.g. "3 photos"); two-column fact grid; the investment description repeated at the bottom of the asset card.
- Worked example to seed exactly (10X Space Coast Fund, LLC): description in summary — a vehicle combining real estate with Bitcoin: acquisition of 10X Space Coast Town Center, a 300-unit Class A multifamily asset in Melbourne, Florida, bought without debt for immediate positive cash flow, with monthly real-estate income funding ongoing Bitcoin purchases. Asset: "10X Space Coast Town Center", 2114 Nebula Way, West Melbourne, FL 32904 · Multi-Family · Class A · Units 300 · Stories 4 · Parking Spaces 500 · Year Built 2022 · Acquired 12/19/24 · 3 photos.
- Full per-fund data for all 24 funded offerings was captured in a later deep audit — see Section 16 and Appendix A, which supersede and complete this section (including corrections: the template also has an optional "Investment Performance" box, a photo-gallery viewer route, and Fund 32's recent page is genuinely empty below its H1).

## 9. Page: Documents (`/investor/documents`)

- H1 "Documents". Top-right outlined button "Upload Document" → opens a centred modal titled "Upload Documents" with a close (X) button and a dashed drop zone reading "Drag Files Here or Choose Files to Add". Stub the upload (no real storage).
- A "View by:" label with three tabs, active tab underlined in teal: `All` · `Investment` · `Signatures` (Signatures tab carries a yellow badge "2"). The last-used tab persists when returning to Documents in the same session.
- Tab "All": H2 "All Documents", a "Download All" button, and three dropdown filters in one row, each with a label above it and these exact options — Investment: All / Cardone Equity Fund 29, LLC / 30, LLC / 31, LLC / 32, LLC · Investing Entity: All / Kevin Puza / Puza, LLC · Year: All / 2026 / 2025. No search box, pagination, result count, or footer text. Sortable table (default order: Shared date descending): `[unnamed indicator column] | Name | Investment | Type | Year | Shared`. The unnamed first column shows a small blue dot on 7 of the 19 rows (all 5 Fund 32 rows, Fund 31's Wire Instructions, and Fund 31's Operating Agreement) and is blank on the rest; the portal shows no legend for it, so render the dot without labelling it. File names are blue links. All 19 seed rows are Type "Agreements" — full ordered list in Section 13.
- Tab "Investment": one collapsible card per fund in the order 29, 30, 31, 32 — each card header is a chevron button with the fund name as H2 — each with its own sortable table: `[indicator] | Name | Investing Entity | Asset | Type | Year | Shared`, previewing only 3 rows and ending with a centred blue "View all" link. Investing Entity and Asset show "--" on every preview row. Preview rows (in order): Fund 29 → its PPM, the 2026-04-17 Naples memorandum, CEF 29 Wire Instructions · Fund 30 → its Subscription Booklet, Operating Agreement, CEF 30 Wire Instructions · Fund 31 → its PPM, Subscription Booklet, Operating Agreement · Fund 32 → its Subscription Booklet, Operating Agreement, PPM.
- "View all" opens a dedicated per-fund page, e.g. Fund 29 at `/documents/investments/81`: breadcrumb "Documents › All", H1 = fund name, H2 "All Documents", and only two filters (Investing Entity, Year — no Investment filter, the page is already scoped). Its table lists all of that fund's documents in Shared-descending order. Replicate this route pattern as `/documents/investments/:offeringId` for every fund.
- Tab "Signatures": see Section 10.

## 10. Signatures

### Pending Signatures view (Documents → Signatures tab, and `/investor/documents/signatures`)
- Collapsible card "Pending Signatures" with the intro line "Please review and sign the following:" and a sortable table: `Requested | Document | Investment | Investing Entity | Status`.
- Two seed rows, both Fund 29 / Puza, LLC, Status cell containing a blue "Sign" button:
  1. Requested 08/07/26 — "Cardone Equity Fund 29 - Subscription Booklet - FINAL - 07-22-26.pdf"
  2. Requested 08/03/26 — "UPDATED W-9 Fund 29.pdf"
- Mobile responsive behaviour (verified from a user screenshot): on a phone-width viewport the Pending Signatures table collapses to just two columns — `Document` (blue link, wrapping over multiple lines) and `Status` (a large solid blue "Sign" button) — the Requested / Investment / Investing Entity columns are hidden. The card, the "View by:" tabs with the teal active underline and yellow "2" badge, and the "Upload Document" button all remain visible.
- Mobile "All Documents" (verified from user screenshots): the "Documents" H1 sits left with the outlined "Upload Document" button right on the same row; "View by:" tabs show the active tab bold with a teal underline and the yellow "2" badge on Signatures; the card header keeps "All Documents" + "Download All". The three filters stack vertically, full-width, one per row (label above each select: Investment / Investing Entity / Year). The table shows only **Name** (↕ sort icon; the blue file-name link wraps over multiple lines with the fund's full name, e.g. "Cardone Equity Fund 32, LLC", in dark text directly underneath) and **Shared** (▼, right-aligned date like 09/08/26). The indicator-dot column and Type column are not shown on mobile. Rows are separated by light hairlines with generous vertical padding.

- The two pending items have their own signature page IDs: the Fund 29 Subscription Booklet is `/documents/signatures/31731` and the UPDATED W-9 Fund 29 is `/documents/signatures/31578`. Clicking "Sign" in the list only navigates (through the loading state) to that item's consent page — it does not sign anything. Both consent pages have identical layout, and there are no text fields, checkboxes, signature pads or initials fields anywhere before the "Agree" button.

### Signature consent page (`/investor/documents/signatures/:id`, e.g. 31731)
- Page title "Please Review and Sign | Cardone Capital | Investor Portal".
- H1 "Please Review and Sign". Card H2 "Electronic Communications Consent".
- Card body: a scrollable embedded-document area (iframe-style panel) showing a multi-section electronic-records-and-signatures consent document. Its section structure, in order: an introduction defining the firm as "we/us/our"; consumer-transaction paper-copy rights; general consent to electronic records and signatures for consumer and business transactions (including a warning that declining means paper documents); what information will be provided electronically; right to paper copies; updating contact information; system requirements; how to withdraw consent; additional consumer-transaction rights (1. Obtaining Paper Copies, 2. Withdrawing Consent); and an "Acceptance and Consent" section with 5 numbered acknowledgements, including that electronic signatures/records replace written documents. A "protected by reCAPTCHA" note appears inside the document frame. (Rebuild this document from the firm's own consent text asset — do not invent the legal wording.)
- Below the document inside the card: "Investing Entity: Puza, LLC".
- Single action under the card: solid blue "Agree" button.
- Not observed (build as the next stub step, clearly marked): whatever signature canvas/fields follow Agree.

## 11. Pages: Tax Forms, Transactions, Contact Us, My Profile

### Tax Forms (`/investor/taxes`)
- H1 "Tax Forms". One filter only, top-left: "Investing Entity" dropdown, default "All", with options All / Kevin Puza / Puza, LLC. No other tabs, filters, search or table exists on this page for this account.
- Empty state (this account has no forms): a bordered card whose only content is the centred text "No tax forms have been shared with you."
- Implement the data path so that when forms exist they render in the same card/table pattern as Documents, but ship the clone with the empty state.

### Transactions (`/investor/transactions`)
- H1 "Transactions". No table, filters or buttons for this account.
- Empty state, plain centred text with no card: "Transactions have not been recorded."
- This page is the distributions/contributions/payments history view; ship it with the empty state and a table component ready for rows.

### Contact Us (`/investor/contact_us`)
- H1 "Contact Us". One narrow white card. No form, no message field, no submit button.
- Card content: firm name in bold; blue links for phone "+1 305 407 0276" (tel:), email "invest@cardonecapital.com" (mailto:), and "https://cardonecapital.com/"; a divider; then "Mailing Address:" with the lines "18851 NE 29th Ave Suite 1000" and "Aventura, FL 33180".

### My Profile (`/investor/settings/profile`)
- H1 "My Profile". This page uses a narrower, centred layout than the other pages. Top-right: "Dark theme" toggle switch (off by default) — implement a working dark theme for the whole app behind this toggle. This page has no other settings, tabs or sub-pages: no notifications, security/password, statements or reports sections exist in this account — Dark theme is the only preference control.
- Card "Contact Information" with a grey "Edit" button top-right (edit form itself is a stub — it was not opened). Read-only label/value rows: Name · Phone · Address ("--" when empty) · Login Email · Email · FinCEN ID ("--" when empty). Seed with placeholder investor data.
- Collapsible card "Investing Entities": table `Name | Investments | Distribution Method | Actions`. Two seed rows — an individual entity named "Kevin Puza" and "Puza, LLC" — both with Investments "--", Distribution Method shown as a red alert icon plus blue "Missing Information" link, and a grey "Edit" action.
- Collapsible card "Bank Accounts" with a grey "Add Bank Account" button (Plaid linking flow is a stub — not opened). Empty state text: "You have not added any bank accounts yet." followed by a blue external link "Learn how to link a bank account using plaid".
- Centred footer: "Terms of Service | Privacy Policy".

### Investing Entity detail page (My Profile → Investing Entities → one entity; verified from user screenshots)
Correction to the line above: My Profile DOES have this sub-page. Breadcrumb: "My Profile › Investing Entity Details"; H1 = the entity's name. (Route not captured — use `/investor/settings/profile/entities/:entityId`.) Per the user, the data on this page is what the investor entered on the account-opening form, and it is the source data that personalises their documents — the clone's onboarding form must collect the same fields (see the onboarding note at the end of this subsection).
- Card "Investing Entity Details" (grey "Edit" button top-right).
  - View mode rows: **Tax ID Number** — masked as "…<last 4>" with a blue "Show" link that reveals it; **Entity Type** (e.g. "Individual"); **Disregarded Entity** ("No"); **Tax Address** (single line: street, city, state ZIP).
  - Edit mode: Tax ID Number input and Entity Type select are shown greyed (read-only appearance — treat Tax ID and Entity Type as operator-controlled after creation; the client edits the Tax Address); "Mark as a Disregarded Entity" checkbox with an info (i) icon beside the Entity Type; Tax Address fields: Address · Address 2 · City · State (select) · Zip · Country (select). Blue "Save" button + "Cancel" link.
- Card "Distribution Method" (grey "Edit" button top-right).
  - View mode rows (all "--" when unset, which is why the profile list flags "Missing Information"): Payment Method · Bank Account Nickname · Bank Name · Routing Number · Account Number · Account Type · Payee Name · Payment Address.
  - Edit mode: **Payment Method \*** select with exactly three options — **Check · Electronic · Wire** — required; when empty on save/submit the label turns red and a red message "Please select a payment method" appears under the field. **Bank Account** select + blue "Add New Bank Account" link. Checkbox "This is a Custodian/FBO Account". **Payee Name \*** input. **Payment Address**: Address · Address 2 · City · State · Zip · Country, with a blue "Use Tax Address" link that copies the entity's Tax Address into these fields. Blue "Save" + "Cancel".
- Card "Contacts" (grey "Add Contact" button top-right): table headed **Name**; each contact row has a blue "View Details" link that expands to: Emails · Phone Numbers · Primary Contact (Yes/No) · Document Access ("All Documents") · Required Signer (Yes/No) · Action (a vertical-ellipsis ⋮ menu).
- Data model additions: `investing_entities` gains `is_disregarded` (bool), `distribution_method` (payment_method enum Check|Electronic|Wire, bank_account_id nullable, is_custodian_fbo bool, payee_name, payment_address fields mirroring tax_address); `entity_contacts` table (entity_id, name, emails[], phones[], is_primary, document_access, required_signer). Routing/account numbers come from the linked bank account (Plaid stub) and follow the same encryption/masking rules as tax IDs.
- Onboarding note (from the user): the original account-opening form collected this same data (entity details + tax address + distribution method + contacts) and it feeds document personalisation. The account-opening form itself is no longer accessible to the user, so reconstruct the clone's onboarding/profile-completion form from the fields on this page. In the clone this form is completed AFTER first login under the invite-only access flow (operator pre-authorises the client's email; see Section 17's access model once finalised by the user).

Card fields: name · fundedOn · targetIrr · targetCashOnCash · targetEquityMultiple · preferredReturn (only where shown). Preserve the displayed order and the numbering gaps exactly.

1. Cardone Equity Fund 32, LLC — 09/04/26 — (no metrics)
2. 10X Space Coast Fund, LLC — 12/19/24 — (no metrics)
3. Cardone Equity Fund 25, LLC — 09/16/24
4. Cardone Equity Fund 24, LLC — 06/19/24
5. Cardone Equity Fund 23, LLC — 03/22/24
6. Cardone Equity Fund 22, LLC — 08/24/23 — 15.00% · 6.00% · 2.50x
7. Cardone Equity Fund 21, LLC — 11/22/22 — 12.00% · 6.00% · 2.25x
8. Cardone Equity Fund 20, LLC — 04/15/22 — 15.00% · 6.00% · 2.50x
9. Cardone Equity Fund 17, LLC — 03/01/22 — 15.00% · 6.00% · 2.50x
10. Cardone Equity Fund 18, LLC — 03/01/22 — 23.00% · 6.00% · 4.50x
11. Cardone Equity Fund 16, LLC — 12/30/21 — 15.00% · 6.00% · 2.50x
12. Cardone Equity Fund 15, LLC — 11/18/21 — 15.00% · 6.00% · 2.50x
13. Cardone Equity Fund 14, LLC — 06/18/21 — IRR 17.50% · Multiple 4.00x (no Cash on Cash)
14. Cardone Equity Fund 12, LLC — 05/28/21 — 16.00% · 7.00% · 3.00x
15. Cardone Equity Fund 11, LLC — 04/16/21 — 15.00% · 6.00% · 2.50x
16. Cardone Equity Fund 10, LLC — 12/29/20 — 15.00% · 6.00% · 2.50x
17. Cardone Equity Fund 9, LLC — 10/01/20 — 15.00% · 6.00% · 2.50x
18. Cardone Equity Fund 6, LLC — 06/25/20 — 16.00% · 6.00% · 3.00x
19. Cardone Equity Fund 8, LLC — 06/25/20 — 16.00% · 6.00% · 3.00x · Pref 6.00%
20. Cardone Equity Fund 4, LLC — 10/11/19 — 15.00% · 6.00% · 2.50x · Pref 6.00%
21. Cardone Equity Fund 5, LLC — 09/23/19 — 15.00% · 6.00% · 2.50x
22. Cardone Equity Fund 3, LLC — 05/31/18 — 16.00% · 6.00% · 3.00x · Pref 6.00%
23. Cardone Equity Fund 2, LLC — 02/13/17 — 20.00% · 6.00% · 4.50x · Pref 6.00%
24. Cardone Equity Fund 1, LLC — 12/08/16 — 20.00% · 6.00% · 4.50x · Pref 6.00%

## 13. Seed data: Documents (Documents → All, 19 rows, all Type "Agreements")

Format: file name — year, shared date.

Fund 32 (5):
- UPDATED W-9 Fund 32.pdf — 2026, 09/08/26
- CEF 32 - Wire Instructions.pdf — 2026, 09/08/26
- Cardone Equity Fund 32 (Class A) - Subscription Booklet (Sept 2026) - FINAL - 09-01-26.pdf — 2026, 09/04/26
- Cardone Equity Fund 32 - Operating Agreement - FINAL - 09-01-26.pdf — 2026, 09/04/26
- Cardone Equity Fund 32 - PPM - FINAL - 09-01-26.pdf — 2026, 09/04/26

Fund 31 (4):
- CEF 31 - Wire Instructions .pdf — 2026, 08/11/26
- Cardone Equity Fund 31 - PPM - FINAL - August 2026.pdf — 2026, 08/07/26
- Cardone Equity Fund 31 Class A_B_D) - Subscription Booklet (August 2026) - FINAL - August 2026.pdf — 2026, 08/07/26
- Cardone Equity Fund 31 - Operating Agreement - FINAL - August 2026.pdf — Year "--", 08/07/26

Fund 29 (6):
- EXECUTED Cardone Equity Fund 29 - Operating Agreement - Second Amended & Restated - FINAL - 07-22-26 — 2026, 07/30/26
- 10X-Naples-Investment-Memorandum-w/ Financials.pdf — 2026, 07/30/26
- Cardone Equity Fund 29 - Subscription Booklet - FINAL - 07-22-26.pdf — 2026, 07/23/26
- Cardone Equity Fund 29 - PPM (corresponds to 2nd Amended & Restated OA) - FINAL - 07-22-26.pdf — 2026, 07/23/26
- 2026-04-17-10X-NAPLES-IM-V7.pdf — 2026, 07/10/26
- CEF 29 Wire Instructions.pdf — 2025, 12/31/25

Fund 30 (4):
- Cardone Equity Fund 30 - PPM - FINAL - 07-08-26.pdf — 2026, 07/10/26
- Cardone Equity Fund 30 (Class A) - Subscription Booklet (July 2026) - FINAL - 07-08-26.pdf — 2026, 07/10/26
- Cardone Equity Fund 30 - Operating Agreement - FINAL - 07-08-26.pdf — 2026, 07/10/26
- CEF 30 - Wire Instructions.pdf — 2026, 01/27/26

Preserve these observed inconsistencies rather than "fixing" them: Fund 29's detail page also lists an "EXECUTED … (1).pdf" variant; Fund 30's detail page does not list its Operating Agreement; Fund 32's detail page additionally lists its W-9. The same document lists power the offering-detail "Documents" cards.

Kit arrangement (mirrors the portal exactly): the PDFs are stored once, in `documents/fund-29|30|31|32/` and `documents/signatures-pending/`. The folders under `documents/views/` reproduce every portal view with its exact membership and display order — `01-all-documents` (all 19, Shared-descending), `02-by-investment/<fund>` (29: 6, 30: 4, 31: 4, 32: 5), `03-signatures-pending` (the 2 personalised items), `04-offering-page-documents/<page>` (Fund 29: 6 files; Fund 30: 3, no Operating Agreement; Fund 31: 3; Fund 32: 4, including its W-9), and `05-tax-forms` (empty). Each view folder has a CONTENTS.md and one pointer file per document naming its stored location, and `documents/manifest.json` carries the same membership as `appearsIn` per document. Build the app's document lists from that manifest so every view matches the portal. See `documents/ARRANGEMENT.md`.

## 14. Flows to implement (each ends at a stub where noted)

1. Login → return to originally requested URL.
2. Dashboard → Sign Documents → Pending Signatures → Sign → consent page → Agree → [STUB: signing step].
3. Dashboard → View Investing Entities → My Profile (Investing Entities / Bank Accounts cards).
4. New Offerings → View Offering → offering detail → INVEST → [STUB: subscription flow].
5. Fund 29 detail → Steps To Invest (Edit / Sign / I sent my capital — all stub actions except Sign, which routes to the consent page).
6. Dashboard → Recent Offerings → Learn More → funded offering detail (terminal page, no actions).
7. Documents → filter/sort/search the table; Investment tab → fund group → View all; Upload Document → modal (stub).
8. Header user dropdown → My Profile / Log Out. Dark theme toggle changes theme only.

## 15. Acceptance criteria

- Every route above renders with the original page title pattern "<Page> | Cardone Capital | Investor Portal".
- All tables sort by every column; Documents filters actually filter the seed rows; tabs and collapsibles work.
- Seed data lives in one data file so names, amounts, dates and document lists can be edited without touching components.
- Responsive: desktop sidebar layout and the mobile single-column layout both work.
- No real credentials, bank, e-signature, or payment integrations — everything external is a clearly marked stub.

## 16. V2 — Deep audit corrections and additions (supersedes Section 8 where they differ)

### Corrected recent-offering detail template (`/investor/recent_offerings/:id`)
- H1 = fund name. Then, only where present, in this order: a boxed "Investment Description" (rich-text area) · a boxed "Investment Performance" (vertical list of target metrics, sometimes including Preferred Return) · H4 "Asset Details".
- Nothing else exists on these pages: no site footer, no related offerings, no buttons below the last asset card.
- Route IDs do NOT follow fund numbers (e.g. Fund 22 = 53, Fund 21 = 49, Fund 18 = 48, Fund 1 = 31) and some in-between IDs load only a spinner — always take IDs from Appendix A, never guess them.
- Fund 32's recent page (`/recent_offerings/88`) is genuinely H1-only: no description, performance, assets or buttons. Reproduce that empty state; its content lives only on its New Offering page (same numeric ID under `/opportunities/88`).

### Asset card (final spec)
- H5 property name · address line · "Map" link with a pin icon (a Google Maps search URL built from the address) · a thumbnail photo link labelled "Photo of <property>" with "<N> photos" under the thumbnail · a two-column fact grid · below the grid, an optional further description block (present and distinct for most older funds; a repeat of the Investment Description for Space Coast only; absent/empty for Funds 22–25).
- Fields appear only when the source page shows them — e.g. Office/Commercial assets have Square Feet and no Units; some multifamily assets have no Square Feet. Do not backfill missing fields.

### Photo gallery viewer
- Clicking a photo thumbnail opens a full-screen black gallery at `/recent_offerings/:id/assets/:assetId/photos`: Previous/Next arrows, an X close button returning to the detail page, and dot indicators equal to the photo count.

### New Offering detail pages — bottom-of-page verification
- Fund 29 (`/opportunities/81`): Invest Again (not INVEST) · Your Commitment · Steps To Invest · hero · Offering Terms · Documents (6 PDFs) · Offering Description. NO Offering Highlights section and NO property fact table; nothing below the description.
- Fund 30 (`/opportunities/86`): INVEST · hero · Offering Highlights · Documents — 3 PDFs on this page (PPM, Subscription Booklet, Wire Instructions; the Operating Agreement appears only in the Documents section) · Offering Terms ($150M / $200k / 7-10 Years / Monthly) · Offering Description · then the property fact table for 10X Westshore South (6301 S West Shore Blvd, Tampa, FL 33616 · Multi-Family · Class A · Total Units 608 · Square Feet 760 exactly as displayed · Rentable SF 462,225 · Land Acres 51 · Stories 3 · Parking Spaces 1219 · Year Built 1989) with the embedded Google Map · then only a single unlabelled back-to-top-style button.
- Fund 31 (`/opportunities/87`): INVEST · hero · Offering Highlights · Documents (3 PDFs) · terms as Fund 30 · description · then a short trailing block whose entire content is: the fund name as heading, Asset Type Mixed-Use, Year Built 2026. Nothing after it.
- Fund 32 (`/opportunities/88`): INVEST · "Prepared for <Investor Name>" · hero · Offering Highlights · Documents — 4 PDFs (PPM, Subscription Booklet, Wire Instructions, UPDATED W-9) · terms (Price Per Share $1,000 · $150M · $200k · 7-10 Years · Monthly) · description · nothing below it; no property table.

### Submit Interest / Invest form (new page, viewed only — never submitted)
- The "$400,000" amount in the Dashboard New Offerings table opens `/opportunities/81/invest?prospectId=<id>`, headed "Invest in Cardone Equity Fund 29, LLC".
- Fields, in order: Desired Commitment (prefilled with the commitment amount; a "$200,000 minimum" note) · a "How would you like to invest?" section with: Investing As selector · "Add a New Investing Entity" · Tax ID · Entity Type · Disregarded Entity checkbox · Holding Title · Tax Address · Additional Questions/Feedback · an "Entity Owner's Personal Information" phone field · Submit and Cancel buttons.
- Implement this as the invest-flow entry screen for all offerings (route `/opportunities/:id/invest`), with Submit as a stub. Do not seed it with any real personal values.

### Small corrections
- "Refer a Friend" is not a portal page: it is a mailto link (subject "Cardone Capital") whose prefilled body links to the firm's website and contact form and gives a team phone number. Implement it as a mailto.
- Dashboard card title/image buttons link to the same recent-offering detail page as their "Learn More" button.

## Appendix A — Every funded offering, audited page by page

Format per fund: route · description gist (summarised — write final copy from the firm's own text assets) · performance shown on the page · assets in order as: Name — Address — photos — fact grid. All assets are Property Class A and have a Map link. "MF" = Multi-Family.

- **Fund 32** — `/recent_offerings/88` — EMPTY page (H1 only). See its New Offering page.
- **10X Space Coast Fund** — `/recent_offerings/76` — Desc: real-estate-plus-Bitcoin vehicle; buys the asset below debt-free for immediate cash flow and uses monthly income for Bitcoin purchases. No Performance box. The description repeats inside the asset card. Asset: 10X Space Coast Town Center — 2114 Nebula Way, West Melbourne, FL 32904 — 3 photos — MF · Units 300 · Stories 4 · Parking 500 · Built 2022 · Acquired 12/19/24 (no Square Feet).
- **Fund 25** — `/recent_offerings/75` — No description, no Performance. Asset: The Edge at Flagler Village — 475 N FEDERAL HWY, FORT LAUDERDALE, FL 33301 — 3 photos — MF · Units 331 · Stories 7 · Parking 528 · Built 2014 · Acquired 09/16/24 (no Square Feet).
- **Fund 24** — `/recent_offerings/74` — Desc: accredited-investor vehicle targeting up to $150M in high-growth markets, mainly multifamily plus opportunistic commercial/office; notes a projected co-investment with Fund 23. No Performance. Asset: 10X at Jacaranda — 9233 NW 7th Cir, Plantation, FL 33324 — 4 photos — MF · Units 468 · Stories 3 · Parking 823 · Built 1989 · Acquired 06/18/24 (no Square Feet).
- **Fund 23** — `/recent_offerings/73` — No description, no Performance. Assets: (1) 10X at Flagler Village — 501 NE 5th St, Fort Lauderdale, FL 33301 — 4 photos — Mixed-Use · Units 382 · Stories 7 · Parking 599 · Built 2014 · Acquired 05/15/24. (2) 10X at The Forum — 3100 CHAMPION RING ROAD, FORT MYERS, FL 33905 — 6 photos — MF · Units 252 · Stories 3 · Parking 504 · Built 2017 · Acquired 03/22/24. (No Square Feet on either.)
- **Fund 22** — `/recent_offerings/53` — No description. Performance: CoC 6% · IRR 15% · Multiple 2.5x. Assets: (1) 10X Tarpon Springs — 1185 S Pinellas Ave, Tarpon Springs, FL 34689 — 3 photos — MF · Units 236 · Stories 4 · Parking 283 · Built 2020 · Acquired 12/28/23. (2) The Edison — 5015 Mina Cir, Fort Myers, FL 33905 — 5 photos — MF · Units 327 · Stories 4 · Parking 611 · Built 2020 · Acquired 08/24/23. (No Square Feet.)
- **Fund 21** — `/recent_offerings/49` — Desc gist: Nov 2022 purchase of the Cardone Corporate Center offices, $58.7M raised, co-invested with Cardone REIT I. Performance: 6% / 12% / 2.25x. Asset: Cardone Corporate Center — 16427 & 16435 North Scottsdale Road, Scottsdale, AZ 85254 — 5 photos — Office · Square Feet 294,762 · Stories 4 · Parking 778 · Built 2004 · Acquired 11/22/22 (no Units). Card has its own distinct description (two-building Class A trophy office, Scottsdale Airpark).
- **Fund 20** — `/recent_offerings/46` — Desc gist: Dec 2021 purchase of 10X Living at Miami River, $38.8M raised, co-invested with Cardone REIT I. Performance: 6% / 15% / 2.5x. Asset: 10X Living at Miami River — "1001 NW 7th St,, Miami, FL 33136" (double comma as displayed — preserve it) — 6 photos — MF · Units 346 · Square Feet 281,896 · Stories 8 · Parking 447 · Built 2021 · Acquired 03/24/22.
- **Fund 17** — `/recent_offerings/45` — Desc gist: Dec 2021 purchase of 10X Living at Riverwalk, $27.3M raised, co-invested with Cardone REIT I. Performance: 6% / 15% / 2.5x. Asset: 10X Living at Riverwalk — 4 West Las Olas Boulevard, Fort Lauderdale, FL 33301 — 5 photos — MF · Units 260 · Square Feet 234,842 · Stories 26 · Parking 385 · Built 2021 · Acquired 12/10/21.
- **Fund 18** — `/recent_offerings/48` — Desc gist: Dec 2021 purchase of 10X Living at Sunrise, $21.3M raised, co-invested with Cardone REIT I. Performance: 6% / 23% / 4.5x. Asset: 10X Living at Sunrise — 1640 NW 128th Drive, Sunrise, FL 33323 — 4 photos — MF · Units 389 · Square Feet 373,164 · Stories 3 · Parking 696 · Built 1996 · Acquired 12/10/21.
- **Fund 16** — `/recent_offerings/44` — Desc gist: Dec 2021 purchase of 10X Living at Las Olas Walk, $48.7M raised, co-invested with Cardone REIT I. Performance: 6% / 15% / 2.5x. Asset: 10X Living at Las Olas Walk — 106 S Federal Hwy, Fort Lauderdale, FL 33301 — 8 photos — MF · Units 456 · Square Feet 342,567 · Stories 7 · Parking 614 · Built 2020 · Acquired 12/10/21.
- **Fund 15** — `/recent_offerings/43` — Desc gist: Sep 2021 purchase of two Houston communities, $69.4M equity invested. Performance: 6% / 15% / 2.5x. Assets: (1) 10X Living at 15th Street Flats — 1414 North Shepard Drive, Houston, TX 77008 — 6 photos — MF · Units 337 · Square Feet 263,866 · Stories 8 · Parking 502 · Built 2021 · Acquired 09/20/21. (2) 10X Living at Heights Waterworks — 515 W 20th Street, Houston, TX 77008 — 6 photos — MF · Units 309 · Square Feet 246,703 · Stories 8 · Parking 408 · Built 2020 · Acquired 09/20/21.

- **Fund 14** — `/recent_offerings/42` — Desc gist: May 2021 purchase of 10X Living at Mizner Park, $29.5M invested. Performance: IRR 17.5% · Multiple 4x ONLY (no Cash on Cash). Asset: 10X Living at Mizner Park — 33 E Camino Real, Boca Raton, FL 33432 — 6 photos — MF · Units 235 · Square Feet 342,135 · Stories 9 · Parking 411 · Built 2002 · Acquired 05/26/21.
- **Fund 12** — `/recent_offerings/41` — Desc gist: May 2021 purchase of the 10X Centre office building, $33.4M raised. Performance: 7% / 16% / 3x. Asset: 10X Centre — 18851 NE 29th Avenue, Aventura, FL 33180 — 4 photos — Commercial · Square Feet 219,244 · Stories 11 · Parking 988 · Built 2003 · Acquired 05/28/21 (no Units).
- **Fund 11** — `/recent_offerings/40` — Desc gist: Apr 2021 purchase of 10X Living at Fort Lauderdale, $38.4M raised. Performance: 6% / 15% / 2.5x. Asset: 10X Living at Fort Lauderdale — 1919 SE 10th Avenue, Fort Lauderdale, FL 33316 — 6 photos — MF · Units 310 · Square Feet 420,000 · Stories 8 · Parking 629 · Built 2018 · Acquired 04/16/21.
- **Fund 10** — `/recent_offerings/39` — Desc gist: Dec 2020 purchase of 10X Living at Boca Raton, $64.5M raised. Performance: 6% / 15% / 2.5x. Asset: 10X Living at Boca Raton — 5500 Military Trail, Boca Raton, FL 33487 — 10 photos — MF · Units 398 · Square Feet 400,148 · Stories 6 · Parking 719 · Built 2018 · Acquired 12/03/20.
- **Fund 9** — `/recent_offerings/38` — Desc gist: Sep 2020 purchase of 10X Living at Port Royale, $47.6M raised. Performance: 6% / 15% / 2.5x. Asset: 10X Living at Port Royale — 3101 Port Royale Boulevard, Fort Lauderdale, FL 33308 — 7 photos — MF · Units 553 · Square Feet 399,204 · Stories 4 · Parking 871 · Built 1998 · Acquired 09/10/20.
- **Fund 6** — `/recent_offerings/36` — Desc gist: open to accredited AND non-accredited investors; Feb 2019–Jan 2020, four communities bought with Fund VIII, $29.5M raised. Performance: 6% / 16% / 3x (no Preferred Return). Assets (all MF): (1) 10X Living at Addison Place — 8633 Addison Pl Cir, Naples, FL 34119 — 4 photos — Units 294 · Square Feet 302,829 · Stories 4 · Parking 550 · Built 2019 · Acquired 02/20/20. (2) 10X Living at Columbia Town Center — 10360 Swift Stream Place, Columbia, MD 21044 — 5 photos — Units 531 · Square Feet 551,454 · Stories 4 · Parking 937 · Built 2001 · Acquired 12/19/19. (3) 10X Living at Panama City Beach — 7150 US-98, Panama City Beach, FL 32407 — 3 photos — Units 288 · Square Feet 304,814 · Stories 3 · Parking 528 · Built 2018 · Acquired 09/12/19. (4) 10X Living at Retreat at PCB — 90 Sandal Lane, Panama City Beach, FL 32413 — 1 photo — Units 360 · Square Feet 361,920 · Stories 3 · Parking 643 · Built 2008 · Acquired 01/28/20.
- **Fund 8** — `/recent_offerings/37` — Desc gist: accredited investors; same Feb 2019–Jan 2020 four communities, bought with Fund VI, $79.3M raised. Performance: 6% / 16% / 3x PLUS Preferred Return 6%. Assets: the same four properties with the same facts and photo counts as Fund 6, with two label differences to preserve: the Addison Place address is spelled "8633 Addison Pl Ciry, Naples, FL 34119" on this page, and the fourth property is named "10X Living at Retreat PCB" (not "Retreat at PCB").
- **Fund 4** — `/recent_offerings/34` — Desc gist: Aug 2018–Jun 2019, five communities bought with Fund V, $106M raised. Performance: 6% / 15% / 2.5x PLUS Preferred Return 6%. Assets (all MF): (1) 10X Living at Breakfast Point — 9700 Panama City Beach Parkway, Panama City Beach, FL 32407 — 1 photo — Units 360 · Square Feet 365,472 · Stories 3 · Parking 605 · Built 2007 · Acquired 08/30/19. (2) 10X Living at Delray — 14050 Pacific Point Place, Delray Beach, FL 33484 — 4 photos — Units 346 · Square Feet 362,000 · Stories 3 · Parking 779 · Built 2017 · Acquired 09/27/18. (3) 10X Living at Naples — 2602 Fountain View Circle, Naples, FL 34109 — 3 photos — Units 456 · Square Feet 468,435 · Stories 2 · Parking 877 · Built 1990 · Acquired 06/28/19. (4) 10X Living at Sawgrass — 2903 NW 130th Avenue, Sunrise, FL 33323 — 3 photos — Units 501 · Square Feet 495,246 · Stories 4 · Parking 890 · Built 2013 · Acquired 06/27/19. (5) 10X Living at Stella — 4711 LJ Parkway, Sugarland, TX 77479 (header spelling as displayed; the card text uses "Stella at Riverstone", Sugar Land) — 5 photos — Units 351 · Square Feet 324,268 · Stories 3 · Parking 621 · Built 2018 · Acquired 01/25/19.
- **Fund 5** — `/recent_offerings/35` — Desc gist: open to BOTH accredited and non-accredited investors; same Aug 2018–Jun 2019 five communities, bought with Fund IV, $50M raised. Performance: 6% / 15% / 2.5x (NO Preferred Return, unlike Fund 4). Assets: the identical five properties, addresses, photo counts and fact grids as Fund 4, in the same order.
- **Fund 3** — `/recent_offerings/33` — Desc gist: Jan 2018 Woodway Square and Feb 2018 Murano purchases, $45M raised. Performance: 6% / 16% / 3x PLUS Preferred Return 6%. Assets: (1) 10X Living at Murano — 9932 Grande Lakes Boulevard, Orlando, FL 32837 — 3 photos — MF · Units 240 · Square Feet 415,194 · Stories 4 · Parking 434 · Built 2016 · Acquired 02/20/18. (2) 10X Living at Woodway Square — 1200 Winrock Boulevard, Houston, TX 77057 — 3 photos — MF · Units 507 · Square Feet 488,048 · Stories 3 · Parking 860 · Built 1992 · Acquired 01/30/18.
- **Fund 2** — `/recent_offerings/32` — Desc gist: Oct 2016 purchase of the Reserve at Ormond Beach, $8.3M raised. Performance: 6% / 20% / 4.5x PLUS Preferred Return 6%. Asset: 10X Living at Ormond Beach — 600 Crown Commerce Court, Ormond Beach, FL 32174 — 3 photos — MF · Units 272 · Square Feet 331,498 · Stories 3 · Parking 585 · Built 2003 · Acquired 10/27/16 (no Land Acres field; the card text mentions 35 acres and calls the property "Reserve at Ormond Beach").
- **Fund 1** — `/recent_offerings/31` — Desc gist: Sep 2016 purchase of the Reserve at Port St. Lucie, $4.8M raised. Performance: 6% / 20% / 4.5x PLUS Preferred Return 6%. UNIQUE element: directly under the "Asset Details" heading, before the asset card, a line reads "99.0000% owned by Cardone Equity Fund 1, LLC" — implement an optional `ownershipNote` field on the offering for this. Asset: 10X Living at Port St. Lucie — 1500 SE Tiffany Club Place, Port St. Lucie, FL 34952 — 1 photo — MF · Units 188 · Square Feet 181,148 · Stories 3 · Parking 392 · Built 1997 · Acquired 09/30/16 (no Land Acres field; card text mentions 20 acres).

End of prompt.

## 17. Document templates, de-personalisation, and the client database — FULL INSTRUCTION (binding, merged into this prompt so nothing is in a separate file)

Add this to the build in CLONE-PROMPT.md. Read it together with Section 9/10/13 of that prompt and with `documents/manifest.json`.

## 1. The finding this is based on (verified by text extraction, 2026-11-01)

Every PDF in the kit was text-extracted and searched for the sample investor's identifiers ("Puza", "Tara", "Kevin"):

- The 19 documents in `documents/fund-29/`, `fund-30/`, `fund-31/`, `fund-32/` (the copies from Documents → All) contain **zero** occurrences in their text layers. These are the **clean masters** — use them as the templates/source files.
  - Caveat: `10X-Naples-Investment-Memorandum-w-Financials.pdf` is image-based (almost no text layer), so it could not be text-verified; it is a marketing deck and is treated as static.
  - Caveat: the EXECUTED Operating Agreement's signature pages may be scanned images; treat that file as a stored output, never as a template.
- The 2 files in `documents/signatures-pending/` **are personalised copies** generated for one specific investor: the Subscription Booklet with the subscriber section filled in (investor/entity name, K-1 name, contact email, commitment amount, and a filled taxpayer-ID field), and the W-9 packet with a generated cover header (Investing Entity / Entity Type / Holding Title). **Never use these two files as templates, never ship them as samples, and never seed demo data from their contents.**

## 2. Document classification (build the system around this)

STATIC — one master per fund, identical for every client, served as-is:
- PPM (funds 29, 30, 31, 32)
- Operating Agreement — unsigned template (funds 30, 31, 32; fund 29's clean subscription/PPM set follows the same rule)
- Wire Instructions (CEF 29 / 30 / 31 / 32)
- UPDATED W-9 master form (the Fund 32 copy is the blank master)
- Investment Memoranda (both Naples files, Fund 29)

PERSONALISED — generated per client from a template + the database (Section 3):
- **Subscription Booklet** — the main fillable document. Field map below.
- **W-9 packet** — a generated cover header (Investing Entity, Entity Type, Holding Title, from the database) prepended to the blank W-9 master, sent to the client to complete and sign.
- **Executed documents** (e.g. an executed Operating Agreement) — not templates: they are outputs created and stored per client after signing.

SIGNATURE QUEUE — a personalised Subscription Booklet and the W-9 packet are exactly the two document types the portal sends as pending signature requests (Documents → Signatures), each with its own signature page (`/documents/signatures/:id`) whose consent screen shows the investing entity name.

## 3. Database to build (this replaces "static documents sent to everyone")

Use a relational database (Postgres or SQLite for the clone) with at least:

- `clients` — id, contact/legal name, email, phone, address, date of birth/formation, fincen_id, created_at. Taxpayer ID lives ONLY in `investing_entities.tax_id_encrypted` (encrypted at rest, access-restricted, never rendered in full in any UI or log).
- `investing_entities` — id, client_id, name, entity_type, holding_title, tax_address, tax_id_encrypted, k1_name, distribution_method (nullable → drives the "Missing Information" state), created_at.
- `offerings` — as in CLONE-PROMPT.md Section 3.
- `commitments` — id, investing_entity_id, offering_id, desired_commitment, contributed, status.
- `document_templates` — id, offering_id (nullable for fund-independent forms like W-9), doc_type (PPM | OPERATING_AGREEMENT | SUBSCRIPTION_BOOKLET | W9 | WIRE_INSTRUCTIONS | MEMORANDUM), master_file_path, version, is_personalised (boolean), field_map (JSON, for personalised types).
- `document_instances` — id, template_id, client_id, investing_entity_id, commitment_id, generated_file_path, status (DRAFT | PENDING_SIGNATURE | SIGNED | EXECUTED), requested_at, signed_at. This table is what powers the Documents pages: "All"/"Investment" tabs list instances + shared static documents; the "Signatures" tab lists instances with status PENDING_SIGNATURE.
- `signature_requests` — id, document_instance_id, investing_entity_id, requested_at, status (PENDING | AGREED | SIGNED), signature_page_id.

## 4. Personalisation field map — Subscription Booklet

Fill these from the database when generating an instance (the blank master in the fund folder shows the empty fields; the personalised sample shows where they land — do not copy its values):
- Name of Subscriber ← investing_entities.name
- Date of Birth/Formation ← clients/investing_entities formation date
- Social Security or Taxpayer ID No. ← investing_entities.tax_id_encrypted (decrypt only at generation time)
- Member Name as it appears on Schedule K-1 ← investing_entities.k1_name
- Email Address / Phone / Address ← clients
- Commitment amount (appears inside the booklet and on the cover data) ← commitments.desired_commitment
- Fund name and class ← offerings
- Signature blocks ← captured at signing time, never pre-filled

Generation method: treat each personalised master as a form template — fill by field overlay/coordinate stamping from the field map (e.g. pdf-lib), output a new PDF per client, store it as a `document_instances` row. Never edit a master in place.

## 5. Send / sign flow to implement

1. A commitment (or an admin action in the future admin side) triggers generation of the personalised Subscription Booklet instance and the W-9 packet instance for that investing entity.
2. Both appear for the client under Documents → Signatures as pending, each linking to its consent page, which displays "Investing Entity: <entity name>" from the database.
3. After the client agrees/signs, the instance status flips to SIGNED, an executed copy is stored, and the document then also appears in the client's Documents → All list — mirroring how the executed Operating Agreement appears in the source portal.
4. Static documents are simply shared per fund (a row linking the template to the fund, visible to all clients with access to that fund) — no generation step.

## 6. De-personalisation rules (acceptance criteria)

- Master templates must contain **no** sample-investor data: add an automated check (text-extract every file in the template store and fail if it matches a denylist of sample identifiers — the sample entity name, the sample contact names, the sample email domain, or the sample commitment amount in a filled field).
- Strip PDF metadata (author/title/producer history) from masters on import.
- The `signatures-pending/` folder in this kit is reference evidence of what a personalised output looks like — exclude it from the app's template store and from any public/demo deployment.
- All demo/seed data in the clone UI must use clearly fictional investors, not the sample account's real names, entities, email addresses, amounts, or tax identifiers.

### Exact personalisation anatomy — Fund 29 signature documents (verified page by page, binding)

This is exactly how the two personalised documents are built. Reproduce this faithfully: a generated document for any other client (for example a different LLC) must look identical to the samples in `documents/signatures-pending/` in layout, labels, order and typography — only the database values change.

**A. The generated "Summary" page — appended as the LAST page of every signature document**
- Both personalised samples end with this page (it is why the personalised Booklet is 29 pages vs the 28-page blank master, and the personalised W-9 packet is 7 pages vs the 6-page blank master).
- Content, in this exact order:
  1. Heading: "Summary"
  2. Declaration line: "By signing your name below, you declare that all details listed are true and complete."
  3. `COMMITTED` ← commitments.desired_commitment, formatted like "$400,000"
  4. `INVESTING ENTITY` ← investing_entities.name (e.g. the client's own LLC name)
  5. `ENTITY TYPE` ← investing_entities.entity_type (sample value: "Individual")
  6. `HOLDING TITLE` ← investing_entities.holding_title (sample value: "Individual Ownership")
  7. `TAX ID NUMBER` ← investing_entities.tax_id_encrypted (rendered only on this generated document)
  8. `TAX ADDRESS` ← investing_entities.tax_address
  9. Footer: the document's own file name (e.g. "UPDATED W-9 Fund 29.pdf" on the W-9 packet; the booklet's file name on the booklet)
- The client's signature is captured in connection with this page (the declaration says "by signing your name below") — signing mechanics after the consent Agree step are the stub step already noted.

**B. Fund 29 Subscription Booklet — personalised instance = blank 28-page master + in-body fills + Summary page**
In-body fields filled from the database, in "PART 1 – GENERAL SUBSCRIBER INFORMATION" and the K-1 section:
- "Name of Subscriber:" ← investing_entities.name
- "Social Security or Taxpayer ID No.:" ← tax ID (same source as Summary)
- "Member Name as it appears on your Schedule K-1 (please print):" ← investing_entities.k1_name
- "Email Address:" ← clients.email
- The commitment amount also appears in the body (in addition to the Summary page).
Everything else in the booklet is byte-identical to the blank master. Date of Birth/Formation was left blank in the sample — keep it as a fillable field, do not invent a value.

**C. UPDATED W-9 Fund 29 packet — personalised instance = blank 6-page IRS Form W-9 (Rev. March 2024) + Summary page ONLY**
- Verified: pages 1–6 of the packet are the standard blank IRS W-9, identical to the Fund 32 master copy. There is **no** pre-filling inside the form itself (no name, address or TIN typed into the form's lines) — the client completes the form when they sign.
- The packet's only personalisation is the appended Summary page (Section A above), which carries the entity's name, type, holding title, committed amount, tax ID and tax address from the database.
- So for the W-9, "personalise" means: generate the packet for the selected investing entity by attaching that entity's Summary page to the blank master — exactly as the sample does.

**D. Acceptance test for personalisation**
Generate both documents for a fictional test entity (for example "Harbor View Holdings, LLC", entity type "Limited Liability Company", a fictional commitment and tax address) and verify: page counts (Booklet 29, W-9 packet 7); the Summary page shows the test entity's values in the same positions with the correct document file name in the footer; the booklet body shows the test entity in the subscriber and K-1 fields; and a text search of both generated files finds **zero** occurrences of the sample investor's identifiers.

### Client-supplied tax data — Tax ID and Tax Address are per-client inputs (binding)

- The Tax ID Number and Tax Address that appear in the samples belong to the sample investor's own entity (Puza, LLC). They are **data, not template content**: they must never be hard-coded, seeded, or carried into any other client's documents.
- In the clone, `investing_entities.tax_id_encrypted` and `investing_entities.tax_address` are **editable input fields for each client's own entity**, collected exactly where the original portal collects them — the "Add a New Investing Entity" form in the Invest/Submit-Interest flow already has Tax ID and Tax Address inputs (see the invest form spec) — and editable later from the entity's record.
- At generation time, the client's own Tax ID is rendered into (a) the Summary page's `TAX ID NUMBER` field on every signature document for that entity, and (b) the Subscription Booklet's "Social Security or Taxpayer ID No.:" field; the client's own Tax Address is rendered into the Summary page's `TAX ADDRESS` field. Nothing else about the documents changes.
- Security rules for these fields: stored encrypted at rest; masked in every UI (at most the last 4 characters shown); never logged, never emailed, never included in demo/seed data; full value rendered only inside the generated PDF at the moment of generation.
- If a client's Tax ID or Tax Address is corrected after documents were generated, pending (unsigned) document instances for that entity are regenerated with the new values; already-executed documents are historical records and are not rewritten.
- Acceptance: create two fictional entities with different Tax IDs and Tax Addresses, generate the W-9 packet and Booklet for each, and verify each file carries only its own entity's tax data, in the same positions as the samples.

## 18. Invite-only access and the first-time onboarding form (user's requirement — supersedes any public-signup assumption)

**No public registration.** The public site shows only a Log In form (Email, Password, "Forgot password?"). There is NO "Create account" / "Sign up" button or route anywhere. A random visitor can do nothing but attempt to log in.

**Operator-controlled access (allowlist).**
- New table `authorized_emails`: email (unique) · invited_by · status (INVITED | ACTIVE | REVOKED) · invite_token_hash (nullable) · invite_expires_at (nullable) · created_at · activated_at.
- Flow: the team speaks with a prospective client first; only then does an operator add the client's email to the allowlist (operator side is handled separately — in this build a minimal operator-only list screen or seed/config file is an acceptable stub, clearly marked).
- Only allowlisted emails can obtain credentials or log in. Login, password-set and password-reset attempts with a non-allowlisted email return one generic message that does not confirm whether the email exists.
- Credential issuance — **DECIDED by the user (2026-11-01): invite link, client sets their own password.** When an operator adds a client's email to the allowlist, the system emails that client a single-use, expiring (48h) set-password link tied to the allowlisted email; the client creates their own password, which no operator ever sees or knows; the link is invalidated on use or expiry (operator can re-issue). "Forgot password" self-service reset works only for allowlisted/activated emails. (Rejected alternative: operator-generated random passwords — do not implement.)

**First-time onboarding form (mandatory after first login, before full portal use).**
On first login the client must complete this form; until it is submitted, the Dashboard shows an Action Item prompting completion and document generation stays off. The fields are the same data the original account-opening form collected (reconstructed from the Investing Entity detail page in Section 14), and each field maps to the database and to document personalisation:
- Full legal name → `clients.full_name` → header display name, My Profile "Contact Information", signature consent page context.
- Investing entity name (their company, e.g. "… LLC") → `investing_entities.name` → Booklet "Name of Subscriber", Summary page INVESTING ENTITY.
- Entity Type (select) + "Mark as a Disregarded Entity" checkbox → `entity_type`, `is_disregarded` → Summary page ENTITY TYPE.
- Holding Title → `holding_title` → Summary page HOLDING TITLE.
- Tax ID → `tax_id_encrypted` (encrypted, masked "…last 4" + Show in profile) → Summary page TAX ID NUMBER and the Booklet's taxpayer ID field. (In the samples this value is Puza, LLC's own Tax ID — each new client inputs their own entity's Tax ID here.)
- Tax Address: Address · Address 2 · City · State · Zip · Country → `tax_address` → Summary page TAX ADDRESS; profile shows it as one line.
- Schedule K-1 member name → `k1_name` (pre-filled with the entity name, editable) → Booklet K-1 field.
- Contact email + phone → `clients` and `entity_contacts` (primary contact, Document Access "All Documents", Required Signer = Yes).
- Distribution Method (may be completed later; My Profile flags "Missing Information" until set): Payment Method (Check | Electronic | Wire, required when saving this section) · Bank Account (Plaid stub) / Custodian-FBO checkbox · Payee Name · Payment Address fields with "Use Tax Address" shortcut.

**After submission:** the account becomes ACTIVE; the client's My Profile and Investing Entity pages show exactly what they entered; and when the operator creates a commitment for them, their personalised documents (Booklet, W-9 packet) are generated from this data per Section 17 — their name, their LLC, their Tax ID, their address — with no other client's data anywhere.

Acceptance: (1) a non-allowlisted email cannot set a password, reset a password, or log in; (2) an allowlisted email completes onboarding and lands on a Dashboard whose header/profile show their own name and entity; (3) documents generated for that client show only that client's name, entity, Tax ID and tax address.

## 19. Visual identity — FROZEN, pixel-faithful (binding, overrides any design instinct)

This is a replica, not a redesign. The clone must be visually indistinguishable from the original portal at a glance and on side-by-side comparison, on desktop and mobile. The only intentional differences in the whole product are data differences (each client's own name, entity, amounts and documents, per Sections 17–18). The operator's later tweaks will be personalisation/data changes, NOT visual or template changes.

- **Branding stays Cardone Capital / Cardone Equity.** Keep the Cardone Capital logo in the header exactly as the original (dark-navy stylised "C" mark, "CARDONE" bold capitals with "CAPITAL" letter-spaced beneath), the fund names ("Cardone Equity Fund 29, LLC" etc.), the business name, phone, email and Aventura address on Contact Us, and all original copy. Do not invent a new logo, name, tagline or brand voice. If production logo artwork is supplied later, drop it into the same slot at the same size — do not restyle around it.
- **Colour palette (sampled from the user's screenshots of the original — use these as the design tokens and verify against the live original):**
  - Sidebar / mobile drawer navy: **#002C4F** (white text)
  - Active menu item green: **#3C8627** (solid, full-width/full-height row)
  - Primary blue (buttons like Sign/Agree/Save, links, hamburger icon): **#0175D8** (white text on buttons)
  - Badge yellow (New Offerings "3", Signatures "2"): **#FCC43E** (dark text)
  - View-by active tab underline: teal (match the original)
  - Page background: white / very light grey cards with light grey hairline borders and subtle rounded corners, exactly as in the reference screenshots; body text near-black; muted grey for labels and secondary text; red used only for required-field labels, validation messages and the "Missing Information" alert, as in the original.
  Do not introduce gradients, new accent colours, dark sidebars of a different hue, or a "modernised" palette.
- **Typography:** one clean sans-serif family throughout, matching the original's look (regular-weight body text, bold dark headings, blue links, grey small labels above values on profile/entity pages). Match the original's type scale and weights page by page from the reference screenshots/videos. If the original's exact font cannot be licensed/identified, use the closest visual match available and flag it — never substitute a stylistically different font (no serif display, no rounded/geometric novelty fonts).
- **Layout & components:** identical header (logo left, Knowledge Base, user dropdown), identical sidebar order/states, identical card styles, table styles (hairline row separators, header sort icons), buttons (solid blue primary, grey secondary, outlined Upload), badges, form controls (light borders, rounded, red required asterisks), the teal active-tab underline, and the mobile behaviours already specified (hamburger drawer, collapsing tables). Spacing, padding and alignment should match the original's rhythm — when in doubt, measure from the reference material in this kit rather than improvising.
- **Reference material is ground truth:** the kit's `reference-screenshot-*.jpg` files, the user's videos listed in `uploads-inventory.md`, and the live original (read-only) outrank this text. Where text and screenshot disagree visually, the screenshot wins.
- **Acceptance (visual QA):** for every page (Dashboard, New Offerings, one New Offering detail, one Recent Offering detail, Documents All/Investment/Signatures, signature consent, Tax Forms, Transactions, Contact Us, My Profile, Investing Entity detail, Login) produce desktop and mobile screenshots of the clone next to the original/reference and confirm: same colours, same fonts/weights, same layout, same logo and branding, same component styles. Any visible difference that is not a client-data difference is a defect to fix before delivery.
