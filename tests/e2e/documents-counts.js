const { chromium } = require('playwright'); const BASE='http://localhost:3000';
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto(BASE+'/investor/login');await p.waitForLoadState('networkidle');
await p.fill('input[name=email]','alex.demo@example.test');await p.fill('input[name=password]','Demo-Passw0rd!Change');await p.click('button[type=submit]');await p.waitForURL('**/investments');
await p.goto(BASE+'/investor/documents');await p.waitForLoadState('networkidle');await p.click('[role=tab]:has-text("All")');await p.waitForTimeout(300);
console.log('All rows:',await p.locator('[data-testid=all-docs] tbody tr').count(),'| dots:',await p.locator('[data-testid=all-docs] tbody span.bg-brand').count());
console.log('first row:',(await p.locator('[data-testid=all-docs] tbody tr').first().innerText()).replace(/\s+/g,' '));
await p.selectOption('select[aria-label=Year]','2025');await p.waitForTimeout(200);console.log('Year=2025 rows:',await p.locator('[data-testid=all-docs] tbody tr').count());
await p.selectOption('select[aria-label=Year]','All');
await p.click('[role=tab]:has-text("Investment")');await p.waitForTimeout(300);
console.log('Investment tab cards:',await p.locator('h2:has-text("Cardone Equity Fund")').allInnerTexts(),'| preview rows each:',await p.locator('main table').evaluateAll(ts=>ts.map(t=>t.querySelectorAll('tbody tr').length)));
for(const id of [81,86,87,88]){await p.goto(BASE+'/investor/documents/investments/'+id);await p.waitForLoadState('networkidle');console.log('fund',id,'rows:',await p.locator('[data-testid=fund-docs] tbody tr').count(),'| filters:',await p.locator('select').count());}
await p.goto(BASE+'/investor/documents/signatures');await p.waitForLoadState('networkidle');console.log('pending rows:',await p.locator('[data-testid=pending-signatures-table] tbody tr').count());
await b.close();})();
