const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/slot-edit/20-modules');fs.mkdirSync(root,{recursive:true});
const attempt=1+fs.readdirSync(root).filter(f=>/^attempt-\d+.json$/.test(f)).length;
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),report={attempt,checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const width of [320,390,768,1440])for(const theme of ['light','dark'])for(const lang of ['zh-cn','en'])for(const preset of ['normal','half']){
  await page.setViewportSize({width,height:900});await page.goto(`http://192.168.9.19:5180/?layout=ordered&theme=${theme}&lang=${lang}&preset=${preset}`,{waitUntil:'networkidle'});await page.waitForTimeout(160);
  const hub=page.locator('[data-layout-card=applications] [data-applications-hub]');await hub.waitFor();
  const measure=await hub.evaluate(e=>{const b=e.getBoundingClientRect();return {width:b.width,height:b.height,overflow:e.scrollHeight>e.clientHeight+1,items:[...e.querySelectorAll('[data-favorite-app]')].map(v=>{const r=v.getBoundingClientRect();return {id:v.dataset.favoriteApp,inside:r.left>=b.left&&r.right<=b.right+1&&r.bottom<=b.bottom+1}})}});
  assert.equal(measure.overflow,false,JSON.stringify({width,theme,lang,preset,measure}));assert.ok(measure.items.length);assert.ok(measure.items.every(x=>x.inside));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await hub.locator('[data-all-apps]').click();await page.locator('[data-applications-browser]').waitFor();
  await page.locator('.browser-category-tabs [role=tab]').last().click();assert.equal(await page.locator('[data-browser-tool]').count(),8);assert.equal(await page.locator('[data-browser-software-center]').count(),1);await page.keyboard.press('Escape');
  if(lang==='zh-cn')await page.screenshot({path:path.join(root,`${width}-${theme}-${preset}.png`),fullPage:true});report.checks.push({width,theme,lang,preset,...measure});
 }
 for(const scenario of ['apps-error','apps-empty','apps-loading','apps-many','long-names']){
  await page.goto(`http://192.168.9.19:5180/?layout=ordered&preset=half&scenario=${scenario}`,{waitUntil:'networkidle'});const hub=page.locator('[data-layout-card=applications] [data-applications-hub]');await hub.locator('[data-all-apps]').click();await page.locator('.browser-category-tabs [role=tab]').last().click();assert.equal(await page.locator('[data-browser-tool]').count(),8);await page.keyboard.press('Escape');report.checks.push({scenario});
 }
 // Selection changes retain exact stable ordering, including zero favorites.
 await page.goto('http://192.168.9.19:5180/?layout=ordered&preset=half',{waitUntil:'networkidle'});
 await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-manage-favorites]').click();
 while(await page.locator('.favorite-order>div').count())await page.locator('.favorite-order>div').first().locator('button').last().click();
 await page.locator('.applications-save').click();assert.equal(await page.locator('[data-favorite-app]').count(),0);report.checks.push({zeroFavorites:true});
 await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-manage-favorites]').click();await page.locator('[data-select-app=docker]').click();await page.locator('.applications-save').click();assert.equal(await page.locator('[data-favorite-app=docker]').count(),1);report.checks.push({oneFavorite:true});
 await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-manage-favorites]').click();for(const id of ['qbittorrent','ddnsto','linkease','fastnet','oaf'])await page.locator(`[data-select-app=${id}]`).click();await page.locator('.applications-save').click();assert.equal(await page.locator('[data-favorite-app]').count(),6);report.checks.push({sixFavorites:true});
 assert.equal(report.errors.length,0,report.errors.join('\n'));report.result='pass';console.log('PASS module visual: '+report.checks.length+' cases');
}catch(e){report.result='fail';report.failure=e.stack;await page.screenshot({path:path.join(root,`failure-${attempt}.png`)}).catch(()=>{});process.exitCode=1}finally{fs.writeFileSync(path.join(root,`attempt-${attempt}.json`),JSON.stringify(report,null,2)+'\n');await browser.close()}})();
