// Freeze the current candidate before any body presentation changes.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {run} = require('./direct-test-utils.cjs');
const root = process.env.QS_DESIGN_EVIDENCE_ROOT || 'docs/archive/evidence/m66/widget-body/70-baseline';
const mutable = new Set(['web/src/design/homeWidgetDetails.css', 'web/src/design/NetworkConnectionCard.vue']);
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const sha = body => crypto.createHash('sha256').update(body).digest('hex');
fs.mkdirSync(root, {recursive:true});
const files = walk('web/src').filter(p => /\.(vue|ts|css)$/.test(p)).concat(['web/vite.design.config.ts','scripts/ui-design.sh','scripts/ui-design-server.cjs']);
const manifest = {at:new Date().toISOString(), head:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{encoding:'utf8'}).trim(), files:files.map(file => {
  const body = fs.readFileSync(file,'utf8');
  return {file, mutable:mutable.has(file), sha256:sha(body), script:mutable.has(file)&&file.endsWith('.vue') ? body.match(/<script[\s\S]*?<\/script>/)?.[0] : undefined};
})};
fs.writeFileSync(root+'/sources.json',JSON.stringify(manifest,null,2)+'\n');
run('widget-body-baseline',async({page,visit,assert,report,capture}) => {
  for (const width of [1440,390]) for (const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1000});
    await visit('&scenario=business-all&theme='+theme);
    await page.locator('.native-docker .input-switch').waitFor();
    await page.locator('.native-remote .info .path').waitFor();
    await page.waitForTimeout(500);
    const document = await page.evaluate(() => window.__quickstartOrdered.document);
    const cards = {};
    for (const id of ['connection','storage','sharing','docker','downloads','remote','system']) {
      const card = page.locator('[data-layout-card='+id+']');
      assert.equal(await card.count(),1,id);
      cards[id] = await card.evaluate(n => {
        const r=n.getBoundingClientRect();
        return {text:n.innerText,html:n.outerHTML,box:{x:r.x,y:r.y,width:r.width,height:r.height},labels:[...n.querySelectorAll('dt,[class$="_name"],.tab>.item>.title,.center-label')].map(e=>({text:e.textContent.trim(),size:getComputedStyle(e).fontSize,color:getComputedStyle(e).color}))};
      });
      await card.screenshot({path:path.join(root,`${width}-${theme}-${id}.png`)});
    }
    fs.writeFileSync(path.join(root,`${width}-${theme}.json`),JSON.stringify({document,cards},null,2)+'\n');
    await capture(page,{path:path.join(root,`${width}-${theme}-home.png`)});
    report.checks.push({name:'Seven current native cards / default document / real screenshot baseline',width,theme,cards:Object.keys(cards)});
  }
  await visit('&scenario=business-disks');
  await page.locator('.native-storage .disk-item').first().waitFor();
  await page.locator('[data-layout-card=storage]').screenshot({path:path.join(root,'disk-conditions.png')});
  report.checks.push('Conditional disk actions and bounded projection baseline captured');
}).catch(e=>{console.error(e);process.exitCode=1});
