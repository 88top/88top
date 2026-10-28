// Current default A: place actions in their modules, retain hidden-module destinations.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base='http://192.168.9.19:5180';
const root=path.resolve('docs/archive/evidence/m66/contextual-actions');fs.mkdirSync(root,{recursive:true});
const destinations=['/network','/devicemanagement','/networkSpeedTest','/parental','/applications'];
const report={checkedAt:new Date().toISOString(),base,layouts:[],visibilityCombinations:[],states:[],navigation:[],errors:[],outside:[],visualStatus:'requires_user_confirmation'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 page.on('request',r=>{if(new URL(r.url()).origin!==base)report.outside.push(r.url())});
 const visit=async query=>{await page.goto(base+'/?variant=canvas&'+query,{waitUntil:'networkidle'});await page.locator('[data-native-chart] canvas').first().waitFor()};
 const entry=dest=>page.locator(`[data-home-entry="${dest}"]`);
 const reserve=()=>page.locator('[data-system-menu-reserve]').evaluate(e=>e.outerHTML);
 const bounds=async selector=>{
  const result=await page.locator(selector).evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width).map(e=>{const r=e.getBoundingClientRect();return {x:r.left,right:r.right}}));
  const left=await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left),right=await page.evaluate(()=>innerWidth);
  for(const r of result)assert.ok(r.x>=left-.5&&r.right<=right+.5,`${selector} crossed content boundary: ${JSON.stringify(r)}`);
 };
 const allEntries=async()=>{for(const dest of destinations){assert.equal(await entry(dest).count(),1,`one destination ${dest}`);assert.ok(await entry(dest).isVisible(),`destination visible ${dest}`)}};
 try{
  let host;
  for(const [viewport,width,height] of [['desktop',1440,1000],['tablet',1024,768],['phone',390,844]]){
   await page.setViewportSize({width,height});
   for(const theme of ['light','dark']){
    await visit('theme='+theme);host??=await reserve();assert.equal(await reserve(),host);
    assert.equal(await page.locator('.canvas-navigation,.canvas-action-dock').count(),0);
    await allEntries();assert.equal(await page.locator('[data-config-tool]').count(),8);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await bounds('.canvas-home,.canvas-variant-picker,[data-home-entry]');
    const graphic=await page.locator('[data-native-chart] canvas').first().evaluate(e=>{const r=e.getBoundingClientRect(),data=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let cyan=0;for(let y=1;y<20;y++)for(let x=1;x<20;x++){const i=(Math.floor(e.height*y/20)*e.width+Math.floor(e.width*x/20))*4;const [red,g,b]=data.slice(i,i+3);if(g>90&&b>120&&b>red+40&&red<150)cyan++}return {width:r.width,height:r.height,cyan}});
    assert.ok(graphic.width>200&&graphic.height>180&&graphic.cyan>10,'original graph must actually paint');
    assert.equal(await page.locator('[data-canvas-device]').count(),width<=760?3:6);
    await page.screenshot({path:path.join(root,`default-${viewport}-${theme}.png`),fullPage:true});await page.screenshot({path:path.join(root,`first-screen-${viewport}-${theme}.png`)});
    await page.getByRole('button',{name:'自定义首页',exact:true}).click();await bounds('.canvas-overlay,.canvas-editor');
    await page.locator('#canvas-enable-connection').uncheck();await page.locator('#canvas-enable-devices').uncheck();await page.locator('#canvas-enable-tools').uncheck();
    await page.getByRole('button',{name:'应用布局',exact:true}).click();await page.locator('[data-open-common-tools]').click();await bounds('.canvas-overlay,.canvas-tool-tray,.common-tools-access');
    await allEntries();assert.equal(await page.locator('.canvas-tool-tray [data-config-tool]').count(),8);assert.equal(await reserve(),host);
    await page.screenshot({path:path.join(root,`collapsed-tools-${viewport}-${theme}.png`)});await page.keyboard.press('Escape');
    report.layouts.push({viewport,theme,graphic});
   }
  }
  // Three independently selectable overview modules: all eight combinations.
  await page.setViewportSize({width:1440,height:1000});
  for(let mask=0;mask<8;mask++){
   await visit('theme=light');await page.getByRole('button',{name:'自定义首页',exact:true}).click();
   const visible={};for(const [i,id] of ['connection','devices','tools'].entries()){visible[id]=Boolean(mask&(1<<i));await page.locator('#canvas-enable-'+id).setChecked(visible[id])}
   await page.getByRole('button',{name:'应用布局',exact:true}).click();if(!visible.tools)await page.locator('[data-open-common-tools]').click();
   await allEntries();const common=await page.locator('[data-common-tools] [data-home-entry]').evaluateAll(es=>es.map(e=>e.dataset.homeEntry));
   assert.deepEqual(common,['/network','/devicemanagement','/parental','/applications'].filter(dest=>dest==='/applications'||dest==='/network'&&!visible.connection||['/devicemanagement','/parental'].includes(dest)&&!visible.devices));
   assert.equal(await reserve(),host);report.visibilityCombinations.push({visible,common});
  }
  for(const scenario of ['many','empty','error','old','no-speed','network-error']){
   await visit('scenario='+scenario);await allEntries();assert.equal(await page.locator('[data-config-tool]').count(),8);assert.equal(await reserve(),host);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);report.states.push(scenario);
  }
  // All five actual destinations, both ordinary module actions and fallback panel.
  for(const fallback of [false,true])for(const dest of destinations){
   await visit('theme=light');
   if(fallback){await page.getByRole('button',{name:'自定义首页',exact:true}).click();for(const id of ['connection','devices','tools'])await page.locator('#canvas-enable-'+id).uncheck();await page.getByRole('button',{name:'应用布局',exact:true}).click();if(dest!=='/networkSpeedTest')await page.locator('[data-open-common-tools]').click()}
   await entry(dest).click();await page.locator(dest==='/devicemanagement'?'.device-center':'.destination').waitFor();
   assert.equal(new URL(page.url()).pathname,dest);assert.equal(await reserve(),host);report.navigation.push({dest,fallback});
  }
  await visit('theme=light');const id=await page.locator('[data-canvas-device]').first().getAttribute('data-canvas-device');await page.locator('[data-canvas-device]').first().click();await page.locator('.device-drawer').waitFor();assert.equal(new URL(page.url()).searchParams.get('device'),id);await bounds('.drawer-backdrop,.device-drawer');
  await page.getByRole('button',{name:'网络与上网',exact:true}).click();assert.equal(await page.locator('.policy-panel select').isDisabled(),true);await page.locator('.drawer-close').click();await page.locator('.breadcrumbs a').click();await page.locator('[data-canvas-home]').waitFor();await allEntries();
  report.deviceIdentityAndAuthority='pass';
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('#canvas-enable-devices').uncheck();await page.getByRole('button',{name:'取消',exact:true}).click();assert.equal(await page.locator('[data-canvas-module=devices]').count(),1);assert.equal(await page.locator('[data-common-tools] [data-home-entry]').count(),1);report.cancel='pass';
  await page.setViewportSize({width:320,height:740});await visit('lang=en&theme=dark');await allEntries();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await bounds('[data-home-entry],.canvas-variant-picker');await page.screenshot({path:path.join(root,'small-phone-english.png'),fullPage:true});
  // Previous B/C remain available as comparison, with the same host boundary.
  for(const variant of ['sidebar','stage']){
   await page.goto(base+'/?variant='+variant+'&theme=dark',{waitUntil:'networkidle'});await page.locator('[data-native-chart] canvas').first().waitFor();assert.equal(await page.locator('.canvas-action-dock').isVisible(),true);await bounds('.canvas-action-dock,.canvas-variant-picker');assert.equal(await reserve(),host);
  }
  await visit('theme=light');const stats=()=>page.evaluate(()=>window.__quickstartDesign.requests.filter(r=>r.path==='/u/network/statistics/').length);
  assert.equal(await stats(),1);await sleep(6200);assert.equal(await stats(),2);await entry('/devicemanagement').click();await page.locator('.device-center').waitFor();const before=await stats();await sleep(6200);assert.equal(await stats(),before);report.sampling='one native sampler; stopped on home unmount';
  assert.equal(report.errors.length,0);assert.equal(report.outside.length,0);report.result='pass';console.log(`PASS: ${report.layouts.length} responsive/theme layouts, ${report.visibilityCombinations.length} visibility combinations, ${report.navigation.length} destination journeys`);
 }catch(e){report.result='fail';report.failure=e.stack;throw e}
 finally{fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
