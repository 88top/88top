// Real-browser composition review. No replacement charts or screenshot-only CSS.
const {run}=require('./direct-test-utils.cjs'),fs=require('node:fs'),path=require('node:path');
const stage=process.env.QS_COMPOSITION_STAGE||'final';
const ids=['connection','storage','sharing','docker','downloads','remote','system'];
run('widget-composition-'+stage,async({page,assert,report,root,visit,capture,edit,pause,state})=>{
  const geometry={};
  const wait=async()=>{await page.locator('.native-remote .info .path').waitFor();await page.locator('.native-docker .input-switch').waitFor();await page.waitForTimeout(650)};
  const widths=stage==='final'?[1440,1280,1024,768,390,320]:[1440,390];
  for(const width of widths)for(const theme of ['light','dark'])for(const lang of stage==='final'?['zh','en']:['zh']){
    await page.setViewportSize({width,height:1000});await visit('&scenario=business-all&theme='+theme+(lang==='en'?'&lang=en':''));await wait();
    const doc=(await state()).document,key=`${width}-${theme}-${lang}`;
    const snapshot=await page.evaluate(ids=>{
      const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
      return {overflow:document.documentElement.scrollWidth>innerWidth+2,cards:Object.fromEntries(ids.map(id=>{const n=document.querySelector('[data-layout-card='+id+']');return [id,{...box(n),text:n.innerText,scroll:n.scrollHeight>n.clientHeight+2,links:[...n.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),body:n.querySelector('.content')?box(n.querySelector('.content')):null}]}))};
    },ids);
    assert.equal(snapshot.overflow,false,key);assert.ok(Object.values(snapshot.cards).every(c=>!c.scroll),key+' no card scroll');
    for(const [id,c]of Object.entries(snapshot.cards))assert.ok(c.width>0&&c.height>0&&c.x>=-2&&c.right<=width+2,key+' '+id);
    if(['system','storage','services','network-disk','final'].includes(stage)&&width===1440){
      const areas=await page.locator('.native-system .content').evaluate(n=>{const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,right:b.right,y:b.y}};return {metrics:r(n.querySelector('.chart_box')),facts:r(n.querySelector('.info'))}});
      assert.ok(areas.metrics.right<=areas.facts.x+2,'System metrics/facts side by side');
    }
    if(['storage','services','network-disk','final'].includes(stage)){
      assert.equal(await page.locator('.native-sharing .tab>button').count(),3);
      assert.equal(await page.locator('.native-sharing .tab>button[aria-pressed=true]').count(),1);
    }
    if(['services','network-disk','final'].includes(stage))for(const kind of ['downloads','remote'])assert.equal(await page.locator('.native-'+kind+' .tab>button').count(),3);
    geometry[key]=snapshot;
    for(const id of ids)await page.locator('[data-layout-card='+id+']').screenshot({path:path.join(root,`${width}-${theme}-${lang}-${id}.png`)});
    if(lang==='zh'&&width===1440)await page.locator('.ordered-content .ordered-row:has([data-layout-card=docker])').screenshot({path:path.join(root,`${width}-${theme}-service-row.png`)});
    if(lang==='zh')await capture(page,{path:path.join(root,`${width}-${theme}-home.png`)});
    assert.deepEqual((await state()).document,doc,'Capture cannot write layout preferences');
    report.checks.push({name:'Real card / page composition, overflow and preference protection',width,theme,lang});
  }
  if(stage==='system'||stage==='final'){
    await page.setViewportSize({width:390,height:1000});await visit('&scenario=business-all&theme=dark');await wait();await edit();await page.locator('[data-display-settings=system]').click();await page.locator('[data-presentation-form=standard]').click();await page.locator('[data-adopt-display]').click();await page.locator('[data-apply]').click();await pause();await page.waitForTimeout(650);
    assert.equal(await page.locator('.native-system .center-label').count(),3);await page.locator('[data-layout-card=system]').screenshot({path:path.join(root,'390-dark-system-full.png')});report.checks.push('Explicit full system on phone retains all three original charts');
  }
  if(['storage','services','network-disk','final'].includes(stage)){
    await page.setViewportSize({width:1440,height:1000});await visit('&scenario=business-all');await wait();
    for(const kind of (stage==='storage'?['sharing']:['sharing','downloads','remote'])){
      const choices=page.locator('.native-'+kind+' .tab>button');
      for(let i=0;i<3;i++){await choices.nth(i).focus();await page.keyboard.press('Enter');await pause();assert.equal(await choices.nth(i).getAttribute('aria-pressed'),'true');await page.locator('[data-layout-card='+({sharing:'sharing',downloads:'downloads',remote:'remote'}[kind])+']').screenshot({path:path.join(root,`${kind}-option-${i}.png`)});report.checks.push({name:'Native keyboard service selection and current content',kind,index:i})}
    }
  }
  fs.writeFileSync(path.join(root,'geometry.json'),JSON.stringify(geometry,null,2)+'\n');
}).catch(e=>{console.error(e);process.exitCode=1});
