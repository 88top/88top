// Current canvas prototype acceptance. Synthetic API fixtures only.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve('docs/archive/evidence/m66/canvas');fs.mkdirSync(root,{recursive:true});
const base='http://192.168.98.2:5180';
const report={checkedAt:new Date().toISOString(),layouts:[],states:[],interactions:[],sampling:[],errors:[],outside:[],visualStatus:'requires_human_screenshot_review'};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 page.on('request',r=>{if(new URL(r.url()).origin!==base)report.outside.push(r.url())});
 async function visit(query=''){await page.goto(base+'/?'+query,{waitUntil:'networkidle'});await page.locator('[data-native-chart] canvas').first().waitFor()}
 const countStats=()=>page.evaluate(()=>window.__quickstartDesign.requests.filter(r=>r.path==='/u/network/statistics/').length);
 const moduleIds=()=>page.locator('[data-canvas-module]').evaluateAll(es=>es.map(e=>e.dataset.canvasModule));
 const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 try{
  for(const [viewport,width,height] of [['desktop',1440,1000],['tablet',1024,768],['phone',390,844]]){
   await page.setViewportSize({width,height});
   for(const variant of ['canvas','sidebar','stage'])for(const theme of ['light','dark']){
    await visit(`variant=${variant}&theme=${theme}&tools=0`);
    assert.equal(await overflow(),false,`${variant}/${viewport}/${theme} overflow`);
    assert.equal(await page.locator('[data-canvas-device]').count(),width<=760?3:6);
    assert.equal(await page.locator('.canvas-header [data-quick-entry],.canvas-header [data-dock-entry]').count(),0);
    const palette=await page.evaluate(()=>{const s=getComputedStyle(document.querySelector('.canvas-home'));return {ink:s.getPropertyValue('--c-text').trim(),panel:s.getPropertyValue('--c-panel').trim()}});
    assert.equal(palette.ink,theme==='dark'?'#edf0f7':'#1c253b');assert.equal(palette.panel,theme==='dark'?'#2c2c2c':'#fff');
    const graphic=await page.locator('[data-native-chart] canvas').first().evaluate(canvas=>{const rect=canvas.getBoundingClientRect();const ctx=canvas.getContext('2d');const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let cyan=0;for(let y=1;y<20;y++)for(let x=1;x<20;x++){const i=(Math.floor(canvas.height*y/20)*canvas.width+Math.floor(canvas.width*x/20))*4;const [r,g,b]=data.slice(i,i+3);if(g>90&&b>120&&b>r+40&&r<150)cyan++}return {width:rect.width,height:rect.height,cyan}});
    assert.ok(graphic.width>200);assert.ok(graphic.height>180);assert.ok(graphic.cyan>10,'original area chart must paint, not only create a canvas');
    assert.equal((await moduleIds()).length,7);
    if(width<=760||variant==='stage'){
     assert.equal(await page.locator('.canvas-action-dock').isVisible(),true);
     await page.locator('.dock-tools').click();await page.locator('.canvas-tool-tray').waitFor();
     assert.equal(await page.locator('.canvas-tool-tray [data-config-tool]').count(),8);
     await page.locator('.tray-close').click();
    }else assert.equal(await page.locator('[data-config-tool]').count(),8);
    await page.screenshot({path:path.join(root,`${variant}-${viewport}-${theme}.png`),fullPage:true});
    if(viewport==='desktop')await page.screenshot({path:path.join(root,`${variant}-first-screen-${theme}.png`)});
    report.layouts.push({variant,viewport,theme,graphic,deviceRows:width<=760?3:6});
   }
  }
  await page.setViewportSize({width:320,height:740});await visit('variant=canvas&lang=en&theme=dark');
  assert.equal(await overflow(),false);assert.match(await page.locator('h1').innerText(),/Network overview/);
  await page.locator('.dock-tools').click();assert.equal(await page.locator('.canvas-tool-tray [data-config-tool]').count(),8);await page.screenshot({path:path.join(root,'small-phone-english-tools.png')});await page.locator('.tray-close').click();
  report.interactions.push('320px English layout and tools');
  await page.setViewportSize({width:1440,height:1000});
  const stateChecks={many:/128 台/,empty:/暂未发现设备/,loading:/正在读取设备清单/,error:/设备清单暂不可用/,stale:/上次快照/,old:/后端版本不兼容/,permission:/登录或读取权限失效/,'no-speed':/设备流量服务未安装/,disabled:/设备流量服务未启用/,'speed-error':/设备流量服务异常/,unsupported:/固件不支持设备流量服务/,'network-error':/流量采样暂不可用/,'storage-error':/磁盘信息暂不可用/,'services-error':/不可用/};
  for(const [scenario,expectation] of Object.entries(stateChecks)){
   await visit(`variant=canvas&scenario=${scenario}&theme=dark&tools=0`);
   assert.match(await page.locator('body').innerText(),expectation);
   if(scenario==='many'){assert.equal(await page.locator('[data-canvas-device]').count(),6);assert.match(await page.locator('.inventory-heading').innerText(),/96/)}
   if(scenario==='stale')assert.match(await page.locator('.inventory-heading').innerText(),/上次在线/);
   if(['no-speed','disabled','speed-error','unsupported'].includes(scenario))assert.equal(await page.locator('[data-canvas-device]').count(),6);
   assert.equal(await overflow(),false);await page.screenshot({path:path.join(root,`state-${scenario}.png`),fullPage:true});report.states.push(scenario);
  }
  await visit('scenario=error');await page.locator('[data-canvas-module=devices]').getByRole('button',{name:'重试',exact:true}).click();await page.locator('[data-canvas-device]').first().waitFor();report.interactions.push('inventory retry');
  // More devices cannot push the configuration tools away.
  for(const variant of ['canvas','sidebar','stage']){
   await visit(`variant=${variant}&tools=0`);const position=()=>page.locator(variant==='canvas'?'.hero-tools':variant==='sidebar'?'.canvas-navigation.expanded':'.dock-tools').boundingBox();const before=await position();
   await visit(`variant=${variant}&scenario=many&tools=0`);const after=await position();assert.ok(Math.abs(before.y-after.y)<1,`${variant} tools moved because inventory grew`);
   report.interactions.push(`${variant}: configuration position stable with 128 devices`);
  }
  await visit('variant=canvas');const original=await moduleIds();
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('#canvas-enable-docker').uncheck();assert.equal(await page.locator('[data-canvas-module=docker]').count(),0);
  await page.getByRole('button',{name:'取消',exact:true}).click();assert.deepEqual(await moduleIds(),original);
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('#canvas-enable-downloads').uncheck();
  await page.getByRole('button',{name:'上移系统状态',exact:true}).click();await page.getByLabel('系统状态宽度',{exact:true}).selectOption('12');
  assert.equal((await moduleIds())[0],'system');assert.equal(await page.locator('[data-canvas-module=system]').evaluate(e=>getComputedStyle(e).getPropertyValue('--span').trim()),'12');
  await page.screenshot({path:path.join(root,'editor-desktop.png')});await page.getByRole('button',{name:'应用布局',exact:true}).click();assert.equal(await page.locator('[data-canvas-module=downloads]').count(),0);report.interactions.push('independent service toggles, reorder, full width, live draft, apply/cancel');
  const id=await page.locator('[data-canvas-device]').first().getAttribute('data-canvas-device');await page.locator('[data-canvas-device]').first().click();await page.locator('.device-drawer').waitFor();assert.equal(new URL(page.url()).searchParams.get('device'),id);
  await page.getByRole('button',{name:'网络与上网',exact:true}).click();assert.equal(await page.locator('.policy-panel select').isDisabled(),true);
  await page.getByRole('button',{name:'设备资料',exact:true}).click();await page.locator('.profile-editor input').first().fill('设计测试工作电脑');await page.getByRole('button',{name:'保存设备资料',exact:true}).click();await page.getByText('设备资料已更新',{exact:true}).waitFor();await page.locator('.drawer-close').click();await page.locator('.breadcrumbs a').click();
  await page.locator('[data-canvas-device]').first().waitFor();assert.match(await page.locator('[data-canvas-device]').first().innerText(),/设计测试工作电脑/);assert.equal(await page.locator('[data-canvas-module=downloads]').count(),0);
  await page.locator('[data-canvas-view-all]').click();await page.locator('.device-center').waitFor();assert.equal(await page.locator('.device-filters button:nth-child(2)').evaluate(e=>e.classList.contains('active')),true);
  report.interactions.push('same identity, real detail/profile, DHCP authority, return retains layout, view all');
  await visit('variant=canvas&authority=local');await page.locator('[data-canvas-device]').first().click();await page.locator('.device-drawer').waitFor();await page.getByRole('button',{name:'网络与上网',exact:true}).click();assert.equal(await page.locator('.policy-panel select').isDisabled(),false);report.interactions.push('local DHCP authority editable');
  await visit('variant=canvas');await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('[data-canvas-editor=system] .editor-drag').dragTo(page.locator('[data-canvas-editor=devices]'));assert.equal((await moduleIds())[0],'system');
  await page.getByRole('button',{name:'恢复当前预设',exact:true}).click();assert.deepEqual(await moduleIds(),original);
  await page.locator('.canvas-presets button').nth(1).click();await page.getByRole('button',{name:'取消',exact:true}).click();assert.equal(await page.locator('.canvas-home').evaluate(e=>e.classList.contains('layout-canvas')),true);assert.deepEqual(await moduleIds(),original);report.interactions.push('drag, restore preset, cancel variant');
  // All navigation entries and tools retain actual destinations.
  for(const entry of ['/network','/networkSpeedTest','/parental','/applications']){await visit('variant=canvas');await page.locator(`.canvas-navigation [data-quick-entry="${entry}"]`).click();await page.locator('.destination').waitFor();assert.equal(new URL(page.url()).pathname,entry)}
  for(const entry of ['/lan','/terminal','/update','/dns','/sources','/sandbox','/logs','/maintenance']){await visit('variant=canvas');await page.locator(`.hero-tools [data-config-tool="${entry}"]`).click();await page.locator('.destination').waitFor();assert.equal(new URL(page.url()).pathname,entry)}
  report.interactions.push('four non-device quick entries and eight configuration destinations');
  await page.setViewportSize({width:390,height:844});await visit('variant=canvas&theme=dark');await page.screenshot({path:path.join(root,'phone-dark-viewport.png')});
  await page.locator('.dock-tools').click();await page.screenshot({path:path.join(root,'phone-tools.png')});await page.keyboard.press('Escape');assert.equal(await page.locator('.canvas-tool-tray').count(),0);
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('.canvas-editor .editor-close').focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('.editor-apply').evaluate(e=>document.activeElement===e),true);await page.keyboard.press('Tab');assert.equal(await page.locator('.canvas-editor .editor-close').evaluate(e=>document.activeElement===e),true);await page.screenshot({path:path.join(root,'phone-editor.png')});await page.keyboard.press('Escape');report.interactions.push('mobile fixed dock, tools, editor focus, Escape');
  await page.locator('.canvas-scenes summary').click();await page.getByLabel('数据场景',{exact:true}).selectOption('empty');await page.getByText('暂未发现设备',{exact:true}).waitFor();await page.getByLabel('数据场景',{exact:true}).selectOption('normal');await page.locator('[data-canvas-device]').first().waitFor();await page.locator('.canvas-scenes summary').click();await page.getByRole('button',{name:'切换主题',exact:true}).click();await page.locator('[data-native-chart] canvas').waitFor();assert.equal(await page.locator('body').getAttribute('theme'),'light');report.interactions.push('live scene and theme');
  // Disable a module, then resume visibility: no hidden-module reads are issued.
  await page.setViewportSize({width:1440,height:1000});await visit('variant=canvas');await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('#canvas-enable-downloads').uncheck();await page.getByRole('button',{name:'应用布局',exact:true}).click();
  await page.evaluate(()=>{window.__quickstartDesign.requests.length=0;document.dispatchEvent(new Event('visibilitychange'))});await sleep(150);assert.equal(await page.evaluate(()=>window.__quickstartDesign.requests.some(r=>r.path==='/guide/download-service/status/')),false);report.sampling.push('disabled download module not read on resume');
  await visit('variant=canvas');assert.equal(await countStats(),1);await sleep(6200);assert.equal(await countStats(),2);report.sampling.push('one graph sampler: 2 statistics reads over initial + 6.2s');
  await page.locator('[data-canvas-view-all]').click();await page.locator('.device-center').waitFor();const before=await countStats();await sleep(6200);assert.equal(await countStats(),before);report.sampling.push('home unmount stops original graph reads (6.2s)');
  const isolation=await page.evaluate(async()=>({unknown:(await fetch('/cgi-bin/luci/istore/not-a-fixture/')).status,mutation:(await fetch('/cgi-bin/luci/istore/system/reboot/',{method:'POST'})).status}));assert.deepEqual(isolation,{unknown:501,mutation:403});report.isolation=isolation;
  assert.equal(report.errors.length,0);assert.equal(report.outside.length,0);report.result='pass';console.log(`PASS: ${report.layouts.length} layouts, ${report.states.length} states, ${report.interactions.length} interaction groups, ${report.sampling.length} sampling checks`);
 }catch(e){report.result='fail';report.failure=e.stack;throw e}
 finally{fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
