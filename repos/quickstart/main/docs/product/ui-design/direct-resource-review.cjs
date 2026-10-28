const {run}=require('./direct-test-utils.cjs');
run('18-review/resources',async({page,assert,report,state,visit,edit,pause})=>{
 await visit();await edit();const before=await state(),started=Date.now();
 const requests=()=>page.evaluate(()=>window.__quickstartDesign.requests);
 const initial=await requests(),counts=items=>items.reduce((a,r)=>(a[r.path]=(a[r.path]||0)+1,a),{});
 for(let i=0;i<20;i++){
  await page.locator('[data-drag-card=system]').click();await page.locator('[data-move-card=system]').click();await page.getByRole('button',{name:'目标列表',exact:true}).click();await page.locator('[data-target-option="slot:network:1:0"]').click();await page.locator('[data-undo]').click();
  await page.locator('[data-row-source=network] .ordered-column-handle').press('ArrowRight');await page.locator('[data-undo]').click();
 }
 assert.deepEqual((await state()).draft,before.draft);assert.equal((await state()).history,0);assert.equal((await state()).gestureActive,false);const final=await requests(),elapsed=(Date.now()-started)/1000,delta=counts(final.slice(initial.length));
 for(const [path,n]of Object.entries(delta))assert.ok(n<=(path==='/u/network/statistics/'?Math.ceil(elapsed/5)+1:Math.ceil(elapsed/30)+1),path+' duplicate reads '+n);
 assert.ok(final.length<=120);report.checks.push({name:'20 moves and 20 ratio changes with undo preserve source and bounded scheduled reads',elapsed,requests:delta});
 const handle=page.locator('[data-row-source=network] .ordered-column-handle');for(let i=0;i<35;i++)await handle.press(i%2?'ArrowLeft':'ArrowRight');assert.ok((await state()).history<=30);report.checks.push('undo history bounded at 30');
}).catch(e=>{console.error(e);process.exitCode=1});
