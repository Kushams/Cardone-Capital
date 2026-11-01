/**
 * Access-model acceptance test — SUPABASE port of tests/e2e/access-model.js.
 *
 * The original drives the old node:sqlite data layer (a portal.sqlite path on the
 * original author's machine). This version preserves every assertion of the original,
 * but reads/writes state through Supabase (Postgres + the `outbox` stub table) using
 * the service-role key from .env.local — the same backend the app itself uses since
 * the Phase-1 data-layer swap (src/lib/supabase.ts / src/lib/db.ts).
 *
 * Extra coverage the original did not have (§7b, from the PR #2 follow-ups):
 * cross-client PDF isolation against /investor/files/instances/[id] —
 *   - client A fetches A's own generated PDF   -> 200, PDF bytes
 *   - client B (logged in) fetches A's PDF     -> 404 (route returns an identical
 *     "Not found" for 'not yours' and 'missing'; see src/app/investor/files/instances/[id]/route.ts)
 *   - A fetches B's PDF (reverse direction)    -> 404
 *   - B fetches B's own PDF (control)          -> 200, PDF bytes
 *   - unauthenticated fetch of A's PDF         -> no PDF bytes: src/proxy.ts redirects
 *     cookieless /investor/* requests to the login page (307) before the route's own
 *     401 can fire; either denial is accepted, a 200/PDF is not
 *
 * Run (against a LOCAL server — Chromium on this VM cannot reach the public internet):
 *   TAX_ID_KEY="$(cat storage/.dev-key)" APP_URL=http://localhost:3100 npx next start -p 3100
 *   BASE=http://localhost:3100 node tests/e2e/access-model.supabase.js [screenshotDir]
 *
 * Chromium: uses `playwright` if installed, else `playwright-core`, else the
 * playwright-core checkout under ~/workspace/.pwtest (this VM's tooling).
 * All data this test creates is TEST data (pat.newclient@ / expiry.test@ example.test
 * rows) and is removed again in the finally-block, together with generated PDF
 * files/objects. Seeded demo rows are not modified (Alex's §7b login session is
 * deleted again by timestamp).
 */
let chromium;
try { ({ chromium } = require('playwright')); }
catch { try { ({ chromium } = require('playwright-core')); }
catch { ({ chromium } = require(require('path').join(require('os').homedir(), 'workspace/.pwtest/node_modules/playwright-core'))); } }
const { execFileSync } = require('child_process');
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

