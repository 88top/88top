// Browser review harness for the design artifact; never reaches router APIs.
// rtk env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/review.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const out=path.resolve('docs/archive/evidence/m66'); fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  const errors=[],failed=[],views=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>failed.push(r.url()));
  page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
  const states=['normal','many','empty','loading','error','stale','old','no-speed','disabled','speed-error','unsupported','permission'];
  try {
    for(const variant of ['A','B','C']) for(const [viewport,width,height] of [['desktop',1440,900],['tablet',1024,768],['mobile',390,844]]) {
      await page.setViewportSize({width,height});
      for(const scenario of states) {
        await page.goto(`http://127.0.0.1:5180/?variant=${variant}&scenario=${scenario}&authority=external`,{waitUntil:'networkidle'});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${variant}/${viewport}/${scenario} overflow`);
        const count=await page.locator('.device-summary [data-device]').count();
        assert.equal(count,['normal','many','stale','no-speed','disabled','speed-error','unsupported'].includes(scenario)?(width===390?3:6):0);
        assert.match(await page.locator('.device-summary').innerText(),/本机不负责此局域网的地址分配/);
        if(scenario==='old')assert.match(await page.locator('.device-summary').innerText(),/兼容版本/);
        if(scenario==='normal')await page.screenshot({path:path.join(out,`${variant}-${viewport}.png`),fullPage:true});
        views.push({variant,viewport,scenario,count,overflow:false});
      }
    }
    await page.setViewportSize({width:1440,height:900});
    await page.goto('http://127.0.0.1:5180/?variant=A&scenario=normal');
    const identity=await page.locator('.device-summary [data-device]').first().getAttribute('data-device');
    await page.locator('.device-summary [data-device]').first().click();
    assert.ok(page.url().includes('/devicemanagement'));
    assert.equal(new URL(page.url()).searchParams.get('device'),identity);
    await page.getByRole('button',{name:'网络与上网',exact:true}).click();
    assert.match(await page.locator('#device-detail').innerText(),/请到分配地址的主路由/);
    await page.locator('#authority').selectOption('local');
    assert.match(await page.locator('#device-detail').innerText(),/本机负责此局域网的地址分配/);
    await page.locator('[data-close-detail]').click();
    await page.locator('#search').fill('电视');
    assert.equal(await page.locator('.device-list [data-device]').count(),1);
    await page.locator('[data-home]').first().click();
    await page.locator('.device-summary [data-all]').click();
    assert.equal(await page.locator('.device-list [data-device]').count(),8);
    assert.equal(new URL(page.url()).searchParams.get('device'),null);
    await page.goBack();
    await page.locator('#scenario').selectOption('error');
    await page.getByRole('button',{name:'重试',exact:true}).click();
    await page.waitForTimeout(800);
    assert.equal(await page.locator('.device-summary [data-device]').count(),6);
    await page.locator('#theme').click();
    assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('dark')));
    await page.screenshot({path:path.join(out,'A-desktop-dark.png'),fullPage:true});
    await page.keyboard.press('ArrowRight');
    assert.equal(new URL(page.url()).searchParams.get('variant'),'B');
    await page.reload();
    assert.match(await page.locator('#variant-label').innerText(),/^B/);
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(out,'B-mobile-dark.png'),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(errors.length,0); assert.equal(failed.length,0);
    const result={checkedAt:new Date().toISOString(),views,interactions:['device identity navigation','all navigation','detail tabs','external/local authority','search','browser back','retry recovery','theme','keyboard variant','reload URL'],consoleErrors:errors,requestFailures:failed,result:'pass'};
    fs.writeFileSync(path.join(out,'browser-review.json'),JSON.stringify(result,null,2)+'\n');
    console.log(`Design review passed: ${views.length} viewport/state/variant combinations, 10 interactions, 0 browser errors.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
