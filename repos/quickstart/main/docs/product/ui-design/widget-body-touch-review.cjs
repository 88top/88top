const {run}=require('./direct-test-utils.cjs');
run('widget-body-touch',async({browser,page,assert,report,visit})=>{
  const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await touch.newPage();
  const errors=[],outside=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('request',r=>{if(new URL(r.url()).origin!=='http://192.168.9.19:5180')outside.push(r.url())});
  await p.addInitScript(()=>{const json=Response.prototype.json;Response.prototype.json=async function(){const d=await json.call(this);if(d?.result?.disks?.[1]?.childrens?.[0])d.result.disks[1].childrens[0].isReadOnly=true;return d}});
  for(const width of [390,320]){
    await p.setViewportSize({width,height:844});await p.goto('http://192.168.9.19:5180/?layout=ordered&scenario=business-all&theme=dark',{waitUntil:'networkidle'});await p.locator('.native-docker .input-switch').waitFor();await p.waitForTimeout(500);
    assert.ok(await p.evaluate(()=>matchMedia('(pointer:coarse)').matches));
    const targets=await p.locator('.connection-addresses [data-reveal],.native-sharing .content a,.native-downloads .content a,.native-remote .content a,.native-docker .input-switch,.native-storage .disk_infoicon,.native-storage .disk_icon>.tooltip-trigger').evaluateAll(ns=>ns.filter(n=>n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent.trim().slice(0,80),width:r.width,height:r.height}}));
    assert.ok(targets.length>=12);assert.ok(targets.every(t=>t.width>=44&&t.height>=44),JSON.stringify(targets));
    await p.locator('[data-reveal=ipv4]').tap();assert.equal(await p.locator('[data-address-value=ipv4]').innerText(),'192.168.30.7');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.checks.push({name:'Actual coarse-pointer targets and independent address tap',width,targets});
  }
  await touch.close();assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  await visit('&scenario=business-all');await page.locator('.native-docker .input-switch').waitFor();
  const menu=page.locator('[data-layout-card=storage] [data-widget-more]');await menu.focus();await page.keyboard.press('Enter');await page.locator('[role=menu]').waitFor();await page.keyboard.press('Escape');assert.ok(await menu.evaluate(n=>document.activeElement===n));
  const link=page.locator('.native-sharing .app-container_linkease a').last();await link.focus();const outline=await link.evaluate(n=>({style:getComputedStyle(n).outlineStyle,width:getComputedStyle(n).outlineWidth}));assert.equal(outline.style,'solid');assert.ok(parseFloat(outline.width)>=2);await page.keyboard.press('Enter');await page.locator('[data-native-destination]').waitFor();await page.keyboard.press('Escape');
  report.checks.push({name:'Original menu keyboard/focus restoration and real link focus/activation',outline});
}).catch(e=>{console.error(e);process.exitCode=1});
