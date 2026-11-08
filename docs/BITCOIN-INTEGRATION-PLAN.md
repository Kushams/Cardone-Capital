# Bitcoin Funding — Production Integration Plan

Status: PLAN (user decision 2026-11-02: "plan the full production integration first" — no demo-first shortcut)
Scope: let investors fund a portal commitment with Bitcoin, inside the existing invest flow.
Site: investors.cardonecapitalportal.us (Cloudflare Worker `cardone-capital`, Next.js + Supabase)

## 1. What "integrate" means here

Cardone Capital's public site markets a real-estate + Bitcoin hybrid angle
(cardonecapital.com/bitcoin: a real estate–Bitcoin hybrid fund, "Text 404 Bitcoin to invest").
For this portal, integration means the money path, not a marketing page:

1. Investor completes the existing flow: choose offering → set commitment → sign subscription documents.
2. At the funding step they get a payment choice: **wire (existing)** or **Bitcoin (new)**.
3. Choosing Bitcoin creates a payment invoice for the exact USD commitment amount, denominated
   in BTC at a locked exchange rate with an expiry window (typically 15–60 minutes).
4. Investor pays from any wallet (on-chain or Lightning, provider-dependent).
5. The provider notifies the portal by webhook when the payment is confirmed; the commitment
   flips to FUNDED and the investor sees it on their dashboard — same end state as a wire.

Nothing else in the portal changes: allowlist, onboarding, documents, taxes are untouched.

## 2. Recommended route: hosted checkout provider (OpenNode class)

The portal runs on Cloudflare Workers (no long-lived processes, no Node.js runtime).
That rules out mounting OpenReceive in-process (it requires Node + a persistent
wallet-relay connection) unless we run a companion service (option B).

**Option A — Hosted provider (RECOMMENDED): OpenNode**
- Built for exactly this: hosted BTC checkout (on-chain + Lightning), USD conversion at
  payment time, webhooks, refunds, and automatic settlement to USD bank account or a BTC wallet.
- Fits Workers perfectly: portal calls their HTTPS API to create a charge, receives webhooks.
- Production concerns it absorbs: exchange-rate locking, under/overpayment handling,
  confirmation thresholds, invoice expiry.
- Needs: an OpenNode account (user/KYC on the business), API key + webhook secret as Worker secrets.

**Option B — Self-hosted BTCPay Server (sovereign alternative)**
- No third-party custody/fees; needs a small always-on server (VPS) for BTCPay + node/Lightning.
- More moving parts to secure and babysit; webhooks work the same way once running.
- Choose this only if self-custody is a hard requirement.

**Option C — OpenReceive companion service (the package the user found)**
- Open-source and free, settles to a receive-only wallet; but needs a companion Node service
  running 24/7 next to the Worker, plus our own rate source, confirmation watching and
  over/underpayment logic. Most build + most operational risk. Not recommended for production v1.

## 3. Data model changes (Supabase)

New table `crypto_payments`:
- id, commitment_id (FK), client_id, provider, provider_charge_id
- amount_usd (the commitment), amount_btc quoted, rate_usd_btc, rate_expires_at
- status: QUOTED → PENDING → CONFIRMED | EXPIRED | UNDERPAID | REFUNDED
- txid(s), confirmations, settled_as (USD | BTC), created_at, updated_at
Migration `0003_crypto_payments.sql` with RLS deny-by-default + service_role grant
(same pattern as 0002). No changes to existing tables except commitment status flow.

## 4. Code changes (repo)

- `src/lib/crypto-payments.ts` — provider client (create charge, verify webhook signature),
  secrets via env: `OPENNODE_API_KEY`, `OPENNODE_WEBHOOK_SECRET` (names TBD by provider choice).
- Funding step UI: payment-method choice in the invest flow after document signing;
  a status page that polls/refreshes while PENDING (reuse existing visual identity — frozen).
- Webhook route: `POST /api/crypto/webhook` — verify signature, update `crypto_payments`,
  mark commitment FUNDED on CONFIRMED, write an operator-visible audit row.
- Operator console: read-only list of crypto payments (status, amounts, txid) next to the allowlist.
- APP_URL is already https://investors.cardonecapitalportal.us — use it for return/webhook URLs
  (webhook URL: https://investors.cardonecapitalportal.us/api/crypto/webhook).

## 5. Money decisions the user must make before build

1. **Settlement:** auto-convert to USD on receipt (recommended — the funds are USD-denominated
   real-estate vehicles; avoids BTC price risk between payment and deployment) vs hold BTC.
2. **Who pays network/provider fees** and the policy for underpayments and expired invoices
   (top-up link vs refund; provider supports both).
3. **Minimums:** BTC option on all commitments, or only above a threshold.

## 6. Compliance flags (not legal advice — needs the fund's counsel before launch)

- Accredited/non-accredited rules still apply to WHO may invest; BTC changes nothing there.
- AML/KYC on the payer; the provider's KYC on the business entity is step one.
- Money-transmission and state rules vary; securities counsel should bless the flow,
  custody arrangement and investor disclosures before the first real payment.

## 7. Rollout phases

- **P0** — Provider account + API credentials (user), DNS/webhook config (Muse).
- **P1** — Migration 0003 + provider client + webhook, deployed behind a feature flag OFF.
- **P2** — Test with provider testnet/small live amounts end-to-end (invoice → pay → webhook → FUNDED).
- **P3** — Flag ON for allowlisted staff/test client; verify operator console + reconciliation.
- **P4** — General availability; monitoring on webhook failures; weekly reconciliation report.

## 8. What Muse needs from the user to start P0/P1

- Pick the settlement choice (§5.1) and confirm provider = OpenNode (or choose BTCPay).
- Create the OpenNode account for the business and provide the API key + webhook secret
  through Muse's secure-entry link (never in chat, never in GitHub).
