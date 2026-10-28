const {run,base}=require('./direct-test-utils.cjs');
run('home-typography-minimum',async({page,assert,report,visit,pause})=>{
 await page.goto(base+'/?layout=baseline',{waitUntil:'networkidle'});const menu=await page.locator('[data-system-menu-reserve]').evaluate(e=>({html:e.outerHTML,font:getComputedStyle(e).font}));
 await visit('&preset=network-business&scenario=network-reference');assert.deepEqual(await page.locator('[data-system-menu-reserve]').evaluate(e=>({html:e.outerHTML,font:getComputedStyle(e).font})),menu);
 report.sizes=[];
 for(const [selector,widths]of [['[data-connection-card]',[300,382,520]],['[data-network-interface]',[280,382,520]]])for(const width of widths){
  const el=page.locator(selector);await el.evaluate((e,w)=>{e.style.width=w+'px';e.style.height='260px'},width);await pause();const size=await el.evaluate(e=>({width:e.clientWidth,height:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight}));report.sizes.push({selector,...size});assert.ok(size.scrollWidth<=size.width+1&&size.scrollHeight<=size.height+1,JSON.stringify(report.sizes.at(-1)));
 }
 report.checks.push('Connection 300/382/520px and interfaces 280/382/520px fit the declared 260px standard minimum');report.checks.push('System menu markup and computed font equal the original baseline');
}).catch(e=>{console.error(e);process.exitCode=1});
