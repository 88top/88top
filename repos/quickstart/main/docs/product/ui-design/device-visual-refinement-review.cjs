// B-only, read-only acceptance. Rehearsal substitutes local assets in the browser;
// state projections substitute GET responses only and never write router state.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { ratio } = require('./home-semantic-colour-checks.cjs');
const collecting = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../web/public/luci-static/quickstart/i18n/en.json'))).en['采集中'];
assert.equal(process.env.QS_ACCEPT_HOST, '192.168.30.244');
const base = 'http://192.168.30.244', out = process.env.QS_ACCEPT_OUT;
const rehearsal = process.env.QS_DEVICE_VISUAL_REHEARSAL === '1';
const states = process.env.QS_DEVICE_VISUAL_STATES === '1';
const report = { result: 'running', rehearsal, states, views: [], errors: [], mutations: [], rpc: [], httpErrors: [] };
let browser, page;
async function measure() {
    return page.locator('.device-management').evaluate(root => {
        const rect = n => { const r = n.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; };
        const visible = n => n.checkVisibility();
        const read = n => ({ text:n.innerText, rect:rect(n), ink:getComputedStyle(n).color, bg:getComputedStyle(n).backgroundColor, font:getComputedStyle(n).fontSize, clipped:n.scrollWidth>n.clientWidth+1 });
        const main = document.querySelector('#maincontent'), host = root.closest('#maincontent>.container'), style = getComputedStyle(host);
        const row = [...root.querySelectorAll('[data-device-id]')].find(visible);
        const table = root.querySelector('.device-table'), tableVisible = table && visible(table);
        const good = document.createElement('span'); good.style.color='var(--device-good)';root.append(good);const goodInk=getComputedStyle(good).color;good.remove();
        const panel = getComputedStyle(root.querySelector('.primary-content')).backgroundColor;
        return { root:rect(root), parent:rect(root.parentElement), main:rect(main), nativeInset:{left:parseFloat(style.marginLeft)+parseFloat(style.paddingLeft),right:parseFloat(style.marginRight)+parseFloat(style.paddingRight)}, overflow:document.documentElement.scrollWidth>innerWidth, panel, goodInk, tableVisible,
            title:root.querySelector('.device-center__header h2') ? read(root.querySelector('.device-center__header h2')) : null,
            targets:[...root.querySelectorAll('.primary-tabs button,.device-toolbar button,.device-toolbar input,.device-toolbar select,.filter-panel>summary,.policy-action button')].filter(visible).map(read),
            colours:[...root.querySelectorAll('.device-center__header p,.identity-meta,.status-pill,.traffic-ready>span,.device-filters button.active')].filter(visible).map(read),
            row:row?read(row):null, stripes:tableVisible?[...table.querySelectorAll('tbody tr')].slice(0,2).map(n=>getComputedStyle(n).backgroundColor):[], address:tableVisible?read(table.querySelector('.device-address')):null,
            filters:root.querySelector('.device-filters')?rect(root.querySelector('.device-filters')):null, tools:root.querySelector('.device-center__tools')?rect(root.querySelector('.device-center__tools')):null,
            shell:[...document.querySelectorAll('.main-left,#mainmenu,.main-right>header')].map(n=>({class:n.className,rect:rect(n)})) };
    });
}
function check(m, c) {
    assert.equal(m.overflow, false, 'Page overflow');
    assert.ok(Math.abs(m.root.left-m.parent.left)<1 && Math.abs(m.root.right-m.parent.right)<1, 'Extra page gutter');
    assert.ok(Math.abs(m.root.left-m.main.left-m.nativeInset.left)<1 && Math.abs(m.main.right-m.root.right-m.nativeInset.right)<1, 'Native gutter changed');
    if (!m.title) return;
    assert.equal(m.title.font, '16px');
    for (const target of m.targets) { assert.ok(target.rect.height>=44 && target.rect.width>=44, 'Small target: '+target.text); assert.ok(target.rect.left>=0 && target.rect.right<=c.width+1, 'Offscreen control: '+target.text); }
    for (const colour of m.colours) assert.ok(ratio(colour.ink,m.panel)>=4.5, 'Text contrast: '+colour.text);
    if(m.address) { assert.ok(m.address.rect.width<=231, 'Address column too wide'); assert.equal(m.address.clipped,false,'Address clipped'); }
    for(const stripe of m.stripes) assert.equal(stripe,m.panel,'Heavy table stripe');
    if(m.root.width>1050) assert.ok(Math.abs(m.filters.top-m.tools.top)<1,'Toolbar split unnecessarily');
}
(async()=>{try {
    browser=await chromium.launch();
    const cases = states ? ['long','empty','loading','error','permission','sampling'].map(mode=>({mode,lang:'en',theme:'dark',width:320})) : rehearsal ? [{lang:'zh',theme:'light',width:1440},{lang:'zh',theme:'dark',width:768},{lang:'en',theme:'light',width:390},{lang:'en',theme:'dark',width:320}] : ['zh','en'].flatMap(lang=>['light','dark'].flatMap(theme=>[2560,1440,1280,1100,1024,768,390,320].map(width=>({lang,theme,width}))));
    for(const c of cases) {
        const context=await browser.newContext({viewport:{width:c.width,height:1000},hasTouch:c.width<600});
        await context.addCookies([{name:'sysauth_http',value:process.env.QS_ACCEPT_SID,domain:'192.168.30.244',path:'/'}]);
        await context.addInitScript(lang=>{let url='';Object.defineProperty(window,'vue_lang',{configurable:true,get:()=>lang,set:actual=>window.__qs_test_native_lang=actual});Object.defineProperty(window,'vue_lang_data',{configurable:true,get:()=>url,set:actual=>url=actual.replace(/\/i18n\/[^/?]+\.json/,'/i18n/'+lang+'.json')});},c.lang==='en'?'en':'zh-cn');
        if(rehearsal) await context.route('**/luci-static/quickstart/**',async route=>{
            const name=new URL(route.request().url()).pathname.split('/luci-static/quickstart/')[1];
            if(['style.css','index.js','vendor.js','i18n/en.json'].includes(name))return route.fulfill({path:path.resolve(__dirname,'../../../web/dist/luci-static/quickstart',name)});
            return route.continue();
        });
        let failing=['error','permission'].includes(c.mode), reads=0;
        await context.route('**/cgi-bin/luci/istore/lanctrl/v2/devices/', async route=>{
            assert.equal(route.request().method(),'GET');reads++;
            if(failing) return route.fulfill({status:c.mode==='permission'?403:503,json:{error:{code:'unavailable',message:'Test inventory unavailable'}}});
            const response=await route.fetch(),body=await response.json();
            if(c.mode==='loading')await new Promise(r=>setTimeout(r,2500));
            if(c.mode==='empty')body.result.devices=[];
            if(c.mode==='long')for(const device of body.result.devices){device.displayName='Long device name for layout review '.repeat(4);device.addresses.current=[{family:6,address:'2001:0db8:1234:5678:90ab:cdef:1234:5678',primary:true}];}
            await route.fulfill({response,json:body});
        });
        if(c.mode==='sampling')await context.route('**/cgi-bin/luci/istore/lanctrl/v2/device-traffic/',route=>route.fulfill({json:{result:{items:[],health:{state:'partial'}}}}));
        page=await context.newPage();
        page.on('pageerror',e=>report.errors.push(e.message));
        page.on('response',r=>{if(new URL(r.url()).origin===base&&r.status()>=400)report.httpErrors.push({path:new URL(r.url()).pathname,status:r.status(),mode:c.mode});});
        page.on('request',r=>{if(new URL(r.url()).origin!==base||r.method()==='GET')return;const p=new URL(r.url()).pathname;if(p==='/ubus/'){const b=r.postDataJSON();for(const x of Array.isArray(b)?b:[b])report.rpc.push({method:x.method,object:x.params?.[1],operation:x.params?.[2]});}else report.mutations.push(p);});
        await page.goto(base+'/cgi-bin/luci/admin/quickstart/devicemanagement',{waitUntil:c.mode==='loading'?'domcontentloaded':'networkidle'});
        await page.locator('.device-management').waitFor();await page.evaluate(theme=>document.body.setAttribute('theme',theme),c.theme);
        const v={...c,panes:[]},name=[c.lang,c.theme,c.width,c.mode||'normal'].join('-');report.views.push(v);
        if(c.mode==='loading'){await page.locator('.page-state--loading').waitFor();await page.screenshot({path:path.join(out,name+'-pending.png')});}
        if(failing){await page.locator('.device-center .page-state--error').waitFor();await page.screenshot({path:path.join(out,name+'-failed.png')});failing=false;await page.locator('.device-center .page-state--error button').click();v.retried=true;}
        if(c.mode==='empty'){await page.locator('.page-state--empty').waitFor();check(await measure(),c);await page.screenshot({path:path.join(out,name+'.png')});await context.close();page=null;continue;}
        await page.locator('[data-device-id]:visible').first().waitFor();await page.waitForTimeout(200);
        assert.equal(await page.locator('.primary-tabs svg').count(),3);assert.equal(await page.locator('.page-heading').count(),0);
        const row=page.locator('[data-device-id]:visible').first();v.firstDeviceId=await row.getAttribute('data-device-id');
        const m=await measure();v.panes.push({index:0,metrics:m});check(m,c);
        if(await row.locator('.status-pill.online').count())assert.equal(await row.locator('.status-pill.online').evaluate(n=>getComputedStyle(n).color),m.goodInk);
        await page.screenshot({path:path.join(out,name+'.png'),fullPage:c.width>=1024});
        if(states){if(c.mode==='long')assert.match(await row.innerText(),/2001:0db8:1234:5678:90ab:cdef:1234:5678/);if(c.mode==='sampling'){await page.locator('.telemetry-notice').waitFor();assert.ok((await row.innerText()).includes('↑ '+collecting));assert.equal(await row.locator('.traffic-ready').count(),0);}await context.close();page=null;continue;}
        const search=page.locator('.device-search input');await search.fill('__no_device_matches_visual_review__');await page.waitForFunction(()=>![...document.querySelectorAll('[data-device-id]')].some(n=>n.getClientRects().length));await search.fill('');await row.waitFor();
        for(const sort of ['name','recent'])await page.locator('.device-center__tools select').selectOption(sort);
        await page.locator('.device-filters button').nth(2).click();await page.locator('.device-filters button').first().click();await row.waitFor();
        await page.locator('.filter-panel>summary').click();await page.locator('.filter-panel select').first().selectOption('unknown');await page.locator('.clear-filters').click();await row.waitFor();check(await measure(),c);await page.locator('.filter-panel>summary').click();
        await page.locator('.add-device').click();await page.locator('.add-device-form').waitFor();assert.equal(await page.locator('.add-device-form input').count(),2);await page.locator('.add-device').click();
        const before=reads;await page.locator('.icon-button').click();await row.waitFor();assert.ok(reads>before,'Refresh did not read inventory');
        await row.focus();await row.press('Enter');await page.locator('.device-drawer').waitFor();
        for(let i=0;i<4;i++){await page.locator('.drawer-tabs button').nth(i).click();await page.waitForLoadState('networkidle');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
        await page.screenshot({path:path.join(out,name+'-drawer.png')});await page.locator('.device-drawer').press('Escape');await page.locator('.device-drawer').waitFor({state:'detached'});assert.equal(await row.evaluate(n=>document.activeElement===n),true);
        for(let i=1;i<3;i++){await page.locator('.primary-tabs>[role=tab]').nth(i).click();await page.locator(i===1?'.group-panel .evaluation':'.lan-settings .settings-nav').first().waitFor();await page.waitForLoadState('networkidle');const m=await measure();check(m,c);v.panes.push({index:i,metrics:m});if(c.width===390||c.width===1440)await page.screenshot({path:path.join(out,name+'-tab-'+i+'.png')});}
        v.interactions='search/sort/status/advanced/clear/add-cancel/refresh/four detail tabs/Escape/focus/three main tabs';
        if(c.lang==='zh'&&c.theme==='light'){const old=JSON.parse(fs.readFileSync(process.env.QS_DEVICE_SPACING_BEFORE)).views.find(x=>x.width===c.width);if(old)assert.deepEqual(v.panes.map(x=>x.metrics.shell),old.panes.map(x=>x.metrics.shell),'Native shell changed');}
        if(c.width===390){await page.locator('.breadcrumbs a').click();await page.locator('[data-ordered-home]').waitFor();await page.goBack();await page.locator('[data-device-id]:visible').first().waitFor();check(await measure(),c);v.homeBack=true;}
        await context.close();page=null;
    }
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.mutations,[]);
    for(const r of report.rpc){if(r.method==='list'&&!r.object)continue;assert.equal(r.method,'call');assert.ok(['luci.getFeatures','file.list','uci.changes'].includes(r.object+'.'+r.operation),JSON.stringify(r));}
    for(const r of report.httpErrors)assert.ok(r.status===404&&r.path==='/luci-static/resources/app-icons/kai.png'||['error','permission'].includes(r.mode)&&[403,503].includes(r.status)&&r.path.endsWith('/devices/'),JSON.stringify(r));
    report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,rehearsal,states,views:report.views.length,failure:report.failure},null,2));}})();
