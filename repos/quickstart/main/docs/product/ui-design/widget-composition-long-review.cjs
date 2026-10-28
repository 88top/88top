const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('widget-composition-long',async({page,assert,visit,report,root,pause})=>{
 // Browser-only synthetic response decorator; original source, transport owner,
 // timings and callbacks remain unchanged. No production data or requests.
 await page.addInitScript(()=>{
  let implementation=window.fetch.bind(window);
  Object.defineProperty(window,'fetch',{configurable:true,get:()=>implementation,set:fn=>{implementation=async(...args)=>{
   const response=await fn(...args),url=String(args[0]);if(!response.headers.get('content-type')?.includes('json'))return response;
   const data=await response.clone().json();if(!data.result)return response;
   if(url.includes('/u/system/version/'))Object.assign(data.result,{model:'Long-model-name-'.repeat(12),firmwareVersion:'Firmware-version-'.repeat(12),kernelVersion:'6.6.144-preview-long-kernel-version'});
   else if(url.includes('/nas/disk/status/'))for(const d of data.result.disks||[])d.venderModel='Very-long-disk-vendor-model-'.repeat(8);
   else if(url.includes('/u/nas/service/status/')){for(const s of data.result.sambas||[])Object.assign(s,{shareName:'long-share-name-'.repeat(12),path:'/mnt/'+('long-directory/').repeat(12)});if(data.result.webdav)data.result.webdav.path='/mnt/'+('long-directory/').repeat(12)}
   else if(url.includes('/guide/docker/status/'))data.result.path='/mnt/'+('long-docker-directory/').repeat(12);
   else if(url.includes('/guide/download-service/status/'))for(const s of Object.values(data.result))s.downloadPath='/mnt/'+('long-download-directory/').repeat(12);
   else if(url.includes('/u/guide/ddns/'))data.result.ddnstoDomain='https://'+('long-domain-').repeat(16)+'.example.invalid';
   else return response;
   return new Response(JSON.stringify(data),{status:response.status,headers:response.headers});
  }}});
 });
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});await visit('&scenario=business-all');await page.locator('.native-docker .path').waitFor();await page.waitForTimeout(650);
  const selectors='.native-system .info .item1>span,.native-storage .disk-item_name,.native-docker .path,.native-downloads .aria2-item_value,.native-remote .path>a';
  const clipped=await page.locator(selectors).evaluateAll(ns=>ns.filter(n=>n.clientWidth&&n.scrollWidth>n.clientWidth+2).map(n=>({text:n.innerText,width:n.clientWidth,scroll:n.scrollWidth})));
  assert.deepEqual(clipped,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const id of ['system','storage','docker','downloads','remote'])await page.locator('[data-layout-card='+id+']').screenshot({path:path.join(root,`${width}-${id}-long.png`)});
  await page.locator('.native-sharing .tab>.item').nth(1).click();await pause();assert.ok(await page.locator('.native-sharing .samba-item').evaluateAll(ns=>ns.every(n=>n.scrollWidth<=n.clientWidth+2)));
  if(width<=440){const rows=await page.locator('.native-sharing .samba-item').evaluateAll(ns=>ns.map(n=>[...n.children].map(e=>{const r=e.getBoundingClientRect();return {y:r.y,bottom:r.bottom,width:r.width}})));for(const cells of rows){assert.ok(cells[1].y>=cells[0].bottom,'Narrow SAMBA paths follow their full-width address');assert.ok(cells[0].width>width-80)}}
  await page.locator('[data-layout-card=sharing]').screenshot({path:path.join(root,`${width}-sharing-long.png`)});
  report.checks.push({name:'Long original fields supplied through test-only response decoration; no clipping or page overflow',width});
 }
}).catch(e=>{console.error(e);process.exitCode=1});
