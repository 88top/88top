const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('widget-body-storage',async({page,assert,report,visit,root})=>{
  for(const width of [1440,390])for(const theme of ['light','dark'])for(const lang of ['zh-cn','en']){
    await page.setViewportSize({width,height:1000});await visit('&scenario=business-all&theme='+theme+'&lang='+lang);
    const surface=page.locator('[data-business-surface=sharing]');await surface.locator('.tab>.item').first().waitFor();
    const tabs=await surface.locator('.tab>.item').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),status=n.querySelector(':scope>span').getBoundingClientRect();return {height:r.height,statusY:status.y,text:n.innerText}}));
    assert.ok(Math.max(...tabs.map(t=>t.height))-Math.min(...tabs.map(t=>t.height))<=2,JSON.stringify(tabs));
    assert.ok(Math.max(...tabs.map(t=>t.statusY))-Math.min(...tabs.map(t=>t.statusY))<=2,JSON.stringify(tabs));
    for(let i=0;i<3;i++){
      await surface.locator('.tab>.item').nth(i).click();
      assert.equal(await surface.locator('.tab>.item.active').count(),1);
      const geometry=await surface.locator('.content li').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent.trim(),width:n.clientWidth,scroll:n.scrollWidth,columns:[...n.children].map(e=>({x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width,font:getComputedStyle(e).fontSize,color:getComputedStyle(e).color}))})));
      assert.ok(geometry.every(r=>r.scroll<=r.width+2),JSON.stringify(geometry));
      if(i===1){
        const rows=await surface.locator('.sambas-item:has(.tit),.samba-item').evaluateAll(nodes=>nodes.map(n=>[...n.children].map(c=>c.getBoundingClientRect().x)));
        assert.equal(rows.length,3);for(const row of rows)for(let c=0;c<2;c++)assert.ok(Math.abs(row[c]-rows[0][c])<=2,JSON.stringify(rows));
        const headerColors=await surface.locator('.sambas-item:has(.tit)>div').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).color));
        const labelColor=await surface.locator('.sambas-item:first-child .sambas-item_name').evaluate(n=>getComputedStyle(n).color);
        assert.deepEqual(headerColors,[labelColor,labelColor],'Both table headings use the same label hierarchy');
        assert.equal(await surface.locator('.samba-item_name a').count(),0);
        assert.equal(await surface.locator('.samba-item_value a').count(),2);
      }
      report.checks.push({name:'Three service options, baseline geometry, original fields/link roles',width,theme,lang,tab:i,tabs,geometry});
    }
    if(lang==='zh-cn')await page.locator('[data-layout-card=sharing]').screenshot({path:path.join(root,`${width}-${theme}-webdav.png`)});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await visit('&scenario=business-missing');const surface=page.locator('[data-business-surface=sharing]');
  await surface.locator('.app-container_linkease .configure.enabel').click();
  await page.locator('[data-native-action=action-nas]').waitFor();await page.keyboard.press('Escape');
  for(let i=0;i<3;i++){await surface.locator('.tab>.item').nth(i).click();assert.match(await surface.innerText(),i===0?/未配置/:/未启用/)}
  report.checks.push('Original unconfigured LinkEase action and missing SAMBA/WebDAV semantics retained');
}).catch(e=>{console.error(e);process.exitCode=1});
