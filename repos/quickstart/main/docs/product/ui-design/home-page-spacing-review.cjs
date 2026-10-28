const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {checkHomeHeader,checkHomeShell,setSystemTheme}=require('../../../scripts/ops/home-shell-checks.cjs');
assert.equal(process.env.QS_ACCEPT_HOST,'192.168.30.244');const base='http://192.168.30.244',out=process.env.QS_ACCEPT_OUT,baseline=process.env.QS_SPACING_BASELINE==='1';
const report={result:'running',baseline,views:[],errors:[],httpErrors:[],mutations:[],readRPC:[]};let browser,page;
async function measure(){return page.locator('[data-ordered-home]').evaluate(root=>{
 const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}},style=n=>{const s=getComputedStyle(n);return {padding:s.padding,margin:s.margin,background:s.backgroundColor,color:s.color,font:s.font,maxWidth:s.maxWidth}};
 const host=root.closest('#maincontent>.container'),main=root.closest('#maincontent'),probe=host?document.createElement('div'):null;let native;
 if(probe){probe.className=host.className;probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;height:0';main.append(probe);const s=getComputedStyle(probe);native={marginLeft:parseFloat(s.marginLeft),marginRight:parseFloat(s.marginRight),paddingLeft:parseFloat(s.paddingLeft),paddingRight:parseFloat(s.paddingRight),marginTop:s.marginTop,paddingTop:s.paddingTop};probe.remove()}
 const available=root.querySelector('.lab-available'),content=root.querySelector('.ordered-content'),top=root.querySelector('[data-home-top]'),rows=[...root.querySelectorAll('[data-ordered-row]')],cards=[...root.querySelectorAll('[data-layout-card]')];
 const controls=[...top.querySelectorAll('a,button')].map(n=>({rect:rect(n),style:style(n)}));
 return {native,main:rect(main||root),host:host?{rect:rect(host),style:style(host)}:null,root:{rect:rect(root),style:style(root)},available:{rect:rect(available),style:style(available)},content:rect(content),top:{rect:rect(top),style:style(top),controls},rows:rows.map(rect),cards:cards.map(n=>({id:n.dataset.layoutCard,form:n.dataset.presentation,rect:rect(n)})),shell:[...document.querySelectorAll('.main-left,#mainmenu,.main-right>header')].map(n=>({tag:n.tagName,class:n.className,rect:rect(n),style:style(n)})),overflow:document.documentElement.scrollWidth>innerWidth};
 })}
(async()=>{try{
 browser=await chromium.launch();const cases=baseline?['zh'].flatMap(lang=>['light'].flatMap(theme=>[2560,1440,1024,768,390,320].map(width=>({lang,theme,width})))):['zh','en'].flatMap(lang=>['light','dark'].flatMap(theme=>[2560,1920,1440,1024,768,390,320].map(width=>({lang,theme,width}))));
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:c.width,height:1000},locale:c.lang==='en'?'en-US':'zh-CN',hasTouch:c.width<600});await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({path:new URL(r.url()).pathname,status:r.status()})});page.on('request',r=>{if(!r.url().startsWith(base)||r.method()==='GET')return;const p=new URL(r.url()).pathname;if(p==='/ubus/'){const body=r.postDataJSON();for(const call of Array.isArray(body)?body:[body])report.readRPC.push({method:call.method,object:call.params?.[1],operation:call.params?.[2]})}else report.mutations.push(p)});
  await page.goto(base+'/cgi-bin/luci/admin/quickstart/',{waitUntil:'networkidle'});await page.locator('[data-layout-card=traffic]').waitFor();await page.waitForTimeout(1000);await setSystemTheme(page,c.theme);
  const m=await measure();report.views.push({...c,metrics:m,header:await checkHomeHeader(page)});assert.equal(m.overflow,false);
  // Capture the normal homepage before editor notices and focus/scroll changes.
  if(c.lang==='zh'&&[2560,1440,390,320].includes(c.width)||c.lang==='en'&&c.width===320)await page.screenshot({path:path.join(out,[c.lang,c.theme,c.width].join('-')+'.png'),fullPage:c.width>600});
  if(!baseline){
   const left=m.content.left-m.main.left,right=m.main.right-m.content.right;
   assert.ok(Math.abs(left-(m.native.marginLeft+m.native.paddingLeft))<1,'Left gutter differs from original LuCI container: '+left);assert.ok(Math.abs(right-(m.native.marginRight+m.native.paddingRight))<1,'Right gutter differs from original LuCI container: '+right);
   assert.ok(Math.abs(m.available.rect.width-m.content.width)<1);assert.ok(Math.abs(m.rows[0].left-m.content.left)<1&&Math.abs(m.rows[0].right-m.content.right)<1);
   const gap=m.rows[0].top-m.top.rect.bottom;assert.equal(gap,20);assert.equal(m.top.controls.at(-1).rect.right,m.content.right,'Header settings and body right edge differ');
   assert.equal(await page.locator('.home-semantic-colors').count()>=1,true);
   if(c.lang==='zh'&&c.theme==='light'){
    const before=JSON.parse(fs.readFileSync(process.env.QS_SPACING_BEFORE));const old=before.views.find(v=>v.width===c.width);if(old)assert.deepEqual(m.shell,old.metrics.shell,'System shell changed');
   }
   if([2560,1440,390,320].includes(c.width)){
    await checkHomeShell(page,{checks:[]},{touch:c.width<600});const before=await page.locator('[data-ordered-home]').getAttribute('class');await page.locator('[data-layout-card=connection] [data-widget-more]').click();await page.keyboard.press('Escape');await page.locator('[role=menu]').waitFor({state:'detached'});assert.equal(await page.locator('[data-ordered-home]').getAttribute('class'),before);
    await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-applications-browser]').waitFor();await page.keyboard.press('Escape');await page.locator('[data-applications-browser]').waitFor({state:'detached'});
   }
  }
  await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.mutations,[]);for(const r of report.readRPC){if(r.method==='list'&&!r.object)continue;assert.equal(r.method,'call');assert.ok(['luci.getFeatures','file.list','uci.changes'].includes(r.object+'.'+r.operation),JSON.stringify(r))}
 for(const e of report.httpErrors)assert.ok(e.status===404&&e.path==='/luci-static/resources/app-icons/kai.png','Unexpected HTTP failure: '+JSON.stringify(e));report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,views:report.views.length,failure:report.failure},null,2))}})();
