const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('widget-body-warning',async({page,assert,report,visit,root})=>{
  await page.addInitScript(()=>{const json=Response.prototype.json;Response.prototype.json=async function(){const data=await json.call(this);if(data?.result?.disks?.[1]?.childrens?.[0])data.result.disks[1].childrens[0].isReadOnly=true;return data}});
  for(const width of [1440,390,320])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:1000});await visit('&scenario=business-docker-error&theme='+theme);
    const trigger=page.locator('.native-docker .docker_tip');await trigger.waitFor();await trigger.hover();await page.waitForTimeout(800);
    const tip=await page.locator('.native-docker .tooltip-text').evaluate(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,viewport:innerWidth,visibility:getComputedStyle(n).visibility,text:n.textContent.trim()}});
    assert.equal(tip.visibility,'visible');assert.match(tip.text,/unavailable/);assert.ok(tip.left>=0&&tip.right<=width,JSON.stringify(tip));assert.ok(tip.width>=200,'Long message must use a readable line length');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('[data-layout-card=docker]').screenshot({path:path.join(root,`${width}-${theme}-docker-warning.png`)});
    report.checks.push({name:'Original Docker warning remains fully readable and inside viewport',width,theme,tip});
  }
  for(const theme of ['light','dark']){
    await page.setViewportSize({width:320,height:1000});await visit('&scenario=business-all&theme='+theme);
    const trigger=page.locator('.native-storage .disk_icon .tooltip-trigger').first();await trigger.hover();await page.waitForTimeout(800);
    const tip=await trigger.locator('.tooltip-text').evaluate(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,text:n.textContent.trim()}});
    assert.ok(tip.width>=190&&tip.left>=0&&tip.right<=320,JSON.stringify(tip));assert.match(tip.text,/分区存在异常/);
    await page.locator('[data-layout-card=storage]').screenshot({path:path.join(root,`320-${theme}-disk-warning.png`)});
    report.checks.push({name:'Disk warning beside two original actions has a readable bounded width',theme,tip});
  }
}).catch(e=>{console.error(e);process.exitCode=1});
