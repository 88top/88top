const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='http://192.168.30.1',out=process.env.QS_NOTICE_OUT;
const report={result:'running',errors:[],blocked:[],configResponses:[],views:[],publicHashes:{},rehearsal:process.env.QS_NOTICE_REHEARSAL==='1'};
let browser,page;
(async()=>{try{
 browser=await chromium.launch();
 const cases=process.env.QS_NOTICE_BASELINE==='1'?[{width:1440,lang:'zh-cn',theme:'light'}]:[{width:1440,lang:'zh-cn',theme:'light'},{width:390,lang:'en',theme:'dark'}];
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:1000},hasTouch:c.width<600});
  await context.addCookies([{name:'sysauth_http',value:process.env.QS_NOTICE_SID,domain:'192.168.30.1',path:'/'}]);
  await context.addInitScript(lang=>{let url='';Object.defineProperty(window,'vue_lang',{configurable:true,get:()=>lang,set:()=>{}});Object.defineProperty(window,'vue_lang_data',{configurable:true,get:()=>url,set:value=>url=value.replace(/\/i18n\/[^/?]+\.json/,'/i18n/'+lang+'.json')});},c.lang);
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==base)return route.abort();
   if(!['GET','HEAD'].includes(req.method())){
    if(url.pathname==='/ubus/'){
     const body=req.postDataJSON(),calls=Array.isArray(body)?body:[body];
     if(calls.every(call=>call.method==='list'||call.method==='call'&&['luci.getFeatures','file.list','uci.changes'].includes(call.params?.[1]+'.'+call.params?.[2])))return route.continue();
    }
    report.blocked.push({method:req.method(),path:url.pathname});return route.abort();
   }
   if(report.rehearsal&&url.pathname.startsWith('/luci-static/quickstart/')){
    const name=url.pathname.slice('/luci-static/quickstart/'.length);
    if(['index.js','style.css','vendor.js','i18n/en.json'].includes(name))return route.fulfill({path:path.resolve(__dirname,'../../../../web/dist/luci-static/quickstart',name)});
   }
   return route.continue();
  });
  page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{const key=new URL(response.url()).pathname;if(key.includes('/home/v1/'))report.configResponses.push({path:key,status:response.status()})});
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.home-config-state')].filter(n=>n.checkVisibility()).length===2);
  await page.evaluate(theme=>document.body.setAttribute('theme',theme),c.theme);
  await page.screenshot({path:path.join(out,`${c.width}-before.png`),fullPage:true});
  const view={...c,notices:await page.locator('.home-config-state:visible').allInnerTexts()};report.views.push(view);
  const first=page.locator('[data-config-domain=layout]');
  assert.equal(await first.locator('[data-dismiss-config-notice]').count(),1,'Configuration error must have a manual close button');
  for(const close of await page.locator('[data-dismiss-config-notice]:visible').all()){
   const box=await close.boundingBox();assert.ok(box.width>=44&&box.height>=44);assert.ok(await close.getAttribute('aria-label'));
  }
  await first.locator('[data-dismiss-config-notice]').click();
  assert.equal(await first.isVisible(),false);
  assert.equal(await page.locator('[data-config-domain=launcher]').isVisible(),true,'Closing layout notice must not dismiss launcher notice');
  assert.equal(await page.locator('[data-home-settings]').isDisabled(),true,'Dismissal must not clear the actual read error');
  await page.locator('[data-config-domain=launcher] [data-retry-config]').click();
  await page.waitForFunction(()=>document.querySelector('[data-config-domain=launcher]')?.checkVisibility()&&document.querySelector('[data-config-domain=launcher] [data-retry-config]'));
  assert.equal(await first.isVisible(),false,'Rereading launcher must not resurrect dismissed layout error');
  await page.locator('[data-config-domain=launcher] [data-dismiss-config-notice]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.home-config-state:visible').count(),0);
  assert.equal(await page.locator('[data-home-settings]').isDisabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('.home-config-state:visible').count(),0,'Background widget updates must not reopen dismissed notices');
  await page.screenshot({path:path.join(out,`${c.width}-dismissed.png`),fullPage:true});
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.home-config-state')].filter(n=>n.checkVisibility()).length===2);
  view.refreshShowsCurrentFailure=true;
  if(!report.rehearsal&&process.env.QS_NOTICE_BASELINE!=='1'){
   const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate.json')));
   for(const name of ['index.js','style.css','vendor.js','i18n/en.json']){
    const response=await context.request.get(base+'/luci-static/quickstart/'+name);assert.equal(response.status(),200);
    const hash=crypto.createHash('sha256').update(await response.body()).digest('hex');
    assert.equal(hash,manifest.hashes[name]);report.publicHashes[name]=hash;
   }
   assert.match(view.notices[0],/当前后端不支持首页配置|This backend does not support homepage configuration/);
  }
  await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.blocked,[]);report.result='passed';
}catch(error){report.result='failed';report.failure=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}})();
