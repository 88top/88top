const {run,base}=require('./direct-test-utils.cjs');
run('slot-navigation',async({page,assert,report,state,visit,edit})=>{
 const quick=['/network','/devicemanagement','/networkSpeedTest','/parental','/applications'],tools=['/lan','/terminal','/update','/dns','/sources','/sandbox','/logs','/maintenance'];
 for(const target of [...quick,...tools]){
  await visit();await page.locator('[data-open-applications]').click();if(tools.includes(target))await page.locator('.browser-category-tabs [role=tab]').last().click();
  const selector=tools.includes(target)?`[data-browser-tool="${target}"]`:`[data-browser-quick="${target}"]`;await page.locator(selector).click();await page.waitForURL(url=>url.pathname===target);assert.equal(await page.locator('[data-applications-browser]').count(),0);
  if(target==='/devicemanagement')await page.locator('.device-filters').waitFor();else await page.locator('.destination').waitFor();report.checks.push('retained entry '+target+' reaches '+(target==='/devicemanagement'?'real isolated device UI':'safe design destination'));
 }
 await visit();const device=page.locator('[data-canvas-device]').first(),id=await device.getAttribute('data-canvas-device'),name=await device.locator('strong').innerText();await device.click();await page.locator('.device-drawer').waitFor();assert.equal(new URL(page.url()).searchParams.get('device'),id);assert.ok((await page.locator('.device-drawer').innerText()).includes(name));report.checks.push('home and full device view retain same stable ID/name');
 await visit();await edit();await page.getByRole('button',{name:'更多 ···',exact:true}).click();await page.getByRole('button',{name:'全部收起',exact:true}).click();await page.locator('[data-apply]').click();assert.equal((await state()).visible.length,0);await page.locator('[data-open-applications]').click();assert.equal(await page.locator('[data-browser-quick]').count(),5);await page.locator('.browser-category-tabs [role=tab]').last().click();assert.equal(await page.locator('[data-browser-tool]').count(),8);report.checks.push('all hidden still retains five quick entries and eight tools');
}).catch(e=>{console.error(e);process.exitCode=1});
