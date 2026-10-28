// Current B, real authentication/page; 24 pins are projected through GET only.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');const out=process.env.QS_APP_HEADER_EVIDENCE;fs.mkdirSync(out,{recursive:true});
const report={result:'running',checks:[],views:[],errors:[],mutations:[]},base='http://192.168.30.244';let browser,page;
const links=Array.from({length:24},(_,i)=>({id:'user-link:header-check-'+i,name:'Quick link '+String(i+1).padStart(2,'0'),url:'https://example.invalid/check/'+i,glyph:'globe'}));
(async()=>{try{
 browser=await chromium.launch();
 for(const language of ['zh','en'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1440,height:900},locale:language==='en'?'en-US':'zh-CN',hasTouch:true});
  await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
  await context.route('**/cgi-bin/luci/istore/home/v1/launcher/',async route=>{assert.equal(route.request().method(),'GET');const response=await route.fetch(),body=await response.json();body.result.value.links=links;body.result.value.favorites=links.map(l=>l.id);await route.fulfill({response,json:body})});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().startsWith(base)&&/\/home\/v1\/|\/admin\/store\//.test(r.url())&&r.method()!=='GET')report.mutations.push(new URL(r.url()).pathname)});
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/',{waitUntil:'networkidle'});await require('../../../scripts/ops/home-shell-checks.cjs').setSystemTheme(page,theme);
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:900});await page.waitForTimeout(180);
   const card=page.locator('[data-layout-card=applications]'),button=card.locator('[data-all-apps]');await button.waitFor();
   assert.equal((await button.innerText()).trim(),language==='en'?'All':'查看全部');assert.equal(await card.locator('[data-app-overflow]').count(),0);
   const visible=await card.locator('[data-favorite-app]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-favorite-app'))),capacity=Number(await card.locator('[data-app-capacity]').getAttribute('data-app-capacity'));
   assert.ok(visible.length>0&&visible.length<=capacity&&visible.length<24);assert.deepEqual(visible,links.slice(0,visible.length).map(l=>l.id));
   const geometry=await card.evaluate(card=>{const title=card.querySelector('.applications-heading h2'),actions=card.querySelector('.applications-actions'),header=card.querySelector('.applications-heading'),box=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height}};return {title:box(title),actions:box(actions),header:box(header),card:box(card),lineHeight:parseFloat(getComputedStyle(title).lineHeight),overflow:document.documentElement.scrollWidth>innerWidth}});
   assert.ok(geometry.title.right<=geometry.actions.left+1);assert.ok(geometry.title.height<=2*geometry.lineHeight+1,'Title must not collapse into vertical characters');assert.ok(geometry.actions.right<=geometry.card.right-4);assert.equal(geometry.overflow,false);
   report.views.push({language,theme,width,visible:visible.length,capacity,geometry});
   if([1440,768,320].includes(width))await card.screenshot({path:path.join(out,language+'-'+theme+'-'+width+'.png')});
  }
  await buttonClick(page);await page.locator('[data-category=links]').click();assert.equal(await page.locator('[data-open-app]').count(),24);await page.locator('.application-search input').fill('Quick link 24');assert.equal(await page.locator('[data-open-app]').count(),1);assert.equal(await page.locator('[data-open-app="user-link:header-check-23"]').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('[data-applications-browser]').count(),0);
  report.checks.push(language+' '+theme+': five widths, bounded ordered pins, compact action/title geometry and all 24/search reachable');await context.close();page=null;
 }
 assert.deepEqual(report.mutations,[]);assert.deepEqual(report.errors,[]);report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,checks:report.checks,views:report.views.length,failure:report.failure},null,2))}})();
async function buttonClick(page){await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-applications-browser]').waitFor()}
