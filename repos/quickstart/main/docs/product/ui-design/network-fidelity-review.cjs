const {run,base}=require('./direct-test-utils.cjs'),path=require('node:path');
run('network-fidelity',async({page,assert,report,root,visit,pause})=>{
 const card=()=>page.locator('[data-connection-card]');
 await page.goto(base+'/?layout=baseline',{waitUntil:'networkidle'});
 const baseline=await page.locator('.reusable-card').filter({has:page.locator('.device-manage-btn')}).evaluate(e=>({fontFamily:getComputedStyle(e).fontFamily,titleColor:getComputedStyle(e.querySelector('.title')).color,addressColor:getComputedStyle(e.querySelector('.ip_address')).color}));
 report.original=baseline;
 await visit('&preset=network-business&scenario=network-reference');
 // Equal card dimensions and synthetic data isolate typography and hierarchy
 // from different devices, viewport widths and uptime values in user captures.
 await card().evaluate(e=>{e.style.width='382px';e.style.maxWidth='100%';e.style.height='320px'});
 await pause();
 const visual=await card().evaluate(e=>{const style=s=>getComputedStyle(e.querySelector(s)),box=s=>{const r=e.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};return {fontFamily:getComputedStyle(e).fontFamily,titleColor:style('h2').color,addressColor:style('dd').color,title:style('h2').fontSize,body:style('dd').fontSize,deviceButton:style('[data-connection-wizard]').fontSize,status:style('.connection-status-text strong').fontSize,radius:getComputedStyle(e).borderRadius,statusBox:box('.connection-status'),uptimeBox:box('[data-connection-uptime]'),ipv4Box:box('.connection-addresses dt'),protocolBox:box('.connection-ip-tag'),height:e.clientHeight,scrollHeight:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth}});
 assert.equal(visual.fontFamily,baseline.fontFamily);assert.equal(visual.titleColor,baseline.titleColor);assert.equal(visual.addressColor,baseline.addressColor);
 assert.equal(visual.title,'16px');assert.equal(visual.body,'14px');assert.equal(visual.status,'14px');assert.equal(visual.deviceButton,'12px');assert.equal(visual.radius,'10px');assert.ok(visual.scrollHeight<=visual.height+1);assert.ok(visual.scrollWidth<=visual.width+1);
 assert.ok(visual.uptimeBox.top>=visual.statusBox.top&&visual.uptimeBox.bottom<=visual.statusBox.bottom);assert.ok(visual.protocolBox.top>=visual.ipv4Box.top&&visual.protocolBox.bottom<=visual.ipv4Box.bottom);
 assert.match(await card().innerText(),/IPv4（wan）/);assert.match(await card().innerText(),/DNS（手动配置）/);assert.equal(await card().locator('[data-reveal=ipv6]').count(),0);assert.match(await card().innerText(),/暂无地址/);assert.match(await card().locator('[data-address-value=ipv4]').innerText(),/^\*+$/);
 await card().screenshot({path:path.join(root,'reference-382x320.png')});report.reference=visual;report.checks.push('Equal 382×320 card, reference fixture: original 16/14/12px scale, globe/button/status badge/IPv4 protocol/DNS hierarchy, bounded content');
 await card().locator('[data-reveal=ipv4]').click();assert.equal(await card().locator('[data-address-value=ipv4]').innerText(),'192.168.30.7');await card().locator('[data-connection-details]').click();assert.equal(await page.locator('[data-detail-address=ipv6]').innerText(),'暂无地址');await page.keyboard.press('Escape');assert.match(await card().locator('[data-address-value=ipv4]').innerText(),/^\*+$/);report.checks.push('Reference single-stack is fixture-only; original privacy and complete details remain reachable');
 report.responsive=[];
 for(const width of [320,390,768,1440])for(const lang of ['zh-cn','en']){
  await page.setViewportSize({width,height:900});await visit(`&preset=network-business&scenario=network-reference&lang=${lang}`);
  const geometry=await card().evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight,title:getComputedStyle(e.querySelector('h2')).fontSize,body:getComputedStyle(e.querySelector('dd')).fontSize}));
  assert.ok(geometry.scrollWidth<=geometry.width+1,JSON.stringify({width,lang,geometry}));assert.ok(geometry.scrollHeight<=geometry.height+1,JSON.stringify({width,lang,geometry}));assert.ok(parseFloat(geometry.body)>=13);assert.ok(parseFloat(geometry.title)>=14);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(lang==='zh-cn')await card().screenshot({path:path.join(root,`reference-${width}.png`)});report.responsive.push({viewportWidth:width,lang,...geometry});
 }
 report.checks.push('320/390/768/1440 Chinese and English: readable standard typography, no card or page overflow');
 // Validate the declared standard minimum as well as the preferred phone height.
 await page.setViewportSize({width:1440,height:900});await visit('&preset=network-business&scenario=network-reference');
 report.minimums=[];
 for(const width of [300,382,520]){
  await card().evaluate((e,width)=>{e.style.width=width+'px';e.style.maxWidth='none';e.style.height='260px'},width);await pause();
  const size=await card().evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight}));assert.ok(size.scrollWidth<=size.width+1);assert.ok(size.scrollHeight<=size.height+1,JSON.stringify(size));report.minimums.push(size);
 }
 report.checks.push('Declared 260px standard minimum fits at 300/382/520px widths without changing saved row heights');
 report.standardBoundaries=[];
 for(const width of [320,768,1440])for(const lang of ['zh-cn','en'])for(const theme of ['light','dark'])for(const scene of ['normal','network-dns','network-source','network-error','network-many']){
  await page.setViewportSize({width,height:900});await visit(`&preset=network-business&lang=${lang}&theme=${theme}&scenario=${scene}`);
  const size=await card().evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight}));assert.ok(size.scrollWidth<=size.width+1,JSON.stringify({width,lang,theme,scene,size}));assert.ok(size.scrollHeight<=size.height+1,JSON.stringify({width,lang,theme,scene,size}));report.standardBoundaries.push({viewportWidth:width,lang,theme,scene,...size});
 }
 report.checks.push('60 current standard-card cases: original font family, both themes/languages, normal/DNS/source/read failure/many DNS, bounded geometry');
}).catch(e=>{console.error(e);process.exitCode=1});
