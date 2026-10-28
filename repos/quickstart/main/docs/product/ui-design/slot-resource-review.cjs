const {run}=require('./direct-test-utils.cjs');
run('slot-resource',async({page,assert,report,state,visit,edit})=>{
 await visit();await edit();const original=(await state()).draft,initial=await page.evaluate(()=>window.__quickstartDesign.requests),started=Date.now();
 for(let i=0;i<20;i++){
  await page.locator('[data-overview]').click();if(!await page.locator('[data-move-card=system]').count())await page.locator('[data-drag-card=system]').click();await page.locator('[data-move-card=system]').click();await page.locator('.slot-overview [data-placement="slot:network:1:0"]').click();await page.locator('[data-undo]').click();await page.locator('[data-overview]').click();
  await page.locator('[data-row-source=network] .ordered-column-handle').press('ArrowRight');await page.locator('[data-undo]').click();
 }
 assert.deepEqual((await state()).draft,original);assert.equal((await state()).history,0);assert.equal((await state()).gestureActive,false);
 const final=await page.evaluate(()=>window.__quickstartDesign.requests),elapsed=(Date.now()-started)/1000,delta=final.slice(initial.length).reduce((a,r)=>(a[r.path]=(a[r.path]||0)+1,a),{});
 for(const [key,n]of Object.entries(delta))assert.ok(n<=(['/u/network/statistics/','/u/network/status/'].includes(key)?Math.ceil(elapsed/5)+1:Math.ceil(elapsed/30)+1),key+' doubled '+n);assert.ok(final.length<=120);report.checks.push({name:'SC23 20 moves/view cycles/width changes + undo',elapsed,delta});
 const handle=page.locator('[data-row-source=network] .ordered-column-handle');for(let i=0;i<35;i++)await handle.press(i%2?'ArrowLeft':'ArrowRight');assert.ok((await state()).history<=30);report.checks.push('history bounded at 30');
}).catch(e=>{console.error(e);process.exitCode=1});
