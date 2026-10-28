const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');
const out=process.env.QS_INSTALLED_EVIDENCE,base='http://192.168.30.244',home=base+'/cgi-bin/luci/admin/quickstart/';
fs.mkdirSync(out,{recursive:true});const report={checks:[],requests:[],errors:[],consoleErrors:[],result:'running'};let browser;
(async()=>{try{
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},locale:process.env.QS_ACCEPT_LANGUAGE==='en'?'en-US':'zh-CN'});await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
 const response=await context.request.get(base+'/cgi-bin/luci/admin/store/installed');assert.equal(response.status(),200);const installed=await response.json();assert.ok(Array.isArray(installed),'Software-center installed response must be an array');
 report.softwareCenter=installed.map(a=>({name:a.name,title:a.title,entry:a.entry,keys:Object.keys(a)}));assert.ok(installed.length,'This device is expected to have installed software-center applications');
 if(process.env.QS_INSTALLED_BASELINE==='1'){const old=await context.request.get(base+'/cgi-bin/luci/istore/app/v1/catalog/');const body=await old.json();report.previousCatalog={status:old.status(),success:body.success,error:body.error,count:Array.isArray(body.result)?body.result.length:null}}
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({text:m.text(),url:m.location().url})});page.on('request',r=>{const u=new URL(r.url());if(u.origin===base&&(/\/app\//.test(u.pathname)||u.pathname.startsWith('/cgi-bin/luci/admin/store/')))report.requests.push({method:r.method(),path:u.pathname})});
 const openApps=async()=>{await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-category=apps]').click()};
 const waitInstalled=async()=>{await page.waitForFunction(count=>document.querySelectorAll('[data-open-app]').length===count,installed.length)};
 await page.goto(home,{waitUntil:'networkidle'});await openApps();if(process.env.QS_INSTALLED_BASELINE==='1')await page.waitForTimeout(500);else await waitInstalled();
 report.language=await page.evaluate(()=>window.vue_lang);
 report.resourceURLs=await page.locator('link[rel=stylesheet]').evaluateAll(nodes=>nodes.map(n=>n.href));if(process.env.QS_EXPECT_ASSET_VERSION)assert.ok(report.resourceURLs.some(url=>new URL(url).pathname==='/luci-static/quickstart/style.css'&&new URL(url).searchParams.get('v')===process.env.QS_EXPECT_ASSET_VERSION),'LuCI must serve the frozen candidate cache key');
 report.tiles=await page.locator('[data-open-app]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.openApp,text:n.innerText,availability:n.dataset.availability})));report.message=await page.locator('[data-applications-browser]').innerText();await page.screenshot({path:path.join(out,'installed-apps-desktop.png')});
 assert.deepEqual(report.tiles.map(a=>a.id).sort(),installed.map(a=>a.name).sort(),'Homepage installed applications must match the read-only software-center list');
 for(const app of installed){const tile=report.tiles.find(t=>t.id===app.name);assert.ok(tile.text.includes(app.title)||tile.text.includes(app.title_en||app.name));assert.equal(tile.availability,app.entry?'available':'no-entry')}
 assert.ok(!/没有已安装|No additional apps installed/.test(report.message));assert.ok(report.requests.some(r=>r.path==='/cgi-bin/luci/admin/store/installed'&&r.method==='GET'),'Homepage must consume the software-center read-only list');
 assert.equal(report.requests.filter(r=>r.path==='/cgi-bin/luci/admin/store/installed').length,1,'Installed catalogue must not poll or read twice');
 await page.keyboard.press('Escape');await openApps();await page.keyboard.press('Escape');await openApps();assert.equal(report.requests.filter(r=>r.path==='/cgi-bin/luci/admin/store/installed').length,1,'Reopening the library must reuse its owner');
 assert.equal(report.requests.filter(r=>r.path==='/cgi-bin/luci/istore/app/v1/catalog/').length,0,'No legacy temporary-directory catalogue reads');
 assert.ok(report.requests.every(r=>!r.path.startsWith('/cgi-bin/luci/admin/store/')||r.method==='GET'&&r.path==='/cgi-bin/luci/admin/store/installed'),'Directory reads must not execute software-center actions');
 assert.equal(report.consoleErrors.length,0,'Normal installed-app view has no console errors');
 await page.setViewportSize({width:390,height:900});await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'installed-apps-mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.keyboard.press('Escape');assert.equal(await page.locator('body[lock-scroll]').count(),0);report.checks.push('Real software-center installed IDs match the launcher; one GET, no software actions; mobile and scroll restoration pass');
 // A root-relative app entry must leave the Quickstart SPA. Intercept only the
 // navigation destination, so this verifies routing without running app actions.
 const rootApp=installed.find(a=>a.entry==='/apps/');assert.ok(rootApp,'B provides a root-relative /apps/ app entry');
 let navigated=false;await page.route(base+'/apps/',async route=>{navigated=route.request().isNavigationRequest();await route.fulfill({contentType:'text/html',body:'<p>Navigation destination intercepted</p>'})});
 await openApps();await page.locator('[data-open-app="'+rootApp.name+'"]').click();await page.waitForURL(base+'/apps/');assert.equal(navigated,true);await page.unroute(base+'/apps/');report.checks.push('Software-center /apps/ metadata performs a full same-origin navigation');
 for(const scenario of [{name:'permission',status:403,body:[]},{name:'error',status:503,body:[]},{name:'invalid',status:200,body:{success:0,result:[]}},{name:'timeout',status:200,body:[]},{name:'empty',status:200,body:[]}]){
  const endpoint=base+'/cgi-bin/luci/admin/store/installed',before=report.requests.length;
  await page.route(endpoint,async route=>{if(scenario.name==='timeout')await new Promise(resolve=>setTimeout(resolve,10000));await route.fulfill({status:scenario.status,contentType:'application/json',body:JSON.stringify(scenario.body)}).catch(()=>{})});
  await page.goto(home,{waitUntil:scenario.name==='timeout'?'domcontentloaded':'networkidle'});await openApps();const panel=page.locator('[data-applications-browser]');
  if(scenario.name==='timeout'){
   await page.locator('[data-applications-state]').getByText(/正在读取应用清单|Loading applications…/).waitFor();
   await page.locator('[data-device-address]').first().waitFor({state:'attached'});assert.ok(await page.locator('[data-device-address]').count(),'Device observations load independently of the pending catalogue');
   await page.locator('[data-category=tools]').click();assert.ok(await page.locator('[data-browser-tool]').count());await page.locator('[data-category=apps]').click();
  }
  if(scenario.name==='empty'){await panel.getByText(/没有已安装的扩展应用|No additional apps installed/).waitFor();assert.equal(await page.locator('[data-applications-state]').count(),0)}else{
   await page.locator('[data-applications-state]').getByText(scenario.name==='permission'?/没有读取应用目录的权限|No permission to read apps/:scenario.name==='timeout'?/读取应用清单超时|Loading applications timed out/:/应用清单暂不可用|Apps unavailable/).waitFor();
   assert.ok(!/没有已安装|No additional apps installed|没有匹配|No matching entries/.test(await panel.innerText()));
   await page.screenshot({path:path.join(out,'installed-apps-'+scenario.name+'.png')});
  }
  assert.equal(await page.locator('[data-open-app]').count(),0);await page.waitForTimeout(250);assert.equal(report.requests.length-before,1,'Failures must wait for an explicit retry');await page.unroute(endpoint);
  if(scenario.name==='empty'){await page.reload({waitUntil:'networkidle'});await openApps()}else await page.locator('[data-applications-state] button').click();
  await waitInstalled();assert.equal(report.requests.length-before,2,'One explicit retry/reload causes one catalogue GET');assert.equal(await page.locator('[data-applications-state]').count(),0);await page.keyboard.press('Escape');
  report.checks.push(scenario.name+': explicit state without a false empty/uninstalled result; real list restored by retry or reload');
 }
 assert.ok(report.requests.every(r=>!r.path.startsWith('/cgi-bin/luci/admin/store/')||r.method==='GET'&&r.path==='/cgi-bin/luci/admin/store/installed'));assert.equal(report.errors.length,0);assert.ok(report.consoleErrors.every(e=>e.url===base+'/cgi-bin/luci/admin/store/installed'&&/403|503/.test(e.text)),'Only intentional HTTP failure console errors are expected');report.result='passed';
 }catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1}
 finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}
})();
