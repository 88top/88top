// B-only refresh regression/diagnosis. State snapshots contain no credentials,
// device values or custom links; no server configuration is written.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');
const out=process.env.QS_REFRESH_EVIDENCE;fs.mkdirSync(out,{recursive:true});const report={result:'running',checks:[],errors:[],runs:[]};let browser,page;
const base='http://192.168.30.244',home=base+'/cgi-bin/luci/admin/quickstart/',mode=process.env.QS_REFRESH_MODE||'saved';report.mode=mode;
(async()=>{try{
 const width=Number(process.env.QS_ACCEPT_WIDTH||(process.env.QS_ACCEPT_TOUCH==='1'?390:1440));assert.ok([320,390,1440].includes(width));
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width,height:900},hasTouch:process.env.QS_ACCEPT_TOUCH==='1',locale:process.env.QS_ACCEPT_LANGUAGE==='en'?'en-US':'zh-CN'});
 if(process.env.QS_ACCEPT_THEME==='dark')await context.addInitScript(()=>{const observer=new MutationObserver(()=>{if(document.body){document.body.setAttribute('theme','dark');observer.disconnect()}});observer.observe(document,{childList:true,subtree:true})});
 await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
 if(process.env.QS_REFRESH_HIDE_BANNERS==='1'){report.probe='hide-config-banners';await context.addInitScript(()=>{const observer=new MutationObserver(()=>{if(document.head){const style=document.createElement('style');style.textContent='.home-config-state{display:none!important}';document.head.append(style);observer.disconnect()}});observer.observe(document,{childList:true,subtree:true})})}
 await context.addInitScript(()=>{
  if(!location.pathname.includes('/admin/quickstart'))return;window.__refreshFrames=[];let n=0,last='';
  function frame(){
   const shown=node=>!!node&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden';
   const cards=Array.from(document.querySelectorAll('[data-layout-card]')).filter(shown),first=cards[0];
   const row={time:Math.round(performance.now()),banners:Array.from(document.querySelectorAll('[data-config-domain]')).filter(shown).map(node=>({domain:node.getAttribute('data-config-domain'),text:node.innerText})),cards:cards.map(node=>({id:node.getAttribute('data-layout-card'),top:node.getBoundingClientRect().top+scrollY,height:node.getBoundingClientRect().height})),firstTop:first?.getBoundingClientRect().top,bootstrap:!!document.querySelector('[data-home-bootstrap]'),empty:shown(document.querySelector('.ordered-empty'))};
   const key=JSON.stringify({...row,time:0});if(key!==last){last=key;window.__refreshFrames.push(row)}
   // Include the actual 8-second request deadline, while remaining bounded.
   if(++n<720)requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
 });
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const mutations=[];page.on('request',r=>{if(r.url().includes('/home/v1/')&&r.method()!=='GET')mutations.push(r.method())});
 if(process.env.QS_REFRESH_DELAY==='1')await page.route('**/cgi-bin/luci/istore/home/v1/*/',async route=>{if(route.request().method()==='GET')await new Promise(resolve=>setTimeout(resolve,1200));await route.continue()});
 if(mode!=='saved'&&mode!=='catalogue-slow')await page.route('**/cgi-bin/luci/istore/home/v1/layout/',async route=>{
  assert.equal(route.request().method(),'GET');if(['unavailable','forbidden','timeout'].includes(mode)){if(mode==='timeout')await new Promise(resolve=>setTimeout(resolve,9000));return route.fulfill({status:mode==='forbidden'?403:503,json:{success:-1,error:'test unavailable'}}).catch(()=>{})}
  const response=await route.fetch(),body=await response.json();if(mode==='empty')body.result.value.rows=[];else body.result={state:mode,version:'',recoveryVersion:'b'.repeat(64)};await route.fulfill({response,json:body});
 });
 if(mode==='catalogue-slow')await page.route('**/cgi-bin/luci/admin/store/installed',async route=>{await new Promise(resolve=>setTimeout(resolve,3000));await route.continue()});
 await page.goto(home,{waitUntil:'domcontentloaded'});await page.locator('.canvas-home').waitFor();
 if(process.env.QS_REFRESH_RELOAD==='1'){await page.waitForLoadState('networkidle');await page.reload({waitUntil:'domcontentloaded'});await page.locator('.canvas-home').waitFor()}
 if(process.env.QS_REFRESH_DELAY==='1'||mode==='timeout'){
  await page.screenshot({path:path.join(out,'pending.png')});if(!report.probe){assert.equal(await page.locator('[data-layout-card]').count(),0);assert.equal(await page.locator('.ordered-empty').count(),0);await page.locator('[data-home-bootstrap] p').waitFor();await page.screenshot({path:path.join(out,'pending-slow.png')})}
 }
 if(mode==='catalogue-slow'){await page.locator('[data-layout-card=system]').waitFor({timeout:2500});assert.equal(await page.locator('[data-home-bootstrap]').count(),0);report.catalogueIndependent=true}
 await page.waitForLoadState('networkidle');await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'loaded.png')});
 const frames=await page.evaluate(()=>window.__refreshFrames),last=frames.at(-1),painted=frames.filter(f=>f.cards.length);report.runs.push({name:'refresh',frames});
 const transient=frames.flatMap(f=>f.banners.filter(b=>/正在校验路由器配置|Checking router configuration/.test(b.text)).map(b=>({time:f.time,...b})));
 report.transientBanners=transient;report.firstAndFinal=painted.length?{first:painted[0],final:last}:null;
 assert.equal(report.errors.length,0);assert.deepEqual(mutations,[],'Refresh must never write configuration');assert.equal(transient.length,0,'Normal initial read must not flash configuration banners that push the content down');
 if(mode==='empty'){assert.equal(painted.length,0);assert.equal(await page.locator('.ordered-empty').count(),1);assert.equal(await page.locator('[data-home-bootstrap]').count(),0);report.checks.push('A saved empty home stays empty; no default widgets, transient empty message or automatic configuration writes');report.result='passed';return}
 assert.ok(painted.length);assert.deepEqual(painted[0].cards.map(c=>c.id),last.cards.map(c=>c.id),'Do not paint the default layout before the saved user layout');
 assert.ok(Math.abs(painted[0].firstTop-last.firstTop)<1,'The first visible row must not jump after initial configuration finishes');report.checks.push('Refresh never paints transient checking banners or the wrong default layout; first visible row stays in place');report.result='passed';
 if(['unavailable','forbidden','timeout','damaged','future'].includes(mode)){const state=page.locator('[data-config-domain=layout]');assert.equal(await state.isVisible(),true);assert.equal(await page.locator('[data-home-settings]').isDisabled(),true);assert.equal(await page.locator('[data-home-bootstrap]').count(),0);assert.equal(await state.getByRole('button').count(),mode==='damaged'?2:1);report.checks.push('Real error/permission/recovery/future state remains visible and read only; settings failure is never treated as an empty saved home')}
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,checks:report.checks,transientBanners:report.transientBanners,failure:report.failure},null,2))}})();
