const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');
const out=process.env.QS_ACCEPT_OUT,report={views:[],errors:[],writes:[]};let browser,page;
(async()=>{try{
 browser=await chromium.launch();
 for(const lang of ['zh-cn','en'])for(const theme of ['light','dark'])for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<600});
  await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
  await context.addInitScript(lang=>{let url='';Object.defineProperty(window,'vue_lang',{configurable:true,get:()=>lang,set:()=>{}});Object.defineProperty(window,'vue_lang_data',{configurable:true,get:()=>url,set:actual=>url=actual.replace(/\/i18n\/[^/?]+\.json/,'/i18n/'+lang+'.json')})},lang);
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{const p=new URL(r.url()).pathname;if(r.method()!=='GET'&&p!=='/ubus/')report.writes.push({method:r.method(),path:p})});
  await page.goto('http://192.168.30.244/cgi-bin/luci/admin/quickstart/',{waitUntil:'networkidle'});await page.evaluate(theme=>document.body.setAttribute('theme',theme),theme);
  const card=page.locator('[data-connection-card]'),button=card.locator('[data-connection-wizard]');await button.waitFor();assert.equal((await button.innerText()).trim(),lang==='en'?'Network setup':'网络向导');assert.equal(await card.locator('header').getByText('设备管理',{exact:true}).count(),0);
  const name=[lang,theme,width].join('-');await card.screenshot({path:path.join(out,name+'-card.png')});
  if(width<600)await button.tap();else{await button.focus();await button.press('Enter')}
  await page.waitForURL(/\/quickstart\/network(?:[?#]|$)/);await page.locator('a[href$="/network/pppoe"]').waitFor();assert.equal(await page.locator('a[href$="/network/dhcp"]').count(),1);assert.equal(await page.locator('a[href$="/network/gateway"]').count(),1);
  await page.screenshot({path:path.join(out,name+'-wizard.png'),fullPage:true});await page.goBack({waitUntil:'networkidle'});await page.locator('[data-connection-wizard]').waitFor();assert.match(page.url(),/\/quickstart\/?(?:[?#]|$)/);report.views.push({lang,theme,width,navigation:'network wizard with three existing connection choices',back:'homepage restored'});await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.writes,[]);report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,views:report.views.length,failure:report.failure}))}})();
