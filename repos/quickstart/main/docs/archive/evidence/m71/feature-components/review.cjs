const {chromium}=require('playwright');
const {ratio}=require('../../../product/ui-design/home-semantic-colour-checks.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base='http://192.168.30.244',out=process.env.QS_COMPONENT_OUT;
const rehearsal=process.env.QS_COMPONENT_REHEARSAL==='1',projected=process.env.QS_COMPONENT_PROJECTED==='1';
const extended=process.env.QS_COMPONENT_EXTENDED==='1';
const actualPlans=process.env.QS_COMPONENT_ACTUAL_PLANS==='1';
const expected=process.env.QS_COMPONENT_CHECK_INSTALLED==='1'?JSON.parse(fs.readFileSync(path.join(__dirname,'extra-fix-1/candidate.json'))):null;
let vendorVersion;
if(expected){const bundle=fs.readFileSync(path.resolve(__dirname,'../../../../web/dist/luci-static/quickstart/index.js'));assert.equal(require('node:crypto').createHash('sha256').update(bundle).digest('hex'),expected.hashes['index.js']);vendorVersion=bundle.toString().match(/vendor\.js\?v=([a-z0-9]+)/)[1]}
const fixture=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../contracts/feature-components.json')));
const report={result:'running',rehearsal,projected,views:[],errors:[],blocked:[],projectedCalls:[]};
report.coverageChecks=[];
report.actualPlanCalls=[];
let browser,page;
const prefix='/cgi-bin/luci/istore',catalogPath=prefix+'/lanctrl/v2/feature-components/';
async function screenshot(name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:false})}
async function titleCoverage(){return page.locator('[data-feature-components]').evaluate(root=>{
 const heading=root.querySelector('h2'),r=heading.getBoundingClientRect(),x=r.left+8,y=r.top+r.height/2;
 // Inert suppresses hit-testing, not painting. Reveal only to the synchronous
 // probe; restore before any user event can run. This catches the native menu
 // that the old elementsFromPoint-only check incorrectly declared behind us.
 const inert=Array.from(document.querySelectorAll('[inert]'));
 try{
  inert.forEach(node=>node.removeAttribute('inert'));
  const stack=document.elementsFromPoint(x,y),top=stack[0];
  const candidates=Array.from(document.body.querySelectorAll('*')).filter(node=>{
   const s=getComputedStyle(node),b=node.getBoundingClientRect();
   return !root.contains(node)&&s.position!=='static'&&b.left<=x&&b.right>=x&&b.top<=y&&b.bottom>=y;
  }).map(node=>({tag:node.tagName,id:node.id,class:node.getAttribute('class'),position:getComputedStyle(node).position,zIndex:getComputedStyle(node).zIndex}));
  const result={unobscured:root.contains(top),stack:stack.slice(0,8).map(node=>({tag:node.tagName,id:node.id,class:node.getAttribute('class'),zIndex:getComputedStyle(node).zIndex})),candidates};
  if(!result.unobscured){
   result.ancestors=[];
   for(let node=root.parentElement;node;node=node.parentElement){const s=getComputedStyle(node);result.ancestors.push({tag:node.tagName,class:node.getAttribute('class'),position:s.position,zIndex:s.zIndex,transform:s.transform,isolation:s.isolation})}
   const overlay=root.closest('[data-feature-overlay]'),parent=overlay.parentNode,next=overlay.nextSibling;
   try{document.body.append(overlay);result.bodyPortalUnobscured=root.contains(document.elementFromPoint(x,y))}finally{parent.insertBefore(overlay,next)}
  }
  return result;
 }finally{inert.forEach(node=>node.setAttribute('inert',''))}
 })}
async function geometry(){return page.locator('[data-feature-components]').evaluate(root=>{
 const background=node=>{for(let current=node;current;current=current.parentElement){const value=getComputedStyle(current).backgroundColor;if(!['rgba(0, 0, 0, 0)','transparent'].includes(value))return value}return 'rgb(255,255,255)'};
 return {overflow:root.scrollWidth>root.clientWidth+1,viewportOverflow:document.documentElement.scrollWidth>innerWidth,targets:Array.from(root.querySelectorAll('button:not(:disabled)')).filter(n=>n.checkVisibility()).map(n=>({text:n.innerText,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})),text:root.innerText,copy:Array.from(root.querySelectorAll('h2,h3,h4,p,.feature-state,.feature-tags span')).filter(n=>n.checkVisibility()).map(n=>({text:n.innerText,color:getComputedStyle(n).color,background:background(n)})),heading:{background:getComputedStyle(root.querySelector('h2')).backgroundColor,shadow:getComputedStyle(root.querySelector('h2')).boxShadow}};
 })}
