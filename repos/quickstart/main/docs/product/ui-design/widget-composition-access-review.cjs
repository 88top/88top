const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('widget-composition-access',async({browser,page,assert,report,visit,root,pause})=>{
 for(const kind of ['sharing','downloads','remote']){
  await visit('&scenario=business-all');await page.locator('.native-'+kind+' .tab>button').first().waitFor();
  const buttons=page.locator('.native-'+kind+' .tab>button');await buttons.nth(1).focus();await page.keyboard.press('Space');assert.equal(await buttons.nth(1).getAttribute('aria-pressed'),'true');
  assert.ok(await buttons.nth(1).evaluate(n=>getComputedStyle(n).outlineStyle==='solid'&&parseFloat(getComputedStyle(n).outlineWidth)>=2));
  await page.keyboard.press('Tab');assert.ok(await buttons.nth(2).evaluate(n=>document.activeElement===n));await page.keyboard.press('Enter');assert.equal(await buttons.nth(2).getAttribute('aria-pressed'),'true');report.checks.push({name:'Native Space, Tab, Enter, pressed state and visible focus',kind});
 }
 const context=await browser.newContext({viewport:{width:320,height:844},hasTouch:true,isMobile:true}),p=await context.newPage();
 try{
  await p.addInitScript(()=>{const json=Response.prototype.json;Response.prototype.json=async function(){const d=await json.call(this);if(d?.result?.disks?.[1]?.childrens?.[0])d.result.disks[1].childrens[0].isReadOnly=true;return d}});
  await p.goto('http://192.168.9.19:5180/?layout=ordered&scenario=business-all&theme=dark',{waitUntil:'networkidle'});await p.locator('.native-docker .input-switch').waitFor();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const kind of ['sharing','downloads','remote']){const choices=p.locator('.native-'+kind+' .tab>button');const sizes=await choices.evaluateAll(ns=>ns.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));assert.ok(sizes.every(s=>s.w>=44&&s.h>=44));await choices.nth(1).tap();assert.equal(await choices.nth(1).getAttribute('aria-pressed'),'true')}
  const trigger=p.locator('.native-storage .disk_icon>.tooltip-trigger').first();await trigger.hover();await p.waitForTimeout(800);
  const tip=await trigger.locator('.tooltip-text').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,visible:getComputedStyle(n).visibility}});await p.locator('[data-layout-card=storage]').screenshot({path:path.join(root,'320-touch-disk-warning.png')});
  assert.equal(tip.visible,'visible');assert.ok(tip.x>=0&&tip.right<=320,JSON.stringify(tip));assert.deepEqual(errors,[]);report.checks.push({name:'Real coarse-pointer selectors and multiline disk warning remain readable',tip});
 }finally{await context.close()}
}).catch(e=>{console.error(e);process.exitCode=1});
