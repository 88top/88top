const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('14-editor',async({page,assert,root,report,pause,visit,edit,close,row})=>{
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await visit('&theme='+theme);
  const host=await page.locator('[data-system-menu-reserve]').evaluate(e=>e.outerHTML),normal=await page.locator('[data-row-source=network]').first().boundingBox();
  assert.equal(await page.locator('.ordered-card-controls').count(),0);await edit();await pause();
  assert.equal(await page.locator('.ordered-editor').count(),0);
  const toolbar=await page.locator('.direct-toolbar').boundingBox();assert.ok(toolbar.height<=(width<760?96:64));
  const network=await page.locator('[data-row-source=network]').first().boundingBox();if(width===1440){assert.ok(network.y-normal.y<=80);assert.ok(network.y+network.height<=900)}
  const hits=await page.locator('[data-row-source=network] .direct-row-tools button').first().evaluate(e=>{const r=e.getBoundingClientRect();return [2,r.height/2,r.height-2].map(dy=>document.elementFromPoint(r.x+r.width/2,r.y+dy)?.closest('button')===e)});assert.ok(hits.every(Boolean),'row handle hit area obscured');
  await page.screenshot({path:path.join(root,`${width}-${theme}-editor.png`)});
  await page.locator('[data-drag-card=traffic]').click();assert.equal(await page.locator('.direct-card-actions').count(),1);
  await row('network');assert.equal(await page.locator('.direct-card-actions').count(),0);
  const panel=await page.locator('.direct-panel').boundingBox(),left=await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left);
  assert.ok(panel.x>=left&&panel.x+panel.width<=width);assert.ok(panel.y>=0&&panel.y+panel.height<=900);
  await page.screenshot({path:path.join(root,`${width}-${theme}-panel.png`)});
  await page.keyboard.press('Escape');assert.equal(await page.locator('.direct-panel').count(),0);assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-select-row')),true);
  await page.locator('[data-open-library]').click();await page.locator('.ordered-library').waitFor();await page.keyboard.press('Escape');
  await page.locator('[data-cancel]').click();assert.equal(await page.locator('.direct-toolbar').count(),0);assert.equal(await page.locator('.ordered-card-controls').count(),0);assert.equal(await page.locator('[data-system-menu-reserve]').evaluate(e=>e.outerHTML),host);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  report.checks.push({width,theme,toolbar:toolbar.height,networkTopDelta:network.y-normal.y});
 }
}).catch(e=>{console.error(e);process.exitCode=1});
