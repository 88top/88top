// Current M66.24 candidate. Real browser, actual synthetic HTTP and exported PNGs.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),capture=require('./ordered-capture.cjs');
const base='http://192.168.9.19:5180',root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/slot-edit/24-review/visual');fs.mkdirSync(root,{recursive:true});
const attempt=1+fs.readdirSync(root).filter(f=>/^attempt-\d+.json$/.test(f)).length,out=path.join(root,'attempt-'+attempt);fs.mkdirSync(out,{recursive:true});
const report={attempt,checkedAt:new Date().toISOString(),output:out,baseline:[],scenarios:[],boundaries:[],checks:[],errors:[],outside:[],manualVisual:'pending'};
(async()=>{const browser=await chromium.launch(),page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});page.on('request',r=>{if(new URL(r.url()).origin!==base)report.outside.push(r.url())});
const state=()=>page.evaluate(()=>window.__quickstartOrdered),pause=()=>page.waitForTimeout(180),edit=()=>page.locator('.lab-edit-button').click();
async function visit(width=1440,theme='light',lang='zh-cn',scenario='normal',preset='normal'){await page.setViewportSize({width,height:width<760?844:900});await page.goto(`${base}/?layout=ordered&theme=${theme}&lang=${lang}&scenario=${scenario}&preset=${preset}`,{waitUntil:'networkidle'});await page.locator('[data-layout-card=traffic] canvas').first().waitFor();await pause()}
async function geometry(label){
 await pause();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,label+' horizontal overflow');
 const left=await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left),width=page.viewportSize().width;
 const cards=await page.locator('[data-layout-card]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.layoutCard,x:r.x,right:r.right,w:r.width,h:r.height,sh:e.scrollHeight,ch:e.clientHeight,sw:e.scrollWidth,cw:e.clientWidth}}));
 for(const c of cards){assert.ok(c.sh<=c.ch+2&&c.sw<=c.cw+2,label+' '+JSON.stringify(c));assert.ok(c.x>=left-1&&c.right<=width+1,label+' outside host '+c.id)}
 assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
 for(const row of await page.locator('[data-ordered-row]').evaluateAll(es=>es.map(e=>[...e.querySelectorAll(':scope>.ordered-column')].map(c=>{const r=c.getBoundingClientRect();return {top:r.top,bottom:r.bottom}}))))for(const c of row)assert.ok(Math.abs(c.top-row[0].top)<=1&&Math.abs(c.bottom-row[0].bottom)<=1,label+' unequal row');
 return cards;
}
async function graph(){return page.locator('[data-layout-card=traffic] canvas').first().evaluate(c=>{const r=c.getBoundingClientRect(),ctx=c.getContext('2d'),data=ctx.getImageData(0,0,c.width,c.height).data;let cyan=0;for(let y=1;y<20;y++)for(let x=1;x<20;x++){const i=(Math.floor(c.height*y/20)*c.width+Math.floor(c.width*x/20))*4,[red,g,b]=data.slice(i,i+3);if(g>90&&b>120&&b>red+40&&red<150)cyan++}return {x:r.x,y:r.y,w:r.width,h:r.height,cyan}})}
async function panelBounds(){const r=await page.locator('.direct-panel').boundingBox(),left=await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left);assert.ok(r.x>=left&&r.x+r.width<=page.viewportSize().width+1&&r.y>=0&&r.y+r.height<=page.viewportSize().height+1,JSON.stringify(r))}
try{
 let host;
 for(const width of [320,390,768,1024,1440,1920])for(const theme of ['light','dark'])for(const lang of ['zh-cn','en']){
  await visit(width,theme,lang);const key=`${width}-${theme}-${lang}`,html=await page.locator('[data-system-menu-reserve]').evaluate(e=>e.outerHTML);host??=html;assert.equal(html,host);const cards=await geometry(key);assert.equal(cards.length,7);const chart=await graph();assert.ok(chart.w>170&&chart.h>110&&chart.cyan>10,JSON.stringify(chart));
  await page.screenshot({path:path.join(out,key+'-viewport.png')});await capture(page,{path:path.join(out,key+'-normal.png')});report.baseline.push({width,theme,lang,cards,chart});console.log('baseline '+key);
 }
 for(const preset of ['normal','half','stacked','mirrored','services']){
  await visit(1440,'light','zh-cn','normal',preset);await edit();const before=(await state()).draft,order=(await state()).visible;
  for(let i=0;i<3;i++){await page.setViewportSize({width:390,height:844});await geometry('roundtrip '+preset);assert.deepEqual((await state()).draft,before);assert.deepEqual(await page.locator('[data-ordered-card]').evaluateAll(es=>es.map(e=>e.dataset.orderedCard)),order);assert.equal(await page.locator('.ordered-column-handle').count(),0);await page.setViewportSize({width:1440,height:900});await pause();assert.deepEqual((await state()).draft,before)}
  report.checks.push(preset+' 3 width roundtrips');
 }
 for(const width of [320,768,1440])for(const theme of ['light','dark']){
  await visit(width,theme);await edit();await geometry('edit '+width+'/'+theme);await page.screenshot({path:path.join(out,`edit-${width}-${theme}.png`)});
  await page.locator('[data-replace-module=connection]').click();await panelBounds();await page.locator('[data-choice=applications]').click();assert.equal((await state()).history,0);await page.screenshot({path:path.join(out,`picker-${width}-${theme}.png`)});await page.keyboard.press('Escape');
  await page.locator('[data-overview]').click();await page.screenshot({path:path.join(out,`overview-${width}-${theme}.png`)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.locator('[data-overview]').click();await page.locator('[data-hide-module=system]').click();await page.locator('[data-apply]').click();await panelBounds();await page.screenshot({path:path.join(out,`finish-${width}-${theme}.png`)});await page.keyboard.press('Escape');await page.locator('[data-cancel]').click();report.checks.push('edit, picker, overview, finish '+width+'/'+theme);
 }
 for(const scenario of ['many','empty','loading','error','stale','old','permission','no-speed','disabled','speed-error','unsupported','network-error','storage-error','services-error','system-error','apps-empty','apps-error','apps-loading','apps-many','long-names','many-disks'])for(const width of [390,1440]){
  await visit(width,'light','zh-cn',scenario);await geometry(scenario+'/'+width);const text=await page.locator('[data-ordered-home]').innerText();if(scenario==='many')assert.match(text,/128 台/);if(scenario==='empty')assert.match(text,/暂未发现设备/);if(scenario==='loading')assert.match(text,/正在读取设备清单/);if(scenario==='old')assert.match(text,/版本|升级|兼容/);if(scenario==='no-speed')assert.match(text,/设备清单仍可使用/);if(scenario==='network-error')assert.match(text,/流量采样暂不可用/);if(scenario==='many-disks')assert.equal(await page.locator('[data-preview-disk]').count(),4);
  await capture(page,{path:path.join(out,`scenario-${scenario}-${width}.png`)});report.scenarios.push({scenario,width});console.log('scenario '+scenario+'/'+width);
 }
 await visit(1920);await edit();await page.getByRole('button',{name:'更多 ···',exact:true}).click();const before=(await state()).draft;
 for(const width of [292,649,650,651,677,678,679,757,758,759]){await page.getByLabel('内容预览宽度',{exact:true}).evaluate((e,w)=>{e.value=String(w);e.dispatchEvent(new Event('input',{bubbles:true}))},width);await geometry('boundary '+width);assert.deepEqual((await state()).draft,before);report.boundaries.push(width)}
 await visit(1440);const stats=()=>page.evaluate(()=>window.__quickstartDesign.requests.filter(r=>r.path==='/u/network/statistics/').length);let n=await stats();await page.waitForTimeout(10600);const delta=await stats()-n;assert.ok(delta>=2&&delta<=3,'native 5s sampler '+delta);report.checks.push({name:'native sampler',delta});
 await edit();await page.locator('[data-hide-module=traffic]').click();n=await stats();await page.waitForTimeout(5600);assert.equal(await stats(),n);report.checks.push('hidden traffic stops sampling');await page.locator('[data-undo]').click();await page.locator('[data-cancel]').click();
 n=await stats();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(5600);assert.equal(await stats(),n);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
 await page.locator('[data-layout-card=devices] [data-canvas-view-all]').click();await page.waitForURL(/devicemanagement/);n=await stats();await page.waitForTimeout(5600);assert.equal(await stats(),n);assert.ok(await page.evaluate(()=>window.__quickstartDesign.requests.length<=120));report.checks.push('hidden document and unmount clean, logs bounded');
 assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(report.outside.length,0);report.result='pass';console.log(`PASS final visual ${report.baseline.length} baseline / ${report.scenarios.length} scenarios / ${report.boundaries.length} boundaries`);
}catch(e){report.result='fail';report.failure=e.stack;await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.error(e);process.exitCode=1}
finally{fs.writeFileSync(path.join(root,`attempt-${attempt}.json`),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'review-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}})();
