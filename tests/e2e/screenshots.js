// usage: node shots.js <outDir> <jobs.json>   jobs: [{name,path,device:"d"|"m",full:bool,clip?,actions?}]
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = 'http://localhost:3000', OUT = process.argv[2], jobs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const who = process.env.WHO || 'alex.demo@example.test';
const DEV = { d: { viewport: { width: 1440, height: 900 } }, m: { viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
(async () => {
  const b = await chromium.launch(); const ctx = {}, pages = {};
  for (const j of jobs) {
    const k = j.device || 'd';
    if (!ctx[k]) {
      ctx[k] = await b.newContext(DEV[k]); pages[k] = await ctx[k].newPage();
      await pages[k].goto(BASE + '/investor/login'); await pages[k].waitForLoadState('networkidle');
      await pages[k].fill('input[name=email]', who); await pages[k].fill('input[name=password]', 'Demo-Passw0rd!Change');
      await pages[k].click('button[type=submit]'); await pages[k].waitForURL('**/investor/investments');
    }
    const p = pages[k];
    await p.goto(BASE + j.path); await p.waitForLoadState('networkidle');
    if (j.theme) await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), j.theme);
    for (const a of j.actions || []) { if (a.click) await p.click(a.click); if (a.wait) await p.waitForTimeout(a.wait); if (a.fill) await p.fill(a.fill[0], a.fill[1]); if (a.select) await p.selectOption(a.select[0], a.select[1]); }
    await p.screenshot({ path: `${OUT}/${j.name}.png`, fullPage: !!j.full, ...(j.clip ? { clip: j.clip } : {}) });
    console.log('ok', j.name, '|', await p.title());
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
