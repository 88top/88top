// M66.8 public-entry comparison; all variants share synthetic inventory and modules.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base='http://192.168.9.19:5180',root=path.resolve('docs/archive/evidence/m66/row-layout/08-visual-options');fs.mkdirSync(root,{recursive:true});
const report={checkedAt:new Date().toISOString(),base,layouts:[],errors:[],outside:[],visualStatus:'requires_product_selection'};
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});page.on('request',r=>{if(new URL(r.url()).origin!==base)report.outside.push(r.url())});
 async function visit(variant,theme,language='zh-cn'){await page.goto(`${base}/?variant=${variant}&theme=${theme}&lang=${language}`,{waitUntil:'networkidle'});await page.locator('[data-layout-card=traffic] canvas').first().waitFor()}
 try{
  let host;
  for(const [viewport,width,height] of [['desktop',1440,1000],['tablet',1024,768],['phone',390,844]])for(const variant of ['rows','grid','free'])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height});await visit(variant,theme);
   const html=await page.locator('[data-system-menu-reserve]').evaluate(e=>e.outerHTML);host??=html;assert.equal(html,host);
   const stats=await page.locator('[data-layout-card]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.layoutCard,x:r.left,right:r.right,w:r.width,h:r.height,scroll:e.scrollHeight,client:e.clientHeight}}));
   assert.equal(stats.length,7);assert.deepEqual(stats.map(v=>v.id).sort(),['traffic','connection','applications','devices','system','storage','sharing'].sort());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${variant}/${viewport}/${theme} page overflow`);
   const left=await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left);
   for(const card of stats){assert.ok(card.x>=left-.5&&card.right<=width+.5,`${variant}/${viewport}/${card.id} crosses host`);assert.ok(card.scroll<=card.client+2,`${variant}/${viewport}/${card.id} content overflows ${card.scroll}/${card.client}`)}
   if(variant==='rows'&&width===1440){for(const id of ['network','devices','storage']){const cards=await page.locator(`[data-preview-row^=${id}] [data-layout-card]`).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));assert.equal(cards.length,2);assert.ok(Math.abs(cards[0]-cards[1])<=1)}}
   const graphic=await page.locator('[data-layout-card=traffic] canvas').first().evaluate(c=>{const r=c.getBoundingClientRect(),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let cyan=0;for(let y=1;y<20;y++)for(let x=1;x<20;x++){const i=(Math.floor(c.height*y/20)*c.width+Math.floor(c.width*x/20))*4,[red,g,b]=data.slice(i,i+3);if(g>90&&b>120&&b>red+40&&red<150)cyan++}return {width:r.width,height:r.height,cyan}});assert.ok(graphic.width>200&&graphic.height>115&&graphic.cyan>10);
   const palette=await page.locator('[data-layout-design]').evaluate(e=>({ink:getComputedStyle(e).getPropertyValue('--c-text').trim(),panel:getComputedStyle(e).getPropertyValue('--c-panel').trim()}));assert.equal(palette.ink,theme==='dark'?'#edf0f7':'#1c253b');
   assert.match(await page.locator('[data-layout-card=devices]').innerText(),/8 台/);
   await page.screenshot({path:path.join(root,`${variant}-${viewport}-${theme}.png`),fullPage:true});await page.screenshot({path:path.join(root,`${variant}-${viewport}-${theme}-viewport.png`)});report.layouts.push({variant,viewport,theme,stats,graphic,palette});
  }
  await page.setViewportSize({width:320,height:740});for(const variant of ['rows','grid','free']){await visit(variant,'dark','en');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${variant}/320 English overflow`);await page.screenshot({path:path.join(root,`${variant}-small-english.png`),fullPage:true})}
  assert.equal(report.errors.length,0);assert.equal(report.outside.length,0);report.result='pass';console.log(`PASS: ${report.layouts.length} layouts + 3 English narrow layouts`);
 }catch(e){report.result='fail';report.failure=e.stack;throw e}finally{fs.writeFileSync(path.join(root,'visual-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
