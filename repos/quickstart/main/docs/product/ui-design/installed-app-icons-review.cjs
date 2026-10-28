const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setSystemTheme}=require('../../../scripts/ops/home-shell-checks.cjs');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');
const out=process.env.QS_ICONS_EVIDENCE,base='http://192.168.30.244',home=base+'/cgi-bin/luci/admin/quickstart/',iconRoot='/luci-static/resources/app-icons/';
fs.mkdirSync(out,{recursive:true});const report={checks:[],views:[],requests:[],errors:[],consoleErrors:[],result:'running'};let browser,page;
(async()=>{try{
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
 await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
 const response=await context.request.get(base+'/cgi-bin/luci/admin/store/installed');assert.equal(response.status(),200);const apps=await response.json();assert.ok(Array.isArray(apps)&&apps.length===6);report.ids=apps.map(a=>a.name);
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({text:m.text(),url:m.location().url})});
 page.on('request',r=>{const u=new URL(r.url());if(u.origin!==base)report.requests.push({external:u.origin,path:u.pathname});else if(u.pathname.startsWith(iconRoot)||u.pathname.includes('/home/v1/')||u.pathname.startsWith('/cgi-bin/luci/admin/store/')||u.pathname.includes('/istore/app/'))report.requests.push({method:r.method(),path:u.pathname})});
 const open=async()=>{await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-category=apps]').click()};
 const ready=async()=>{await page.waitForFunction(count=>{const images=[...document.querySelectorAll('[data-open-app] img[data-app-artwork]')];return images.length===count&&images.every(i=>i.complete&&i.naturalWidth>0)},apps.length)};
 const metric=async id=>page.locator('[data-open-app="'+id+'"]').evaluate(n=>{const rect=x=>{const r=x.getBoundingClientRect();return {width:r.width,height:r.height}};return {tile:rect(n),frame:rect(n.querySelector('.application-icon')),art:rect(n.querySelector('[data-app-artwork]')),tag:n.querySelector('[data-app-artwork]').tagName}});
 await page.goto(home,{waitUntil:'networkidle'});await open();await ready();
 report.resources=await page.locator('link[rel=stylesheet]').evaluateAll(nodes=>nodes.map(n=>n.href));assert.ok(report.resources.some(url=>new URL(url).pathname==='/luci-static/quickstart/style.css'&&new URL(url).searchParams.get('v')===process.env.QS_EXPECT_ASSET_VERSION));
 report.loaded=await page.locator('[data-open-app] img[data-app-artwork]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.appArtwork,path:new URL(n.src).pathname,width:n.naturalWidth,height:n.naturalHeight,alt:n.alt})));
 assert.deepEqual(report.loaded.map(a=>a.id).sort(),report.ids.slice().sort());for(const icon of report.loaded){assert.equal(icon.path,iconRoot+icon.id+'.png');assert.ok(icon.width>0&&icon.height>0);assert.equal(icon.alt,'')}
 assert.equal(report.requests.filter(r=>r.path==='/cgi-bin/luci/admin/store/installed').length,1);assert.equal(report.consoleErrors.length,0);report.checks.push('Six actual installed app PNGs decode from canonical local paths; one catalogue GET');
 for(const [width,theme] of [[1440,'light'],[768,'light'],[390,'light'],[320,'light'],[390,'dark']]){
  await page.setViewportSize({width,height:900});await setSystemTheme(page,theme);await ready();await page.screenshot({path:path.join(out,'icons-'+width+'-'+theme+'.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);report.views.push({width,theme,first:await metric(apps[0].name)});
 }
 report.checks.push('Desktop/tablet/390/320 and dark-theme icon frames stay bounded');
 await page.setViewportSize({width:390,height:900});await setSystemTheme(page,'light');const id=apps[0].name,url=base+iconRoot+id+'.png',normal=await metric(id);
 for(const failure of ['missing','broken','offline']){
  let reads=0;await page.route(url,async route=>{reads++;if(failure==='offline')return route.abort('internetdisconnected');await route.fulfill({status:failure==='missing'?404:200,contentType:'image/png',body:failure==='missing'?'':'invalid PNG'})});
  await page.keyboard.press('Escape');await open();await page.locator('[data-open-app="'+id+'"] svg[data-app-artwork]').waitFor();await page.waitForTimeout(400);
  const fallback=await metric(id);assert.deepEqual(fallback.tile,normal.tile);assert.deepEqual(fallback.frame,normal.frame);assert.ok(fallback.art.width>0&&fallback.art.width<fallback.frame.width,'Fallback retains the original glyph size');assert.equal(reads,1,'An image failure must not loop');
  assert.equal(await page.locator('[data-open-app="'+id+'"] img').count(),0);assert.equal(await page.locator('[data-applications-state]').count(),0);await page.screenshot({path:path.join(out,'icons-'+failure+'.png')});report.checks.push(failure+': original glyph fallback, unchanged tile/frame, one request, catalogue remains available');await page.unroute(url);
 }
 await page.keyboard.press('Escape');await open();await ready();assert.equal(report.requests.filter(r=>r.path==='/cgi-bin/luci/admin/store/installed').length,1,'Icon rendering must not refresh the installed catalogue');
 await page.locator('[data-category=tools]').click();assert.equal(await page.locator('[data-browser-tool] img').count(),0);assert.ok(await page.locator('[data-browser-tool] svg[data-app-artwork]').count());await page.keyboard.press('Escape');
 // Override only a GET response in this browser to exercise pinned surfaces.
 // The router's durable favorites/links and their versions are never written.
 const launcher=base+'/cgi-bin/luci/istore/home/v1/launcher/';await page.route(launcher,async route=>{assert.equal(route.request().method(),'GET');const r=await route.fetch(),body=await r.json();assert.equal(body.success,0);body.result.value.favorites=[id,...body.result.value.favorites.filter(pin=>pin!==id)].slice(0,24);await route.fulfill({response:r,json:body})});
 await page.reload({waitUntil:'networkidle'});const pinned=page.locator('[data-favorite-app="'+id+'"] img[data-app-artwork]');await pinned.scrollIntoViewIfNeeded();await page.waitForFunction(id=>{const i=document.querySelector('[data-favorite-app="'+id+'"] img');return i?.complete&&i.naturalWidth>0},id);await page.locator('[data-layout-card=applications]').screenshot({path:path.join(out,'icons-pinned-browser-preview.png')});
 await open();await page.locator('[data-manage-favorites]').click();const editor=page.locator('[data-editor-shortcut="'+id+'"] img');await editor.scrollIntoViewIfNeeded();await page.waitForFunction(id=>{const i=document.querySelector('[data-editor-shortcut="'+id+'"] img');return i?.complete&&i.naturalWidth>0},id);
 const choice=page.locator('[data-select-app="'+id+'"]').locator('..').locator('img');await choice.scrollIntoViewIfNeeded();await page.waitForFunction(id=>{const i=document.querySelector('[data-select-app="'+id+'"]')?.parentElement.querySelector('img');return i?.complete&&i.naturalWidth>0},id);
 await page.locator('.launcher-editor-preview').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'icons-editor-browser-preview.png')});await page.locator('.applications-close').click();await page.unroute(launcher);report.checks.push('Pinned homepage, reorder preview and picker share real artwork; only a browser GET response overridden, no saves');
 assert.ok(report.requests.every(r=>!r.external),'No external icon service or remote URL');assert.ok(report.requests.every(r=>r.method==='GET'),'All observed app/store/home operations remain reads');assert.ok(report.requests.every(r=>!r.path.startsWith('/cgi-bin/luci/admin/store/')||r.path==='/cgi-bin/luci/admin/store/installed'));
 assert.equal(report.errors.length,0);assert.ok(report.consoleErrors.every(e=>e.url===url&&/404|ERR_INTERNET_DISCONNECTED|ERR_FAILED/.test(e.text)),'Only injected image failures may report console errors');assert.equal(await page.locator('body[lock-scroll]').count(),0);report.result='passed';
 }catch(e){report.result='failed';report.failure=e.stack;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1}
 finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,checks:report.checks,errors:report.errors,failure:report.failure},null,2))}
})();
