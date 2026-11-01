const { chromium } = require('playwright'); const { DatabaseSync } = require('node:sqlite'); const { execFileSync } = require('child_process');
const BASE='http://localhost:3000', OUT=process.argv[2], DBP='/home/user/Cardone-Capital/storage/db/portal.sqlite';
const db=()=>new DatabaseSync(DBP); const EMAIL='pat.newclient@example.test', PW='Correct-Horse-Battery-9', NOPE='stranger@example.test';
let fails=0; const ck=(ok,m)=>{console.log((ok?'  ok   ':'  FAIL ')+m); if(!ok)fails++;};
(async()=>{const b=await chromium.launch(); const D={viewport:{width:1440,height:900}};
// ---- 1. public surface: login only ----
let c=await b.newContext(D), p=await c.newPage(); await p.goto(BASE+'/investor/login'); await p.waitForLoadState('networkidle');
const body=(await p.innerText('body')).toLowerCase(); ck(!/sign ?up|create (an )?account|register|get started/.test(body),'login page has NO sign-up / create-account / register text');
for (const r of ['/signup','/register','/investor/signup','/investor/register']) { const s=(await p.goto(BASE+r)).status(); const landed=p.url(); ck(s===404||landed.includes('/investor/login'),`${r} is not a page (status ${s}, ends at ${landed.replace(BASE,'')})`); ck(!/create (an )?account|sign ?up/i.test(await p.innerText('body')),`${r} shows no sign-up form`); }
// ---- 2. non-allowlisted email: login, reset, set-password all generic / inert ----
await p.goto(BASE+'/investor/login'); await p.waitForLoadState('networkidle'); await p.fill('input[name=email]',NOPE); await p.fill('input[name=password]','whatever-123456'); await p.click('button[type=submit]'); await p.waitForSelector('p[role=alert]');
const gen1=await p.locator('p[role=alert]').textContent(); await p.fill('input[name=email]','alex.demo@example.test'); await p.fill('input[name=password]','wrong-password-123'); await p.waitForTimeout(400); await p.click('button[type=submit]'); await p.waitForTimeout(800);
const gen2=await p.locator('p[role=alert]').textContent(); ck(gen1===gen2,`same message for unknown email and wrong password: "${gen1}"`);
await p.goto(BASE+'/investor/forgot-password'); await p.waitForLoadState('networkidle'); const before=db().prepare('select count(*) n from outbox').get().n;
await p.fill('input[name=email]',NOPE); await p.click('button:has-text("Send reset link")'); await p.waitForSelector('[role=status]'); const m1=await p.textContent('[role=status]');
ck(db().prepare('select count(*) n from outbox').get().n===before,'non-allowlisted forgot-password creates NO email/token'); await p.screenshot({path:OUT+'/g01-forgot-generic.png'});
await p.goto(BASE+'/investor/set-password?token=not-a-real-token'); ck((await p.textContent('body')).includes('invalid or has expired'),'bogus set-password token rejected'); await p.screenshot({path:OUT+'/g02-invalid-link.png'});
// ---- 3. operator invites ----
await p.goto(BASE+'/operator'); await p.fill('input[name=key]','operator-dev-key'); await p.click('button:has-text("Unlock")'); await p.waitForSelector('text=Access allowlist');
await p.fill('input[name=email]',EMAIL); await p.click('button:has-text("Invite")'); await p.waitForSelector('[role=status]');
const row=db().prepare('select status,invite_token_hash h,invite_expires_at x,token_purpose from authorized_emails where email=?').get(EMAIL);
ck(row.status==='INVITED'&&!!row.h,'allowlisted as INVITED with token HASH stored (not the token)'); const hrs=(new Date(row.x)-Date.now())/36e5; ck(hrs>47.9&&hrs<=48.01,`link expires in ~48h (${hrs.toFixed(2)}h)`);
await p.click('summary:has-text("pat.newclient")'); await p.screenshot({path:OUT+'/g03-operator-console-outbox.png',fullPage:true});
const link=db().prepare("select body from outbox where to_email=? order by id desc limit 1").get(EMAIL).body.match(/https?:\/\/\S+/)[0]; ck(!db().prepare('select 1 from authorized_emails where invite_token_hash=?').get(link.split('token=')[1]),'raw token is not stored in the DB');
// ---- 4. client sets OWN password ----
c=await b.newContext(D); p=await c.newPage(); await p.goto(link); await p.waitForSelector('input[name=password]'); await p.screenshot({path:OUT+'/g04-set-password.png'});
await p.fill('input[name=password]','short'); await p.fill('input[name=confirm]','short'); await p.evaluate(()=>document.querySelector('input[name=password]').removeAttribute('minlength')); await p.click('button:has-text("Set password")'); await p.waitForSelector('p[role=alert]'); ck((await p.locator('p[role=alert]').textContent()).includes('12 characters'),'weak password refused'); await p.waitForTimeout(700);
await p.fill('input[name=password]',PW); await p.fill('input[name=confirm]',PW); await p.click('button:has-text("Set password")'); await p.waitForURL('**/investor/onboarding'); ck(true,'after setting password -> forced to onboarding');
// token single-use
const c2=await b.newContext(D), p2=await c2.newPage(); await p2.goto(link); ck((await p2.textContent('body')).includes('invalid or has expired'),'invite link is single-use (reuse rejected)'); await c2.close();
// ---- 5. onboarding gate + validation ----
await p.goto(BASE+'/investor/investments'); ck(p.url().includes('/investor/onboarding'),'portal pages redirect to onboarding until the form is done');
await p.waitForLoadState('networkidle'); await p.click('button:has-text("Submit and continue")'); await p.waitForSelector('span[role=alert]'); await p.waitForTimeout(700); await p.screenshot({path:OUT+'/g05-onboarding-validation.png',fullPage:true});
await p.fill('input[name=full_name]','Pat Newclient'); await p.fill('input[name=phone]','+1 555 010 0303'); await p.fill('input[name=entity_name]','Maple Ridge Ventures, LLC');
await p.selectOption('select[name=entity_type]','Limited Liability Company'); await p.fill('input[name=holding_title]','Company Ownership'); await p.fill('input[name=tax_id]','96-5551234');
await p.fill('input[name=tax_address]','300 Sample Street'); await p.fill('input[name=tax_city]','Exampleton'); await p.selectOption('select[name=tax_state]','NJ'); await p.fill('input[name=tax_zip]','07000');
ck((await p.inputValue('input[name=k1_name]'))==='Maple Ridge Ventures, LLC','K-1 name pre-filled from entity name');
await p.screenshot({path:OUT+'/g06-onboarding-filled.png',fullPage:true}); await p.click('button:has-text("Submit and continue")'); await p.waitForURL('**/investor/investments');
// ---- 6. data landed where it should, encrypted ----
const e=db().prepare('select e.name,e.k1_name,e.tax_id_encrypted t,c.full_name,c.onboarding_completed_at ob from investing_entities e join clients c on c.id=e.client_id where c.email=?').get(EMAIL);
ck(e.full_name==='Pat Newclient'&&e.name==='Maple Ridge Ventures, LLC','profile + entity rows created from the form'); ck(e.t.startsWith('v1:')&&!e.t.includes('5551234'),'Tax ID stored encrypted (no plaintext in DB)');
ck(db().prepare('select status from authorized_emails where email=?').get(EMAIL).status==='ACTIVE','allowlist status -> ACTIVE after onboarding');
ck((await p.textContent('[data-testid=user-menu]')).includes('Pat Newclient'),'header shows the client\'s own name'); await p.screenshot({path:OUT+'/g07-dashboard-new-client.png'});
await p.goto(BASE+'/investor/settings/profile'); await p.waitForLoadState('networkidle'); const prof=await p.textContent('main'); ck(prof.includes('Pat Newclient')&&prof.includes('Maple Ridge Ventures, LLC')&&!prof.includes('Alex Demo'),'My Profile shows only their own data'); await p.screenshot({path:OUT+'/g08-profile-new-client.png',fullPage:true});
await p.goto(BASE+'/investor/settings/profile/entities/'+db().prepare('select id from investing_entities where name=?').get('Maple Ridge Ventures, LLC').id); await p.waitForLoadState('networkidle');
const ent=await p.textContent('main'); ck(ent.includes('…1234')&&!ent.includes('5551234')&&!ent.includes('96-555'),'entity page shows Tax ID masked to last 4 only'); await p.screenshot({path:OUT+'/g09-entity-masked-tin.png'});
ck((await p.textContent('body')).length>0 && !(await p.content()).includes('96-5551234'),'full Tax ID absent from the page HTML');
// ---- 7. documents stay off until operator creates a commitment ----
await p.goto(BASE+'/investor/documents/signatures'); await p.waitForLoadState('networkidle'); ck(await p.locator('[data-testid=pending-signatures-table] tbody tr').count()===1 && (await p.textContent('[data-testid=pending-signatures-table]')).includes('No documents are waiting'),'no documents generated before a commitment exists');
const oc=await b.newContext(D), op=await oc.newPage(); await op.goto(BASE+'/operator'); await op.fill('input[name=key]','operator-dev-key'); await op.click('button:has-text("Unlock")'); await op.waitForSelector('text=Access allowlist');
await op.selectOption('select[name=email]',EMAIL); await op.selectOption('select[name=offering]','86'); await op.fill('input[name=amount]','300,000'); await op.click('button:has-text("Create")'); await op.waitForSelector('[role=status]');
await p.goto(BASE+'/investor/documents/signatures'); await p.waitForLoadState('networkidle'); const pend=await p.textContent('[data-testid=pending-signatures-table]');
ck(pend.includes('Maple Ridge Ventures, LLC')&&pend.includes('Fund 30'),'after commitment: pending Booklet + W-9 packet for THEIR entity (Fund 30)'); await p.screenshot({path:OUT+'/g10-pending-after-commitment.png'});
const insts=db().prepare("select di.id from document_instances di join clients c on c.id=di.client_id where c.email=?").all(EMAIL).map(r=>r.id); ck(insts.length===2,'2 instances generated');
let allTxt=''; for(const id of insts){ const r=await p.request.get(BASE+'/investor/files/instances/'+id); ck(r.status()===200,'client can fetch their own PDF '+id); require('fs').writeFileSync('/tmp/g_'+id+'.pdf',await r.body()); allTxt+=execFileSync('pdftotext',['-layout','/tmp/g_'+id+'.pdf','-']).toString(); }
ck(allTxt.includes('Maple Ridge Ventures, LLC')&&allTxt.includes('965551234')&&allTxt.includes('300 Sample Street')&&allTxt.includes('$300,000'),'their PDFs carry THEIR entity, Tax ID, tax address, amount');
ck(!/Harbor View|Lakeside|98-7654321|97-1234567|Alex Demo|Sam Sample/.test(allTxt)&&!/\b(puza|tara|kevin)\b/i.test(allTxt),'no other client\'s data and no sample-investor identifiers in their PDFs');
// ---- 8. expiry + revoke ----
await op.goto(BASE+'/operator'); await op.fill('input[name=email]','expiry.test@example.test'); await op.click('button:has-text("Invite")'); await op.waitForSelector('[role=status]');
const l2=db().prepare("select body from outbox where to_email='expiry.test@example.test' order by id desc limit 1").get().body.match(/https?:\/\/\S+/)[0];
const w=db(); w.prepare("update authorized_emails set invite_expires_at=? where email='expiry.test@example.test'").run(new Date(Date.now()-1000).toISOString()); const c3=await b.newContext(D), p3=await c3.newPage(); await p3.goto(l2); ck((await p3.textContent('body')).includes('invalid or has expired'),'expired (>48h) link rejected');
await op.goto(BASE+'/operator'); await op.click(`tr:has-text("${EMAIL}") button:has-text("Revoke")`); await op.waitForLoadState('networkidle');
await p.goto(BASE+'/investor/investments'); ck(p.url().includes('/investor/login'),'revoked client\'s live session is killed immediately');
await p.fill('input[name=email]',EMAIL); await p.fill('input[name=password]',PW); await p.click('button[type=submit]'); await p.waitForSelector('[role=alert]'); ck(true,'revoked client cannot log in');
await op.goto(BASE+'/operator'); await op.fill('input[name=email]',EMAIL); await op.click('button:has-text("Invite")'); await op.waitForSelector('[role=status]'); await op.screenshot({path:OUT+'/g11-operator-after-revoke-reinvite.png',fullPage:true});
console.log(fails?`\n${fails} FAILURE(S)`:'\nALL ACCESS-MODEL ACCEPTANCE CHECKS PASSED'); await b.close(); process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2)});
