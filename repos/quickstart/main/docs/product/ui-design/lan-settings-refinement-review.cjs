// Authenticated B-only UI. Normal cases use actual data; projection cases never
// send their plan/apply requests to the router. Candidate assets are substituted
// only when explicitly rehearsing, not during installed-version acceptance.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { ratio } = require('./home-semantic-colour-checks.cjs');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');
const base='http://192.168.30.244',out=process.env.QS_ACCEPT_OUT;
const rehearsal=process.env.QS_LAN_SETTINGS_REHEARSAL==='1',states=process.env.QS_LAN_SETTINGS_STATES==='1';
const prefix='/cgi-bin/luci/istore',globalPath='/lanctrl/globalConfigs/',dhcpPath='/lanctrl/v2/lan-dhcp-settings/';
const report={result:'running',rehearsal,states,views:[],errors:[],mutations:[],rpc:[],httpErrors:[],projectedTransactions:[]};
let browser,page;
async function metrics(){return page.locator('.lan-settings').evaluate(root=>{
 const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
 const background=n=>{const layers=[];for(let p=n;p;p=p.parentElement){const c=getComputedStyle(p).backgroundColor.match(/[\d.]+/g)?.map(Number);if(!c)continue;const a=c[3]??1;if(a)layers.push({c,a});if(a===1)break}let c=[255,255,255];for(const l of layers.reverse())c=c.map((v,i)=>v*(1-l.a)+l.c[i]*l.a);return 'rgb('+c.map(Math.round).join(',')+')'};
 const visible=n=>n.checkVisibility();const read=n=>({text:n.innerText,rect:rect(n),ink:getComputedStyle(n).color,bg:background(n),font:getComputedStyle(n).fontSize,clipped:n.scrollWidth>n.clientWidth+1});
 const surface=root.closest('.primary-content'),main=root.closest('.device-management');
 return {rect:rect(root),panel:getComputedStyle(surface).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth,ownOverflow:root.scrollWidth>root.clientWidth+1,cards:[...root.querySelectorAll('.settings-stack>.setting-card')].map(rect),targets:[...root.querySelectorAll('.settings-nav button,.setting-card>button,.speed-check-actions button,.config-disclosure,.advanced-group>summary,.setting-card input:not([type=checkbox]),.setting-card select')].filter(visible).map(read),text:[...root.querySelectorAll('.context-card strong,.context-card>div>span,.card-heading h3,.card-heading p,.config-origin,.local-config-summary dt,.local-config-summary dd,.capability-pill,.capability-action>p')].filter(visible).map(read),rootWidth:rect(main).width};
})}
function check(m,c){assert.equal(m.overflow,false);assert.equal(m.ownOverflow,false);for(const t of m.targets){assert.ok(t.rect.height>=44&&t.rect.width>=44,'Small target '+t.text);assert.ok(t.rect.left>=0&&t.rect.right<=c.width+1,'Offscreen '+t.text)}for(const t of m.text)assert.ok(ratio(t.ink,t.bg)>=4.5,'Contrast '+t.text);if(m.cards.length===2&&m.cards[0].left!==m.cards[1].left)assert.ok(Math.abs(m.cards[0].top-m.cards[1].top)<1,'Cards not top aligned')}
async function shot(name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});}
(async()=>{try{
 browser=await chromium.launch();
 const cases=states?['draft-success','draft-failure','business-failure','malformed','timeout','unmount','dhcp-unknown','dhcp-read-failure','split-permissions','ready','uninstalled','plan-apply'].map(mode=>({mode,lang:'en',theme:'dark',width:mode==='split-permissions'?1440:390})):rehearsal?[{lang:'zh',theme:'light',width:1440},{lang:'zh',theme:'dark',width:768},{lang:'en',theme:'light',width:390},{lang:'en',theme:'dark',width:320}]:['zh','en'].flatMap(lang=>['light','dark'].flatMap(theme=>[2560,1440,1280,768,390,320].map(width=>({lang,theme,width}))));
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:1000},hasTouch:c.width<600});
  let contextClosing=false;const closeContext=async()=>{contextClosing=true;await context.close()};
  await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
  await context.addInitScript(lang=>{let url='';Object.defineProperty(window,'vue_lang',{configurable:true,get:()=>lang,set:actual=>window.__qs_test_native_lang=actual});Object.defineProperty(window,'vue_lang_data',{configurable:true,get:()=>url,set:actual=>url=actual.replace(/\/i18n\/[^/?]+\.json/,'/i18n/'+lang+'.json')});},c.lang==='en'?'en':'zh-cn');
  if(rehearsal)await context.route('**/luci-static/quickstart/**',route=>{const name=new URL(route.request().url()).pathname.split('/luci-static/quickstart/')[1];return ['index.js','style.css','vendor.js','i18n/en.json'].includes(name)?route.fulfill({path:path.resolve(__dirname,'../../../web/dist/luci-static/quickstart',name)}):route.continue()});
  const counts={},draftMode=['draft-success','draft-failure','business-failure','malformed','timeout','unmount','plan-apply'].includes(c.mode);let checking=false,failedOnce=false,release,markHeld;const held=new Promise(resolve=>{markHeld=resolve});
  await context.route('**/cgi-bin/luci/istore/**',async route=>{
   try{
   const req=route.request(),key=new URL(req.url()).pathname.slice(prefix.length);counts[key]=(counts[key]||0)+1;
   if(req.method()!=='GET'){
    assert.ok(draftMode&&(key==='/lanctrl/v2/rate-limit-settings/plan/'||c.mode==='plan-apply'&&[dhcpPath+'plan/',dhcpPath+'apply/','/lanctrl/v2/rate-limit-settings/apply/'].includes(key)),'Unexpected mutation '+key);
    const payload=req.postDataJSON();report.projectedTransactions.push({key,payload});
    const result=key.startsWith(dhcpPath)?{settings:payload.settings,editable:true,version:'browser-test-v1',conflicts:[],affectedDevices:0,canApply:true,changed:false}:{version:'browser-test-v1',canApply:true,changes:[{kind:'speed'}],changed:false};return route.fulfill({json:{success:0,result}});
   }
   if(key===globalPath&&checking){
    if(draftMode)await new Promise(r=>setTimeout(r,450));
    if(['draft-failure','business-failure','malformed'].includes(c.mode)&&!failedOnce){failedOnce=true;if(c.mode==='draft-failure')return route.fulfill({status:503,json:{error:'projected failure'}});return route.fulfill({json:c.mode==='business-failure'?{success:-1,error:'projected business failure'}:{result:{speedLimit:{providers:'invalid'}}}})}
    if(c.mode==='timeout'&&!failedOnce){failedOnce=true;await new Promise(r=>setTimeout(r,11000));return route.abort().catch(()=>{})}
    if(c.mode==='unmount'&&!failedOnce){failedOnce=true;await new Promise(r=>{release=r;markHeld()});return route.abort().catch(()=>{})}
   }
   if(c.mode==='dhcp-read-failure'&&key===dhcpPath)return route.fulfill({status:503,json:{error:'projected DHCP failure'}});
   const response=await route.fetch(),body=await response.json();
   if(key===dhcpPath)report.dhcpShape={success:body.success,error:body.error,resultKeys:Object.keys(body.result||{}),settings:body.result?.settings,editable:body.result?.editable};
   if(states&&key===dhcpPath){if(c.mode==='dhcp-unknown')return route.fulfill({json:{success:0,result:{editable:false}}});body.success=0;delete body.error;body.result={settings:{enabled:true,poolStart:'192.168.30.100',poolEnd:'192.168.30.199',leaseTime:'12h',defaultTargetId:'self'},editable:draftMode||c.mode==='split-permissions',version:'browser-test-v1',conflicts:[],affectedDevices:0,canApply:false};}
   if(states&&key===globalPath&&(draftMode||['ready','uninstalled'].includes(c.mode))){body.result.speedLimit={provider:draftMode?'eqos':'quickstart-native',enabled:true,uploadSpeed:100,downloadSpeed:1000,providers:[{id:'eqos',installed:true,available:true},{id:'quickstart-native',installed:c.mode!=='uninstalled',available:c.mode==='ready',reason:c.mode==='uninstalled'?'dependency_not_installed':'engine_unavailable'}]};const cap={state:c.mode==='uninstalled'?'not_installed':draftMode||c.mode==='ready'?'available':'error',reason:c.mode==='uninstalled'?'dependency_not_installed':undefined};body.result.capabilities={...body.result.capabilities,items:{...body.result.capabilities?.items,device_speed_limit:cap},speedLimit:cap};}
   await route.fulfill({response,json:body});
   }catch(error){if(!contextClosing){report.errors.push(error.stack);await route.abort().catch(()=>{})}}
  });
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(new URL(r.url()).origin===base&&r.status()>=400)report.httpErrors.push({path:new URL(r.url()).pathname,status:r.status(),mode:c.mode})});page.on('request',r=>{if(new URL(r.url()).origin!==base||r.method()==='GET')return;const key=new URL(r.url()).pathname;if(key==='/ubus/'){const b=r.postDataJSON();for(const x of Array.isArray(b)?b:[b])report.rpc.push({method:x.method,object:x.params?.[1],operation:x.params?.[2]})}else if(!draftMode)report.mutations.push(key)});
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/devicemanagement',{waitUntil:'networkidle'});await page.locator('[data-device-id]:visible').first().waitFor();await page.locator('.primary-tabs button').nth(2).click();await page.locator('.settings-nav').waitFor();await page.evaluate(theme=>document.body.setAttribute('theme',theme),c.theme);await page.waitForLoadState('networkidle');
  const name=[c.lang,c.theme,c.width,c.mode||'normal'].join('-'),v={...c,counts};report.views.push(v);assert.equal(await page.locator('.lan-settings>header').count(),0);assert.ok(await page.locator('.lan-settings').getAttribute('aria-label'));assert.doesNotMatch(await page.locator('.lan-settings').innerText(),/本页只读|This page is read.only/);
  v.metrics=await metrics();check(v.metrics,c);await shot(name);
  if(c.mode==='dhcp-unknown'||c.mode==='dhcp-read-failure'){assert.equal(await page.locator('.local-config-summary').count(),0);assert.equal(await page.locator('.dhcp-card input').count(),0);assert.ok(await page.locator('.dhcp-card .page-state').count());await page.locator('.speed-recheck').click();await page.waitForFunction(()=>document.querySelector('.speed-card').getAttribute('aria-busy')==='false');await closeContext();page=null;continue;}
  if(c.mode==='split-permissions'){assert.equal(await page.locator('.dhcp-card fieldset').evaluate(n=>n.disabled),false);assert.match(await page.locator('.context-card').innerText(),/Address configuration editable/);assert.match(await page.locator('.context-card').innerText(),/Internet paths read-only/);await closeContext();page=null;continue;}
  if(!draftMode){
   if(await page.locator('.config-disclosure').count()){await page.locator('.local-config-summary').waitFor();assert.equal(await page.locator('.dhcp-card fieldset').count(),0);assert.equal(await page.locator('.dhcp-card>.primary').count(),0);await page.locator('.config-disclosure').click();await page.locator('.dhcp-card fieldset').waitFor();assert.equal(await page.locator('.dhcp-card fieldset').evaluate(n=>n.disabled),true);check(await metrics(),c);await page.locator('.config-disclosure').click();v.dhcp='known readonly snapshot';}
   else{assert.equal(await page.locator('.dhcp-card input').count(),0);assert.ok(await page.locator('.dhcp-card .page-state').count());v.dhcp='actual backend unavailable; no invented defaults';}
   if(await page.locator('.speed-inspect').count()){await page.locator('.speed-inspect').click();assert.equal(await page.locator('.advanced-group').evaluate(n=>n.open),true);assert.equal(await page.locator('.advanced-group>label>select').evaluate(n=>document.activeElement===n),true)}
   const before={...counts};checking=true;await page.locator('.speed-recheck').click();await page.waitForFunction(()=>document.querySelector('.speed-card').getAttribute('aria-busy')==='false');assert.equal(counts[globalPath],before[globalPath]+1);for(const [key,value]of Object.entries(before))if(key!==globalPath)assert.equal(counts[key],value,'Unrelated re-read '+key);assert.equal(await page.locator('.lan-settings .page-state--loading').count(),0);
   for(let index=1;index<3;index++){await page.locator('.settings-nav button').nth(index).click();await page.locator(index===1?'.route-list,.route-form,.setting-card .page-state,.setting-card .state-message':'.rules-hub').first().waitFor();await page.waitForLoadState('networkidle');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
   v.checked='readonly summary/disclosure/local recheck/advanced focus/three sections';await closeContext();page=null;continue;
  }
  // All mutations below are fulfilled inside this browser, never sent to B.
  const pool=page.locator('.dhcp-card input[inputmode=decimal]').first(),rates=page.locator('.speed-card input[type=number]');
  await pool.fill('192.168.30.123');await rates.first().fill('37');await rates.nth(1).fill('83');await page.locator('.advanced-group>summary').click();await page.locator('.speed-card>.primary').click();await page.locator('.speed-card .impact-preview').waitFor();
  const saved={pool:await pool.inputValue(),up:await rates.first().inputValue(),down:await rates.nth(1).inputValue(),plan:await page.locator('.speed-card .impact-preview').innerText()};
  const before={...counts};checking=true;await page.locator('.speed-recheck').click();assert.equal(await page.locator('.speed-recheck').isDisabled(),true);
  if(c.mode==='unmount'){await held;await page.locator('.primary-tabs button').first().click();release();await page.locator('[data-device-id]:visible').first().waitFor();assert.equal(counts[globalPath],before[globalPath]+1);await closeContext();page=null;continue;}
  await page.waitForFunction(()=>document.querySelector('.speed-card').getAttribute('aria-busy')==='false',null,{timeout:15000});
  assert.equal(counts[globalPath],before[globalPath]+1);for(const [key,value]of Object.entries(before))if(key!==globalPath)assert.equal(counts[key],value,'Unrelated re-read '+key);
  assert.equal(await pool.inputValue(),saved.pool);assert.equal(await rates.first().inputValue(),saved.up);assert.equal(await rates.nth(1).inputValue(),saved.down);assert.equal(await page.locator('.advanced-group').evaluate(n=>n.open),true);assert.equal(await page.locator('.speed-card .impact-preview').innerText(),saved.plan);
  if(['draft-failure','business-failure','malformed','timeout'].includes(c.mode)){assert.match(await page.locator('.speed-card').innerText(),/Status not updated/);await shot(name+'-failed');await page.locator('.speed-recheck').click();await page.waitForFunction(()=>document.querySelector('.speed-card').getAttribute('aria-busy')==='false');assert.equal(await rates.first().inputValue(),saved.up);assert.equal(await pool.inputValue(),saved.pool);}
  if(c.mode==='plan-apply'){await page.locator('.speed-card .impact-preview .primary').click();await page.waitForLoadState('networkidle');await page.locator('.settings-nav').waitFor();await page.locator('.dhcp-card>.primary').click();await page.locator('.dhcp-card .impact-preview').waitFor();await page.locator('.dhcp-card .impact-preview .primary').click();await page.waitForLoadState('networkidle');await page.locator('.settings-nav').waitFor();}
  v.draftsRetained=true;await shot(name+'-after');await closeContext();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.mutations,[]);for(const r of report.rpc){if(r.method==='list'&&!r.object)continue;assert.equal(r.method,'call');assert.ok(['luci.getFeatures','file.list','uci.changes'].includes(r.object+'.'+r.operation),JSON.stringify(r))}for(const r of report.httpErrors)assert.ok(states&&[403,503].includes(r.status),JSON.stringify(r));report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,rehearsal,states,views:report.views.length,failure:report.failure},null,2));}})();
