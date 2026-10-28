const {run}=require('./direct-test-utils.cjs');
run('row-sort-resource',async({page,assert,report,visit,edit,state})=>{
 await visit('&preset=services');await edit();await page.locator('[data-overview]').click();const before=await state(),start=Date.now(),initial=await page.evaluate(()=>window.__quickstartDesign.requests);
 for(let i=0;i<20;i++){await page.locator('[data-row-handle=network]').press('Alt+End');await page.locator('[data-undo]').click()}
 // Observe beyond the native five-second sampling period. A fast edit loop
 // alone would miss leaked timers that have not fired yet.
 await page.waitForTimeout(5600);const elapsed=(Date.now()-start)/1000,final=await page.evaluate(()=>window.__quickstartDesign.requests),delta=final.slice(initial.length).reduce((a,r)=>(a[r.path]=(a[r.path]||0)+1,a),{});assert.deepEqual((await state()).draft,before.draft);assert.equal((await state()).history,0);assert.equal((await state()).rowSort.frame,false);assert.ok(final.length<=120);
 for(const [key,n]of Object.entries(delta))assert.ok(n<=(key==='/u/network/statistics/'?Math.ceil(elapsed/5)+1:Math.ceil(elapsed/30)+1),key+' duplicated '+n);assert.ok(delta['/u/network/statistics/']>=1,'sampling period was not observed');report.checks.push({name:'RS08 row-sort/undo ×20, observed beyond five-second sampling period',elapsed,delta});
}).catch(e=>{console.error(e);process.exitCode=1});
