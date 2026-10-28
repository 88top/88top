const fs=require('node:fs'),path=require('node:path'),{run}=require('./direct-test-utils.cjs');
run('widget-body-matrix',async({page,assert,report,visit,pause,state,root,capture,edit})=>{
  const baseDoc=JSON.parse(fs.readFileSync('docs/archive/evidence/m66/widget-body/70-baseline/1440-light.json')).document;
  const fields=[
    '.connection-addresses dd>span','.native-storage .disk-item_name',
    '.native-sharing .content [class*="-item_name"]','.native-sharing .content [class*="-item_value"]',
    '.native-downloads .content [class*="-item_name"]','.native-downloads .content [class*="-item_value"]',
    '.native-remote .info .path>a','.native-system .info .item1>span','.native-system .info .item>span',
  ].join(',');
  const servicesReady=()=>Promise.all([
    page.locator('.native-docker .docker_box>.path').waitFor(),
    page.locator('.native-downloads .app-container_aria2 .aria2-item a').first().waitFor(),
    page.locator('.native-remote .info .path>a.configure').waitFor(),
  ]);
  for(const theme of ['light','dark'])for(const lang of ['zh-cn','en']){
    await page.setViewportSize({width:1440,height:1000});await visit('&scenario=business-all&theme='+theme+'&lang='+lang);await servicesReady();
    for(const width of [1440,1280,1024,768,390,320]){
      await page.setViewportSize({width,height:1000});await pause();await servicesReady();assert.deepEqual((await state()).document,baseDoc,'Responsive geometry must not rewrite layout/preferences');
      const clipped=await page.locator(fields).evaluateAll(ns=>ns.filter(n=>n.clientWidth>0&&n.scrollWidth>n.clientWidth+2).map(n=>({text:n.textContent,width:n.clientWidth,scroll:n.scrollWidth,style:getComputedStyle(n).textOverflow})));
      assert.deepEqual(clipped,[],'Necessary body fields must remain readable');
      const cards=await page.locator('.ordered-content [data-ordered-card]').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.orderedCard,x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth}}));
      assert.equal(cards.length,11);assert.ok(cards.every(c=>c.scrollWidth<=c.clientWidth+2));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      report.checks.push({name:'Current layout document equals M66.70; full body fields and all 11 cards fit',width,lang,theme,cards});
      if(lang==='zh-cn'&&[1440,390].includes(width)){
        for(const id of ['connection','storage','sharing','docker','downloads','remote','system'])await page.locator('[data-layout-card='+id+']').screenshot({path:path.join(root,`${width}-${theme}-${id}.png`)});
        await capture(page,{path:path.join(root,`${width}-${theme}-home.png`)});
        fs.writeFileSync(path.join(root,`${width}-${theme}-geometry.json`),JSON.stringify(cards,null,2)+'\n');
      }
    }
  }
  for(const preset of ['network-stack','network-stack-mirror','network-stack-reverse','services','stacked']){
    await page.setViewportSize({width:1440,height:1000});await visit('&preset='+preset+'&scenario=business-all');const original=(await state()).document;
    for(const width of [1440,390,1440]){await page.setViewportSize({width,height:1000});await pause();assert.deepEqual((await state()).document,original);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))}
    report.checks.push({name:'Existing named layout / responsive roundtrip preserves intent',preset});
  }
  await visit('&scenario=business-all');const saved=await state(),original=saved.document;await edit();
  for(const id of ['connection','sharing','docker','downloads','remote','system'])for(const mode of ['summary','standard']){
    await page.locator('[data-display-settings='+id+']').click();await page.locator('[data-presentation-form='+mode+']').click();await page.locator('[data-adopt-display]').click();await pause();
    const card=page.locator('[data-layout-card='+id+']');assert.equal(await card.getAttribute('data-presentation'),mode);assert.ok(await card.evaluate(n=>n.scrollWidth<=n.clientWidth+2));
    if(mode==='standard'&&['docker','downloads','remote'].includes(id))await servicesReady();
    report.checks.push({name:'Existing supported form remains readable through real display controls',id,mode});
  }
  const beforeCancel=(await state()).document.revision;await page.locator('[data-cancel]').click();const cancelled=await state();
  assert.equal(cancelled.document.revision,beforeCancel+1,'Existing cancellation advances the gesture revision');
  assert.deepEqual({...cancelled.document,revision:original.revision},original);
  assert.deepEqual(cancelled.applied,saved.applied);assert.deepEqual(cancelled.appliedPreferences,saved.appliedPreferences);
  report.checks.push('Cancel after six widgets/twelve form changes restores original saved layout/preferences and advances its existing gesture revision');
}).catch(e=>{console.error(e);process.exitCode=1});
