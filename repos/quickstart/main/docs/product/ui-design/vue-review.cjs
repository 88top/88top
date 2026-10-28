// Reusable staged review; all browser data must come from the design fixtures.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const stage = process.argv[2] || '01-preview';
const out = path.resolve(`docs/archive/evidence/m66/vue/${stage}`);
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[],failed=[],outside=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 page.on('request',r=>{if(new URL(r.url()).hostname!=='192.168.98.2')outside.push(r.url());});
 try{
   await page.goto('http://192.168.98.2:5180/?tools=0',{waitUntil:'networkidle'});
   await page.waitForTimeout(1800);
   const layoutChecks=[];
   const navigationChecks=[];
   if(stage==='04-navigation') {
     await page.goto('http://192.168.98.2:5180/?layout=below-network',{waitUntil:'networkidle'});
     const id=await page.locator('[data-summary-device]').first().getAttribute('data-summary-device');
     await page.locator('[data-summary-device]').first().click();
     await page.locator('.device-drawer').waitFor();
     assert.equal(new URL(page.url()).searchParams.get('device'),id);
     await page.getByRole('button',{name:'网络与上网',exact:true}).click();
     await page.locator('.policy-panel select').waitFor();
     assert.equal(await page.locator('.policy-panel select').isDisabled(),true);
     await page.screenshot({path:path.join(out,'external-route.png'),fullPage:true});
     await page.getByRole('button',{name:'设备资料',exact:true}).click();
     await page.locator('.profile-editor input').first().fill('设计测试电脑');
     await page.getByRole('button',{name:'保存设备资料',exact:true}).click();
     await page.getByText('设备资料已更新',{exact:true}).waitFor();
     await page.locator('.drawer-close').click();
     await page.locator('.breadcrumbs a').click();
     await page.locator('[data-summary-device]').first().waitFor();
     assert.match(await page.locator('[data-summary-device]').first().innerText(),/设计测试电脑/);
     await page.locator('.summary-more').click();
     await page.locator('.device-center').waitFor();
     assert.equal(await page.locator('.device-filters button:nth-child(2)').evaluate(el=>el.classList.contains('active')),true);
     await page.goBack();await page.locator('[data-summary-device]').first().waitFor();
     await page.goto(`http://192.168.98.2:5180/devicemanagement?layout=below-network&authority=local&device=${encodeURIComponent(id)}&filter=all`,{waitUntil:'networkidle'});
     await page.locator('.device-drawer').waitFor();
     await page.getByRole('button',{name:'网络与上网',exact:true}).click();
     await page.locator('.policy-panel select').waitFor();assert.equal(await page.locator('.policy-panel select').isDisabled(),false);
     await page.locator('.policy-panel select').selectOption('bypass');
     await page.getByRole('button',{name:'预览地址与上网路线',exact:true}).click();
     await page.locator('.policy-plan').waitFor();
     await page.getByRole('button',{name:'确认应用',exact:true}).click();
     await page.getByText('配置已保存，等待设备重新获取地址',{exact:true}).waitFor();
     await page.screenshot({path:path.join(out,'local-route-preview.png'),fullPage:true});
     await page.reload();await page.locator('.device-drawer').waitFor();
     await page.goto('http://192.168.98.2:5180/devicemanagement?device=missing-device&filter=all',{waitUntil:'networkidle'});
     await page.locator('.design-missing').waitFor();assert.equal(await page.locator('.device-drawer').count(),0);
     navigationChecks.push('same deviceId','real drawer','profile memory mutation','return to home','view all filter','browser back','local/external authority','network plan/apply in memory','refresh deep link','missing identity');
   }
   if(stage==='03-summary') {
     for(const [name,width,height] of [['desktop',1440,900],['tablet',1024,768],['mobile',390,844]]) {
       await page.setViewportSize({width,height});
       for(const layout of ['baseline','below-network','above-network']) {
         await page.goto(`http://192.168.98.2:5180/?layout=${layout}&tools=0`,{waitUntil:'networkidle'});
         const count=await page.locator('[data-summary-device]').count();
         assert.equal(count,layout==='baseline'?0:width===390?3:6);
         if(layout!=='baseline')assert.match(await page.locator('[data-summary-count]').innerText(),/在线 6.*本次开机发现 8/);
         assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${layout}/${name} overflow`);
         await page.screenshot({path:path.join(out,`${layout}-${name}.png`),fullPage:true});
         layoutChecks.push({layout,viewport:name,count});
       }
     }
     await page.goto('http://192.168.98.2:5180/?layout=below-network&scenario=many&tools=0',{waitUntil:'networkidle'});
     assert.equal(await page.locator('[data-summary-device]').count(),3);
     assert.match(await page.locator('[data-summary-count]').innerText(),/在线 96.*本次开机发现 128/);
   }
   await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
   const body=await page.locator('body').innerText();
   if(stage!=='04-navigation'){assert.match(body,/局域网设备管理/);assert.match(body,/磁盘信息/);assert.match(body,/系统信息/);}
   assert.equal(outside.length,0);
   const probe=await page.evaluate(async()=>{
     const missing=await fetch('/cgi-bin/luci/istore/not-a-fixture/');
     const blocked=await fetch('/cgi-bin/luci/istore/system/reboot/',{method:'POST'});
     return {missing:missing.status,blocked:blocked.status};
   });
   assert.equal(probe.missing,501);assert.equal(probe.blocked,403);
   assert.equal(errors.length,0);assert.equal(failed.length,0);
   fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),stage,probe,layoutChecks,navigationChecks,errors,failed,outside,result:'pass'},null,2)+'\n');
   console.log(`${stage}: passed; real Vue home, fixture isolation, zero browser errors`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
