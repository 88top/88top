const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');const out=process.env.QS_DETAIL_HEADER_EVIDENCE;fs.mkdirSync(out,{recursive:true});
const report={result:'running',styleProbe:process.env.QS_DETAIL_STYLE_LOCAL==='1',views:[],errors:[],readRPC:[],mutations:[]},base='http://192.168.30.244';let browser,page;
const widgets=process.env.QS_DETAIL_BASELINE==='1'?['remote']:['remote','storage','sharing','docker','downloads','system'];
(async()=>{try{
 browser=await chromium.launch();const cases=process.env.QS_DETAIL_BASELINE==='1'?[{lang:'zh',theme:'light',width:1440}]:['zh','en'].flatMap(lang=>['light','dark'].flatMap(theme=>[1440,390,320].map(width=>({lang,theme,width}))));
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:950},locale:c.lang==='en'?'en-US':'zh-CN',hasTouch:c.width<600});await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
  // Project the published layout only, so hidden widgets can also be checked.
  // All business snapshots remain actual B responses; no durable writes.
  await context.route('**/cgi-bin/luci/istore/home/v1/layout/',async route=>{assert.equal(route.request().method(),'GET');const response=await route.fetch(),body=await response.json();body.result.value=require('../../../backend/modules/homeconfig/defaults.json').layout;await route.fulfill({response,json:body})});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{
   if(!r.url().startsWith(base)||r.method()==='GET')return;
   const pathname=new URL(r.url()).pathname;
   // LuCI shell uses POST for read-only RPC. Record object/method only, never
   // session IDs or arguments, and reject unrecognized commands separately.
   if(pathname==='/ubus/'){const body=r.postDataJSON();for(const call of Array.isArray(body)?body:[body])report.readRPC.push({method:call.method,object:call.params?.[1],operation:call.params?.[2]})}
   else report.mutations.push(pathname);
  });
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/',{waitUntil:'networkidle'});await require('../../../scripts/ops/home-shell-checks.cjs').setSystemTheme(page,c.theme);
  if(report.styleProbe)await page.addStyleTag({path:path.resolve(__dirname,'../../../web/src/home/widgetActionGroup.css')});
  for(const id of widgets){
   const card=page.locator('[data-layout-card='+id+']');await card.locator('[data-widget-more]').click();await card.locator('[data-widget-menu-item=complete]').click();
   const dialog=page.locator('.network-dialog'),surface=dialog.locator('[data-business-surface='+id+']'),primary=surface.locator('.card-header .btn_settings'),more=surface.locator('.card-header [data-widget-more]');await primary.waitFor();await more.waitFor();
   const g=await surface.evaluate(surface=>{const header=surface.querySelector('.card-header'),primary=header.querySelector('.btn_settings'),more=header.querySelector('[data-widget-more]'),group=primary.closest('.settings-wrapper'),box=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};return {primary:box(primary),more:box(more),group:box(group),display:getComputedStyle(group).display,gap:getComputedStyle(group).gap,dialogOverflow:surface.closest('.network-dialog').scrollWidth>surface.closest('.network-dialog').clientWidth}});
   report.views.push({...c,id,geometry:g});if(id==='remote'||c.width===320)await dialog.screenshot({path:path.join(out,[c.lang,c.theme,c.width,id].join('-')+'.png')});
   assert.ok(Math.abs(g.primary.top-g.more.top)<=1,'Primary action and more must share one row: '+JSON.stringify(g));assert.ok(Math.abs(g.primary.bottom-g.more.bottom)<=1,'Segment heights must match');assert.ok(Math.abs(g.primary.right-g.more.left)<=2,'Segments must join without a second-row gap');assert.equal(g.dialogOverflow,false);
   if(c.width<600){assert.ok(g.primary.height>=44&&g.more.height>=44&&g.more.width>=44,'Touch targets must retain 44px dimensions')}
   await more.click();const items=dialog.locator('[role=menuitem]');assert.ok(await items.count()>0);assert.equal(await items.first().evaluate(n=>n===document.activeElement),true,'Menu must focus its first item');
   assert.equal(await items.first().evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true,'Menu item is clipped or covered');
   await page.keyboard.press('Escape');assert.equal(await dialog.count(),1,'First Escape closes the menu only');assert.equal(await dialog.locator('[role=menu]').count(),0);assert.equal(await more.evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.notEqual(await page.locator('body').evaluate(n=>n.style.overflow),'hidden');
  }
  await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.mutations,[]);for(const call of report.readRPC){if(call.method==='list'&&!call.object)continue;assert.equal(call.method,'call');assert.ok(['luci.getFeatures','file.list','uci.changes'].includes(call.object+'.'+call.operation),'Unexpected LuCI RPC: '+JSON.stringify(call))}report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,views:report.views.length,failure:report.failure},null,2))}})();
