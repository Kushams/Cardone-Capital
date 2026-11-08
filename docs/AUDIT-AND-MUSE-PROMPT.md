> **Note (2026-11-08):** This file is a dated record of the 2026-11-06 audit and the prompt given to Muse. It was written as a conversation, so phrases such as "I can fix this" refer to the assistant that wrote it.
> The authoritative CURRENT state, open items and next steps are in `docs/HANDOFF.md`. If the two differ, HANDOFF.md wins.

# Live-site audit + Muse follow-up prompt (2026-11-06)

Everything below is in the order it was written, starting from the request:
"I think I've finished the website. I've added domains and everything. Just check and let me know what more I need to add."

Contents:
1. Audit of the live site: what's good, what to fix, what's still open, what I couldn't verify
2. The two addresses: investors.* and investor.*
3. The prompt to paste into Muse AI to verify and fix everything

---

# PART 1 — Audit of the live site

The site is live and working on its own domain, but it isn't ready for real investors yet. It's at `https://investors.cardonecapitalportal.us`, and `main` on GitHub now matches what's running, since PR #2 was merged.

I tested the live site from outside as a visitor, scanned `main` and its full history for committed keys, and checked Resend (the email service). I did not log in, because I have no test account, so I haven't tested the actual investor flows on the live data.

## What's good
- **Domain:** it has a valid HTTPS certificate and is served through Cloudflare.
- **Login:** a wrong login gets the generic message, and `/signup` doesn't exist.
- **Files:** the document file routes require login.
- **Secrets:** my scan of `main` and its history found no committed keys, passwords or private keys.
- **Email:** Resend shows `cardonecapitalportal.us` as verified with sending enabled, so invite emails can go out.

