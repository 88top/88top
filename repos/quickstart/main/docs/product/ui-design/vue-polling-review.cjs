// Regression feedback loop for real homepage timer ownership; no simulated clock.
const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const out=path.resolve('docs/archive/evidence/m66/vue/05-review');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({args:['--no-sandbox']});const page=await browser.newPage();
 try{
  await page.goto('http://192.168.98.2:5180/?layout=below-network',{waitUntil:'networkidle'});
  const count=()=>page.evaluate(()=>window.__quickstartDesign.requests.filter(r=>r.path==='/network/port/list/').length);
  for(let i=0;i<3;i++){
    await page.locator('.summary-more').click();await page.locator('.device-center').waitFor();
    if(i<2){await page.locator('.breadcrumbs a').click();await page.locator('.summary-more').waitFor();}
  }
  const leaving=await count();await page.waitForTimeout(11000);const after=await count();
  const result={checkedAt:new Date().toISOString(),method:'Real 11-second wait after three home visits',leaving,after,noPollingAfterUnmount:after===leaving,result:after===leaving?'pass':'fail'};
  fs.writeFileSync(path.join(out,'polling-after-fix.json'),JSON.stringify(result,null,2)+'\n');assert.equal(after,leaving);console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
