const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),capture=require('./ordered-capture.cjs');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/slot-edit/24-review/manual-current');fs.mkdirSync(root,{recursive:true});
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),cases=[];try{
 for(const [width,theme,lang,mode]of [[1440,'light','zh-cn','half'],[1440,'dark','zh-cn','half'],[320,'light','zh-cn','half'],[1024,'light','en','half'],[1440,'light','zh-cn','overview'],[1440,'dark','zh-cn','finish']]){
  await page.setViewportSize({width,height:900});await page.goto(`http://192.168.9.19:5180/?layout=ordered&preset=half&theme=${theme}&lang=${lang}`,{waitUntil:'networkidle'});await page.locator('[data-layout-card=traffic] canvas').first().waitFor();
  if(mode==='overview'){await page.locator('.lab-edit-button').click();await page.locator('[data-overview]').click()}else if(mode==='finish'){await page.locator('.lab-edit-button').click();await page.locator('[data-hide-module=system]').click();await page.locator('[data-apply]').click();await page.locator('[data-confirm-finish]').waitFor()}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);const file=`${mode}-${width}-${theme}-${lang}.png`;await capture(page,{path:path.join(root,file)});cases.push({width,theme,lang,mode,file});
 }
 fs.writeFileSync(path.join(root,'capture.json'),JSON.stringify({checkedAt:new Date().toISOString(),cases},null,2)+'\n');console.log('Captured 6 current visual review cases');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
