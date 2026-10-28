const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {checkHomeShell,setSystemTheme,checkHomeHeader}=require('./home-shell-checks.cjs');
const {checkDeviceAddresses}=require('../../docs/product/ui-design/device-address-checks.cjs');
const host=process.env.QS_ACCEPT_HOST;if(host!=='192.168.30.244')throw new Error('B-only acceptance');
const out=process.env.QS_ACCEPT_OUT,base='http://'+host,home=base+'/cgi-bin/luci/admin/quickstart/';
const english=process.env.QS_ACCEPT_LANGUAGE==='en',touch=process.env.QS_ACCEPT_TOUCH==='1';
const report={checkedAt:new Date().toISOString(),checks:[],errors:[],consoleErrors:[],httpErrors:[],views:[],restoration:[]};
let browser,page,first,second,layout,launcher,layoutVersion,launcherVersion;
async function read(context,domain){const r=await context.request.get(base+'/cgi-bin/luci/istore/home/v1/'+domain+'/');assert.equal(r.status(),200);const body=await r.json();assert.equal(body.success,0);assert.equal(body.result.state,'saved');return body.result}
async function write(context,domain,value,expectedVersion){const r=await context.request.post(base+'/cgi-bin/luci/istore/home/v1/'+domain+'/',{data:{value,expectedVersion}});assert.equal(r.status(),200,'homepage config save rejected');const b=await r.json();assert.equal(b.success,0);assert.deepEqual(b.result.value,value);return b.result.version}
(async()=>{
 try{
  browser=await chromium.launch();
  async function context(sid){const c=await browser.newContext({viewport:{width:1440,height:1000},locale:english?'en-US':'zh-CN',hasTouch:touch,colorScheme:process.env.QS_ACCEPT_COLOR_SCHEME||'light'});await c.addCookies([{name:'sysauth_http',value:sid,domain:host,path:'/'}]);return c}
  first=await context(process.env.QS_ACCEPT_SID);second=await context(process.env.QS_ACCEPT_SECOND_SID);
  const originalLayout=await read(first,'layout'),originalLauncher=await read(first,'launcher');layout=originalLayout.value;launcher=originalLauncher.value;layoutVersion=originalLayout.version;launcherVersion=originalLauncher.version;
  const unauthenticated=await browser.newContext();const denied=await unauthenticated.request.get(base+'/cgi-bin/luci/istore/home/v1/layout/');assert.equal(denied.status(),403);await unauthenticated.close();report.checks.push('Unauthenticated config read denied');
  page=await first.newPage();const other=await second.newPage();page.on('pageerror',e=>report.errors.push(e.message));other.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&report.consoleErrors.length<100)report.consoleErrors.push(m.text())});
  page.on('response',r=>{if(r.status()>=400&&report.httpErrors.length<100)report.httpErrors.push({path:new URL(r.url()).pathname,status:r.status()})});
  const capture=async name=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:!touch});report.views.push({name,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),input:await page.evaluate(()=>({coarse:matchMedia('(pointer:coarse)').matches,points:navigator.maxTouchPoints})),cards:await page.locator('[data-layout-card]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.layoutCard,form:n.dataset.presentation,w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})))})};
  async function ready(p){await p.goto(home,{waitUntil:'networkidle'});await p.locator('[data-ordered-home]').waitFor();await p.waitForTimeout(1200);assert.equal(await p.getByRole('button',{name:english?'Customize home':'自定义首页',exact:true}).isEnabled(),true);assert.equal(await p.locator('.modal,.cbi-map').filter({hasText:'Session expired'}).count(),0)}
  async function finish(p){await p.locator('[data-apply]').click();if(await p.locator('[data-confirm-finish]').count())await p.locator('[data-confirm-finish]').click()}
  async function trafficTouch(){const bounds=await page.locator('[data-layout-card=traffic]').evaluate(n=>{const rect=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};return {width:innerWidth,action:rect(n.querySelector('.traffic-header-actions')),labels:[...n.querySelectorAll('.speed_item>span')].map(rect)}});(report.trafficTouchBounds??=[]).push(bounds);assert.ok(bounds.labels.every(r=>r.right<=bounds.action.left-4||r.left>=bounds.action.right+4||r.top>=bounds.action.bottom+4||r.bottom<=bounds.action.top-4),'Touch speed-test action overlaps traffic rate labels')}
  await ready(page);await ready(other);await capture('b-home-1440');
  for(const [index,row] of (await page.locator('[data-ordered-row]').all()).entries()){await row.scrollIntoViewIfNeeded();await page.waitForTimeout(800);await page.screenshot({path:path.join(out,'b-row-'+(index+1)+'-1440.png')})}
  await page.locator('[data-home-top]').scrollIntoViewIfNeeded();
  report.themeStyles=await page.evaluate(()=>Array.from(document.styleSheets).map(s=>s.href).filter(Boolean));
  report.systemCenters=await page.locator('[data-layout-card=system] .pie-chart-wrapper,[data-layout-card=system] .center-content,[data-layout-card=system] .center-label').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {cls:n.className,text:n.textContent,display:s.display,position:s.position,visibility:s.visibility,opacity:s.opacity,color:s.color,left:r.left,top:r.top,width:r.width,height:r.height,transform:s.transform,zIndex:s.zIndex}}));
  if(process.env.QS_EXPECT_ASSET_VERSION){assert.ok(report.themeStyles.some(url=>new URL(url).pathname==='/luci-static/quickstart/style.css'&&new URL(url).searchParams.get('v')===process.env.QS_EXPECT_ASSET_VERSION),'Installed LuCI template has a stale resource cache key');report.checks.push(process.env.QS_ACCEPT_RUNTIME_CANDIDATE==='1'?'Direct candidate files, running processes and LuCI resource key match the frozen runtime; opkg records retained':'Installed package, running process and LuCI resource version match the frozen runtime')}
  report.density=await page.locator('[data-layout-card=networkInterface] *,.inventory-header,.inventory-footer,.applications-header').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return {tag:n.tagName,cls:n.className,h:n.getBoundingClientRect().height,margin:s.margin,padding:s.padding,minHeight:s.minHeight,lineHeight:s.lineHeight,font:s.font,display:s.display}}));
  const expectedWidgets=layout.rows.flatMap(r=>r.columns.flatMap(c=>c.cards)).filter(Boolean);assert.equal(await page.locator('[data-layout-card]').count(),expectedWidgets.length);
  report.checks.push('Real root session renders persisted homepage');
  if(process.env.QS_ACCEPT_HEADER_INSPECT==='1'){
   report.headerAncestors=await page.locator('[data-home-top]').evaluate(top=>{const result=[];for(let n=top;n;n=n.parentElement){const s=getComputedStyle(n),r=n.getBoundingClientRect();result.push({tag:n.tagName,id:n.id,cls:n.className,x:r.x,y:r.y,width:r.width,height:r.height,background:s.backgroundColor,padding:s.padding,margin:s.margin,primary:s.getPropertyValue('--primary')})}return result});
   report.result='diagnostic';return;
  }
  await checkHomeShell(page,report,{touch});
  if(process.env.QS_ACCEPT_DEVICE_ADDRESSES==='1'){
   const response=await first.request.get(base+'/cgi-bin/luci/istore/lanctrl/v2/devices/');assert.equal(response.status(),200);const inventory=(await response.json()).result.devices;assert.ok(Array.isArray(inventory));
   for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(300);await checkDeviceAddresses(page,report,inventory);await page.locator('[data-layout-card=devices]').screenshot({path:path.join(out,'b-device-address-'+width+'.png')})}
   const target=page.locator('[data-canvas-device]').first(),id=await target.getAttribute('data-canvas-device');await target.focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.pathname.endsWith('/devicemanagement')&&url.searchParams.get('device')===id);await page.locator('.drawer-backdrop').waitFor();report.checks.push('Each home device displays its own address without increasing height; keyboard opens the same stable deviceId');assert.equal(report.errors.length,0);report.result='passed';return;
  }
  if(process.env.QS_ACCEPT_SHELL==='1'){
   await other.close();let installs=0;page.on('request',r=>{if(new URL(r.url()).pathname==='/cgi-bin/luci/istore/app/install/')installs++});
   const check=await first.request.post(base+'/cgi-bin/luci/istore/app/check/',{data:{name:'app-meta-fastnet'}});assert.equal(check.status(),200);const fastnet=await check.json();assert.ok(fastnet.result&&!fastnet.error);
   if(fastnet.result.status!=='installed'){
    const dialog=page.waitForEvent('dialog');const click=page.locator('[data-layout-card=traffic] .layout-speed').click();const prompt=await dialog;assert.equal(prompt.type(),'confirm');assert.match(prompt.message(),/FastNet/);await prompt.dismiss();await click;assert.equal(installs,0);report.checks.push('Traffic widget retains FastNet installation prompt; cancelling makes no installation request');
   }
   await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-open-app=network]').focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.pathname.endsWith('/network'));await capture('b-network-library-navigation');await ready(page);
   await page.locator('[data-layout-card=devices] [data-canvas-view-all]').focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.pathname.endsWith('/devicemanagement'));await capture('b-complete-device-navigation');await ready(page);
   report.checks.push('Network setup remains reachable in the library and complete device management in the device widget via keyboard');
   const parentalCheck=await first.request.post(base+'/cgi-bin/luci/istore/app/check/',{data:{name:'luci-app-oaf'}});assert.equal(parentalCheck.status(),200);const parental=await parentalCheck.json();assert.ok(parental.result&&!parental.error);
   await page.locator('[data-layout-card=devices] [data-widget-more]').click();
   if(parental.result.status==='installed'){
    await page.locator('[data-layout-card=devices] [data-widget-menu-item=parental]').click();await page.waitForURL(url=>url.pathname==='/cgi-bin/luci/admin/services/appfilter');await capture('b-parental-navigation');assert.equal(report.httpErrors.some(r=>r.path==='/cgi-bin/luci/admin/services/appfilter'),false,'Parental-control destination returned an HTTP error');await ready(page);
   }else{
    const dialog=page.waitForEvent('dialog');const click=page.locator('[data-layout-card=devices] [data-widget-menu-item=parental]').click();const prompt=await dialog;assert.equal(prompt.type(),'confirm');await prompt.dismiss();await click;assert.equal(installs,0);
   }
   report.checks.push('Device menu retains real parental-control action without a duplicate shortcut strip');
   await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-applications-browser]').waitFor();await page.setViewportSize({width:390,height:900});await page.waitForTimeout(400);assert.equal(await page.locator('[data-applications-browser]').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('[data-layout-card=applications] [data-all-apps]').evaluate(n=>n===document.activeElement),true);assert.equal(await page.locator('body[lock-scroll]').count(),0);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   report.checks.push('Renderless library host survives responsive rows; close restores focus and scrolling');
   for(const theme of ['dark','light']){await setSystemTheme(page,theme);for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(300);await checkHomeHeader(page);await capture('b-blue-header-'+theme+'-'+width);assert.equal(report.views.at(-1).overflow,false)}}
   assert.equal(report.errors.length,0);assert.equal(report.consoleErrors.length,0);assert.equal(report.httpErrors.length,0);report.result='passed';return;
  }
  if(process.env.QS_ACCEPT_SYSTEM==='1'){
   const card=page.locator('[data-layout-card=system]');report.systemThemes=[];
   for(const theme of ['light','dark']){
    await setSystemTheme(page,theme);
    await card.scrollIntoViewIfNeeded();await page.waitForTimeout(800);
    const centers=await card.locator('.center-content,.center-label').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {cls:n.className,text:n.textContent,display:s.display,color:s.color,width:r.width,height:r.height}}));
    report.systemThemes.push({theme,centers});assert.equal(await card.locator('.center-label:visible').count(),3,'System ring values are hidden after LuCI content scroll');assert.equal(await card.locator('.center-icon:visible').count(),3,'System ring icons are hidden');
    await page.screenshot({path:path.join(out,'b-system-rested-'+theme+'.png')});
   }
   report.checks.push('All three standard system ring labels and icons remain visible after real LuCI scroll in both themes');report.result='passed';return;
  }
  if(process.env.QS_ACCEPT_CAPABILITY==='1'){
   const globalResponse=await first.request.get(base+'/cgi-bin/luci/istore/lanctrl/globalConfigs/');assert.equal(globalResponse.status(),200);const global=(await globalResponse.json()).result;report.speedCapability={selected:global.speedLimit?.provider,providers:global.speedLimit?.providers,capability:global.capabilities?.items?.device_speed_limit??global.capabilities?.speedLimit};
   const response=await first.request.get(base+'/cgi-bin/luci/istore/lanctrl/v2/router-context/');assert.equal(response.status(),200);const context=(await response.json()).result;assert.equal(typeof context.routeEditability.editable,'boolean');report.routeEditability=context.routeEditability;
   const device=page.locator('[data-canvas-device]').first();assert.ok(await device.count(),'Capability test requires an observed device');await device.click();await page.locator('.drawer-backdrop').waitFor();await page.locator('.drawer-tabs').getByRole('button',{name:'网络与上网',exact:true}).click();await page.locator('.policy-card').waitFor();
   if(!context.routeEditability.editable){assert.equal(await page.locator('.policy-toggle input').first().isDisabled(),true);const preview=page.getByRole('button',{name:'预览地址与上网路线',exact:true});if(await preview.count())assert.equal(await preview.isDisabled(),true);await page.locator('.policy-reason').first().waitFor();report.checks.push('Real DHCP authority keeps route/address policy read only with guidance')}
   await page.screenshot({path:path.join(out,'b-device-network-authority.png')});await page.locator('.drawer-tabs').getByRole('button',{name:'使用管理',exact:true}).click();
   if(report.speedCapability.capability?.reason==='selected_provider_unavailable')await page.getByText('已安装限速服务，但当前执行方式不可用；请到局域网设置选择并预览。',{exact:true}).waitFor();
   else await page.getByRole('button',{name:/^(安装限速服务|启用限速服务)$/}).waitFor();
   await page.screenshot({path:path.join(out,'b-device-optional-netpolicy.png')});report.checks.push('Unavailable optional NetPolicy leaves inventory and policy guidance usable without enabling it');
   if(process.env.QS_ACCEPT_PROVIDER_GUARD==='1'){
    const native=report.speedCapability.providers?.find(p=>p.id==='quickstart-native');const actions=report.speedCapability.capability?.actions??[];
    assert.ok(native,'Native provider diagnostics missing');assert.ok(!(native.installed&&actions.some(a=>a.kind==='install'&&a.target==='quickstart-netpolicy')),'Capability install action targets an already installed NetPolicy package');
    if(native.installed&&report.speedCapability.selected!=='quickstart-native'){
     assert.equal(await page.getByRole('button',{name:'安装限速服务',exact:true}).count(),0);await page.setViewportSize({width:320,height:900});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,'b-provider-detail-320.png')});await page.locator('.drawer-close').click();await page.setViewportSize({width:1440,height:1000});await page.locator('.primary-tabs').getByRole('tab',{name:'局域网设置'}).click();await page.locator('.lan-settings .setting-card').first().waitFor();assert.equal(await page.getByRole('button',{name:'安装所需服务',exact:true}).count(),0);await page.getByText('已安装限速服务，但当前执行方式不可用；请在下方高级设置中查看服务状态，选择后预览。',{exact:true}).waitFor();await page.screenshot({path:path.join(out,'b-selected-provider-guidance.png')});report.checks.push('Installed alternative is not reinstalled or selected automatically; existing settings preview remains available');
    }
   }
   assert.equal(report.errors.length,0);report.result='passed';return;
  }
  if(process.env.QS_ACCEPT_LIFECYCLE==='1'){
   await other.close();let trafficRequests=0;page.on('request',r=>{if(new URL(r.url()).pathname==='/cgi-bin/luci/istore/u/network/statistics/')trafficRequests++});
   report.lifecycle=[];
   for(let i=0;i<20;i++){
    const device=page.locator('[data-canvas-device]').first();assert.ok(await device.count(),'Lifecycle test requires a real observed device');await device.click();await page.locator('.drawer-backdrop').waitFor();assert.equal(await page.locator('[data-layout-card]').count(),0);assert.equal(await page.locator('.network_container canvas').count(),0);
    await page.waitForTimeout(150);const before=trafficRequests;if(i===0||i===19){await page.waitForTimeout(5300);assert.equal(trafficRequests,before,'Unmounted homepage retained a traffic reader')}
    const initialRead=page.waitForResponse(r=>new URL(r.url()).pathname==='/cgi-bin/luci/istore/u/network/statistics/');await page.goBack();await initialRead;await page.locator('[data-layout-card=traffic] canvas').waitFor();await page.waitForTimeout(150);assert.equal(await page.locator('[data-layout-card=traffic] canvas').count(),1);assert.equal(await page.locator('body[lock-scroll]').count(),0);report.lifecycle.push({cycle:i+1,trafficRequests});
   }
   const before=trafficRequests;await page.waitForTimeout(5500);const delta=trafficRequests-before;assert.ok(delta>=1&&delta<=2,'Homepage traffic pollers accumulated across navigation');report.lifecyclePollsIn5500ms=delta;await capture('b-home-after-20-navigation-cycles');assert.equal(report.errors.length,0);report.checks.push('Twenty real SPA device/home cycles clean up charts and traffic readers without accumulating pollers');report.result='passed';return;
  }
  if(process.env.QS_ACCEPT_READONLY==='1'){
   if(english)assert.equal(await page.locator('[data-layout-card=connection] h2').innerText(),'Connection & IP');
   for(const width of [1024,768,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(300);await capture('b-home-'+width);assert.equal(report.views.at(-1).overflow,false);if(touch){assert.equal(report.views.at(-1).input.coarse,true,'Touch emulation lost');await trafficTouch();if(width===390){for(const card of await page.locator('[data-layout-card]').all()){await card.screenshot({path:path.join(out,'b-touch-390-'+await card.getAttribute('data-layout-card')+'.png')})}await page.locator('[data-home-top]').scrollIntoViewIfNeeded()}}}
   if(touch){report.touchInput=await page.evaluate(()=>({coarse:matchMedia('(pointer:coarse)').matches,points:navigator.maxTouchPoints}));const heights=await page.locator('.widget-primary-action').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({widget:n.closest('[data-layout-card]')?.dataset.layoutCard,text:n.textContent,height:n.getBoundingClientRect().height,minHeight:getComputedStyle(n).minHeight})));report.touchTargets=heights;assert.ok(heights.length&&heights.every(n=>n.height>=44),'Touch primary action smaller than 44px');report.checks.push('Real LuCI touch primary actions retain 44px target')}
   await setSystemTheme(page,'dark');await capture('b-home-320-dark');
   assert.equal(report.errors.length,0);report.checks.push(english?'Real LuCI English responsive surface':'Real LuCI touch responsive surface');report.result='passed';return;
  }
  if(process.env.QS_ACCEPT_DIAGNOSTICS==='1'){report.metrics=await page.locator('.ordered-home header,.ordered-home h1,.ordered-home .card-header,.ordered-home .network-business-card,.ordered-home .widget-menu-trigger,.ordered-home .widget-primary-action,.ordered-home .lab-edit-button').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),b=getComputedStyle(n,'::before'),a=getComputedStyle(n,'::after');return {tag:n.tagName,cls:n.className,display:s.display,height:s.height,minHeight:s.minHeight,padding:s.padding,margin:s.margin,lineHeight:s.lineHeight,font:s.font,position:s.position,background:s.backgroundColor,before:{content:b.content,display:b.display,position:b.position,width:b.width,height:b.height,background:b.backgroundColor},after:{content:a.content,display:a.display,position:a.position}}}));report.result='diagnostic';return}
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();await other.getByRole('button',{name:'自定义首页',exact:true}).click();
  // Removing the left half of a stacked row deliberately requires a layout
  // decision. Exercise ordinary save with the standalone final row instead.
  const removable=expectedWidgets.includes('system')?'system':layout.rows.find(r=>r.columns.length===1&&r.columns[0].cards.length===1)?.columns[0].cards[0];assert.ok(removable,'Need a standalone row for save/concurrency acceptance');
  await page.locator('[data-hide-module="'+removable+'"]').click();await finish(page);await page.waitForFunction(()=>!document.querySelector('.ordered-editing'));layoutVersion=(await read(first,'layout')).version;
  await other.locator('[data-hide-module="'+removable+'"]').click();await finish(other);await other.locator('[data-layout-notice]').filter({hasText:'另一窗口'}).waitFor();assert.equal(await other.locator('.ordered-editing').count(),1);
  report.checks.push('Two independent root sessions: stale save conflicts and draft remains');
  await other.close();await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-layout-card="'+removable+'"]').count(),0);report.checks.push('Layout save survives real device reload');
  layoutVersion=await write(first,'layout',layout,layoutVersion);await page.reload({waitUntil:'networkidle'});
  layoutVersion=await write(first,'layout',{...layout,rows:[]},layoutVersion);await page.reload({waitUntil:'networkidle'});await page.locator('.ordered-empty').waitFor();assert.equal(await page.locator('[data-layout-card]').count(),0);report.checks.push('Explicit empty homepage survives reload without restoring defaults');
  await page.locator('[data-home-settings]').click();await page.locator('[data-open-library]').click();await page.locator('[data-choice=applications]').click();await page.locator('[data-confirm-choice]').click();await finish(page);await page.waitForFunction(()=>!document.querySelector('.ordered-editing'));layoutVersion=(await read(first,'layout')).version;
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-layout-card]').count(),1);await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-applications-browser]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('[data-open-applications]').count(),0);report.checks.push('Empty content keeps old settings accessible: re-add apps, save, reload and open full library without a footer');
  layoutVersion=await write(first,'layout',layout,layoutVersion);await page.reload({waitUntil:'networkidle'});
  if(expectedWidgets.includes('applications')){
   await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-add-link]').click();await page.locator('[data-link-name]').fill('Quickstart 验收临时链接');await page.locator('[data-link-url]').fill('https://quickstart-acceptance.example.invalid/');await page.locator('[data-link-save]').click();await page.locator('[data-link-form]').waitFor({state:'hidden'});launcherVersion=(await read(first,'launcher')).version;assert.equal((await read(first,'launcher')).value.links.length,launcher.links.length+1);await page.keyboard.press('Escape');
   await page.reload({waitUntil:'networkidle'});await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-category=links]').click();await page.getByRole('button',{name:'打开Quickstart 验收临时链接',exact:true}).waitFor();await page.keyboard.press('Escape');report.checks.push('HTTP router origin: custom link saves and survives reload');
   launcherVersion=await write(first,'launcher',launcher,launcherVersion);
  }
  const devices=page.locator('[data-canvas-device]');if(await devices.count()){const id=await devices.first().getAttribute('data-canvas-device');await devices.first().click();await page.locator('.drawer-backdrop').waitFor();assert.equal(new URL(page.url()).searchParams.get('device'),id);await page.locator('.drawer-close').click();report.checks.push('Homepage deviceId opens real complete management detail');await ready(page)}
  for(const width of [1024,768,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(300);await capture('b-home-'+width);assert.equal(report.views.at(-1).overflow,false)}
  await setSystemTheme(page,'dark');await capture('b-home-320-dark');
  const darkHeadings=await page.locator('.ordered-home h2').evaluateAll(nodes=>nodes.map(n=>{const actual=getComputedStyle(n).color,probe=document.createElement('span');probe.style.color='var(--c-text)';n.append(probe);const expected=getComputedStyle(probe).color;probe.remove();return {text:n.textContent,actual,expected}}));assert.ok(darkHeadings.every(n=>n.actual===n.expected),'A widget title inherited the LuCI theme color');report.checks.push('Dark widget titles use the homepage theme color');
  assert.equal(report.errors.length,0);report.result='passed';
 }catch(error){report.result='failed';report.failure=error.stack;if(page){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});report.language=await page.evaluate(()=>window.vue_lang).catch(()=>null)}process.exitCode=1}
 finally{
  // Compare versions captured after our writes; never overwrite another root
  // session's concurrent change during cleanup.
  if(first)for(const [domain,value,version] of [['layout',layout,layoutVersion],['launcher',launcher,launcherVersion]])if(value&&version){try{const current=await read(first,domain);if(JSON.stringify(current.value)===JSON.stringify(value))report.restoration.push(domain+': unchanged');else {assert.equal(current.version,version,'Concurrent edit detected; cleanup stopped');await write(first,domain,value,version);report.restoration.push(domain+': restored')}}catch(error){report.restoration.push(domain+': failed: '+error.message);report.result='failed';process.exitCode=1}}
  await browser?.close();if(process.env.QS_EXPECT_ASSET_VERSION&&report.result==='passed'&&(report.errors.length||report.consoleErrors.length||report.httpErrors.length)){report.result='failed';report.failure='Matched package acceptance reported browser/API errors';process.exitCode=1}fs.writeFileSync(path.join(out,'ui.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
