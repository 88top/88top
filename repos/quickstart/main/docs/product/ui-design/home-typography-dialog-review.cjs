const {run}=require('./direct-test-utils.cjs');
run('home-typography-dialog',async({page,assert,report,visit})=>{
 const problems=[];report.dialogs=[];
 async function inspect(label,selector){
  const node=page.locator(selector);await node.waitFor();const metrics=await node.evaluate(e=>{const r=e.getBoundingClientRect(),body=e.querySelector('.network-dialog-body,.applications-browser-body'),walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),texts=[];let text;while(text=walker.nextNode()){const el=text.parentElement;if(!text.textContent.trim()||!el||el.closest('svg,style,script,option')||!el.getClientRects().length)continue;const s=getComputedStyle(el);if(s.visibility==='hidden'||s.display==='none')continue;texts.push({text:text.textContent.trim().slice(0,60),size:parseFloat(s.fontSize),family:s.fontFamily})}return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,body:body?{width:body.clientWidth,scrollWidth:body.scrollWidth}:null,texts}});
  if(metrics.x<0||metrics.y<0||metrics.right>metrics.viewportWidth+1||metrics.bottom>metrics.viewportHeight+1)problems.push({label,issue:'dialog bounds'});
  if(metrics.body&&metrics.body.scrollWidth>metrics.body.width+1)problems.push({label,issue:'dialog content horizontal overflow',body:metrics.body});
  for(const t of metrics.texts){if(t.size<12)problems.push({label,issue:'text below 12px',...t});if(t.family!=='Arial, "Microsoft YaHei", sans-serif')problems.push({label,issue:'different font family',...t})}
  report.dialogs.push({label,...metrics});await page.keyboard.press('Escape');assert.equal(await node.count(),0);
 }
 for(const width of [320,1440])for(const lang of ['zh-cn','en']){
  await page.setViewportSize({width,height:900});const query=`&preset=network-business&lang=${lang}&theme=dark`;
  await visit(query);await page.locator('[data-all-apps]').click();await inspect(`${width}/${lang}/apps`,'.applications-browser');
  await page.locator('[data-connection-details]').click();await inspect(`${width}/${lang}/connection`,'.network-dialog');
  await page.locator('[data-port=eth0]').click();await inspect(`${width}/${lang}/port`,'.network-dialog');
  await visit(query+'&scenario=network-many');await page.locator('[data-interfaces-all]').click();await inspect(`${width}/${lang}/port-pagination`,'.network-dialog');
  for(const scenario of ['network-dns','network-source']){await visit(query+'&scenario='+scenario);await page.locator('[data-connection-remedy]').click();await inspect(`${width}/${lang}/${scenario}`,'.network-dialog')}
 }
 report.problems=problems;assert.deepEqual(problems,[]);report.checks.push('24 desktop/phone Chinese/English product dialogs retain original font, 12px readable floor, bounded scroll region and Escape close');
}).catch(e=>{console.error(e);process.exitCode=1});
