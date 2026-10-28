// Formal build UI tests. Reference data is captured from the accepted isolated
// preview; API emulation exists only here, never in the production bundle.
const {chromium}=require('playwright');
const {checkHomeShell,setSystemTheme}=require('../../../scripts/ops/home-shell-checks.cjs');
const {checkDeviceAddresses}=require('./device-address-checks.cjs');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'../../..'),out=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m69/02-business/attempt-1');
if(fs.existsSync(out))throw new Error('Evidence directory already exists');fs.mkdirSync(out,{recursive:true});
const defaults=JSON.parse(fs.readFileSync(path.join(project,'backend/modules/homeconfig/defaults.json'),'utf8'));
const visualOnly=process.env.QS_HOME_VISUAL_ONLY==='1',language=process.env.QS_HOME_LANGUAGE||'zh-cn',touch=process.env.QS_HOME_TOUCH==='1';
const configDomain=process.env.QS_HOME_CONFIG_DOMAIN,denyStorage=process.env.QS_HOME_DENY_STORAGE==='1',invalidCatalogue=process.env.QS_HOME_INVALID_CATALOGUE==='1';
const report={checkedAt:new Date().toISOString(),checks:[],errors:[],views:[],requests:{},result:'running'};
const paths=['/u/network/status/','/network/port/list/','/u/network/statistics/','/lanctrl/v2/devices/','/lanctrl/v2/router-context/','/nas/disk/status/','/raid/list/','/u/nas/service/status/','/guide/docker/status/','/guide/download-service/status/','/u/guide/ddns/','/system/status/','/u/system/version/','/app/install-list/','/nas/sandbox/','/guide/download/partition/list/','/guide/docker/partition/list/'];
const prefix='/cgi-bin/luci/istore';
const expectedFailures=new Set();
const version=n=>'a'.repeat(32)+':'+n;
let browser,server;
(async()=>{
 try{
 browser=await chromium.launch();const reference=await browser.newPage({viewport:{width:1440,height:1000}});
 await reference.goto('http://192.168.9.19:5180/?layout=ordered'+(process.env.QS_HOME_SCENARIO?'&scenario='+process.env.QS_HOME_SCENARIO:'')+'&lang='+language,{waitUntil:'networkidle'});
 const captured=await reference.evaluate(async paths=>{
  const entries=await Promise.all(paths.map(async p=>{const r=await fetch('/cgi-bin/luci/istore'+p);return [p,{status:r.status,body:await r.json()}]}));
  return {responses:Object.fromEntries(entries),lang:window.vue_lang,features:window.quickstart_features,configs:window.quickstart_configs};
 },paths);
 await reference.waitForTimeout(1800);
 const inspect=async page=>page.locator('[data-layout-card=connection],[data-layout-card=networkInterface],[data-layout-card=downloads],[data-layout-card=remote]').evaluateAll(cards=>cards.map(card=>({id:card.dataset.layoutCard,nodes:[card,...card.querySelectorAll('section,header,h2,dl,dt,dd,footer,.connection-status,.connection-address-group,.connection-dns-group,.connection-status-text,.connection-status-mark,.interface-summary-ports,.port-summary,.tab,.info,.status,.title_box')].map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {tag:n.tagName,cls:n.className,w:r.width,h:r.height,padding:s.padding,margin:s.margin,minHeight:s.minHeight,lineHeight:s.lineHeight,boxSizing:s.boxSizing,font:s.font,alignItems:s.alignItems}})})));
 report.referenceMetrics=await inspect(reference);
 if(process.env.QS_HOME_DEVICE_EDGE_CASES==='1'){
  const list=captured.responses['/lanctrl/v2/devices/'].body.result.devices;
  for(const [i,device] of list.entries()){device.displayName=i===0?'客厅里名字特别长的电视与影音设备':i===1?'离线打印机':'';device.hostname='';device.vendor='';device.classification={brand:'',manufacturer:'',category:'computer',source:'fallback',confidence:'low'};device.online=i!==1;device.presenceState=i===1?'offline':'online'}
  list[0].addresses={current:[{family:6,address:'2001:0db8:1234:5678:90ab:cdef:1234:5678',primary:true}],historical:[]};
  list[1].addresses={current:[],historical:[{family:4,address:'192.168.100.203'}]};
  list[2].addresses={current:[],historical:[]};
 }
 const referenceWidth=await reference.locator('.canvas-home').evaluate(node=>node.getBoundingClientRect().width);
 fs.writeFileSync(path.join(out,'fixtures.json'),JSON.stringify(captured,null,2));
 await reference.locator('.canvas-home').screenshot({path:path.join(out,'reference-1440.png')});
 server=http.createServer((req,res)=>{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(project,'web/dist','.'+relative);if(file!==path.join(project,'web/dist')&&!file.startsWith(path.join(project,'web/dist')+path.sep)){res.writeHead(403);return res.end()};const target=fs.existsSync(file)&&fs.statSync(file).isFile()?file:path.join(project,'web/dist/index.html');res.setHeader('Content-Type',target.endsWith('.js')?'application/javascript':target.endsWith('.css')?'text/css':target.endsWith('.json')?'application/json':target.endsWith('.webp')?'image/webp':'text/html');fs.createReadStream(target).pipe(res)});
 await new Promise((resolve,reject)=>server.listen(5181,'127.0.0.1',resolve).once('error',reject));
 const context=await browser.newContext({viewport:{width:visualOnly?Math.round(referenceWidth):1440,height:1000},hasTouch:touch,colorScheme:process.env.QS_HOME_COLOR_SCHEME||'light'});
 if(denyStorage)await context.addInitScript(()=>{for(const name of ['localStorage','sessionStorage'])Object.defineProperty(window,name,{get(){throw new DOMException('Storage blocked','SecurityError')}})});
 await context.addInitScript(data=>{window.vue_base='/';window.vue_lang=data.language;window.quickstart_features=data.features||[];window.quickstart_configs=data.configs||{};if(data.luciTheme)document.addEventListener('DOMContentLoaded',()=>{const style=document.createElement('style');style.textContent='header{position:relative}header::after{content:"";position:absolute;inset:0;height:32px;background:#606de8;z-index:20}button{margin:4px 1.6px;min-height:44px;padding:8px 12px}h1{padding-bottom:10px;line-height:1.1}h2{padding:16px 20px;letter-spacing:1.6px;line-height:1.1!important}footer{font-size:12.8px;overflow:hidden;padding:16px;text-align:right;white-space:nowrap;color:#aaa}';document.head.append(style)})},{...captured,language,luciTheme:process.env.QS_HOME_LUCI_THEME==='1'});
 const stored={layout:{value:defaults.layout,revision:1},launcher:{value:defaults.launcher,revision:1}};let rejectWrites=false;
 await context.route('**/cgi-bin/luci/istore/**',async route=>{
  const request=route.request(),key=new URL(request.url()).pathname.slice(prefix.length);report.requests[key]=(report.requests[key]||0)+1;
  const config=key.match(/^\/home\/v1\/(layout|launcher)\/$/);let status=200,body;
  if(config){const item=stored[config[1]];if(request.method()==='POST'){if(rejectWrites){status=503;body={success:-1,error:'unavailable'}}else {const incoming=request.postDataJSON();if(incoming.expectedVersion!==version(item.revision)){status=409;body={success:-1,error:'conflict'}}else {item.value=incoming.value;item.revision++}}}if(!body)body={success:0,result:{state:'saved',version:version(item.revision),value:item.value},canEdit:true};if(request.method()==='GET'&&process.env.QS_HOME_CONFIG_STATE&&(!configDomain||configDomain===config[1])){const state=process.env.QS_HOME_CONFIG_STATE;if(state==='forbidden'||state==='unavailable'){status=state==='forbidden'?403:503;body={success:-1,error:state};expectedFailures.add(key)}else body.result={state,version:state==='backup'?version(item.revision):'',value:state==='backup'?item.value:undefined,recoveryVersion:'b'.repeat(64)}}}
  else if(key==='/app/check/')body={success:0,result:{name:request.postDataJSON()?.name,status:process.env.QS_HOME_OAF_INSTALLED==='1'?'installed':'uninstalled'}};
  else if(key==='/app/v1/catalog/')body={success:0,result:invalidCatalogue?{broken:{}}:captured.responses['/app/install-list/'].body};
  else if(captured.responses[key]){({status,body}=captured.responses[key]);if(status>=400)expectedFailures.add(key)}
  else {status=404;body={success:-1,error:'unmocked'}}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await context.route('**/cgi-bin/luci/admin/store/installed',async route=>{
  assert.equal(route.request().method(),'GET');report.requests['software-center-installed']=(report.requests['software-center-installed']||0)+1;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(invalidCatalogue?{broken:{}}:captured.responses['/app/install-list/'].body)});
 });
 await context.route('**/luci-static/resources/app-icons/*.png',async route=>{expectedFailures.add(new URL(route.request().url()).pathname.slice(prefix.length));await route.fulfill({status:404,contentType:'image/png',body:''})});
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()==='error'&&!rejectWrites&&!expectedFailures.has(new URL(message.location().url||'http://localhost').pathname.slice(prefix.length)))report.errors.push('console: '+message.text())});
 const finish=async()=>{await page.locator('[data-apply]').click();const confirm=page.locator('[data-confirm-finish]');if(await confirm.count())await confirm.click()};
 const capture=async name=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:!touch});const input=await page.evaluate(()=>({coarse:matchMedia('(pointer:coarse)').matches,points:navigator.maxTouchPoints}));if(touch){assert.equal(input.coarse,true,'Screenshot lost touch emulation');const bounds=await page.locator('[data-layout-card=traffic]').evaluate(n=>({actionBottom:n.querySelector('.traffic-header-actions').getBoundingClientRect().bottom,speedTop:n.querySelector('.speed').getBoundingClientRect().top}));assert.ok(bounds.speedTop>=bounds.actionBottom+4,'Touch traffic rates overlap speed-test action')}report.views.push({name,input,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),cards:await page.locator('[data-layout-card]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.layoutCard,form:n.dataset.presentation,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})))})};
 await page.goto('http://127.0.0.1:5181/',{waitUntil:'networkidle'});await page.waitForTimeout(1500);
 assert.equal(report.requests['software-center-installed'],1);assert.equal(report.requests['/app/v1/catalog/']||0,0);
 if(visualOnly)await page.addStyleTag({content:'body{margin:0}'});
 report.formalMetrics=await inspect(page);
 await capture('formal-1440');assert.equal(await page.locator('[data-layout-card]').count(),11);assert.equal(report.errors.length,0);report.checks.push('Formal entry renders all 11 widgets without page errors');
 if(process.env.QS_HOME_COLOR_REVIEW==='1'){
  const colours=require('./home-semantic-colour-checks.cjs');report.colourParity=[];
  for(const theme of ['light','dark']){
   await reference.evaluate(theme=>document.body.setAttribute('theme',theme),theme);await page.evaluate(theme=>document.body.setAttribute('theme',theme),theme);await page.waitForTimeout(350);
   const expected=await colours.snapshot(reference),actual=await colours.snapshot(page);assert.deepEqual(actual,expected,'Formal colours differ from the accepted preview');
   report.colourParity.push({theme,colours:actual,semantics:await colours.check(page)});
   await page.screenshot({path:path.join(out,'colour-parity-'+theme+'.png'),fullPage:true});
  }
  await page.evaluate(()=>document.body.setAttribute('theme','light'));report.checks.push('Formal light/dark semantic colours exactly match the frozen accepted preview; glyph/name/state/hover contrast and uptime meaning preserved');
 }
 await checkHomeShell(page,report,{editable:!process.env.QS_HOME_CONFIG_STATE||configDomain==='launcher',touch});
 if(process.env.QS_HOME_NAVIGATION_REVIEW==='1')await require('./launcher-navigation-checks.cjs')(page,report,out);
 if(process.env.QS_HOME_ENTRY_REVIEW==='1'){expectedFailures.add('/cgi-bin/luci/admin/store/entrysh'.slice(prefix.length));await require('./entry-resolution-checks.cjs')(page,report,out)}
 if(process.env.QS_HOME_PINNED_REVIEW==='1'){expectedFailures.add('/cgi-bin/luci/admin/store/entrysh'.slice(prefix.length));await require('./pinned-entry-checks.cjs')(page,report,out,{fixture:true})}
 if(process.env.QS_HOME_DEVICE_REVIEW==='1')await checkDeviceAddresses(page,report,captured.responses['/lanctrl/v2/devices/'].body.result.devices);
 assert.equal(report.requests['/app/check/']||0,0,'Removed shortcut strip must not probe the parental-control package on mount');
 if(process.env.QS_HOME_CONFIG_STATE){assert.equal(await page.getByRole('button',{name:language==='en'?'Customize home':'自定义首页',exact:true}).isDisabled(),configDomain!=='launcher');report.checks.push('Unavailable/future/recovery config stays visible and affected domain stays read only')}
 if(configDomain){await page.locator('[data-layout-card=applications] [data-all-apps]').click();assert.equal(await page.locator('[data-manage-favorites]').isDisabled(),configDomain==='launcher');await page.keyboard.press('Escape');report.checks.push('Single-domain failure preserves editing capability of the independent domain')}
 if(invalidCatalogue){await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-applications-state]').filter({hasText:'应用清单暂不可用'}).waitFor();assert.equal(await page.getByText('没有已安装的扩展应用，可前往软件中心。',{exact:true}).count(),0);await page.screenshot({path:path.join(out,'invalid-catalogue.png'),fullPage:!touch});await page.keyboard.press('Escape');report.checks.push('Malformed catalogue shows unknown/error rather than an empty installed list')}
 if(denyStorage)report.checks.push('Blocked browser storage preserves router-owned homepage rendering');
 if(!visualOnly){
 await page.getByRole('button',{name:'自定义首页',exact:true}).click()
 await page.locator('[data-hide-module=networkInterface]').click()
 await page.locator('[data-layout-card=networkInterface]').waitFor({state:'hidden'})
 const resumedPorts=page.waitForResponse(response=>new URL(response.url()).pathname===prefix+'/network/port/list/')
 await page.locator('[data-cancel]').click();await resumedPorts
 report.checks.push('Hidden widget resumes its reader after cancelling layout edit')
 for(const id of ['sharing','docker','downloads','remote']){
  await page.locator('[data-layout-card='+id+'] .btn_settings').click()
  await page.locator('body > div #actioner').waitFor()
  await page.locator('#actioner > .bg').click({position:{x:2,y:2}})
  await page.locator('#actioner').waitFor({state:'hidden'})
  assert.equal(await page.locator('body[lock-scroll]').count(),0)
 }
 report.checks.push('Four original business wizards open/close and release scroll lock')
 await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('[data-hide-module=remote]').click();await finish();await page.waitForFunction(()=>!document.querySelector('.ordered-editing'));
 await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-layout-card=remote]').count(),0);report.checks.push('Layout save survives reload');
 await page.getByRole('button',{name:'自定义首页',exact:true}).click();await page.locator('[data-hide-module=docker]').click();rejectWrites=true;await finish();await page.locator('[data-layout-notice]').filter({hasText:'保存结果'}).waitFor();assert.equal(await page.locator('.ordered-editing').count(),1);await page.screenshot({path:path.join(out,'save-failed-draft.png'),fullPage:!touch});report.checks.push('Unknown save outcome retains editor draft');rejectWrites=false;await page.locator('[data-config-domain=layout] button').first().click();await page.locator('[data-layout-notice]').filter({hasText:'草稿仍保留'}).waitFor();assert.equal(await page.locator('[data-layout-card=docker]').count(),0);report.checks.push('Reload confirms server state without discarding an editing draft');
 if(await page.locator('[data-cancel-finish]').count())await page.locator('[data-cancel-finish]').click();await page.locator('[data-cancel]').click();await page.reload({waitUntil:'networkidle'});
 await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-add-link]').click();await page.locator('[data-link-name]').fill('家庭 NAS');await page.locator('[data-link-url]').fill('https://nas.example.invalid/');await page.locator('[data-link-save]').click();await page.locator('[data-link-form]').waitFor({state:'hidden'});assert.equal(stored.launcher.value.links.length,1);await page.keyboard.press('Escape');
 await page.reload({waitUntil:'networkidle'});await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-category=links]').click();await page.getByRole('button',{name:'打开家庭 NAS',exact:true}).waitFor();report.checks.push('Custom link persists after reload');await page.keyboard.press('Escape');
 stored.layout.value=defaults.layout;stored.layout.revision++;await page.reload({waitUntil:'networkidle'});
 }
 for(const width of [1024,768,600,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(500);await capture('formal-'+width);assert.equal(report.views.at(-1).overflow,false);if(process.env.QS_HOME_DEVICE_REVIEW==='1'){await checkDeviceAddresses(page,report,captured.responses['/lanctrl/v2/devices/'].body.result.devices);await page.locator('[data-layout-card=devices]').screenshot({path:path.join(out,'device-address-'+width+'.png')})}}
 await setSystemTheme(page,'dark');await capture('formal-320-dark');report.checks.push('1024/768/390/320 and system dark theme have no horizontal page overflow');
 if(visualOnly){await page.setViewportSize({width:390,height:900});await page.waitForTimeout(300);await capture('formal-390-dark')}
 const pixels=await page.locator('[data-layout-card=traffic] canvas').first().evaluate(canvas=>{const bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let count=0;for(let i=0;i<bytes.length;i+=16)if(bytes[i+3]>0&&(bytes[i+2]>bytes[i]+20||bytes[i+2]>bytes[i+1]+20))count++;return count});assert.ok(pixels>100,'traffic curve must be painted');report.checks.push('Traffic curve has colored raster pixels after resize and theme change');
 const statusBefore=report.requests['/u/network/status/'];await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(5200);assert.equal(report.requests['/u/network/status/'],statusBefore);report.checks.push('Hidden page stops status reads');
 assert.equal(report.errors.length,0);report.result='passed';
 }catch(error){report.result='failed';report.failure=error.stack;process.exitCode=1}
 finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({result:report.result,checks:report.checks,views:report.views.length,errors:report.errors,failure:report.failure},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
