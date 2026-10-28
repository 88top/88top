const {run,base}=require('./direct-test-utils.cjs'),path=require('node:path');
run('home-typography',async({page,assert,root,report,visit,pause,edit,capture})=>{
 const quick=process.env.QS_TYPOGRAPHY_QUICK==='1',problems=[];
 report.mode=quick?'initial quick inspection':'complete';report.cases=[];report.coverage=[];
 await page.goto(base+'/?layout=baseline',{waitUntil:'networkidle'});
 const original=await page.locator('.reusable-card').filter({has:page.locator('.device-manage-btn')}).evaluate(e=>({family:getComputedStyle(e).fontFamily,title:getComputedStyle(e.querySelector('.title')).fontSize}));
 assert.equal(original.title,'16px');report.original=original;
 async function inspect(label){
  await pause();const measurements=await page.locator('[data-layout-card]').evaluateAll(es=>es.map(e=>{
   const r=e.getBoundingClientRect(),title=e.querySelector('header h2,.title_box .display_flex>span'),s=title&&getComputedStyle(title),root=e.querySelector('.canvas-module,.home-applications,.network-business-card')||e;
   const texts=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
   while(node=walker.nextNode()){if(!node.textContent.trim())continue;const el=node.parentElement;if(!el||el.closest('svg,canvas,style,script')||!el.getClientRects().length)continue;const style=getComputedStyle(el);if(style.visibility==='hidden'||style.display==='none')continue;texts.push({text:node.textContent.trim().slice(0,65),size:parseFloat(style.fontSize),family:style.fontFamily})}
   return {id:e.dataset.layoutCard,width:r.width,height:r.height,cw:e.clientWidth,sw:e.scrollWidth,ch:e.clientHeight,sh:e.scrollHeight,title:s?{size:parseFloat(s.fontSize),family:s.fontFamily}:null,texts};
  }));
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))problems.push({label,issue:'page horizontal overflow'});
  for(const m of measurements){if(!report.coverage.includes(m.id))report.coverage.push(m.id);if(m.sw>m.cw+2||m.sh>m.ch+2)problems.push({label,issue:'card overflow',...m,texts:undefined});if(m.title&&!['14','16'].includes(String(m.title.size)))problems.push({label,id:m.id,issue:'nonstandard title',title:m.title});for(const t of m.texts){if(t.size<12)problems.push({label,id:m.id,issue:'text below readable caption size',...t});if(t.family!==original.family)problems.push({label,id:m.id,issue:'font differs from original',...t})}}
  report.cases.push({label,widgets:measurements.map(({texts,...m})=>m)});
 }
 const widths=quick?[320,1440]:[320,390,768,1440,1920],langs=quick?['zh-cn']:['zh-cn','en'],themes=quick?['light']:['light','dark'];
 for(const width of widths)for(const lang of langs)for(const theme of themes)for(const preset of ['services','network-business']){
  await page.setViewportSize({width,height:900});await visit(`&preset=${preset}&lang=${lang}&theme=${theme}`);await inspect(`${width}/${lang}/${theme}/${preset}`);
  if(lang==='zh-cn'&&theme==='light'&&[320,1440].includes(width))await capture(page,{path:path.join(root,`${width}-${preset}.png`)});
 }
 assert.deepEqual([...report.coverage].sort(),['traffic','connection','networkInterface','applications','devices','system','storage','sharing','docker','downloads','remote'].sort());
 report.checks.push('Eleven independent modules use the original font family, 16/14px title tier, readable captions and bounded cards');
 if(quick){
  await page.setViewportSize({width:320,height:900});for(const scenario of ['no-speed','many-disks']){await visit(`&preset=services&lang=en&theme=dark&scenario=${scenario}`);await inspect(`320/en/dark/${scenario}`)}
  report.checks.push('Previously failing phone capability notice and many-disk cases');
 }
 if(!quick){
  for(const width of [320,1440])for(const scenario of ['loading','empty','error','old','permission','no-speed','long-names','many-disks','apps-error','apps-loading','system-error','storage-error']){
   await page.setViewportSize({width,height:900});await visit(`&preset=services&lang=en&theme=dark&scenario=${scenario}`);await inspect(`${width}/en/dark/${scenario}`);
  }
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:900});await visit('&preset=stacked&lang=en&theme=dark');await inspect(`${width}/stacked`);
   await page.locator('[data-all-apps]').click();assert.equal(await page.locator('.applications-browser').evaluate(e=>getComputedStyle(e).fontFamily),original.family);await page.locator('.applications-close').click();
  }
  await page.setViewportSize({width:1440,height:900});await visit('&preset=apps-devices&favorites=6');await edit();
  for(const rows of [2,3]){await page.locator('[data-display-settings=applications]').click();await page.locator('[data-presentation-form=grid]').click();await page.locator(`[data-icon-rows="${rows}"]`).click();await page.locator('[data-adopt-display]').click();await pause();assert.equal(await page.locator('[data-favorite-app]').count(),6);await inspect(`six-apps/${rows}-rows`)}
  await page.locator('[data-display-settings=applications]').click();await page.locator('[data-presentation-form=strip]').click();await page.locator('[data-adopt-display]').click();await inspect('apps/strip');await page.locator('[data-cancel]').click();
  await visit('&preset=network-business');await page.locator('[data-connection-details]').click();assert.equal(await page.locator('.network-dialog').evaluate(e=>getComputedStyle(e).fontFamily),original.family);await page.keyboard.press('Escape');
  report.checks.push('Loading/empty/error/old/permission/service/long-name/many-disk states, compact stacks, apps two/three rows and strip, and both product panels retain readable type');
 }
 report.problems=problems;assert.deepEqual(problems,[]);
 report.checks.push('No text below 12px in visible widget content; no card/page overflow; no outside requests or browser errors');
}).catch(e=>{console.error(e);process.exitCode=1});
