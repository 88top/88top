const {run}=require('./direct-test-utils.cjs');
run('widget-body-resource',async({page,assert,report,visit,edit,pause})=>{
  await page.addInitScript(()=>{
    const clocks=new Set(),visibility=new Set(),resize=new Set(),set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
    window.setInterval=(fn,delay,...args)=>{const id=set(fn,delay,...args);if(delay===1000)clocks.add(id);return id};window.clearInterval=id=>{clocks.delete(id);return clear(id)};
    for(const [target,type,ids] of [[document,'visibilitychange',visibility],[window,'resize',resize]]){
      const add=target.addEventListener.bind(target),remove=target.removeEventListener.bind(target);
      target.addEventListener=(event,fn,...args)=>{if(event===type)ids.add(fn);return add(event,fn,...args)};
      target.removeEventListener=(event,fn,...args)=>{if(event===type)ids.delete(fn);return remove(event,fn,...args)};
    }
    window.__bodyOwners={clocks,visibility,resize};
  });
  const counts=()=>page.evaluate(()=>Object.fromEntries(['/nas/disk/status/','/raid/list/','/u/nas/service/status/','/guide/docker/status/','/guide/download-service/status/','/u/guide/ddns/','/system/status/','/u/system/version/'].map(path=>[path,window.__quickstartDesign.requests.filter(r=>r.path===path).length])));
  const owners=()=>page.evaluate(()=>({...Object.fromEntries(Object.entries(window.__bodyOwners).map(([k,s])=>[k,s.size])),charts:document.querySelectorAll('[_echarts_instance_]').length}));
  await visit('&scenario=business-all');await page.locator('.native-docker .input-switch').waitFor();await page.waitForTimeout(1200);
  const initial=await owners(),start=await counts(),at=Date.now();await edit();
  for(let i=0;i<20;i++){
    await page.locator('[data-display-settings=sharing]').click();await page.locator('[data-presentation-form='+(i%2?'standard':'summary')+']').click();await page.locator('[data-adopt-display]').click();
    await page.locator('[data-overview]').click();await page.locator('[data-overview]').click();
  }
  await page.locator('[data-cancel]').click();await page.waitForTimeout(1600);const finish=await counts(),seconds=(Date.now()-at)/1000;
  for(const key of ['/nas/disk/status/','/raid/list/','/u/nas/service/status/','/guide/docker/status/','/guide/download-service/status/','/u/system/version/']){assert.equal(start[key],1);assert.equal(finish[key],1)}
  assert.ok(finish['/u/guide/ddns/']-start['/u/guide/ddns/']<=Math.ceil(seconds/3)+1);assert.ok(finish['/system/status/']-start['/system/status/']<=Math.ceil(seconds/5)+1);
  assert.deepEqual(await owners(),initial);report.checks.push({name:'20 real form/overview cycles: no added read owners, clocks, visibility/resize listeners or chart instances',initial,start,finish,seconds});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await pause();const hidden=await counts();await page.waitForTimeout(3600);assert.deepEqual(await counts(),hidden);assert.equal((await owners()).clocks,0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(1800);assert.deepEqual(await owners(),initial);report.checks.push('Background pauses reads/clocks; foreground restores exactly the baseline owners');
  await page.evaluate(()=>document.getElementById('app').__vue_app__.unmount());const unmounted=await counts();await page.waitForTimeout(3600);assert.deepEqual(await counts(),unmounted);assert.deepEqual(await owners(),{clocks:0,visibility:0,resize:0,charts:0});assert.ok(await page.evaluate(()=>window.__quickstartDesign.requests.length<=120));
  report.checks.push('Actual Vue unmount releases instrumented clocks/listeners/charts and stops reads; request log remains bounded at 120');
}).catch(e=>{console.error(e);process.exitCode=1});
