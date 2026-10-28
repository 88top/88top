// Current installed A, no candidate assets/fixtures and no business writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='http://192.168.30.1',out=process.env.QS_BACKEND_OUT;
const report={result:'running',views:[],errors:[],blocked:[],configResponses:[],publicHashes:{}};
let browser,page;
(async()=>{try{
 browser=await chromium.launch();
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390});
  await context.addCookies([{name:'sysauth_http',value:process.env.QS_BACKEND_SID,domain:'192.168.30.1',path:'/'}]);
  await context.addInitScript(()=>{let url='';Object.defineProperty(window,'vue_lang',{configurable:true,get:()=>'zh-cn',set:()=>{}});Object.defineProperty(window,'vue_lang_data',{configurable:true,get:()=>url,set:value=>url=value.replace(/\/i18n\/[^/?]+\.json/,'/i18n/zh-cn.json')});});
  await context.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==base)return route.abort();
   if(['GET','HEAD'].includes(req.method()))return route.continue();
   if(url.pathname==='/ubus/'){
    const body=req.postDataJSON(),calls=Array.isArray(body)?body:[body];
    if(calls.every(call=>call.method==='list'||call.method==='call'&&['luci.getFeatures','file.list','uci.changes'].includes(call.params?.[1]+'.'+call.params?.[2])))return route.continue();
   }
   report.blocked.push({method:req.method(),path:url.pathname});return route.abort();
  });
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{const name=new URL(response.url()).pathname;if(name.includes('/home/v1/'))report.configResponses.push({path:name,status:response.status()})});
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('[data-home-settings]')?.disabled===false);
  assert.equal(await page.locator('.home-config-state:visible').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(out,`${width}-homepage.png`),fullPage:true});
  await page.locator('[data-home-settings]').click();await page.locator('[data-cancel]').waitFor();
  assert.equal(await page.locator('[data-apply]').isEnabled(),true);
  await page.locator('[data-cancel]').click();await page.locator('[data-cancel]').waitFor({state:'hidden'});
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('[data-home-settings]')?.disabled===false);
  assert.equal(await page.locator('.home-config-state:visible').count(),0);
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/devicemanagement',{waitUntil:'networkidle'});
  await page.locator('[data-device-id]:visible').first().waitFor();
  await page.locator('.primary-tabs button').nth(2).click();await page.locator('.context-card').waitFor();
  const text=await page.locator('.context-card').innerText();assert.match(text,/本机负责局域网地址分配/);assert.match(text,/地址配置可编辑/);assert.match(text,/路线可编辑/);
  assert.equal(await page.locator('.dhcp-card input[inputmode=decimal]').first().inputValue(),'192.168.30.2');
  assert.equal(await page.locator('.dhcp-card input[inputmode=decimal]').nth(1).inputValue(),'192.168.30.249');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(out,`${width}-lan-settings.png`),fullPage:true});
  report.views.push({width,homeConfigNotices:0,editorOpenedAndCancelled:true,role:text});
  const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../home-config-notices/candidate.json')));
  if(width===1440)for(const name of ['index.js','style.css','vendor.js','i18n/en.json']){
   const response=await context.request.get(base+'/luci-static/quickstart/'+name);assert.equal(response.status(),200);
   report.publicHashes[name]=crypto.createHash('sha256').update(await response.body()).digest('hex');assert.equal(report.publicHashes[name],manifest.hashes[name]);
  }
  await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.blocked,[]);for(const response of report.configResponses)assert.equal(response.status,200);
 report.result='passed';
}catch(error){report.result='failed';report.failure=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}})();