// ---- env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env.local (values never printed) ----
for (const line of fs.readFileSync(path.join(__dirname, '..', '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const must = async (q) => { const { data, error } = await q; if (error) throw new Error('Supabase: ' + error.message); return data; };
const one = async (q) => { const { data, error } = await q; if (error) throw new Error('Supabase: ' + error.message); return data; };

const BASE = process.env.BASE || 'http://localhost:3100', OUT = process.argv[2] || '/tmp/cc-access-shots';
fs.mkdirSync(OUT, { recursive: true });
const EMAIL = 'pat.newclient@example.test', PW = 'Correct-Horse-Battery-9', NOPE = 'stranger@example.test';
const EXPIRY = 'expiry.test@example.test';
const ALEX = 'alex.demo@example.test', DEMO_PW = 'Demo-Passw0rd!Change'; // seeded demo client B (src/data/seed-data.ts)
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
let fails = 0; const ck = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) fails++; };
const TEST_START = new Date().toISOString();

// ---- Supabase replacements for the original's SQLite reads ----
const outboxCount = async () => (await sb.from('outbox').select('*', { count: 'exact', head: true })).count;
const authRow = async (email) => one(sb.from('authorized_emails').select('status, invite_token_hash, invite_expires_at, token_purpose').eq('email', email).maybeSingle());
const latestOutboxBody = async (email) => { const r = await must(sb.from('outbox').select('body').eq('to_email', email).order('id', { ascending: false }).limit(1)); return r[0]?.body; };
const clientByEmail = async (email) => one(sb.from('clients').select('id, full_name, onboarding_completed_at').eq('email', email).maybeSingle());

/** Remove everything this test creates (safe before and after a run; demo seed rows untouched). */
async function cleanupTestData() {
  for (const email of [EMAIL, EXPIRY]) {
    const c = await clientByEmail(email).catch(() => null);
    if (c) {
      const insts = await must(sb.from('document_instances').select('id, generated_file_path, executed_file_path').eq('client_id', c.id));
      const instIds = insts.map((i) => i.id);
      for (const i of insts) for (const rel of [i.generated_file_path, i.executed_file_path]) {
        if (!rel) continue;
        const bucket = rel.startsWith('storage/executed') ? 'executed' : 'generated';
        await sb.storage.from(bucket).remove([rel.replace(/^storage\/(generated|executed)\//, '')]).catch(() => {});
        fs.rmSync(path.join(__dirname, '..', '..', rel), { force: true });
      }
      if (instIds.length) await must(sb.from('signature_requests').delete().in('document_instance_id', instIds));
      await must(sb.from('document_instances').delete().eq('client_id', c.id));
      const ents = await must(sb.from('investing_entities').select('id').eq('client_id', c.id));
      const entIds = ents.map((e) => e.id);
      if (entIds.length) {
        await must(sb.from('commitments').delete().in('investing_entity_id', entIds));
        await must(sb.from('investing_entities').delete().in('id', entIds)); // entity_contacts / bank_accounts cascade
      }
      const u = await one(sb.from('users').select('id').eq('email', email).maybeSingle());
      if (u) { await must(sb.from('sessions').delete().eq('user_id', u.id)); await must(sb.from('users').delete().eq('id', u.id)); }
      await must(sb.from('clients').delete().eq('id', c.id));
    }
    await must(sb.from('outbox').delete().eq('to_email', email));
    await must(sb.from('authorized_emails').delete().eq('email', email));
  }
  // sessions created by THIS run's demo-client (Alex) §7b login
  const au = await one(sb.from('users').select('id').eq('email', ALEX).maybeSingle()).catch(() => null);
  if (au) await must(sb.from('sessions').delete().eq('user_id', au.id).gte('created_at', TEST_START));
}

(async () => {
  await cleanupTestData(); // idempotent pre-clean: a crashed earlier run can't poison this one
  const b = await chromium.launch();
  let exitCode = 2;
  try {
    const D = { viewport: { width: 1440, height: 900 } };
    // ---- 1. public surface: login only ----
    let c = await b.newContext(D), p = await c.newPage(); await p.goto(BASE + '/investor/login'); await p.waitForLoadState('networkidle');
    const body = (await p.innerText('body')).toLowerCase(); ck(!/sign ?up|create (an )?account|register|get started/.test(body), 'login page has NO sign-up / create-account / register text');
    for (const r of ['/signup', '/register', '/investor/signup', '/investor/register']) { const s = (await p.goto(BASE + r)).status(); const landed = p.url(); ck(s === 404 || landed.includes('/investor/login'), `${r} is not a page (status ${s}, ends at ${landed.replace(BASE, '')})`); ck(!/create (an )?account|sign ?up/i.test(await p.innerText('body')), `${r} shows no sign-up form`); }
    // ---- 2. non-allowlisted email: login, reset, set-password all generic / inert ----
    await p.goto(BASE + '/investor/login'); await p.waitForLoadState('networkidle'); await p.fill('input[name=email]', NOPE); await p.fill('input[name=password]', 'whatever-123456'); await p.click('button[type=submit]'); await p.waitForSelector('p[role=alert]');
    const gen1 = await p.locator('p[role=alert]').textContent(); await p.fill('input[name=email]', 'alex.demo@example.test'); await p.fill('input[name=password]', 'wrong-password-123'); await p.waitForTimeout(400); await p.click('button[type=submit]'); await p.waitForTimeout(800);
    const gen2 = await p.locator('p[role=alert]').textContent(); ck(gen1 === gen2, `same message for unknown email and wrong password: "${gen1}"`);
    await p.goto(BASE + '/investor/forgot-password'); await p.waitForLoadState('networkidle'); const before = await outboxCount();
    await p.fill('input[name=email]', NOPE); await p.click('button:has-text("Send reset link")'); await p.waitForSelector('[role=status]'); const m1 = await p.textContent('[role=status]');
    ck((await outboxCount()) === before, 'non-allowlisted forgot-password creates NO email/token'); await p.screenshot({ path: OUT + '/g01-forgot-generic.png' });
    await p.goto(BASE + '/investor/set-password?token=not-a-real-token'); ck((await p.textContent('body')).includes('invalid or has expired'), 'bogus set-password token rejected'); await p.screenshot({ path: OUT + '/g02-invalid-link.png' });
    // ---- 3. operator invites ----
    await p.goto(BASE + '/operator'); await p.fill('input[name=key]', 'operator-dev-key'); await p.click('button:has-text("Unlock")'); await p.waitForSelector('text=Access allowlist');
    await p.fill('input[name=email]', EMAIL); await p.click('button:has-text("Invite")'); await p.waitForSelector('[role=status]');
    const row = await authRow(EMAIL);
    ck(row.status === 'INVITED' && !!row.invite_token_hash, 'allowlisted as INVITED with token HASH stored (not the token)'); const hrs = (new Date(row.invite_expires_at) - Date.now()) / 36e5; ck(hrs > 47.9 && hrs <= 48.01, `link expires in ~48h (${hrs.toFixed(2)}h)`);
    await p.click('summary:has-text("pat.newclient")'); await p.screenshot({ path: OUT + '/g03-operator-console-outbox.png', fullPage: true });
    const link = (await latestOutboxBody(EMAIL)).match(/https?:\/\/\S+/)[0]; const rawToken = link.split('token=')[1];
    ck((await sb.from('authorized_emails').select('*', { count: 'exact', head: true }).eq('invite_token_hash', rawToken)).count === 0, 'raw token is not stored in the DB');
    ck(row.invite_token_hash === sha256(rawToken), 'stored value is exactly SHA-256(link token)');
    // ---- 4. client sets OWN password ----
    c = await b.newContext(D); p = await c.newPage(); await p.goto(link); await p.waitForSelector('input[name=password]'); await p.screenshot({ path: OUT + '/g04-set-password.png' });
    await p.fill('input[name=password]', 'short'); await p.fill('input[name=confirm]', 'short'); await p.evaluate(() => document.querySelector('input[name=password]').removeAttribute('minlength')); await p.click('button:has-text("Set password")'); await p.waitForSelector('p[role=alert]'); ck((await p.locator('p[role=alert]').textContent()).includes('12 characters'), 'weak password refused'); await p.waitForTimeout(700);
    await p.fill('input[name=password]', PW); await p.fill('input[name=confirm]', PW); await p.click('button:has-text("Set password")'); await p.waitForURL('**/investor/onboarding'); ck(true, 'after setting password -> forced to onboarding');
    // token single-use
    const c2 = await b.newContext(D), p2 = await c2.newPage(); await p2.goto(link); ck((await p2.textContent('body')).includes('invalid or has expired'), 'invite link is single-use (reuse rejected)'); await c2.close();
    // ---- 5. onboarding gate + validation ----
    await p.goto(BASE + '/investor/investments'); ck(p.url().includes('/investor/onboarding'), 'portal pages redirect to onboarding until the form is done');
    await p.waitForLoadState('networkidle'); await p.click('button:has-text("Submit and continue")'); await p.waitForSelector('span[role=alert]'); await p.waitForTimeout(700); await p.screenshot({ path: OUT + '/g05-onboarding-validation.png', fullPage: true });
    await p.fill('input[name=full_name]', 'Pat Newclient'); await p.fill('input[name=phone]', '+1 555 010 0303'); await p.fill('input[name=entity_name]', 'Maple Ridge Ventures, LLC');
    await p.selectOption('select[name=entity_type]', 'Limited Liability Company'); await p.fill('input[name=holding_title]', 'Company Ownership'); await p.fill('input[name=tax_id]', '96-5551234');
    await p.fill('input[name=tax_address]', '300 Sample Street'); await p.fill('input[name=tax_city]', 'Exampleton'); await p.selectOption('select[name=tax_state]', 'NJ'); await p.fill('input[name=tax_zip]', '07000');
    ck((await p.inputValue('input[name=k1_name]')) === 'Maple Ridge Ventures, LLC', 'K-1 name pre-filled from entity name');
    await p.screenshot({ path: OUT + '/g06-onboarding-filled.png', fullPage: true }); await p.click('button:has-text("Submit and continue")'); await p.waitForURL('**/investor/investments');
    // ---- 6. data landed where it should, encrypted ----
    const patClient = await clientByEmail(EMAIL);
    const ent = (await must(sb.from('investing_entities').select('id, name, k1_name, tax_id_encrypted').eq('client_id', patClient.id).limit(1)))[0];
    ck(patClient.full_name === 'Pat Newclient' && ent.name === 'Maple Ridge Ventures, LLC', 'profile + entity rows created from the form'); ck(ent.tax_id_encrypted.startsWith('v1:') && !ent.tax_id_encrypted.includes('5551234'), 'Tax ID stored encrypted (no plaintext in DB)');
    ck((await authRow(EMAIL)).status === 'ACTIVE', 'allowlist status -> ACTIVE after onboarding');
    ck((await p.textContent('[data-testid=user-menu]')).includes('Pat Newclient'), 'header shows the client\'s own name'); await p.screenshot({ path: OUT + '/g07-dashboard-new-client.png' });
    await p.goto(BASE + '/investor/settings/profile'); await p.waitForLoadState('networkidle'); const prof = await p.textContent('main'); ck(prof.includes('Pat Newclient') && prof.includes('Maple Ridge Ventures, LLC') && !prof.includes('Alex Demo'), 'My Profile shows only their own data'); await p.screenshot({ path: OUT + '/g08-profile-new-client.png', fullPage: true });
    await p.goto(BASE + '/investor/settings/profile/entities/' + ent.id); await p.waitForLoadState('networkidle');
    const entPage = await p.textContent('main'); ck(entPage.includes('…1234') && !entPage.includes('5551234') && !entPage.includes('96-555'), 'entity page shows Tax ID masked to last 4 only'); await p.screenshot({ path: OUT + '/g09-entity-masked-tin.png' });
    ck((await p.textContent('body')).length > 0 && !(await p.content()).includes('96-5551234'), 'full Tax ID absent from the page HTML');
    // ---- 7. documents stay off until operator creates a commitment ----
    await p.goto(BASE + '/investor/documents/signatures'); await p.waitForLoadState('networkidle'); ck(await p.locator('[data-testid=pending-signatures-table] tbody tr').count() === 1 && (await p.textContent('[data-testid=pending-signatures-table]')).includes('No documents are waiting'), 'no documents generated before a commitment exists');
    const oc = await b.newContext(D), op = await oc.newPage(); await op.goto(BASE + '/operator'); await op.fill('input[name=key]', 'operator-dev-key'); await op.click('button:has-text("Unlock")'); await op.waitForSelector('text=Access allowlist');
    await op.selectOption('select[name=email]', EMAIL); await op.selectOption('select[name=offering]', '86'); await op.fill('input[name=amount]', '300,000'); await op.click('button:has-text("Create")'); await op.waitForSelector('[role=status]');
    await p.goto(BASE + '/investor/documents/signatures'); await p.waitForLoadState('networkidle'); const pend = await p.textContent('[data-testid=pending-signatures-table]');
    ck(pend.includes('Maple Ridge Ventures, LLC') && pend.includes('Fund 30'), 'after commitment: pending Booklet + W-9 packet for THEIR entity (Fund 30)'); await p.screenshot({ path: OUT + '/g10-pending-after-commitment.png' });
    const insts = (await must(sb.from('document_instances').select('id').eq('client_id', patClient.id))).map((r) => r.id); ck(insts.length === 2, '2 instances generated');
    let allTxt = ''; const ownPdf = {};
    for (const id of insts) { const r = await p.request.get(BASE + '/investor/files/instances/' + id); ck(r.status() === 200, 'client can fetch their own PDF ' + id); const buf = await r.body(); ownPdf[id] = buf; fs.writeFileSync('/tmp/g_' + id + '.pdf', buf); allTxt += execFileSync('pdftotext', ['-layout', '/tmp/g_' + id + '.pdf', '-']).toString(); }
    ck(allTxt.includes('Maple Ridge Ventures, LLC') && allTxt.includes('965551234') && allTxt.includes('300 Sample Street') && allTxt.includes('$300,000'), 'their PDFs carry THEIR entity, Tax ID, tax address, amount');
    ck(!/Harbor View|Lakeside|98-7654321|97-1234567|Alex Demo|Sam Sample/.test(allTxt) && !/\b(puza|tara|kevin)\b/i.test(allTxt), 'no other client\'s data and no sample-investor identifiers in their PDFs');
    // ---- 7b. cross-client PDF isolation (NEW vs the SQLite original) ----
    const alexClient = await clientByEmail(ALEX);
    const alexInsts = (await must(sb.from('document_instances').select('id').eq('client_id', alexClient.id))).map((r) => r.id);
    const ac = await b.newContext(D), ap = await ac.newPage();
    await ap.goto(BASE + '/investor/login'); await ap.waitForLoadState('networkidle');
    await ap.fill('input[name=email]', ALEX); await ap.fill('input[name=password]', DEMO_PW); await ap.click('button[type=submit]'); await ap.waitForURL('**/investor/investments');
    ck(ap.url().includes('/investor/investments'), 'client B (Alex Demo) logged in for the isolation check');
    for (const id of insts) {
      const r = await ap.request.get(BASE + '/investor/files/instances/' + id);
      const buf = await r.body();
      ck(r.status() === 404, `isolation: client B requesting client A's PDF ${id} -> 404 (got ${r.status()})`);
      ck(buf.subarray(0, 5).toString() !== '%PDF-', `isolation: no PDF bytes leaked to client B for ${id}`);
    }
    for (const id of alexInsts) {
      const r = await p.request.get(BASE + '/investor/files/instances/' + id);
      ck(r.status() === 404, `isolation (reverse): client A requesting client B's PDF ${id} -> 404 (got ${r.status()})`);
    }
    { const r = await ap.request.get(BASE + '/investor/files/instances/' + alexInsts[0]);
      const buf = await r.body();
      ck(r.status() === 200 && buf.subarray(0, 5).toString() === '%PDF-', `control: client B CAN fetch B's own PDF ${alexInsts[0]} (200, PDF bytes)`); }
    { const anon = await b.newContext(D); const r = await anon.request.get(BASE + '/investor/files/instances/' + insts[0], { maxRedirects: 0 });
      const buf = await r.body();
      ck((r.status() === 307 || r.status() === 401) && buf.subarray(0, 5).toString() !== '%PDF-', `unauthenticated fetch of A's PDF -> denied (307 login redirect from proxy.ts, or route 401), no PDF bytes (got ${r.status()})`);
      await anon.close(); }
    await ac.close();
    // ---- 8. expiry + revoke ----
    await op.goto(BASE + '/operator'); await op.fill('input[name=email]', EXPIRY); await op.click('button:has-text("Invite")'); await op.waitForSelector('[role=status]');
    const l2 = (await latestOutboxBody(EXPIRY)).match(/https?:\/\/\S+/)[0];
    await must(sb.from('authorized_emails').update({ invite_expires_at: new Date(Date.now() - 1000).toISOString() }).eq('email', EXPIRY));
    const c3 = await b.newContext(D), p3 = await c3.newPage(); await p3.goto(l2); ck((await p3.textContent('body')).includes('invalid or has expired'), 'expired (>48h) link rejected');
    await op.goto(BASE + '/operator'); await op.click(`tr:has-text("${EMAIL}") button:has-text("Revoke")`); await op.waitForLoadState('networkidle');
    await p.goto(BASE + '/investor/investments'); ck(p.url().includes('/investor/login'), 'revoked client\'s live session is killed immediately');
    await p.fill('input[name=email]', EMAIL); await p.fill('input[name=password]', PW); await p.click('button[type=submit]'); await p.waitForSelector('[role=alert]'); ck(true, 'revoked client cannot log in');
    await op.goto(BASE + '/operator'); await op.fill('input[name=email]', EMAIL); await op.click('button:has-text("Invite")'); await op.waitForSelector('[role=status]'); await op.screenshot({ path: OUT + '/g11-operator-after-revoke-reinvite.png', fullPage: true });
    exitCode = fails ? 1 : 0;
  } catch (e) { console.error(e); exitCode = 2; }
  finally {
    await b.close().catch(() => {});
    await cleanupTestData().catch((e) => console.error('cleanup failed:', e.message));
  }
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL ACCESS-MODEL ACCEPTANCE CHECKS PASSED (Supabase port, incl. cross-client PDF isolation)');
  process.exit(exitCode);
})().catch(async (e) => { console.error(e); await cleanupTestData().catch(() => {}); process.exit(2); });