(async()=>{try{
 browser=await chromium.launch();
 const cases=actualPlans?[{width:1440,lang:'zh-cn',theme:'light'},{width:390,lang:'en',theme:'dark'}]:process.env.QS_COMPONENT_SINGLE==='1'?[{width:390,lang:'en',theme:'dark'}]:process.env.QS_COMPONENT_QUICK==='1'?[{width:1440,lang:'zh-cn',theme:'light'}]:['zh-cn','en'].flatMap(lang=>['light','dark'].flatMap(theme=>[1440,390,320].map(width=>({width,lang,theme}))));
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:1000},hasTouch:c.width<600});
  await context.addCookies([{name:'sysauth_http',value:process.env.QS_COMPONENT_SID,domain:'192.168.30.244',path:'/'}]);
  await context.addInitScript(lang=>{let url='';Object.defineProperty(window,'vue_lang',{configurable:true,get:()=>lang,set:()=>{}});Object.defineProperty(window,'vue_lang_data',{configurable:true,get:()=>url,set:value=>url=value.replace(/\/i18n\/[^/?]+\.json/,'/i18n/'+lang+'.json')});},c.lang);
  let catalog=structuredClone(fixture),catalogMode='normal',bodyReads=0,deferApply=false,releaseApply;
  const native=()=>catalog.components[0];
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url()),key=url.pathname;
   if(url.origin!==base)return route.abort();
   if(rehearsal&&key.startsWith('/luci-static/quickstart/')){const name=key.split('/luci-static/quickstart/')[1];if(['index.js','style.css','vendor.js','i18n/en.json'].includes(name))return route.fulfill({path:path.resolve(__dirname,'../../../../web/dist/luci-static/quickstart',name)})}
   if(projected&&key===catalogPath){bodyReads++;if(catalogMode==='failure')return route.fulfill({status:503,json:{error:'projected'}});if(catalogMode==='forbidden')return route.fulfill({json:{success:-1001}});if(catalogMode==='malformed')return route.fulfill({json:{success:0,result:{schemaVersion:2}}});return route.fulfill({json:{success:0,result:catalog}})}
   if(!['GET','HEAD'].includes(req.method())){
    if(actualPlans&&!projected&&key===prefix+'/lanctrl/v2/capability-action/plan/'){
     const body=req.postDataJSON();assert.ok([['device_speed_limit','enable'],['compat_speed_limit','install'],['floating_gateway','install']].some(([key,action])=>body.capabilityKey===key&&body.action===action));report.actualPlanCalls.push({key,body});return route.continue();
    }
    if(key==='/ubus/'){
     const body=req.postDataJSON(),calls=Array.isArray(body)?body:[body];if(calls.every(call=>call.method==='list'||call.method==='call'&&['luci.getFeatures','file.list','uci.changes'].includes(call.params?.[1]+'.'+call.params?.[2])))return route.continue();
    }
    if(projected&&key.startsWith(prefix+'/lanctrl/v2/capability-action/')){
     const body=req.postDataJSON();report.projectedCalls.push({key,body});
     const item=catalog.components.find(item=>item.capabilityKey===body.capabilityKey);
     if(key.endsWith('/plan/'))return route.fulfill({json:{success:0,result:{plan:{...body,current:item.status,target:body.action==='install'?item.package:item.capabilityKey,canApply:true,requiresConfirmation:true,requiredFreeBytes:8388608,availableFreeBytes:99999999}}}});
     assert.equal(body.confirm,true);
     if(deferApply){item.operation='running';await new Promise(resolve=>{const timer=setTimeout(resolve,15000);releaseApply=()=>{clearTimeout(timer);resolve()}});delete item.operation}
     item.status=body.action==='install'?{state:'disabled',reason:'service_stopped',actions:[{kind:'enable'}]}:{state:'available'};
     return route.fulfill({json:{success:0,result:{changed:true,current:item.status}}});
    }
    if(projected&&key===prefix+'/lanctrl/v2/rate-limit-settings/plan/'){const body=req.postDataJSON();report.projectedCalls.push({key,body});return route.fulfill({json:{success:0,result:{version:'browser-plan-'+body.settings.provider,canApply:true,changes:[{kind:'speed'}],changed:false}}})}
    if(projected&&key===prefix+'/lanctrl/v2/device-restrictions/plan/'){report.projectedCalls.push({key,body:req.postDataJSON()});return route.fulfill({json:{success:0,result:{version:'browser-detail-plan',canApply:true,changes:[{kind:'speed',description:'Projected speed change'}],reloadServices:[],recoveryAction:'restore_previous'}}})}
    report.blocked.push({key,method:req.method()});return route.abort();
   }
   if(projected&&extended&&key===prefix+'/lanctrl/v2/device-policy/'){
    const response=await route.fetch(),body=await response.json(),policy=body.result?.policy;
    assert.ok(policy,'Real detail policy unavailable; keep this failure separate from projection');
    policy.capabilities.speed={state:'available'};policy.speed={enabled:true,uploadSpeed:100,downloadSpeed:1000};
    if(policy.rateLimit)policy.rateLimit.canApply=true;
    return route.fulfill({response,json:body});
   }
   if(projected&&key===prefix+'/lanctrl/globalConfigs/'){
    const response=await route.fetch(),body=await response.json();
    body.result.speedLimit={provider:'eqos',enabled:true,uploadSpeed:100,downloadSpeed:1000,installed:true,providers:[{id:'eqos',installed:true,available:true},{id:'quickstart-native',installed:native().status.state!=='not_installed',available:native().status.state==='available',reason:native().status.reason||''}]};
    body.result.capabilities.items.device_speed_limit={state:'available'};body.result.capabilities.speedLimit={state:'available'};
    return route.fulfill({response,json:body});
   }
   return route.continue();
  });
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/devicemanagement',{waitUntil:'networkidle'});await page.locator('[data-device-id]:visible').first().waitFor();await page.locator('.primary-tabs button').nth(2).click();await page.locator('.settings-nav').waitFor();await page.evaluate(theme=>document.body.setAttribute('theme',theme),c.theme);
  const name=[c.lang,c.theme,c.width].join('-');
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(item=>item.name).filter(name=>/\/luci-static\/quickstart\/(index\.js|vendor\.js|style\.css|i18n\/(en|zh-cn)\.json)(\?|$)/.test(name)));
  if(expected){assert.equal(rehearsal,false);for(const name of ['index.js','vendor.js','style.css'])assert.ok(resources.some(url=>new URL(url).pathname.endsWith('/'+name)),'Missing deployed resource '+name);for(const url of resources)assert.equal(new URL(url).searchParams.get('v'),new URL(url).pathname.endsWith('/vendor.js')?vendorVersion:expected.assetVersion,'Page uses a cache key different from the frozen template/bundle')}
  const rates=page.locator('.speed-card input[type=number]');let originalPlan;
  if(projected){await rates.first().fill('37');await rates.nth(1).fill('83');await page.locator('.speed-card>.primary').click();await page.locator('.speed-card .impact-preview').waitFor();originalPlan=await page.locator('.speed-card .impact-preview').innerText();assert.equal(await page.locator('[data-manage-speed-component]').isVisible(),true)}
  const entry=page.locator('[data-open-components]:visible');await entry.click();await page.locator('[data-feature-component=quickstart-native]').waitFor();
  const m=await geometry();assert.equal(m.overflow,false);assert.equal(m.viewportOverflow,false);for(const button of m.targets)assert.ok(button.width>=44&&button.height>=44,'small action '+button.text);for(const copy of m.copy)assert.ok(ratio(copy.color,copy.background)>=4.5,'contrast '+copy.text);assert.equal(m.heading.shadow,'none');assert.equal(m.heading.background,'rgba(0, 0, 0, 0)');
  m.titleCoverage=await page.locator('.feature-heading h2').evaluate(node=>{const r=node.getBoundingClientRect();return {rect:{left:r.left,top:r.top,width:r.width,height:r.height},pseudo:{before:getComputedStyle(node,'::before').content,after:getComputedStyle(node,'::after').content},stack:document.elementsFromPoint(r.left+8,r.top+12).map(item=>({tag:item.tagName,id:item.id,class:item.className,zIndex:getComputedStyle(item).zIndex,position:getComputedStyle(item).position}))}});
  assert.match(await entry.innerText(),c.lang==='en'?/Feature components/:/功能组件/);
  assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
  await screenshot(name+'-components');
  const coverage=await titleCoverage();report.coverageChecks.push({name,...coverage});assert.ok(coverage.unobscured,'Native chrome paints over component heading');
  if(actualPlans){
   assert.equal(projected,false);assert.equal(rehearsal,false);
   for(const item of fixture.components){
    const before=report.actualPlanCalls.length;
    await page.locator('[data-prepare-component='+item.id+']').click();await page.locator('[data-component-confirm]').waitFor();assert.equal(report.actualPlanCalls.length,before+1);
    assert.match(await page.locator('[data-component-confirm]').innerText(),new RegExp(item.package));await screenshot(name+'-actual-plan-'+item.id);
    await page.locator('[data-component-confirm] button').first().click();await page.locator('[data-component-confirm]').waitFor({state:'hidden'});
   }
  }
  if(projected){
   const before=report.projectedCalls.length;
   await page.locator('[data-prepare-component=quickstart-native]').click();await page.locator('[data-component-confirm]').waitFor();assert.equal(report.projectedCalls.length,before+1);assert.match(await page.locator('[data-component-confirm]').innerText(),/quickstart-netpolicy/);await screenshot(name+'-confirm');
   await page.locator('[data-component-confirm] button').first().click();assert.equal(report.projectedCalls.length,before+1,'Cancel submitted installation');
   await page.locator('[data-prepare-component=quickstart-native]').click();await page.locator('[data-confirm-component]').click();await page.waitForFunction(()=>document.querySelector('[data-feature-component=quickstart-native]')?.textContent.match(/未启用|Not enabled/));
   assert.equal(await rates.first().inputValue(),'37');assert.equal(await rates.nth(1).inputValue(),'83');assert.equal(await page.locator('.speed-card .impact-preview').innerText(),originalPlan);
   await page.locator('[data-prepare-component=quickstart-native]').click();await page.locator('[data-confirm-component]').click();await page.waitForFunction(()=>document.querySelector('[data-feature-component=quickstart-native]')?.textContent.match(/已就绪|Ready/));
   assert.equal(await page.locator('.speed-card select').inputValue(),'eqos','Enable silently switched provider');
   await page.locator('[data-configure-component=quickstart-native]').click();await page.locator('[data-feature-overlay]').waitFor({state:'hidden'});await page.waitForFunction(()=>document.querySelector('.speed-card select')?.value==='quickstart-native');await page.locator('.speed-card .impact-preview').waitFor();
   assert.ok(report.projectedCalls.every(call=>!call.key.endsWith('/rate-limit-settings/apply/')));
   await entry.click();await page.locator('[data-feature-component=quickstart-native]').waitFor();
  }
  await page.locator('[data-close-components]').focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement?.closest('[data-feature-components]')!==null),true);
  await page.keyboard.press('Escape');await page.locator('[data-feature-overlay]').waitFor({state:'hidden'});assert.equal(await entry.evaluate(node=>node===document.activeElement),true);assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
  if(projected&&c.lang==='en'&&c.theme==='dark'&&c.width===390){
   for(const mode of ['failure','forbidden','malformed']){catalogMode=mode;await entry.click();await page.locator('.feature-feedback.warning').waitFor();assert.equal(await page.locator('[data-prepare-component]:enabled').count(),0);await screenshot(name+'-'+mode);catalogMode='normal';await page.locator('[data-check-components]').click();await page.locator('.feature-feedback.warning').waitFor({state:'hidden'});await page.keyboard.press('Escape')}
   native().operation='pending';native().status={state:'not_installed',actions:[{kind:'install'}]};await entry.click();await page.locator('[data-feature-component=quickstart-native]').waitFor();assert.equal(await page.locator('[data-prepare-component=quickstart-native]').count(),0);await screenshot(name+'-pending');await page.keyboard.press('Escape');delete native().operation;
   native().status={state:'unsupported',reason:'interface_not_supported',actions:[{kind:'retry'}]};await entry.click();await page.locator('[data-feature-component=quickstart-native]').waitFor();assert.equal(await page.locator('[data-prepare-component=quickstart-native]').count(),0);await page.keyboard.press('Escape');
  }
  const extra={};
  if(extended&&projected){
   native().status={state:'not_installed',actions:[{kind:'install'}]};delete native().operation;
   await entry.click();await page.locator('[data-prepare-component=quickstart-native]').click();deferApply=true;
   const before=report.projectedCalls.filter(call=>call.key.endsWith('/capability-action/apply/')).length;
   await page.locator('[data-confirm-component]').click();await page.waitForFunction(()=>document.querySelector('.feature-progress')?.textContent.match(/操作已提交|Action submitted/));
   await page.locator('[data-close-components]').click();await page.locator('[data-feature-overlay]').waitFor({state:'hidden'});await entry.click();await page.locator('[data-feature-component=quickstart-native]').waitFor();
   assert.equal(await page.locator('[data-prepare-component]:enabled').count(),0);
   assert.equal(report.projectedCalls.filter(call=>call.key.endsWith('/capability-action/apply/')).length,before+1,'Reopen duplicated submitted operation');
   await screenshot(name+'-reopened-progress');releaseApply();deferApply=false;
   await page.waitForFunction(()=>document.querySelector('[data-feature-component=quickstart-native]')?.textContent.match(/未启用|Not enabled/));
   await page.keyboard.press('Escape');extra.submittedCloseReopen=true;
  }
  if(extended){
   await page.locator('.primary-tabs button').nth(0).click();const row=page.locator('[data-device-id]:visible').first();await row.click();await page.locator('.drawer-tabs button').nth(3).click();
   const nestedEntry=page.locator('[data-device-components]');await nestedEntry.waitFor();const overflow=await page.evaluate(()=>document.body.style.overflow);
   const fields=page.locator('.policy-panel input[type=number]');let pending;
   if(projected){await fields.first().fill('23');await fields.nth(1).fill('47');await page.locator('.policy-card').filter({has:nestedEntry}).locator('button').last().click();await page.locator('.policy-plan').waitFor();pending=await page.locator('.policy-plan').innerText()}
   await nestedEntry.click();await page.locator('[data-feature-component=quickstart-native]:visible').waitFor();
   assert.equal(await page.locator('[data-configure-component]').count(),0,'Device detail unexpectedly navigates to settings');
   const coverage=await titleCoverage();assert.ok(coverage.unobscured,'Nested heading is obscured');await screenshot(name+'-nested-components');
   await page.keyboard.press('Escape');await page.locator('[data-feature-overlay]').waitFor({state:'hidden'});assert.equal(await page.locator('.device-drawer').isVisible(),true,'Escape closed parent detail');
   assert.equal(await nestedEntry.evaluate(node=>node===document.activeElement),true);assert.equal(await page.evaluate(()=>document.body.style.overflow),overflow);
   if(projected){assert.equal(await fields.first().inputValue(),'23');assert.equal(await fields.nth(1).inputValue(),'47');assert.equal(await page.locator('.policy-plan').innerText(),pending)}
   await nestedEntry.click();await page.locator('[data-close-components]:visible').click();await page.locator('.drawer-close').click();assert.equal(await page.locator('[data-feature-overlay]').count(),0,'Unmount left a teleported overlay');assert.equal(await page.locator('[inert]').count(),0,'Unmount leaked inert');
   extra.nested={coverage,draftPreserved:projected,escapeOnlyClosesChild:true,focusAndScrollRestored:true,unmountClean:true};
  }
  report.views.push({...c,bodyReads,metrics:m,draftsAndExplicitSwitch:projected,extra,resources});await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.blocked,[]);report.result='passed';
}catch(error){report.result='failed';report.failure=error.stack;process.exitCode=1;if(page)await screenshot('failure').catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,rehearsal,projected,views:report.views.length,errors:report.errors,blocked:report.blocked,failure:report.failure},null,2));}})();
