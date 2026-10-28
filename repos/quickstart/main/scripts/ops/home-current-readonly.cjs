// A baseline of the currently installed B, not acceptance of the new homepage.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const host=process.env.QS_PREFLIGHT_HOST;if(host!=='192.168.30.244')throw Error('B-only audit');
 const out=process.env.QS_PREFLIGHT_OUT,browser=await chromium.launch({headless:true});
 const context=await browser.newContext(),report={views:[],errors:[],badResponses:[]};
 try{
  await context.addCookies([{name:'sysauth_http',value:process.env.QS_PREFLIGHT_SID,domain:host,path:'/'}]);
  const page=await context.newPage();page.setDefaultNavigationTimeout(15000);
  page.on('pageerror',()=>report.errors.push('pageerror'));page.on('response',r=>{if(r.status()>=400)report.badResponses.push({path:new URL(r.url()).pathname,status:r.status()})});
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   for(const [name,route] of [['home',''],['devices','devicemanagement']]){
    const view={name,width};report.views.push(view);
    try{
     await page.goto(`http://${host}/cgi-bin/luci/admin/quickstart/${route}`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(2500);
     const body=await page.locator('body').innerText();
     view.sessionExpired=/Session expired|Login session is expired|登录.*过期/.test(body);
     view.loggedIn=!view.sessionExpired&&!await page.locator('input[type=password]').count();
     view.currentDeviceSurface=body.includes('分组与计划')&&body.includes('局域网设置');
     view.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
     await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
    }catch{view.error='navigation_or_render_unavailable'}
   }
  }
 }finally{await browser.close();fs.writeFileSync(path.join(out,'ui.json'),JSON.stringify(report,null,2)+'\n')}
 console.log(`Current B baseline: ${report.views.length} views; no configuration actions`);
})().catch(e=>{console.error(e.message);process.exitCode=1});
