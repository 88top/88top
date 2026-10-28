// A-only actual installed UI. No fixtures, candidate substitution or write calls.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const host='192.168.30.1',base='http://'+host,out=process.env.QS_MAIN_OUT;
const report={result:'running',views:[],errors:[],httpErrors:[],blocked:[],rpc:[],publicHashes:{}};
let browser,page;
(async()=>{try{
 browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addCookies([{name:'sysauth_http',value:process.env.QS_MAIN_SID,domain:host,path:'/'}]);
 await context.route('**/*',async route=>{
  const request=route.request();
  if(new URL(request.url()).origin!==base)return route.abort();
  if(['GET','HEAD'].includes(request.method()))return route.continue();
  if(new URL(request.url()).pathname==='/ubus/'){
   const body=request.postDataJSON(),calls=Array.isArray(body)?body:[body];
   const allowed=calls.every(call=>call.method==='list'||call.method==='call'&&['luci.getFeatures','file.list','uci.changes'].includes(call.params?.[1]+'.'+call.params?.[2]));
   report.rpc.push(...calls.map(call=>({method:call.method,object:call.params?.[1],operation:call.params?.[2]})));
   if(allowed)return route.continue();
  }
  report.blocked.push({method:request.method(),path:new URL(request.url()).pathname});return route.abort();
 });
 page=await context.newPage();
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('response',async response=>{
  const name=new URL(response.url()).pathname;
  if(response.status()>=400)report.httpErrors.push({path:name,status:response.status()});
  if(name.endsWith('/lanctrl/v2/lan-dhcp-settings/'))try{report.dhcp=(await response.json()).result}catch{}
 });
 // Public resources really served by A, rather than filesystem checks alone.
 const deployment=JSON.parse(fs.readFileSync(path.join(__dirname,'deployment-r2.json')));
 for(const name of ['index.js','style.css','vendor.js','i18n/en.json']){
  const response=await context.request.get(base+'/luci-static/quickstart/'+name);
  assert.equal(response.status(),200);
  report.publicHashes[name]=crypto.createHash('sha256').update(await response.body()).digest('hex');
  assert.equal(report.publicHashes[name],deployment.expectedHashes[name]);
 }
 await page.goto(base+'/cgi-bin/luci/admin/quickstart/',{waitUntil:'networkidle'});
 await page.locator('[data-ordered-home]').waitFor();
 await page.waitForFunction(()=>document.querySelector('[data-home-settings]')?.disabled===true&&[...document.querySelectorAll('.home-config-state')].filter(n=>n.checkVisibility()).length===2);
 await page.screenshot({path:path.join(out,'homepage-desktop.png'),fullPage:true});
 report.home={temporaryDefaults:true,editingDisabled:await page.locator('[data-home-settings]').isDisabled(),notices:await page.locator('.home-config-state:visible').allInnerTexts()};
 await page.goto(base+'/cgi-bin/luci/admin/quickstart/devicemanagement',{waitUntil:'networkidle'});
 await page.locator('[data-device-id]:visible').first().waitFor();
 report.deviceCount=await page.locator('[data-device-id]:visible').count();
 await page.screenshot({path:path.join(out,'devices-desktop.png'),fullPage:true});
 await page.locator('.primary-tabs button').nth(2).click();
 await page.locator('.context-card').waitFor();await page.waitForLoadState('networkidle');
 assert.equal(report.dhcp?.editable,true,'Actual A DHCP settings should be editable');
 const pool=page.locator('.dhcp-card input[inputmode=decimal]');
 assert.equal(await pool.first().inputValue(),report.dhcp.settings.poolStart);
 assert.equal(await pool.nth(1).inputValue(),report.dhcp.settings.poolEnd);
 assert.equal(await page.locator('.dhcp-card fieldset').evaluate(n=>n.disabled),false);
 const contextText=await page.locator('.context-card').innerText();
 assert.match(contextText,/地址配置可编辑|Address configuration editable/);
 assert.match(contextText,/路线可编辑|Route editable/);
 assert.doesNotMatch(contextText,/本页只读|This page is read.only/);
 report.contextText=contextText;
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(let section=0;section<3;section++){
   await page.locator('.settings-nav button').nth(section).click();
   if(section===1){await page.locator('.floating-wizard').waitFor();await page.locator('.floating-wizard .page-state--loading').waitFor({state:'hidden',timeout:25000})}
   if(section===2){await page.locator('.rules-hub').waitFor();await page.locator('.rules-hub .page-state--loading').waitFor({state:'hidden',timeout:25000})}
   await page.waitForLoadState('networkidle');
   const metrics=await page.locator('.lan-settings').evaluate(root=>({overflow:document.documentElement.scrollWidth>innerWidth,ownOverflow:root.scrollWidth>root.clientWidth+1,text:root.innerText}));
   report.views.push({width,section,...metrics});
   assert.equal(metrics.overflow,false);assert.equal(metrics.ownOverflow,false);
   await page.screenshot({path:path.join(out,`settings-${width}-${section}.png`),fullPage:true});
  }
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.blocked,[]);
 report.result='passed';
}catch(error){report.result='failed';report.failure=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'ui-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,views:report.views.length,errors:report.errors,httpErrors:report.httpErrors,blocked:report.blocked,failure:report.failure},null,2));}})();
