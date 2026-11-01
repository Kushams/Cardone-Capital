const { chromium } = require('playwright'); const fs=require('fs');
const BASE='http://localhost:3000'; const map=JSON.parse(fs.readFileSync('/home/user/Cardone-Capital/images/image-map.json','utf8')).images;
let fails=0; const ck=(ok,m)=>{ if(!ok){fails++;console.log('  FAIL',m);} };
(async()=>{const b=await chromium.launch(); const lg=await b.newContext({viewport:{width:1440,height:900}}); const lp=await lg.newPage();
await lp.goto(BASE+'/investor/login'); await lp.waitForLoadState('networkidle');
let loaded=await lp.$$eval('img',i=>i.map(x=>({s:x.getAttribute('src'),w:x.naturalWidth}))); ck(loaded.length===1&&loaded[0].s.endsWith('cardone-capital-logo.png')&&loaded[0].w===800,'login logo = real PNG (800px)'); console.log('login logo:',JSON.stringify(loaded));
const c=await b.newContext({viewport:{width:1440,height:900}}); const p=await c.newPage();
await p.goto(BASE+'/investor/login'); await p.waitForLoadState('networkidle'); await p.fill('input[name=email]','alex.demo@example.test'); await p.fill('input[name=password]','Demo-Passw0rd!Change'); await p.click('button[type=submit]'); await p.waitForURL('**/investments'); await p.waitForLoadState('networkidle');
// header logo
const hl=await p.$$eval('header img',i=>i.map(x=>x.getAttribute('src'))); ck(hl.some(s=>s.endsWith('cardone-capital-logo.png')),'header/sidebar-area logo = real PNG'); console.log('shell logo:',hl);
// dashboard cards in order
await p.evaluate(async()=>{for(const i of document.querySelectorAll('img')) i.loading='eager'; window.scrollTo(0,document.body.scrollHeight);}); await p.waitForTimeout(2500);
const dash=await p.$$eval('[data-testid=recent-grid] article',a=>a.map(x=>({name:x.querySelector('h3').innerText.trim(),src:x.querySelector('img').getAttribute('src'),w:x.querySelector('img').naturalWidth,fit:getComputedStyle(x.querySelector('img')).objectFit})));
const exp=map.filter(e=>e.file.startsWith('dashboard-recent-offerings/')).sort((a,z)=>a.file.localeCompare(z.file));
ck(dash.length===24,'24 dashboard cards'); dash.forEach((d,i)=>{ ck(d.src==='/images/'+exp[i].file,`dashboard #${i+1} ${d.name}: ${d.src} expected ${exp[i].file}`); ck(d.name===exp[i].offering,`dashboard #${i+1} name ${d.name} vs ${exp[i].offering}`); ck(d.w===300,`dashboard #${i+1} loaded (w=${d.w})`); ck(d.fit==='cover',`#${i+1} object-fit cover`); });
console.log('dashboard cards verified:',dash.length);
// new offerings
await p.goto(BASE+'/investor/opportunities'); await p.waitForLoadState('networkidle');
const no=await p.$$eval('article',a=>a.map(x=>({name:x.querySelector('h2').innerText.trim(),src:x.querySelector('img').getAttribute('src'),w:x.querySelector('img').naturalWidth})));
const expN=map.filter(e=>e.file.startsWith('new-offerings/')&&e.file.includes('-card'));
ck(no.length===4,'4 new-offering cards'); for(const e of expN){const n=no.find(x=>x.name===e.offering); ck(n&&n.src==='/images/'+e.file&&n.w===300,`new offering ${e.offering} -> ${e.file}`);} console.log('new-offering cards:',no.map(n=>n.name.slice(-12)+' '+n.src.split('/').pop()).join(' | '));
// heroes
for(const [id,slug] of [[81,'fund-29'],[86,'fund-30'],[87,'fund-31'],[88,'fund-32']]){ await p.goto(BASE+'/investor/opportunities/'+id); await p.waitForLoadState('networkidle'); const h=await p.$$eval('main img',i=>i.map(x=>({s:x.getAttribute('src'),w:x.naturalWidth,fit:getComputedStyle(x).objectFit}))); const card=map.find(e=>e.file.startsWith('new-offerings/'+slug+'-card')); ck(h.length===1&&h[0].s==='/images/'+card.file&&h[0].w>0&&h[0].fit==='cover',`hero /opportunities/${id} uses ${card.file} (cover)`); console.log('hero',id,JSON.stringify(h)); }
// recent thumbs
const thumbs=map.filter(e=>e.file.startsWith('recent-offerings/')); const routes=[...new Set(thumbs.map(e=>e.route))]; let n=0;
for(const r of routes){ await p.goto(BASE+'/investor'+r); await p.waitForLoadState('networkidle'); await p.evaluate(()=>{for(const i of document.querySelectorAll('img')) i.loading='eager'}); await p.waitForTimeout(400);
  const got=await p.$$eval('article',a=>a.map(x=>({name:x.querySelector('h5').innerText.trim(),src:x.querySelector('img').getAttribute('src'),w:x.querySelector('img').naturalWidth,fit:getComputedStyle(x.querySelector('img')).objectFit})));
  for(const e of thumbs.filter(t=>t.route===r)){ const g=got.find(x=>x.name===e.property); ck(g&&g.src==='/images/'+e.file&&g.w===300&&g.fit==='cover',`${r} ${e.property} -> ${e.file}`); n++; } }
console.log('property thumbnails verified:',n,'on',routes.length,'pages');
ck((await p.goto(BASE+'/investor/recent_offerings/88')).status()===200,'fund 32 recent page still H1-only'); console.log('f32 imgs:',await p.$$eval('main img',i=>i.length));
// gallery
await p.goto(BASE+'/investor/recent_offerings/53'); const gl=await p.$eval('a[aria-label^="Photo of The Edison"]',a=>a.getAttribute('href')); await p.goto(BASE+gl); await p.waitForLoadState('networkidle');
const g0=await p.$$eval('[role=dialog] img',i=>i.map(x=>x.getAttribute('src'))); const dots=await p.$$eval('[role=tab]',d=>d.length); ck(g0[0]==='/images/recent-offerings/fund-22/the-edison-thumb.jpg'&&dots===5,'gallery slide 1 = thumbnail, 5 dots for 5 photos'); console.log('gallery first:',g0[0],'dots',dots);
await p.click('button[aria-label=Next]'); const g1=await p.$$eval('[role=dialog] svg[role=img]',s=>s.length); ck(g1===1,'slide 2 = placeholder until top-up'); 
console.log(fails?`\n${fails} FAILURE(S)`:'\nALL IMAGE PLACEMENTS VERIFIED IN THE BROWSER'); await b.close(); process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2)});