## Fix before real investors (most important first)
1. **The domain itself.** `cardonecapitalportal.us` carries Cardone's name, and it hosts a pixel-faithful copy of its investor login. Unless Cardone Capital has authorised this in writing, it looks like a phishing site. Browsers and Google can flag it and take it down. I'd get written approval, or host it on a subdomain Cardone owns, like `investors.cardonecapital.com`.
2. **Plain HTTP works.** `http://…` serves the login page with no redirect, and no HSTS header is set. In Cloudflare, turn on "Always Use HTTPS" and HSTS.
3. **Missing security headers.** There is no CSP, no clickjacking protection, no `nosniff` and no Referrer-Policy. The site also tells everyone it runs Next.js (`X-Powered-By`). I can fix these in code.
4. **Search engines aren't blocked.** There's no `noindex` tag and `robots.txt` has no Disallow rule. A private investor portal should not be indexed. I can fix this in code.
5. **`/operator` is public**, protected only by a passphrase. Put it behind Cloudflare Access with 2-factor. The code also still falls back to the known default passphrase `operator-dev-key` if `OPERATOR_KEY` is ever unset (the live banner is off, so it's set today). It should refuse to run instead.
6. **Legal and compliance.** The fund's securities lawyer needs to clear the site, the signing process, the funding steps and the Bitcoin plan before the first real payment. Muse's Bitcoin plan (`docs/BITCOIN-INTEGRATION-PLAN.md`) is only a plan. Nothing is built, and it needs your decisions on settlement and fees.
7. **Test data:** make sure the demo users (`alex.demo`, `sam.sample`) and the default passphrases don't exist in the production database.

## Still open
- **Real e-signature and consent text.** The consent text is still my placeholder, and signing may still be the typed-name demo. Check what Muse changed here.
- **Content:** hero images, gallery photos 2 to N, the real consent text, Terms and Privacy links, and final fund descriptions.
- **Look:** Muse's 14px text change is in the live site, so every page looks smaller than the approved design.
- **Operations:** backups with a tested restore, uptime and error alerts, and a safe copy of `TAX_ID_KEY` in a password manager. If that key is lost, every Tax ID becomes unreadable.
- **Housekeeping:** the README on `main` still describes email as a stub, which is out of date, and there are old Muse branches to clean up.

## What I couldn't verify
- **The Supabase project:** I can't see the portal's project. Yours still holds only the other app's 29 tables, so Muse is using a different account or project.
- **Login rate limiting:** Muse added a table for it, but I haven't tested whether it blocks repeated bad logins.
- **Email DNS:** the sandbox can't query DNS, so the SPF, DKIM and DMARC records are unchecked. Only Resend's "verified" status is confirmed.

Want me to fix items 3, 4 and 5 in code as a draft pull request for you to review? You'd do the Cloudflare settings (item 2 and the Access login) and the written Cardone approval (item 1), and I'd then re-test after each fix.

---

# PART 2 — The two addresses

The two addresses are `investors.cardonecapitalportal.us` and `investor.cardonecapitalportal.us`. I tested both. They serve the same app and behave identically, so everything from Part 1 applies to both.

| | `investors.…` | `investor.…` |
|---|---|---|
| HTTPS certificate | valid | valid |
| Login page | loads | loads, identical page |
| Wrong login | generic message, no errors | same |
| Plain `http://` | served, no redirect | served, no redirect |
| Security headers | missing | missing |
| `/operator` | public | public |

I haven't tested real logins on either address.

**New observations:**
1. **Two addresses, one app.** There are two copies of the login on the internet, and I'd pick one and send the other to it. The code's `APP_URL`, used in the invite and reset email links, points at `investors.` (plural), and Muse's plan uses that too, so I'd make it canonical and 301-redirect `investor.` to it. With no redirect, search engines see duplicates and users can end up on either host.
2. **Logins don't carry over.** The session cookie is host-only, so someone who logs in on one address is logged out on the other. This isn't a security problem (the cookie is `httpOnly`, `sameSite=lax`, and `secure` in production), but it's confusing without the redirect.
3. **Server actions are fine.** Muse's config allows both hostnames, and the failed-login test worked on both, so there's nothing to fix.
4. **Email sender:** the mailer sends as `invest@cardonecapitalportal.us`, with replies going to a staff mailbox on Zoho. Check that mailbox is monitored, because investors will reply to it.

The first thing I'd still settle is the domain approval, since `cardonecapitalportal.us` isn't Cardone's own domain. After that, the fixes are the same as in Part 1:
- **In code (I can do these):** security headers, `noindex`, locking down `/operator` so it refuses to run without a real key, and the redirect from `investor.` to `investors.` (that redirect can also be done in Cloudflare).
- **In Cloudflare (you do these):** "Always Use HTTPS", HSTS, and Cloudflare Access with 2-factor for `/operator`.

---

# PART 3 — Prompt to paste into Muse AI

It covers everything from the two audit messages above, and it asks Muse to prove each item before claiming it's done.

```
AUDIT FOLLOW-UP — verify each item below, then fix what is not done.

CONTEXT
Our site is live on Cloudflare at TWO addresses serving the same app:
  https://investors.cardonecapitalportal.us   (canonical: APP_URL and the invite emails use this one)
  https://investor.cardonecapitalportal.us
An outside audit found the problems below. For EACH numbered item, reply with a status — DONE / PARTIAL / NOT DONE — and EVIDENCE: the commit or PR link, and for live behaviour the exact curl output or a screenshot. Do not say "done" without evidence. Then fix everything that is not done, as separate draft pull requests into main, and tell me what to review. Never put secrets in chat or in GitHub. Ask me before anything that costs money, publishes something new, or changes how the site looks.

A. SECURITY (found on BOTH hostnames)
1. Plain HTTP is not redirected. http://investors.cardonecapitalportal.us/investor/login returns 200 with no redirect, and no Strict-Transport-Security header is sent. FIX in Cloudflare: "Always Use HTTPS" on, HSTS on (start with max-age 6 months, includeSubDomains off until all subdomains are checked). Evidence: `curl -sI http://<host>/investor/login` must show a 301/308 to https, and `curl -sI https://<host>/investor/login` must show strict-transport-security.
2. Missing security headers on every response. Currently only cache-control and x-powered-by are present. ADD in next.config headers (or Cloudflare): Content-Security-Policy (frame-ancestors 'none'; sensible script/style/img/connect sources — test that the app, images, fonts, the Google Maps embed on Fund 30 and Server Actions still work), X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy (deny camera/mic/geolocation unless used). REMOVE the X-Powered-By header (poweredByHeader: false).
3. Not blocked from search engines. There is no noindex tag and robots.txt has no Disallow rule. ADD `X-Robots-Tag: noindex, nofollow` on all responses, a robots meta noindex, and robots.txt `User-agent: *  Disallow: /`. This is a private investor portal.
4. /operator is publicly reachable (passphrase only). Put it behind Cloudflare Access (email allowlist + one-time PIN or 2FA) on BOTH hostnames, OR make it unreachable from the public internet. Also in code: src/lib/operator.ts falls back to the known default passphrase "operator-dev-key" when OPERATOR_KEY is unset, and src/app/operator/OperatorLogin.tsx prints that default. Make the operator console REFUSE TO RUN (fail closed, clear error) when OPERATOR_KEY is missing or equals the default, and remove the printed hint. Add rate limiting and lockout to the operator login.
5. Login rate limiting: migration 0007_login_attempts exists. PROVE it works on the live site: after N wrong logins from one IP/email, further attempts are blocked, with the same generic message and no way to tell whether an email is on the allowlist. Show the test and its output. Also confirm the invite/reset/set-password endpoints are rate limited.
6. TAX_ID_KEY: confirm it is set as a Cloudflare secret (never in the repo), tell me where the ONLY backup copy is stored (it must be in a password manager or key vault — if it is lost, every Tax ID becomes unreadable), and describe how a key rotation would work. Do not print the key.
7. Secrets scan: the repo and its history are currently clean (no committed keys). Add a secret-scanning check (gitleaks or GitHub secret scanning + push protection) so it stays clean.

B. TWO HOSTNAMES
8. investor.cardonecapitalportal.us and investors.cardonecapitalportal.us serve identical pages. Make investors.* canonical and 301-redirect investor.* (every path and query string, keeping https) to it, in Cloudflare or middleware. Evidence: `curl -sI https://investor.cardonecapitalportal.us/investor/login?return=%2Finvestor%2Fdocuments` shows a 301 to the investors.* equivalent. Confirm the Server Actions allowedOrigins and APP_URL still work after this, and that invite/reset links always use the canonical host.

C. EMAIL
9. Resend shows cardonecapitalportal.us as verified with sending enabled. Confirm SPF, DKIM AND a DMARC record exist (start DMARC at p=none with a reporting address, then tighten to quarantine). Show the DNS records. Confirm invite and password-reset emails actually arrive in a real inbox (not spam) and that the links work once and expire after 48 hours.
10. Emails are sent as invest@cardonecapitalportal.us and replies go to a Zoho staff mailbox. Confirm that mailbox exists, is monitored by a named person, and tell me who.

D. DATA AND OPERATIONS
11. Demo data must NOT exist in production: delete the demo users (alex.demo@example.test, sam.sample@example.test, invitee.demo@example.test) and their entities, commitments, signature requests and PDFs from the production Supabase project. Show a query result proving zero demo rows. Confirm no default or dev passphrase exists anywhere in production.
12. Backups: tell me which Supabase plan the production project is on, whether automatic daily backups (and point-in-time recovery) are ON, and do ONE real test restore into a scratch project. Confirm the private Storage buckets (masters, generated, executed) are included in the backup/restore plan.
13. Isolation test on production data: create two throwaway test clients and prove that client A gets 404 for client B's PDFs and signature pages, and that Tax IDs are never shown beyond the last 4 digits in any page or API response. Then delete the test clients.
14. Monitoring: add uptime checks on the login page, error tracking (e.g. Sentry) for the Worker, and an alert if the Resend webhook or any email send fails. Tell me where the alerts go.
15. Run and show passing output for: npm run check:masters, npm run check:images, npm run test:personalisation, npm run build, and the Playwright suites in tests/e2e (access-model, sign-flow, documents-counts, image-placement) against the Supabase-backed app. If a suite was never ported to Supabase, port it.

E. PRODUCT STILL OPEN (report status; do not invent anything)
16. E-signature: is signing still a typed-name DEMO (the executed copy is stamped "DEMO/STUB")? If yes, list the real options (DocuSign, Dropbox Sign, or a proper in-house capture), recommend one, and ASK ME before building.
17. The electronic-communications consent text is still a PLACEHOLDER. Never write legal wording yourself. Make the page easy for me to paste the firm's text into one file.
18. Still-pending content: the 4 hero images (images/new-offerings/fund-29..32-hero.*), gallery photos 2…N per property, final fund descriptions, working Terms of Service and Privacy Policy links. Report which exist.
19. Funding / payments: the wire-instructions path and the "I sent my capital" step — what is real and what is still a stub? The Bitcoin plan (docs/BITCOIN-INTEGRATION-PLAN.md) is ONLY a plan: do not build any payment code until I answer its section-5 decisions AND the fund's securities counsel approves.
20. The Upload Document, Download All, Plaid bank linking and contact "Edit" items — status of each.

F. DECISIONS FOR ME (ask, do not decide)
21. DOMAIN AUTHORISATION: cardonecapitalportal.us is not Cardone Capital's own domain and hosts a pixel-faithful copy of its investor login. Do NOT change DNS or move domains. Ask me whether I have written approval from Cardone Capital, or whether the site should move to a subdomain Cardone controls (for example investors.cardonecapital.com). List the steps for either path.
22. TEXT SIZE: a merged commit scaled all typography down 12.5% (root 16px -> 14px). The design was meant to be FROZEN (docs/CLONE-PROMPT.md section 19). Show me side-by-side screenshots (16px vs 14px) of Login, Dashboard, Documents and My Profile against the reference screenshots in storage/reference/, and ask which I want. Do not revert or keep it on your own.

G. HOUSEKEEPING
23. Update README.md and docs/HANDOFF.md so they match reality (email is real via Resend, not a stub; the data layer is Supabase; hosting is Cloudflare; the list of remaining stubs is current).
24. Delete merged or abandoned branches (muse/supabase-migration, muse/supabase-cloudflare-plan, muse/supabase-data-layer, muse/access-model-supabase-test, claude/cardone-portal-clone) ONLY after confirming each is fully contained in main; list what you deleted.
25. Close with a one-page status table of items 1–24 (Status | Evidence | Who owns the next step) and a ranked list of what you recommend before real investors are invited.

HARD RULES (unchanged)
- Visual identity is FROZEN apart from the text-size question in item 22.
- No public sign-up anywhere; login only; invite link, client sets their own password, single-use, 48 hours.
- Tax IDs encrypted, masked to the last 4 digits everywhere, never logged or emailed.
- Never add documents/signatures-pending/ anywhere. Never write the firm's legal text.
```

I can also run my own live checks for items 1 to 3, 5 and 8 once Muse says they're done, to confirm its evidence.
