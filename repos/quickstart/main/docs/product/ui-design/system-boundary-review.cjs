// Current host/content boundary acceptance; always inspect the public entry.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base='http://192.168.9.19:5180';
const root=path.resolve('docs/archive/evidence/m66/system-boundary');
fs.mkdirSync(root,{recursive:true});
const report={checkedAt:new Date().toISOString(),base,layouts:[],interactions:[],errors:[],outside:[],visualStatus:'requires_user_review'};
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 page.on('request',r=>{if(new URL(r.url()).origin!==base)report.outside.push(r.url())});
 const visit=async query=>{await page.goto(base+'/?'+query,{waitUntil:'networkidle'});await page.locator('[data-native-chart] canvas').first().waitFor()};
 const reserve=()=>page.locator('[data-system-menu-reserve]').evaluate(e=>({html:e.outerHTML,background:getComputedStyle(e).backgroundColor}));
 async function withinContent(selector){
  const boxes=await page.locator(selector).evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width&&getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}));
  const contentLeft=await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left);
  for(const r of boxes){assert.ok(r.left>=contentLeft-.5,`${selector} crossed host boundary: ${JSON.stringify(r)}`);assert.ok(r.right<=await page.evaluate(()=>innerWidth)+.5,`${selector} crossed right viewport`)}
  return boxes;
 }
 try{
  let immutable;
  for(const [viewport,width,height] of [['desktop',1440,1000],['tablet',1024,768],['phone',390,844]]){
   await page.setViewportSize({width,height});
   for(const variant of ['canvas','sidebar','stage'])for(const theme of ['light','dark']){
    await visit(`variant=${variant}&theme=${theme}`);
    immutable??=await reserve();assert.deepEqual(await reserve(),immutable);
    assert.equal(await page.locator('[data-system-menu-reserve] button,[data-system-menu-reserve] a,[data-system-menu-reserve] input').count(),0);
    assert.equal(await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left),width<=760?0:200);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await withinContent('.canvas-home,.canvas-action-dock,.canvas-variant-picker');
    if(width>760&&variant!=='stage'){
     const tools=await page.locator('.canvas-navigation').boundingBox();const workspace=await page.locator('.canvas-workspace').boundingBox();
     assert.ok(tools.x>=workspace.x+workspace.width,'home tools must be on the right of content');
     assert.equal(await page.locator('[data-config-tool]').count(),8);
    }
    assert.equal(await page.locator('[data-canvas-device]').count(),width<=760?3:6);
    const graphic=await page.locator('[data-native-chart] canvas').first().evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height}});
    assert.ok(graphic.width>200&&graphic.height>180);
    await page.screenshot({path:path.join(root,`${variant}-${viewport}-${theme}.png`)});
    await page.getByRole('button',{name:'自定义首页',exact:true}).click();
    await withinContent('.canvas-overlay,.canvas-editor');
    assert.equal(await page.locator('.canvas-editor [data-system-menu-reserve]').count(),0);
    await page.locator('#canvas-enable-docker').uncheck();assert.deepEqual(await reserve(),immutable);
    await page.keyboard.press('Escape');
    if(width<=760||variant==='stage'){
     const before=await page.locator('.canvas-action-dock').boundingBox();
     await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
     const after=await page.locator('.canvas-action-dock').boundingBox();assert.equal(after.y,before.y);
     await page.locator('.dock-tools').click();await withinContent('.canvas-overlay,.canvas-tool-tray');
     assert.equal(await page.locator('.canvas-tool-tray [data-config-tool]').count(),8);
     await page.screenshot({path:path.join(root,`${variant}-${viewport}-${theme}-tools.png`)});
     await page.keyboard.press('Escape');
    }
    assert.deepEqual(await reserve(),immutable);
    report.layouts.push({variant,viewport,theme,graphic,contentLeft:width<=760?0:200});
   }
  }
  await page.setViewportSize({width:1440,height:1000});await visit('variant=canvas&theme=dark');
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  await page.screenshot({path:path.join(root,'desktop-editor.png')});await page.keyboard.press('Escape');
  const id=await page.locator('[data-canvas-device]').first().getAttribute('data-canvas-device');
  await page.locator('[data-canvas-device]').first().click();await page.locator('.device-drawer').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('device'),id);
  await withinContent('.drawer-backdrop,.device-drawer');assert.deepEqual(await reserve(),immutable);
  await page.screenshot({path:path.join(root,'desktop-device-detail.png')});
  await page.locator('.drawer-close').click();await page.locator('.breadcrumbs a').click();await page.locator('[data-canvas-home]').waitFor();
  report.interactions.push('stable identity navigation, real device drawer and return remain within host boundary');
  await page.locator('.canvas-navigation [data-quick-entry="/network"]').click();await page.locator('.destination').waitFor();
  assert.equal(new URL(page.url()).pathname,'/network');assert.deepEqual(await reserve(),immutable);
  report.interactions.push('home tools navigate without changing host reference');
  for(const variant of ['canvas','sidebar','stage']){
   await visit('variant='+variant+'&scenario=many');assert.equal(await page.locator('[data-canvas-device]').count(),6);assert.deepEqual(await reserve(),immutable);
  }
  report.interactions.push('128 devices keep host reference unchanged');
  await page.setViewportSize({width:320,height:740});await visit('variant=canvas&lang=en');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await withinContent('.canvas-action-dock,.canvas-variant-picker');
  report.interactions.push('320px English content remains within viewport');
  assert.equal(report.errors.length,0);assert.equal(report.outside.length,0);
  report.result='pass';console.log(`PASS: ${report.layouts.length} boundary layouts, ${report.interactions.length} navigation/state checks`);
 }catch(e){report.result='fail';report.failure=e.stack;throw e}
 finally{fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
