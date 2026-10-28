// Navigation, rendering and logged-out UI only. Never submits configuration.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const host = process.env.QS_SECURITY_HOST;
  const out = process.env.QS_SECURITY_OUTPUT;
  const base = `https://${host}`;
  const report = { host, views: [], pageErrors: [], failedRequests: [], cancelledRequests: [], badResponses: [], expectedAuthDenials: [], writes: [] };
  let loggedOut = false;
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const anonymous = await context.newPage();
    await anonymous.goto(base + '/cgi-bin/luci/admin/quickstart/', {waitUntil:'domcontentloaded'});
    report.anonymousPasswordForm = await anonymous.locator('input[type=password]').count() > 0;
    assert(report.anonymousPasswordForm, 'anonymous admin page did not require login');
    await anonymous.close();
    await context.addCookies([{name:'sysauth_https', value:process.env.QS_SECURITY_SID, domain:host, path:'/', secure:true}]);
    const page = await context.newPage();
    page.on('pageerror', e => report.pageErrors.push(e.message));
    page.on('requestfailed', r => {
      const entry = {path:new URL(r.url()).pathname, error:r.failure().errorText};
      (entry.error === 'net::ERR_ABORTED' ? report.cancelledRequests : report.failedRequests).push(entry);
    });
    page.on('request', r => { if (!['GET','HEAD','OPTIONS'].includes(r.method())) report.writes.push({method:r.method(),path:new URL(r.url()).pathname}); });
    page.on('response', r => { if (r.status() >= 400) {
      const entry={path:new URL(r.url()).pathname,status:r.status()};
      (loggedOut && r.status()===403 ? report.expectedAuthDenials : report.badResponses).push(entry);
    }});
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width, height:900});
      for (const [name,route] of [['home',''],['devices','devicemanagement'],['network','network']]) {
        await page.goto(base + '/cgi-bin/luci/admin/quickstart/' + route, {waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForSelector('#app', {timeout:15000});
        await page.waitForTimeout(3000);
        const view = await page.evaluate(() => ({
          appTextLength:document.querySelector('#app').textContent.trim().length,
          passwordForm:!!document.querySelector('input[name=\"luci_password\"]'),
          overflow:document.documentElement.scrollWidth > innerWidth + 1,
          title:document.title,
        }));
        Object.assign(view, {name,width});
        report.views.push(view);
        assert(!view.passwordForm && view.appTextLength > 30, `${name}/${width}: app did not render`);
        await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
      }
    }
    // Destroying the session itself is done by the Python owner after this
    // browser exits. This page checks the missing-cookie UI independently.
    loggedOut = true;
    await context.clearCookies();
    await page.goto(base + '/cgi-bin/luci/admin/quickstart/',{waitUntil:'domcontentloaded'});
    report.afterCookieRemovalPasswordForm = await page.locator('input[type=password]').count() > 0;
    assert(report.afterCookieRemovalPasswordForm);
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out,'ui.json'),JSON.stringify(report,null,2)+'\n');
  }
  assert.equal(report.pageErrors.length,0,'browser script errors');
  console.log(JSON.stringify({views:report.views.length,pageErrors:report.pageErrors.length,badResponses:report.badResponses.length,overflow:report.views.filter(v=>v.overflow).length}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
