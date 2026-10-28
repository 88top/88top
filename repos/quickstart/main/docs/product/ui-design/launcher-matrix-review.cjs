const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('launcher-matrix',async({page,visit,assert,report,root,pause})=>{
 page.setDefaultTimeout(20000);
 async function inspectDialog(){return page.locator('[data-applications-browser]').evaluate(root=>{
  const r=root.getBoundingClientRect(),problems=[];
  if(r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1)problems.push('dialog outside viewport');
  if(root.scrollWidth>root.clientWidth+2)problems.push('dialog horizontal overflow');
  const bg=e=>{if(!e)return [255,255,255];const c=(getComputedStyle(e).backgroundColor.match(/[\d.]+/g)||[]).map(Number),a=c.length===3?1:c[3]||0;if(a===1)return c;const p=bg(e.parentElement);return c.slice(0,3).map((n,i)=>n*a+p[i]*(1-a))},lum=c=>c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0),contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while(n=walker.nextNode()){const e=n.parentElement;if(!n.textContent.trim()||!e?.getClientRects().length||e.closest('svg,script,style,button:disabled,.launcher-sr-only'))continue;const s=getComputedStyle(e);if(parseFloat(s.fontSize)<12)problems.push('small font: '+n.textContent);if(contrast((s.color.match(/[\d.]+/g)||[]).map(Number),bg(e))<4.5)problems.push('contrast: '+n.textContent)}
  for(const e of root.querySelectorAll('.launcher-edit-tile,.application-catalogue>div'))if(e.scrollWidth>e.clientWidth+2)problems.push('tile overflow');
  return {width:r.width,height:r.height,problems};
 })}
 for(const theme of ['light','dark'])for(const lang of ['zh-cn','en'])for(const width of [1440,1280,1024,768,390,320]){
  await page.setViewportSize({width,height:1000});await visit('&theme='+theme+'&lang='+lang);const pins=page.locator('[data-favorite-app]');assert.equal(await pins.count(),8);for(const p of await pins.all())assert.equal(await p.isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const internal=await page.locator('[data-applications-hub]').evaluate(e=>({scroll:getComputedStyle(e).overflowY,height:e.clientHeight,content:e.scrollHeight}));assert.ok(!['auto','scroll'].includes(internal.scroll)||internal.content<=internal.height+2,JSON.stringify(internal));
  if(width===1440&&lang==='zh-cn'){await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1400);await page.screenshot({path:path.join(root,`home-${theme}.png`),fullPage:true})}
  await page.locator('[data-applications-hub] [data-all-apps]').click();assert.deepEqual((await inspectDialog()).problems,[]);await page.locator('[data-manage-favorites]').click();assert.equal(await page.locator('[data-editor-shortcut]').count(),8);const result=await inspectDialog();assert.deepEqual(result.problems,[]);
  if([1440,768,390,320].includes(width)&&lang==='zh-cn')await page.locator('[data-applications-browser]').screenshot({path:path.join(root,`editor-${width}-${theme}.png`)});
  await page.locator('.applications-close').focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('.applications-save').evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await page.locator('.applications-close').evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Escape');assert.equal(await page.locator('[data-applications-browser]').count(),0);report.checks.push({name:`${width}/${lang}/${theme}`,defaultPins:8,dialog:result,focusTrap:true});
 }
}).catch(e=>{console.error(e);process.exitCode=1});
