// Repeatable design acceptance. Browser interaction, no physical-router writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=path.resolve('docs/archive/evidence/m66/redesign');
fs.mkdirSync(output,{recursive:true});
const base='http://192.168.98.2:5180';
const report={checkedAt:new Date().toISOString(),viewports:[],states:[],interactions:[],contrast:[],errors:[],outside:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text())});
 page.on('request',request=>{if(new URL(request.url()).origin!==base)report.outside.push(request.url())});
 try{
  for(const [viewport,width,height] of [['desktop',1440,1000],['tablet',1024,768],['mobile',390,844]]){
   await page.setViewportSize({width,height});
   for(const variant of ['studio','network','device'])for(const theme of ['light','dark']){
    await page.goto(`${base}/?variant=${variant}&theme=${theme}&tools=0`,{waitUntil:'networkidle'});
    await page.locator('[data-studio-device]').first().waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${variant}/${viewport}/${theme} overflow`);
    assert.equal(await page.locator('[data-studio-device]').count(),width<700?3:6);
    assert.equal(await page.locator('body').getAttribute('theme'),theme);
    assert.match(await page.locator('.traffic-metrics').innerText(),/368\.6.*KB\/s/s);
    assert.match(await page.locator('.traffic-metrics').innerText(),/20\.5.*KB\/s/s);
    const colors=await page.evaluate(()=>{
     const home=document.querySelector('.studio-home');
     const style=getComputedStyle(home);
     return {background:getComputedStyle(document.querySelector('.studio-panel')).backgroundColor,ink:style.getPropertyValue('--s-ink').trim(),muted:style.getPropertyValue('--s-muted').trim(),accent:style.getPropertyValue('--s-accent').trim(),good:style.getPropertyValue('--s-good').trim()};
    });
    assert.equal(colors.ink,theme==='dark'?'#eef1fb':'#192239','actual palette must match the selected theme');
    assert.equal(colors.background,theme==='dark'?'rgb(26, 32, 48)':'rgb(255, 255, 255)','panel theme must render, not merely change the body attribute');
    const rgb=value=>value.startsWith('#')?value.slice(1).match(/../g).map(v=>parseInt(v,16)):value.match(/[\d.]+/g).slice(0,3).map(Number);
    const luminance=value=>rgb(value).map(c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0);
    for(const kind of ['ink','muted','accent','good']){
     const light=luminance(colors[kind]),bg=luminance(colors.background),ratio=(Math.max(light,bg)+.05)/(Math.min(light,bg)+.05);
     assert.ok(ratio>=4.5,`${theme} ${kind}: contrast ${ratio}`);
     if(viewport==='desktop'&&variant==='studio')report.contrast.push({theme,kind,ratio:Number(ratio.toFixed(2))});
    }
    await page.screenshot({path:path.join(output,`${variant}-${viewport}-${theme}.png`),fullPage:true});
    report.viewports.push({variant,viewport,theme,width,deviceRows:await page.locator('[data-studio-device]').count()});
   }
  }
  // Include a small phone and English, not only the Chinese desktop.
  await page.setViewportSize({width:320,height:740});
  await page.goto(`${base}/?variant=device&lang=en&theme=dark`,{waitUntil:'networkidle'});
  assert.match(await page.locator('h1').innerText(),/Home control center/);
  assert.match(await page.locator('[data-module=devices]').innerText(),/LAN devices/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(output,'small-phone-english.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  for(const scenario of ['many','empty','loading','error','stale','old','permission','no-speed','disabled','speed-error','unsupported','network-error','storage-error','services-error']){
   await page.goto(`${base}/?variant=studio&scenario=${scenario}&theme=dark&tools=0`,{waitUntil:'networkidle'});
   const body=await page.locator('body').innerText();
   if(scenario==='many'){assert.match(body,/96.*在线/s);assert.match(body,/128 台/);assert.equal(await page.locator('[data-studio-device]').count(),6)}
   if(scenario==='empty')assert.match(body,/还没有发现设备/);
   if(scenario==='loading')assert.match(body,/正在读取设备清单/);
   if(scenario==='error')assert.match(body,/设备清单暂不可用/);
   if(scenario==='stale'){assert.match(body,/上次快照/);assert.equal(await page.locator('[data-studio-device]').count(),6)}
   if(scenario==='old')assert.match(body,/后端版本不兼容/);
   if(scenario==='permission')assert.match(body,/登录或读取权限失效/);
   if(['no-speed','disabled','speed-error','unsupported'].includes(scenario)){assert.equal(await page.locator('[data-studio-device]').count(),6);assert.match(body,/设备清单仍可查看/)}
   if(scenario==='network-error'){assert.match(body,/连接状态未知/);assert.match(body,/流量暂不可用/);assert.equal(await page.locator('[data-studio-device]').count(),6)}
   if(scenario==='storage-error'){assert.match(body,/存储信息暂不可用/);assert.equal(await page.locator('[data-studio-device]').count(),6)}
   if(scenario==='services-error'){assert.match(await page.locator('[data-module=services]').innerText(),/不可用/);assert.equal(await page.locator('[data-studio-device]').count(),6)}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(output,`state-${scenario}.png`),fullPage:true});report.states.push(scenario);
  }
  await page.goto(`${base}/?scenario=error`,{waitUntil:'networkidle'});
  await page.locator('[data-module=devices]').getByRole('button',{name:'重试',exact:true}).click();
  await page.locator('[data-studio-device]').first().waitFor();report.interactions.push('inventory retry');
  await page.goto(`${base}/`,{waitUntil:'networkidle'});
  const moduleIds=()=>page.locator('[data-module]').evaluateAll(elements=>elements.map(e=>e.dataset.module));
  const original=await moduleIds();
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  await page.locator('#module-storage').uncheck();
  assert.equal(await page.locator('[data-module=storage]').count(),0);
  await page.getByRole('button',{name:'取消',exact:true}).click();
  assert.deepEqual(await moduleIds(),original);report.interactions.push('live draft and cancel');
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  await page.locator('#module-storage').uncheck();
  await page.getByRole('button',{name:'上移局域网设备',exact:true}).click();
  await page.getByLabel('局域网设备宽度',{exact:true}).selectOption('12');
  assert.equal((await moduleIds())[0],'devices');
  assert.equal(await page.locator('[data-module=devices]').evaluate(el=>getComputedStyle(el).getPropertyValue('--module-span').trim()),'12');
  const draftWidth=await page.locator('[data-module=devices]').evaluate(el=>el.getBoundingClientRect().width);
  const gridWidth=await page.locator('.studio-grid').evaluate(el=>el.getBoundingClientRect().width);
  assert.ok(Math.abs(draftWidth-gridWidth)<2,'full-row draft must occupy the grid width');
  await page.getByRole('button',{name:'应用布局',exact:true}).click();
  assert.equal(await page.locator('[data-module=storage]').count(),0);
  report.interactions.push('toggle, reorder, full-width, apply');
  const id=await page.locator('[data-studio-device]').first().getAttribute('data-studio-device');
  await page.locator('[data-studio-device]').first().click();
  await page.locator('.device-drawer').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('device'),id);
  await page.getByRole('button',{name:'网络与上网',exact:true}).click();
  assert.equal(await page.locator('.policy-panel select').isDisabled(),true);
  await page.screenshot({path:path.join(output,'device-details.png'),fullPage:true});
  await page.locator('.drawer-close').click();await page.locator('.breadcrumbs a').click();
  await page.locator('[data-studio-device]').first().waitFor();
  assert.equal(await page.locator('[data-module=storage]').count(),0);assert.equal((await moduleIds())[0],'devices');
  report.interactions.push('stable identity, real drawer, DHCP authority, return preserves layout');
  await page.locator('[data-view-all]').click();await page.locator('.device-center').waitFor();
  assert.equal(await page.locator('.device-filters button:nth-child(2)').evaluate(el=>el.classList.contains('active')),true);
  report.interactions.push('view all opens complete inventory');
  await page.goto(`${base}/`,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  // HTML5 drag interaction; the handle does not turn nested inputs into drag targets.
  await page.locator('[data-editor-module=devices] .drag-handle').dragTo(page.locator('[data-editor-module=traffic]'));
  assert.equal((await moduleIds())[0],'devices');
  await page.getByRole('button',{name:'恢复当前预设',exact:true}).click();assert.deepEqual(await moduleIds(),original);
  for(const key of ['devices','connection','storage','services','system','shortcuts']){
   const checkbox=page.locator(`#module-${key}`);if(await checkbox.isChecked())await checkbox.uncheck();
  }
  assert.equal(await page.locator('#module-traffic').isDisabled(),true);
  await page.getByRole('button',{name:'取消',exact:true}).click();report.interactions.push('drag, restore preset, last visible module protected');
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  await page.locator('.preset-picker button').nth(1).click();
  await page.getByRole('button',{name:'取消',exact:true}).click();
  assert.equal(await page.locator('.studio-grid').getAttribute('data-variant'),'studio');assert.deepEqual(await moduleIds(),original);
  report.interactions.push('cancel preset restores original');
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  await page.screenshot({path:path.join(output,'editor-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'取消',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/?theme=dark`,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  assert.equal(await page.locator('.layout-editor').getAttribute('aria-modal'),'true');
  await page.locator('.editor-close').focus();await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('.apply-layout').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Tab');assert.equal(await page.locator('.editor-close').evaluate(el=>el===document.activeElement),true);
  await page.screenshot({path:path.join(output,'editor-mobile.png'),fullPage:true});
  await page.keyboard.press('Escape');assert.equal(await page.locator('.layout-editor').count(),0);
  report.interactions.push('mobile editor, keyboard focus and Escape');
  await page.locator('.scene-controls summary').click();await page.getByLabel('场景',{exact:true}).selectOption('empty');
  await page.getByText('还没有发现设备',{exact:true}).waitFor();
  await page.getByLabel('场景',{exact:true}).selectOption('normal');await page.locator('[data-studio-device]').first().waitFor();
  await page.getByRole('button',{name:'切换深浅主题',exact:true}).click();assert.equal(await page.locator('body').getAttribute('theme'),'light');
  report.interactions.push('live scenario and theme switch');
  await page.goto(`${base}/`,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.activeElement.blur());await page.keyboard.press('ArrowRight');
  assert.equal(new URL(page.url()).searchParams.get('variant'),'network');
  await page.reload();assert.equal(await page.locator('.studio-grid').getAttribute('data-variant'),'network');
  report.interactions.push('keyboard variant and shareable URL');
  // Real elapsed time demonstrates that closing a module stops its existing poll.
  await page.goto(`${base}/`,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('#module-traffic').uncheck();
  await page.getByRole('button',{name:'应用布局',exact:true}).click();
  await sleep(100);
  const trafficCount=()=>page.evaluate(()=>window.__quickstartDesign.requests.filter(r=>r.path==='/u/network/statistics/').length);
  const count=await trafficCount();await sleep(6200);assert.equal(await trafficCount(),count);
  report.interactions.push('disabled module stops polling (6.2s)');
  await page.goto(`${base}/`,{waitUntil:'networkidle'});await page.locator('[data-view-all]').click();await page.locator('.device-center').waitFor();
  const before=await trafficCount();await sleep(6200);assert.equal(await trafficCount(),before);
  report.interactions.push('home unmount stops polling (6.2s)');
  assert.equal(report.errors.length,0);assert.equal(report.outside.length,0);
  report.result='pass';
  console.log(`PASS: ${report.viewports.length} responsive/theme layouts, ${report.states.length} scenarios, ${report.interactions.length} interaction checks`);
 }catch(error){report.result='fail';report.failure=error.stack;throw error}
 finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
