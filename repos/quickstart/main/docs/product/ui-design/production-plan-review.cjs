// Inspect the user-designated product preview without saving business/config data.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const base='http://192.168.9.19:5180',root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT);
 fs.mkdirSync(root,{recursive:true});
 const report={checkedAt:new Date().toISOString(),base,views:[],checks:[],errors:[]};
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'networkidle'});await page.waitForTimeout(1800);
  const before=await page.evaluate(()=>window.__quickstartOrdered.applied);
  report.layout=before;
  const capture=async name=>{
   await page.screenshot({path:path.join(root,name+'.png'),fullPage:true});
   report.views.push({name,width:await page.evaluate(()=>innerWidth),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),cards:await page.locator('[data-layout-card]').evaluateAll(items=>items.map(el=>({id:el.dataset.layoutCard,form:el.dataset.presentation,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})))})
  };
  await capture('desktop-home');
  assert.equal(await page.locator('[data-layout-card]').count(),11);
  await page.getByRole('button',{name:'自定义首页',exact:true}).click();
  await page.locator('[data-overview]').click();await page.waitForTimeout(250);await capture('desktop-layout-overview');
  await page.locator('[data-cancel]').click();
  assert.deepEqual(await page.evaluate(()=>window.__quickstartOrdered.applied),before);
  report.checks.push('Default five rows / 11 stable widgets; layout overview and cancel preserve applied layout');
  await page.locator('[data-layout-card=applications] [data-all-apps]').click();
  await page.locator('[data-applications-browser]').waitFor();await capture('desktop-launchpad');
  await page.locator('[data-add-link]').click();await capture('desktop-link-form');
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  report.checks.push('Unified launchpad and custom link form inspected; exited without saving');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1800);await capture('mobile-home');
  await page.getByRole('button',{name:'切换主题',exact:true}).click();await page.waitForTimeout(800);await capture('mobile-dark-home');
  assert.deepEqual(await page.evaluate(()=>window.__quickstartOrdered.applied),before);
  report.checks.push('Narrow screen and dark theme preserve saved layout intent');
  assert.equal(report.errors.length,0);
  report.result='inspected';
 }catch(error){report.result='failed';report.failure=error.stack;process.exitCode=1}
 finally{await browser.close();fs.writeFileSync(path.join(root,'review.json'),JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({result:report.result,views:report.views.length,checks:report.checks,errors:report.errors,failure:report.failure},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
