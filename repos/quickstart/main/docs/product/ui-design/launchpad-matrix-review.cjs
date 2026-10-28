const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('launchpad-matrix',async({page,visit,assert,report,root,pause})=>{
 page.setDefaultTimeout(15000);
 const inspect=()=>page.locator('[data-applications-browser]').evaluate(root=>{
  const problems=[],r=root.getBoundingClientRect(),body=root.querySelector('.applications-browser-body'),reserve=parseFloat(getComputedStyle(document.querySelector('.canvas-home')).getPropertyValue('--design-system-reserve'))||0;
  if(r.left<reserve-1||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1)problems.push('outside content viewport');
  if(root.scrollWidth>root.clientWidth+1||body.scrollWidth>body.clientWidth+1)problems.push('horizontal overflow');
  for(const tile of root.querySelectorAll('.launchpad-tile'))if(tile.scrollWidth>tile.clientWidth+1)problems.push('tile overflow');
  for(const control of root.querySelectorAll('button,input')){if(!control.getClientRects().length||control.matches('input[type=checkbox]'))continue;const b=control.getBoundingClientRect();if(b.width<43.9||b.height<43.9)problems.push('small target '+control.outerHTML.slice(0,110))}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const e=node.parentElement;if(node.textContent.trim()&&e?.getClientRects().length&&!e.closest('svg,style,script')&&parseFloat(getComputedStyle(e).fontSize)<12)problems.push('font below 12 '+node.textContent)}
  return {width:r.width,columns:root.querySelector('.launchpad-grid')?getComputedStyle(root.querySelector('.launchpad-grid')).gridTemplateColumns.split(' ').length:0,problems};
 });
 for(const theme of ['light','dark'])for(const lang of ['zh-cn','en'])for(const width of [1440,1280,1024,768,390,320]){
  await page.setViewportSize({width,height:900});await visit(`&scenario=apps-35&theme=${theme}&lang=${lang}`);await page.locator('[data-applications-hub] [data-all-apps]').click();assert.equal(await page.locator('[data-open-app]').count(),35);const grid=await inspect();assert.deepEqual(grid.problems,[]);await page.screenshot({path:path.join(root,`all-${width}-${lang}-${theme}.png`)});
  await page.locator('[data-add-link]').click();const name=lang==='en'?'My personal network storage and remote access dashboard':'家庭网络存储与远程服务入口名称较长时依然保持整齐';await page.locator('[data-link-name]').fill(name);await page.locator('[data-link-url]').fill('https://services.example.test/dashboard');assert.deepEqual((await inspect()).problems,[]);if([1440,390,320].includes(width)&&lang==='zh-cn')await page.screenshot({path:path.join(root,`form-${width}-${theme}.png`)});await page.locator('[data-link-save]').click();assert.equal(await page.locator('[data-open-app]').count(),1);assert.equal(await page.locator('[data-open-app]').getAttribute('title'),name);assert.deepEqual((await inspect()).problems,[]);await page.locator('[data-manage-links]').click();assert.deepEqual((await inspect()).problems,[]);await page.keyboard.press('Escape');assert.equal(await page.locator('[inert]').count(),0);report.checks.push({width,lang,theme,grid,linkForm:true,longName:true,manageLinks:true,cleanup:true});
 }
}).catch(e=>{console.error(e);process.exitCode=1});
