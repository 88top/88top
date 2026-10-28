const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('widget-body-network-disk',async({page,assert,report,visit,root,state})=>{
  await page.addInitScript(()=>{const json=Response.prototype.json;Response.prototype.json=async function(){const d=await json.call(this),r=d?.result;if(r?.ipv6addr)r.ipv6addr='2001:db8:1234:5678:90ab:cdef:1234:5678';if(r?.disks?.[1]?.childrens?.[0]){r.disks[1].childrens[0].isReadOnly=true;r.disks[1].childrens[0].errorInfo='Preview partition is read only'}return d}});
  for(const width of [1440,390,320])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:1000});await visit('&scenario=business-all&theme='+theme);
    const initial=(await state()).document,connection=page.locator('[data-connection-card]');
    assert.equal(await connection.locator('[data-address-value=ipv4]').innerText(),'••••••••••');
    await connection.locator('[data-reveal=ipv6]').click();
    const address=connection.locator('[data-address-value=ipv6]');
    assert.equal(await address.innerText(),'2001:db8:1234:5678:90ab:cdef:1234:5678');
    assert.ok(await address.evaluate(n=>n.scrollWidth<=n.clientWidth+2&&getComputedStyle(n).whiteSpace!=='nowrap'));
    assert.equal(await connection.locator('[data-address-value=ipv4]').innerText(),'••••••••••');
    const neutral=await connection.evaluate(n=>getComputedStyle(n.querySelector('.connection-uptime-badge')).color===getComputedStyle(n.querySelector('dt')).color);assert.ok(neutral,'Interface uptime has neutral label color');
    const disks=page.locator('.native-storage');await disks.locator('.disk-item').first().waitFor();
    const bars=await disks.locator('.disk-item .progress-bar').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}));
    assert.equal(bars.length,3);assert.ok(Math.max(...bars.map(b=>b.right))-Math.min(...bars.map(b=>b.right))<=2,JSON.stringify(bars));
    const counts=await disks.locator('.disk_icon').evaluateAll(ns=>ns.map(n=>n.children.length));assert.ok(counts.includes(3)&&counts.includes(1),JSON.stringify(counts));
    const strokes=await disks.locator('.disk_infoicon>svg [stroke]:not([stroke=none])').evaluateAll(ns=>ns.map(n=>({stroke:getComputedStyle(n).stroke,color:getComputedStyle(n).color})));
    assert.ok(strokes.every(s=>s.stroke===s.color),JSON.stringify(strokes));
    for(const id of ['connection','storage'])await page.locator('[data-layout-card='+id+']').screenshot({path:path.join(root,`${width}-${theme}-${id}.png`)});
    assert.deepEqual((await state()).document,initial);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    report.checks.push({name:'Short independent mask, full long IPv6, neutral uptime, stable disk bars with one/three actions and unchanged layout intent',width,theme,bars,counts});
  }
}).catch(e=>{console.error(e);process.exitCode=1});
