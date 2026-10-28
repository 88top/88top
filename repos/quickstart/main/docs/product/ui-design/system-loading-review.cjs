// Exercise the actual built page, holding each system request independently.
// B mode uses real root-authenticated APIs; local mode uses archived fixtures.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),out=path.resolve(process.env.QS_SYSTEM_EVIDENCE||'docs/archive/evidence/m70/system-loading/baseline');
assert.ok(!fs.existsSync(out),'Do not overwrite evidence');fs.mkdirSync(out,{recursive:true});
const real=process.env.QS_ACCEPT_HOST==='192.168.30.244',base=real?'http://192.168.30.244':'http://127.0.0.1:5181',home=real?base+'/cgi-bin/luci/admin/quickstart/':base+'/';
const fixtures=JSON.parse(fs.readFileSync(path.join(root,'docs/archive/evidence/m70/header-correction/round-1/local-full/fixtures.json')));
const defaults=JSON.parse(fs.readFileSync(path.join(root,'backend/modules/homeconfig/defaults.json')));
const report={checks:[],cases:[],errors:[],result:'running',real};let browser,server;
(async()=>{try{
 if(!real){server=http.createServer((req,res)=>{const p=path.resolve(root,'web/dist','.'+new URL(req.url,base).pathname),safe=p.startsWith(path.join(root,'web/dist')+path.sep);const f=safe&&fs.existsSync(p)&&fs.statSync(p).isFile()?p:path.join(root,'web/dist/index.html');res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html');fs.createReadStream(f).pipe(res)});await new Promise((r,j)=>server.listen(5181,'127.0.0.1',r).once('error',j))}
 browser=await chromium.launch();
 const cases=process.env.QS_SYSTEM_BASELINE==='1'?[{width:1440,form:'standard',theme:'light'}]:[{width:1440,form:'standard',theme:'light'},{width:768,form:'standard',theme:'light',statusFirst:true},{width:390,form:'summary',theme:'light'},{width:320,form:'summary',theme:'dark',english:true},{width:1440,form:'standard',theme:'dark',fail:true}];
 for(const scenario of cases){
  const context=await browser.newContext({viewport:{width:scenario.width,height:1000},locale:scenario.english?'en-US':'zh-CN',hasTouch:scenario.width<600,colorScheme:scenario.theme});
  if(real)await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
  else await context.addInitScript(d=>{window.vue_base='/';window.vue_lang=d.english?'en':'zh-cn';window.quickstart_features=d.fixtures.features||[];window.quickstart_configs=d.fixtures.configs||{}},{...scenario,fixtures});
  if(real)await context.addInitScript(desired=>{let url='';Object.defineProperty(window,'vue_lang',{configurable:true,get:()=>desired,set:actual=>window.__qs_test_native_lang=actual});Object.defineProperty(window,'vue_lang_data',{configurable:true,get:()=>url,set:actual=>url=actual.replace(/\/i18n\/[^/?]+\.json/,'/i18n/'+desired+'.json')})},scenario.english?'en':'zh-cn');
  let releaseStatus,releaseVersion;const statusGate=new Promise(r=>releaseStatus=r),versionGate=new Promise(r=>releaseVersion=r);let reads=0,fail=!!scenario.fail;
  if(!real)await context.route('**/cgi-bin/luci/istore/**',async route=>{const key=new URL(route.request().url()).pathname.replace('/cgi-bin/luci/istore','');let body;
   if(key==='/home/v1/layout/')body={success:0,canEdit:true,result:{state:'saved',version:'a'.repeat(32)+':1',value:defaults.layout}};
   else if(key==='/home/v1/launcher/')body={success:0,canEdit:true,result:{state:'saved',version:'b'.repeat(32)+':1',value:defaults.launcher}};
   else if(key==='/app/v1/catalog/')body={success:0,result:fixtures.responses['/app/install-list/'].body};
   else if(fixtures.responses[key])body=fixtures.responses[key].body;
   else body={success:0,result:{}};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  for(const [key,gate] of [['/system/status/',statusGate],['/u/system/version/',versionGate]])await context.route('**/cgi-bin/luci/istore'+key,async route=>{reads++;await gate;if(fail)await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:-1,error:'test unavailable'})});else if(real)await route.continue();else await route.fallback()});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const entry={...scenario};report.cases.push(entry);let preference=defaults.layout.widgetPreferences.system;
  if(real){const response=await context.request.get(base+'/cgi-bin/luci/istore/home/v1/layout/');assert.equal(response.status(),200);preference=(await response.json()).result.value.widgetPreferences.system;entry.savedPreference=preference}
  try{
   await page.goto(home,{waitUntil:'domcontentloaded'});await page.locator('[data-layout-card=system]').waitFor();for(let i=0;i<100&&reads<2;i++)await page.waitForTimeout(30);assert.equal(reads,2);
   await page.evaluate(()=>document.fonts.ready);await page.evaluate(theme=>document.body.setAttribute('theme',theme),scenario.theme);await page.waitForTimeout(300);
   const card=page.locator('[data-layout-card=system]');
   const measure=()=>card.evaluate(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,stacked:n.closest('.ordered-column')?.querySelectorAll(':scope>.ordered-card').length>1,text:n.innerText,structure:!!n.querySelector('.reusable-card'),blur:n.querySelector('.card-body')?getComputedStyle(n.querySelector('.card-body')).filter:null,busy:n.querySelector('[aria-busy=true]')!==null,form:n.getAttribute('data-presentation')}));
   entry.pending=await measure();const original=entry.pending.structure?await card.locator('.reusable-card').elementHandle():null;await card.screenshot({path:path.join(out,scenario.width+'-'+scenario.theme+'-pending.png')});
   entry.actualLanguage=await page.evaluate(()=>window.vue_lang);assert.equal(entry.actualLanguage,scenario.english?'en':'zh-cn');assert.match(entry.pending.text,scenario.english?/^System information/:/^系统信息/);
   if(scenario.statusFirst)releaseStatus();else releaseVersion();await page.waitForTimeout(200);entry.partial=await measure();
   releaseStatus();releaseVersion();await page.waitForFunction(()=>!!document.querySelector('[data-layout-card=system] .reusable-card')&&!document.querySelector('[data-layout-card=system] [data-system-loading]'),null,{timeout:15000});await page.waitForTimeout(100);
   entry.complete=await measure();await card.screenshot({path:path.join(out,scenario.width+'-'+scenario.theme+'-complete.png')});
   const expectedForm=preference.mode!=='auto'?preference.mode:entry.pending.stacked||preference.ruleVersion!==0&&entry.pending.width<560?'summary':'standard';
   assert.equal(entry.pending.structure,true,'Loading replaced the complete system card with a small message');assert.equal(entry.pending.busy,true);assert.match(entry.pending.blur,/blur\(/);assert.equal(entry.pending.form,real?expectedForm:scenario.form,'Form must preserve the saved preference, stacked role and actual content width');
   assert.ok(!/0%|0℃/.test(entry.pending.text),'Unknown metrics must not appear as real zero readings');assert.equal(await original.evaluate(n=>n===document.querySelector('[data-layout-card=system] .reusable-card')),true,'Loading recreated the card instead of updating it');
   assert.ok(Math.abs(entry.pending.height-entry.complete.height)<=1,'System card shrank/grew on initial read: '+entry.pending.height+' -> '+entry.complete.height);
   assert.equal(entry.partial.height,entry.pending.height);assert.equal(entry.complete.busy,false);assert.equal(entry.complete.blur,'none');
   if(scenario.fail){assert.match(entry.complete.text,/失败|Unavailable|unavailable/);fail=false;await card.getByRole('button',{name:scenario.english?'Retry':'重试',exact:true}).first().click();await page.waitForFunction(()=>{const n=document.querySelector('[data-layout-card=system]');return n&&!/失败|Unavailable|unavailable/.test(n.innerText)&&/\d+(?:\.\d+)?[%℃]/.test(n.innerText)},null,{timeout:15000});entry.retried=await measure()}
   else{assert.ok(!/失败|Unavailable|unavailable/.test(entry.complete.text),'Real system reads failed');assert.match(entry.complete.text,/\d+(?:\.\d+)?[%℃]/,'No real system metrics appeared')}
   if(entry.retried)assert.ok(Math.abs(entry.retried.height-entry.pending.height)<=1,'Retry changed card height');
   report.checks.push(scenario.width+' '+scenario.theme+' '+entry.pending.form+(scenario.fail?' failure/retry':' delayed read')+' stable');
  }finally{releaseStatus();releaseVersion();await context.close()}
 }
 assert.equal(report.errors.length,0);report.result='passed';
 }catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1}
 finally{await browser?.close();await new Promise(r=>server?server.close(r):r());fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}
})();
