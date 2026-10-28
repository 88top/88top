// Current-browser evidence for the approved compact network presentation.
const {run}=require('./direct-test-utils.cjs'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const stage=process.env.QS_DENSITY_STAGE||'after',before=stage==='before';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
run('network-density-'+stage,async({page,visit,root,report,assert,capture,state,pause})=>{
 page.setDefaultTimeout(12000);
 const files=fs.readdirSync('web/src/design').filter(n=>/\.(ts|vue|css)$/.test(n)).map(n=>'web/src/design/'+n).concat('web/vite.design.config.ts');
 const sources=files.map(file=>{const s=fs.readFileSync(file,'utf8'),m=s.match(/<script[^>]*>([\s\S]*?)<\/script>/);return{file,sha256:hash(s),script:m?hash(m[1]):null}});
 fs.writeFileSync(path.join(root,'sources.json'),JSON.stringify(sources,null,2)+'\n');
 if(!before){
  const baseline=JSON.parse(fs.readFileSync('docs/archive/evidence/m66/network-density/before/sources.json'));
  const allowed=['NetworkConnectionCard.vue','homeWidgetDetails.css','naturalHome.css','rowLayout.ts','widgetPresentation.ts'];
  for(const prior of baseline){const now=sources.find(s=>s.file===prior.file);assert.ok(now,prior.file);if(prior.script)assert.equal(now.script,prior.script,prior.file+' script unchanged');if(!allowed.includes(path.basename(prior.file)))assert.equal(now.sha256,prior.sha256,prior.file+' unchanged')}
  report.checks.push('Original design business scripts and all unrelated runtime sources match this turn baseline');
 }
 report.geometry=[];
 const inspect=async(key)=>{
  await pause();const result=await page.locator('[data-connection-card],[data-network-interface]').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),row=n.closest('[data-ordered-row]'),min=row?.getAttribute('data-size-measuring');if(row)row.setAttribute('data-size-measuring','');const intrinsic=n.getBoundingClientRect().height;if(row){if(min===null)row.removeAttribute('data-size-measuring');else row.setAttribute('data-size-measuring',min)}return{kind:n.hasAttribute('data-connection-card')?'connection':'interface',width:r.width,height:r.height,intrinsic,overflowX:n.scrollWidth>n.clientWidth+2,overflowY:n.scrollHeight>n.clientHeight+2,text:n.innerText}}));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,key+' page overflow');
  for(const item of result){assert.equal(item.overflowX,false,key+' '+item.kind+' horizontal overflow');assert.equal(item.overflowY,false,key+' '+item.kind+' vertical overflow')}
  report.geometry.push({key,cards:result});return result;
 };
 for(const width of before?[1440,390]:[1440,1280,1024,768,390,320])for(const theme of before?['light']:['light','dark'])for(const lang of before?['zh-cn']:['zh-cn','en']){
  await page.setViewportSize({width,height:1000});await visit('&scenario=business-all&theme='+theme+'&lang='+lang);await page.locator('.native-docker .input-switch').waitFor();
  const doc=(await state()).document,key=`${width}-${theme}-${lang}`,geometry=await inspect(key);
  if(!before&&width===1440&&lang==='zh-cn'){
   const c=geometry.find(c=>c.kind==='connection'),i=geometry.find(c=>c.kind==='interface');assert.ok(c.height>=220&&c.height<=240,JSON.stringify(c));assert.ok(i.height>=135&&i.height<=145,JSON.stringify(i));
  }
  assert.equal(await page.locator('[data-connection-card] [data-address-value=ipv4]').innerText(),'••••••••••');
  if(before||[1440,390,320].includes(width)&&lang==='zh-cn'){
   for(const id of ['connection','networkInterface'])await page.locator('[data-layout-card='+id+']').screenshot({path:path.join(root,`${key}-${id}.png`)});
   if(width===1440)await page.locator('[data-row-source=network]').first().screenshot({path:path.join(root,key+'-network-row.png')});
   if(width!==320)await capture(page,{path:path.join(root,key+'-home.png')});
  }
  assert.deepEqual((await state()).document,doc,'Rendering does not rewrite layout');report.checks.push({width,theme,lang,geometry});
 }
 if(before)return;
 // Exercise natural growth with full addresses, labels and bounded large DNS.
 for(const width of [1440,320])for(const scene of ['network-dns','network-source','network-offline','network-error','network-no-address','network-many','ports-error','ports-empty']){
  await page.setViewportSize({width,height:1000});await visit('&scenario='+scene+'&lang='+(width===320?'en':'zh-cn')+'&theme=dark');await inspect(width+'/'+scene);report.checks.push({width,scene});
 }
 await page.addInitScript(()=>{const original=Response.prototype.json;Response.prototype.json=async function(){const d=await original.call(this);if(d?.result?.ipv6addr)d.result.ipv6addr='2001:db8:1234:5678:90ab:cdef:1234:5678';return d}});
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});await visit('&scenario=business-all');const c=page.locator('[data-connection-card]'),eye=c.locator('[data-reveal=ipv6]');
  assert.match(await eye.getAttribute('aria-label'),/显示60秒/);await eye.focus();await page.keyboard.press('Space');assert.equal(await eye.getAttribute('aria-pressed'),'true');
  const address=c.locator('[data-address-value=ipv6]');assert.equal(await address.innerText(),'2001:db8:1234:5678:90ab:cdef:1234:5678');assert.ok(await address.evaluate(n=>n.scrollWidth<=n.clientWidth+2));
  assert.equal(await c.locator('[data-address-value=ipv4]').innerText(),'••••••••••');await inspect(width+'/long-revealed');await c.screenshot({path:path.join(root,width+'-long-address.png')});
  await eye.press('Enter');assert.equal(await eye.getAttribute('aria-pressed'),'false');report.checks.push({width,longIPv6:'Complete address, independent privacy and keyboard toggle'});
 }
 fs.writeFileSync(path.join(root,'geometry.json'),JSON.stringify(report.geometry,null,2)+'\n');
}).catch(e=>{console.error(e);process.exitCode=1});
