// Current installation audit; clicks navigation only, never a configuration action.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const host = process.env.QS_AUDIT_HOST;
  const out = process.env.QS_AUDIT_OUT;
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const report = { host, views: [], consoleErrors: [], requestFailures: [], badResponses: [] };
  try {
    await context.addCookies(['sysauth_http', 'sysauth_https', 'sysauth'].map(name => ({ name, value: process.env.QS_AUDIT_SID, domain: host, path: '/' })));
    const page = await context.newPage();
    page.on('pageerror', e => report.consoleErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
    page.on('requestfailed', r => report.requestFailures.push({ path: new URL(r.url()).pathname, error: r.failure().errorText }));
    page.on('response', r => { if (r.status() >= 400) report.badResponses.push({ path: new URL(r.url()).pathname, status: r.status() }); });
    for (const [name, width, height] of [['desktop', 1440, 900], ['tablet', 1024, 768], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`http://${host}/cgi-bin/luci/admin/quickstart/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2200);
      const home = await page.locator('body').innerText();
      const deviceLink = page.getByText('局域网设备管理', { exact: true }).first();
      let navigated = false;
      if (await deviceLink.count()) {
        await deviceLink.click();
        await page.waitForTimeout(1800);
        navigated = page.url().includes('/devicemanagement');
      }
      if (!navigated) {
        await page.goto(`http://${host}/cgi-bin/luci/admin/quickstart/devicemanagement`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
      }
      const body = await page.locator('body').innerText();
      report.views.push({ name, homeLoaded: /网络|Network|Connected Devices/.test(home), navigated,
        currentDeviceSurface: body.includes('分组与计划') && body.includes('局域网设置'),
        failureVisible: /加载失败|404|设备清单不可用|读取结果失败/.test(body),
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        textSample: body.includes('局域网设备管理') ? body.slice(body.indexOf('局域网设备管理'), body.indexOf('局域网设备管理') + 800) : 'Installed UI does not contain the current device-management surface.' });
      await page.screenshot({ path: path.join(out, `${host}-${name}.png`), fullPage: true });
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, `${host}-ui.json`), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`Read-only UI evidence: ${host}; views=${report.views.length}; errors=${report.consoleErrors.length}; badResponses=${report.badResponses.length}`);
})().catch(e => { console.error(e.message); process.exitCode = 1; });
