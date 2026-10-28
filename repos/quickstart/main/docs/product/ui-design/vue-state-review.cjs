const { chromium } = require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const out=path.resolve('docs/archive/evidence/m66/vue/05-review');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[],outside=[],views=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(new URL(r.url()).hostname!=='192.168.98.2')outside.push(r.url());});
 const sizes=[['desktop',1440,900],['tablet',1024,768],['mobile',390,844]];
 async function open(url){await page.goto('http://192.168.98.2:5180/'+url,{waitUntil:'networkidle'});await page.locator('.feature-card').first().waitFor();}
 async function noOverflow(label){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${label}: page overflow`);}
 async function transportErrors(){const logs=await page.evaluate(()=>window.__quickstartDesign.requests);const unknown=logs.filter(r=>r.status===501);assert.deepEqual(unknown,[]);return logs;}
 try{
  for(const layout of ['baseline','below-network','above-network'])for(const [viewport,width,height] of sizes)for(const theme of ['light','dark'])for(const lang of ['zh-cn','en']){
   await page.setViewportSize({width,height});await open(`?layout=${layout}&theme=${theme}&lang=${lang}&tools=0`);
   await page.waitForTimeout(1000);await noOverflow(`${layout}/${viewport}/${theme}/${lang}`);
   if(layout!=='baseline')assert.equal(await page.locator('[data-summary-device]').count(),width===390?3:6);
   await transportErrors();views.push({kind:'layout',layout,viewport,theme,lang});
   if(theme==='light'&&lang==='zh-cn')await page.screenshot({path:path.join(out,`${layout}-${viewport}.png`),fullPage:true});
   if(layout==='below-network'&&viewport==='mobile'&&theme==='dark'&&lang==='en')await page.screenshot({path:path.join(out,'summary-mobile-en-dark.png'),fullPage:true});
   if(views.length%12===0)console.log(`Reviewed ${views.length} layout combinations`);
  }
  for(const scenario of ['normal','many','empty','loading','error','stale','old','permission','no-speed','disabled','speed-error','unsupported'])for(const [viewport,width,height] of sizes){
   const lang=viewport==='tablet'?'en':'zh-cn',theme=viewport==='desktop'?'light':'dark';
   await page.setViewportSize({width,height});await open(`?layout=below-network&scenario=${scenario}&theme=${theme}&lang=${lang}&tools=0`);
   await noOverflow(`${scenario}/${viewport}`);
   const count=await page.locator('[data-summary-device]').count();
   assert.equal(count,['empty','loading','error','old','permission'].includes(scenario)?0:width===390?3:6);
   const text=await page.locator('.home-device-summary').innerText();
   if(scenario==='stale')assert.match(text,/2 分钟|2 minutes/);
   if(scenario==='old')assert.match(text,/兼容版本|compatible/);
   if(scenario==='permission')assert.match(text,/权限|access denied/);
   if(scenario==='many')assert.match(text,/128/);
   if(['no-speed','disabled','speed-error','unsupported'].includes(scenario)){
     const before=(await transportErrors()).filter(r=>r.path==='/lanctrl/v2/device-traffic/').length;
     await page.locator('.summary-footer button').first().click();assert.match(await page.locator('.summary-rate').first().innerText(),/暂不可用|unavailable/);
     const after=(await transportErrors()).filter(r=>r.path==='/lanctrl/v2/device-traffic/').length;assert.equal(after,before);
   }
   await transportErrors();views.push({kind:'scenario',scenario,viewport,theme,lang,count});
   if(viewport==='mobile'&&['error','old','stale','no-speed'].includes(scenario))await page.screenshot({path:path.join(out,`${scenario}-mobile.png`),fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  await open('?layout=below-network&scenario=error');await page.locator('.home-device-summary .page-state button').click();await page.locator('[data-summary-device]').first().waitFor();checks.push('retry recovery');
  await page.getByLabel('场景',{exact:true}).selectOption('stale');await page.locator('.summary-notice').waitFor();checks.push('stale cached data after failed request');
  await page.getByLabel('场景',{exact:true}).selectOption('normal');await page.locator('.summary-more').click();await page.locator('.device-center').waitFor();
  const last=page.locator('.device-card').last();await last.click();await page.locator('.device-drawer').waitFor();assert.match(await page.locator('.drawer-summary').innerText(),/尚未上线/);checks.push('never-seen identity');
  await page.getByRole('button',{name:'使用管理',exact:true}).click();await page.locator('.usage-policy').waitFor();await noOverflow('mobile detail');await transportErrors();
  await page.screenshot({path:path.join(out,'detail-mobile.png'),fullPage:true});
  await page.locator('.drawer-close').click();await page.getByRole('tab',{name:'分组与计划',exact:false}).click();await page.locator('.group-panel').waitFor();await transportErrors();
  await page.getByRole('tab',{name:'局域网设置',exact:false}).click();await page.locator('.lan-settings').waitFor();await page.waitForTimeout(200);await transportErrors();checks.push('groups and LAN settings');
  // Faster timer clock through the browser's supported clock harness; transport remains local.
  await open('?layout=below-network&tools=0');
  await page.clock.install();
  const initial=await transportErrors();const inventories=()=>page.evaluate(()=>window.__quickstartDesign.requests.filter(r=>r.path==='/lanctrl/v2/devices/').length);
  const before=await inventories();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.fastForward(65000);assert.equal(await inventories(),before);checks.push('hidden summary sampling paused');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(1);
  await page.locator('.summary-more').click();await page.locator('.device-center').waitFor();
  const afterLeave=await inventories();await page.clock.fastForward(65000);assert.equal(await inventories(),afterLeave);checks.push('unmounted summary sampling stopped');
  assert.ok((await transportErrors()).length<=120);assert.equal(errors.length,0);assert.equal(outside.length,0);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),views,checks,errors,outside,result:'pass'},null,2)+'\n');
  console.log(`State review passed: ${views.length} combinations; ${checks.length} interactions/resource checks`);
 }catch(error){fs.writeFileSync(path.join(out,`failure-${process.argv[2]||'retry1'}.json`),JSON.stringify({url:page.url(),error:String(error),body:(await page.locator('body').innerText()).slice(0,2500),views,errors,outside},null,2)+'\n');throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
