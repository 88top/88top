const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {checkHomeHeader,setSystemTheme,checkHomeShell}=require('../../../scripts/ops/home-shell-checks.cjs'),colours=require('./home-semantic-colour-checks.cjs');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');const out=process.env.QS_ACCEPT_OUT,baseline=process.env.QS_COLOUR_BASELINE==='1',base='http://192.168.30.244',home=base+'/cgi-bin/luci/admin/quickstart/';
const report={result:'running',baseline,views:[],details:[],errors:[],httpErrors:[],mutations:[],readRPC:[]};let browser,page;
const cases=baseline?[{lang:'zh',theme:'light',width:1440},{lang:'zh',theme:'light',width:390},{lang:'en',theme:'light',width:320},{lang:'en',theme:'dark',width:320}]:['zh','en'].flatMap(lang=>['light','dark'].flatMap(theme=>[1440,1024,768,390,320].map(width=>({lang,theme,width}))));
async function geometry(){return page.locator('[data-layout-card]').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.layoutCard,form:n.dataset.presentation,w:r.width,h:r.height}}))}
(async()=>{try{
 browser=await chromium.launch();
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:950},locale:c.lang==='en'?'en-US':'zh-CN',hasTouch:c.width<600});await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({path:new URL(r.url()).pathname,status:r.status()})});
  page.on('request',r=>{if(!r.url().startsWith(base)||r.method()==='GET')return;const p=new URL(r.url()).pathname;if(p==='/ubus/'){const body=r.postDataJSON();for(const call of Array.isArray(body)?body:[body])report.readRPC.push({method:call.method,object:call.params?.[1],operation:call.params?.[2]})}else report.mutations.push(p)});
  await page.goto(home,{waitUntil:'networkidle'});await page.locator('[data-layout-card=system]').waitFor();await page.waitForTimeout(1200);await setSystemTheme(page,c.theme);
  assert.equal(await page.evaluate(()=>window.vue_lang),'en'===c.lang?'en':'zh-cn');
  const stored=await context.request.get(base+'/cgi-bin/luci/istore/home/v1/layout/');assert.equal(stored.status(),200);const config=await stored.json();assert.equal(config.success,0);assert.equal(config.result.state,'saved');
  assert.equal(await page.locator('[data-layout-card]').count(),config.result.value.rows.flatMap(r=>r.columns.flatMap(c=>c.cards)).filter(Boolean).length);
  const g=await geometry(),key=[c.lang,c.theme,c.width].join('-');let semantics;
  if(!baseline){
   assert.equal(await page.locator('[data-ordered-home].home-semantic-colors').count(),1);semantics=await colours.check(page);
   const before=JSON.parse(fs.readFileSync(process.env.QS_COLOUR_BEFORE));const original=before.views.find(v=>v.key===key);if(original)assert.deepEqual(g,original.geometry,'Colour migration changed saved-layout widget dimensions');
  }
  report.views.push({...c,key,layout:'saved',geometry:g,semantics,header:await checkHomeHeader(page)});
  if(c.width===1440||c.width===390||c.width===320)await page.screenshot({path:path.join(out,'saved-'+key+'.png'),fullPage:c.width>600});
  if(baseline){await context.close();page=null;continue}
  // Expose all eleven widgets in this browser only. Real B business reads and
  // the router's saved layout remain untouched; no configuration POSTs.
  await context.route('**/cgi-bin/luci/istore/home/v1/layout/',async route=>{assert.equal(route.request().method(),'GET');const response=await route.fetch(),body=await response.json();body.result.value=require('../../../backend/modules/homeconfig/defaults.json').layout;await route.fulfill({response,json:body})});
  await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(1200);await setSystemTheme(page,c.theme);assert.equal(await page.locator('[data-layout-card]').count(),11);
  report.views.push({...c,key,layout:'browser-projected-default',geometry:await geometry(),semantics:await colours.check(page)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(c.width===1440||c.width===320)await page.screenshot({path:path.join(out,'all-widgets-'+key+'.png'),fullPage:c.width>600});
  if(c.width===1440||c.width===320)for(const id of ['sharing','downloads','remote']){
   const card=page.locator('[data-layout-card='+id+']');await card.locator('[data-widget-more]').click();await card.locator('[data-widget-menu-item=complete]').click();const dialog=page.locator('.network-dialog');await dialog.locator('[data-business-surface]').waitFor();
   const detail=await colours.check(page,dialog);assert.equal(detail.services.length,3);report.details.push({...c,id,semantics:detail});
   const primary=dialog.locator('.card-header .btn_settings'),more=dialog.locator('.card-header [data-widget-more]'),a=await primary.boundingBox(),b=await more.boundingBox();assert.ok(Math.abs(a.y-b.y)<1&&Math.abs(a.x+a.width-b.x)<=2,'Detail action segments separated');if(c.width<600)assert.ok(a.height>=44&&b.height>=44);
   if(id==='downloads')await dialog.screenshot({path:path.join(out,'detail-'+key+'.png')});
   await more.click();await page.keyboard.press('Escape');assert.equal(await dialog.count(),1);await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.notEqual(await page.locator('body').evaluate(n=>n.style.overflow),'hidden');
  }
  if(c.width===1440&&c.theme==='light'){
   await checkHomeShell(page,{checks:[]});const all=page.locator('[data-layout-card=applications] [data-all-apps]');await all.click();await page.locator('[data-category=apps]').click();const icons=page.locator('[data-applications-browser] img[data-app-artwork]');assert.ok(await icons.count()>0,'Real installed app artwork was lost');
   await page.waitForTimeout(500);report.brandArtwork??=[];for(const img of await icons.all()){const m=await img.evaluate(n=>({id:n.dataset.appArtwork,loaded:n.complete&&n.naturalWidth>0,filter:getComputedStyle(n).filter}));assert.equal(m.loaded,true);assert.equal(m.filter,'none');report.brandArtwork.push(m)}
   await page.keyboard.press('Escape');assert.equal(await page.locator('[data-applications-browser]').count(),0);
   const target=page.locator('[data-canvas-device]').first(),id=await target.getAttribute('data-canvas-device');await target.click();await page.waitForURL(u=>u.pathname.endsWith('/devicemanagement')&&u.searchParams.get('device')===id);await page.locator('.drawer-backdrop').waitFor();await page.goBack({waitUntil:'networkidle'});await page.locator('[data-ordered-home]').waitFor();
  }
  await context.unrouteAll({behavior:'wait'});await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.mutations,[]);for(const r of report.readRPC){if(r.method==='list'&&!r.object)continue;assert.equal(r.method,'call');assert.ok(['luci.getFeatures','file.list','uci.changes'].includes(r.object+'.'+r.operation),JSON.stringify(r))}
 for(const e of report.httpErrors)assert.ok(e.status===404&&e.path==='/luci-static/resources/app-icons/kai.png','Unexpected HTTP failure: '+JSON.stringify(e));
 report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}
finally{if(browser)for(const context of browser.contexts())await context.unrouteAll({behavior:'wait'});await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,views:report.views.length,details:report.details.length,failure:report.failure},null,2))}})();
