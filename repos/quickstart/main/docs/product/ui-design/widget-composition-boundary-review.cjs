const {run}=require('./direct-test-utils.cjs');
run('widget-composition-boundary',async({page,assert,visit,report,state,pause})=>{
 await visit('&scenario=business-all');await page.locator('.native-system .center-label').first().waitFor();const doc=(await state()).document;
 // Test the real container query at exact supported card-content widths.
 // This fixture constrains an existing container, never replaces its charts.
 for(const width of [839,840,841,559,560,561,320]){
  await page.locator('.native-system').evaluate((n,width)=>n.style.width=width+'px',width);await pause();
  const g=await page.locator('.native-system').evaluate(n=>{const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom}};return {chart:r(n.querySelector('.chart_box')),facts:r(n.querySelector('.info')),width:n.clientWidth,scroll:n.scrollWidth,labels:[...n.querySelectorAll('.info span')].filter(e=>e.clientWidth).map(e=>({width:e.clientWidth,scroll:e.scrollWidth}))}});
  assert.equal(g.width,width);assert.ok(g.scroll<=width+2);assert.ok(g.labels.every(x=>x.scroll<=x.width+2));
  if(width>=840)assert.ok(g.chart.right<=g.facts.x+2);else assert.ok(g.chart.bottom<=g.facts.y+2);
  assert.equal(await page.locator('.native-system .center-label').count(),3);assert.deepEqual((await state()).document,doc);report.checks.push({name:'Actual container breakpoint / explicit full charts / no preference write',width,g});
 }
}).catch(e=>{console.error(e);process.exitCode=1});
