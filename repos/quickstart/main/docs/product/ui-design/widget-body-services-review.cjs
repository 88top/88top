const {run}=require('./direct-test-utils.cjs'),path=require('node:path');
run('widget-body-services',async({page,assert,report,visit,root})=>{
  for(const width of [1440,390,320])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:1000});await visit('&scenario=business-all&theme='+theme);
    await page.locator('.native-docker .input-switch').waitFor();await page.locator('.native-remote .info .path').waitFor();
    const docker=page.locator('.native-docker'),downloads=page.locator('.native-downloads'),remote=page.locator('.native-remote');
    const pathStyle=await docker.locator('.docker_box>.path').evaluate(n=>({tag:n.tagName,editable:n.isContentEditable,border:getComputedStyle(n).borderRightWidth,text:n.textContent.trim()}));
    assert.deepEqual(pathStyle,{tag:'DIV',editable:false,border:'0px',text:'/mnt/sdb1/docker'});
    assert.doesNotMatch(await docker.innerText(),/容器数量|镜像数量/);
    for(const surface of [downloads,remote]){
      const geom=await surface.locator('.tab>.item').evaluateAll(ns=>ns.map(n=>({height:n.getBoundingClientRect().height,status:n.querySelector(':scope>span').getBoundingClientRect().y})));
      assert.ok(Math.max(...geom.map(g=>g.status))-Math.min(...geom.map(g=>g.status))<=2,JSON.stringify(geom));
      for(let i=0;i<3;i++){await surface.locator('.tab>.item').nth(i).click();assert.equal(await surface.locator('.tab>.item.active').count(),1);assert.ok(await surface.evaluate(n=>n.scrollWidth<=n.clientWidth+2))}
      await surface.locator('.tab>.item').first().click();
    }
    const rpc=await downloads.locator('a').filter({hasText:'点此自动配置'}).getAttribute('href');assert.match(rpc,/settings\/rpc\/set\/http/);
    const help=downloads.locator('.use-url_app a');assert.match(await help.getAttribute('href'),/^https:\/\/doc\.linkease\.com/);assert.notEqual(await help.evaluate(n=>getComputedStyle(n).color),'rgb(136, 136, 136)');
    const clipped=await page.locator('.native-downloads .content [class*="-item_name"],.native-downloads .content [class*="-item_value"],.native-remote .info .path>a').evaluateAll(ns=>ns.filter(n=>n.scrollWidth>n.clientWidth+2||getComputedStyle(n).whiteSpace==='nowrap').map(n=>({text:n.textContent,width:n.clientWidth,scroll:n.scrollWidth})));
    assert.deepEqual(clipped,[],'Necessary labels and revealed domains must wrap, not silently ellipsize');
    assert.equal(await remote.locator('.info .status').count(),1);assert.match(await remote.locator('.info .status').innerText(),/DDNSTO\s*正常/);
    assert.equal(await remote.locator('a.item_btn').getAttribute('href'),'https://www.kooldns.cn/app/#/devices');
    for(const id of ['docker','downloads','remote'])await page.locator('[data-layout-card='+id+']').screenshot({path:path.join(root,`${width}-${theme}-${id}.png`)});
    report.checks.push({name:'Three service cards, original status/tab/link roles and read-only path',width,theme,pathStyle});
  }
  for(const scenario of ['business-stopped','business-missing','business-docker-error','business-ipv6']){
    await visit('&scenario='+scenario);await page.locator('.native-remote .tab').waitFor();
    if(scenario==='business-stopped'){await page.locator('.native-docker .status-icon').waitFor();assert.match(await page.locator('.native-docker').innerText(),/未启用/);assert.equal(await page.locator('.native-docker .docker_box>.path').count(),0)}
    if(scenario==='business-missing'){assert.match(await page.locator('.native-docker').innerText(),/未安装/);assert.equal(await page.locator('.native-docker .input-switch').count(),0);await page.locator('.native-remote .tab>.item').nth(1).click();assert.match(await page.locator('.native-remote .info').innerText(),/离线\s*IPv4\s*动态域名解析\s*Disabled/);assert.equal(await page.locator('a[href="http://Disabled"]').count(),0)}
    if(scenario==='business-docker-error'){await page.locator('.native-docker .docker_tip').waitFor();assert.match(await page.locator('.native-docker .docker_dir_tip').textContent(),/unavailable/)}
    if(scenario==='business-ipv6'){assert.equal(await page.locator('.native-remote .tab>.item').count(),2);assert.match(await page.locator('.native-remote .tab>.item.active').innerText(),/IPv6/)}
    report.checks.push({name:'Preserved missing/stopped/error/IPv6-only branch',scenario});
  }
}).catch(e=>{console.error(e);process.exitCode=1});
