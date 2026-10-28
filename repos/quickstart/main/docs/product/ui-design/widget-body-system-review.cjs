const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('widget-body-system',async({page,assert,report,visit,edit,root,pause,state})=>{
  // Preserve the original ECharts entrance animation. Capture the actual fully
  // painted rings rather than freezing an intermediate animation frame.
  const settleGauges=()=>page.waitForFunction(()=>[...document.querySelectorAll('.native-system .pie-chart-wrapper canvas')].length===3&&[...document.querySelectorAll('.native-system .pie-chart-wrapper canvas')].every(c=>{
    const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let left=0,right=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>0){if(x<c.width/2)left++;else right++}
    const scale=(c.width/150)**2;return left>1900*scale&&right>1900*scale&&Math.abs(left-right)<30*scale;
  }));
  const setForm=async mode=>{await edit();await page.locator('[data-display-settings=system]').click();await page.locator('[data-presentation-form='+mode+']').click();await page.locator('[data-adopt-display]').click();await page.locator('[data-apply]').click();await pause();if(mode==='standard')await settleGauges()};
  for(const [scenario,values,colors] of [
    ['business-all',['1%','48℃','27%'],['#3b82f6','#22c55e','#8b5cf6']],
    ['system-zero',['0%','0℃','0%'],['#3b82f6','#22c55e','#8b5cf6']],
    ['system-high',['96%','116℃','96%'],['#ef4444','#f97316','#b91c1c']],
    ['system-missing',['0%','0℃','0%'],['#3b82f6','#22c55e','#8b5cf6']],
  ]){
    await visit('&scenario='+scenario);await page.locator('.native-system').waitFor();
    if(!await page.locator('.native-system .center-label').count())await setForm('standard');
    await page.locator('.native-system .center-label').first().waitFor();
    await settleGauges();
    const actual=await page.locator('.native-system .pie-chart-wrapper').evaluateAll(ns=>ns.map(n=>{const label=n.querySelector('.center-label'),icon=n.querySelector('.center-icon [fill]:not([fill=none])');return {text:label.textContent.trim(),size:getComputedStyle(label).fontSize,color:icon.getAttribute('fill')}}));
    assert.deepEqual(actual.map(a=>a.text),values);assert.deepEqual(actual.map(a=>a.color),colors);assert.ok(actual.every(a=>a.size==='22px'));
    assert.match(await page.locator('.native-system').innerText(),/QEMU Standard PC|iStoreOS/);report.checks.push({name:'Original three metrics, units, zero/missing conventions and threshold colors',scenario,actual});
  }
  for(const width of [1440,390])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:1000});await visit('&scenario=business-all&theme='+theme);await setForm('standard');
    const system=page.locator('.native-system'),doc=(await state()).document;
    const geom=await system.locator('.info .item1').evaluateAll(ns=>ns.map(n=>({width:n.clientWidth,scroll:n.scrollWidth,padding:getComputedStyle(n).padding,text:n.innerText})));
    assert.equal(geom.length,2);assert.equal(geom[0].padding,geom[1].padding);assert.ok(geom.every(g=>g.scroll<=g.width+2));
    for(const text of ['设备型号','固件版本','内核','系统时间','已启动'])assert.ok((await system.innerText()).includes(text));
    await page.locator('[data-layout-card=system]').screenshot({path:path.join(root,`${width}-${theme}-system.png`)});
    await page.setViewportSize({width:width===1440?390:1440,height:1000});await pause();assert.deepEqual((await state()).document,doc);assert.equal(await system.locator('.center-label').count(),3);
    report.checks.push({name:'Full system fields, equal panels, original preference across width roundtrip',width,theme,geom});
  }
  await visit('&preset=services&scenario=business-all');await setForm('summary');
  const summary=page.locator('[data-system-form=summary]');await summary.waitFor();assert.equal(await summary.locator('[data-system-metric]').count(),3);assert.match(await summary.innerText(),/48℃|27%/);
  await summary.locator('[data-widget-more]').click();await summary.locator('[data-widget-menu-item=complete]').click();await page.locator('.network-dialog .pie-chart-wrapper').first().waitFor();assert.equal(await page.locator('.network-dialog .pie-chart-wrapper').count(),3);await page.keyboard.press('Escape');
  await summary.locator('[data-system-overview]').click();await page.locator('[data-native-destination]').waitFor();assert.match(await page.locator('[data-native-destination] code').innerText(),/\/admin\/status\/overview$/);await page.keyboard.press('Escape');
  report.checks.push('Compact metrics / full original information / original overview target remain distinct');
}).catch(e=>{console.error(e);process.exitCode=1});
