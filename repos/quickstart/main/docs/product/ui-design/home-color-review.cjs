const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base='http://192.168.9.19:5180',out=process.env.QS_DESIGN_EVIDENCE_ROOT;assert.ok(out);fs.mkdirSync(out,{recursive:true});
const report={result:'running',views:[],checks:[],errors:[],outside:[]};let browser,page;
function rgb(value){if(value.startsWith('#')){let s=value.slice(1);if(s.length===3)s=s.split('').map(x=>x+x).join('');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16))}return value.match(/[\d.]+/g).slice(0,3).map(Number)}
function ratio(a,b){const lum=s=>rgb(s).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
// Begin/cancel advances the existing local draft revision even without content
// edits. Palette-only comparisons still check the full document above/below.
const content=doc=>{const {revision,...value}=doc;return value};
(async()=>{try{
 browser=await chromium.launch();page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==base)report.outside.push(r.url())});
 const visit=async(palette,width,theme,lang)=>{await page.setViewportSize({width,height:1000});await page.goto(`${base}/?layout=ordered&scenario=business-all&palette=${palette}&theme=${theme}&lang=${lang}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__quickstartOrdered?.width>0);await page.waitForTimeout(350)};
 const metrics=()=>page.evaluate(()=>({cards:[...document.querySelectorAll('[data-layout-card]')].map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.layoutCard,w:Math.round(r.width*100)/100,h:Math.round(r.height*100)/100}}),shell:(()=>{const n=document.querySelector('[data-system-menu-reserve]'),s=getComputedStyle(n);return {background:s.backgroundColor,color:s.color,width:n.getBoundingClientRect().width}})(),doc:window.__quickstartOrdered.document}));
 for(const lang of ['zh-cn','en'])for(const theme of ['light','dark'])for(const width of [1440,1024,768,390,320]){
  let baseline;
  for(const palette of ['classic','vivid','bold']){
   await visit(palette,width,theme,lang);const m=await metrics();assert.equal(m.cards.length,11);if(!baseline)baseline=m;else{assert.deepEqual(m.cards,baseline.cards,'Palette changed card geometry');assert.deepEqual(m.shell,baseline.shell,'Palette touched system menu');assert.deepEqual(m.doc,baseline.doc,'Palette changed layout document')}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const colours=await page.locator('[data-ordered-home]').evaluate(root=>{
    const s=getComputedStyle(root),get=k=>s.getPropertyValue(k).trim(),pairs=[['body',get('--c-text'),get('--c-panel')],['caption',get('--c-muted'),get('--home-surface-inset')],['selection',get('--c-text'),get('--home-option-selected')],['selection-caption',get('--c-muted'),get('--home-option-selected')],['link',get('--c-accent'),get('--c-panel')],['good',get('--c-good'),get('--home-good-soft')],['warning',get('--c-warning'),get('--home-warning-soft')]];
    // Bold keeps the previous white-on-gradient candidate. The recommended
    // study now checks actual coloured glyphs/text on their pale surfaces.
    if(root.dataset.colorStyle==='bold')for(const tone of ['blue','teal','violet'])for(const stop of ['start','end'])pairs.push([tone+'-'+stop,'#fff',get('--color-'+tone+'-'+stop)]);
    if(root.dataset.colorStyle==='vivid'){
     for(const icon of root.querySelectorAll('.home-applications .application-icon')){const c=getComputedStyle(icon);pairs.push(['tool-glyph',c.color,c.backgroundColor])}
     for(const tile of root.querySelectorAll('.native-business-surface .content .tab>.item')){
      const bg=getComputedStyle(tile).backgroundColor;
      for(const [name,node] of [['service-name',tile.querySelector('.title')],['service-icon',tile.querySelector('svg')],['service-state',tile.querySelector('span')]])if(node){pairs.push([name,getComputedStyle(node).color,bg]);pairs.push([name+'-hover',getComputedStyle(node).color,get('--c-hover')])}
     }
     for(const n of root.querySelectorAll('.native-system .info .item1>span'))pairs.push(['system-value',getComputedStyle(n).color,get('--c-panel')]);
     const normal=root.querySelector('[data-connection-state=netSuccess] .connection-status-text strong');if(normal)pairs.push(['connection-status',getComputedStyle(normal).color,get('--c-panel')]);
    }
    const groups=[...root.querySelectorAll('.widget-action-group')].map(g=>{const b=g.querySelector('button:not(:disabled)');return b?['action',getComputedStyle(b).color,getComputedStyle(g).backgroundColor]:null}).filter(Boolean);return [...pairs,...groups];
   });
   const contrasts=colours.map(([name,a,b])=>({name,foreground:a,background:b,ratio:ratio(a,b)}));for(const p of contrasts)assert.ok(p.ratio>=4.5,JSON.stringify({palette,width,theme,lang,...p}));
   report.views.push({palette,width,theme,lang,metrics:m,contrasts});
   if(lang==='zh-cn'&&width===1440||lang==='en'&&width===320){await require('./ordered-capture.cjs')(page,{path:path.join(out,`${palette}-${lang}-${theme}-${width}.png`)});await page.screenshot({path:path.join(out,`${palette}-${lang}-${theme}-${width}-top.png`)})}
  }
 }
 report.checks.push('60 palette/theme/language/width views: 11 card dimensions and layout documents identical to classic, system menu untouched, no horizontal overflow, body/caption/action/selection/status contrast >=4.5; recommended coloured tool glyphs/service names/icons/states/system values including service hover and previous bold gradient endpoints >=4.5');
 for(const palette of ['vivid','bold']){
  await visit(palette,1440,'light','zh-cn');const before=await metrics();await page.locator('.lab-scenes>summary').click();await page.locator('[data-color-select]').selectOption(palette==='vivid'?'bold':'vivid');assert.equal(await page.locator('[data-ordered-home]').getAttribute('data-color-style'),palette==='vivid'?'bold':'vivid');assert.deepEqual((await metrics()).doc,before.doc);await page.locator('.lab-scenes>summary').click();
  await page.locator('[data-layout-card=applications] [data-all-apps]').click();await page.locator('[data-category=tools]').click();assert.ok(await page.locator('[data-open-app]').count()>=8);await page.locator('.application-search input').fill('DNS');assert.equal(await page.locator('[data-open-app]').count(),1);await page.screenshot({path:path.join(out,palette+'-library.png')});await page.keyboard.press('Escape');assert.equal(await page.locator('[data-applications-browser]').count(),0);
  await page.locator('[data-layout-card=connection] [data-widget-more]').click();assert.ok(await page.locator('[role=menuitem]').count()>0);await page.keyboard.press('Escape');assert.equal(await page.locator('[role=menu]').count(),0);
  await page.locator('.lab-edit-button').click();await page.locator('[data-overview]').click();await page.locator('[data-layout-overview]').waitFor();await page.locator('[data-cancel]').click();assert.deepEqual(content((await metrics()).doc),content(before.doc));report.checks.push(palette+': review selector changes palette only, searchable application library, business menu keyboard close, editor/overview/cancel retain configuration');
  await page.locator('.lab-edit-button').click();await page.locator('[data-display-settings=sharing]').click();await page.locator('[data-presentation-form=summary]').click();await page.locator('[data-adopt-display]').click();await page.locator('[data-apply]').click();await page.waitForTimeout(350);const more=page.locator('[data-layout-card=sharing] [data-widget-more]');const ink=await more.evaluate(n=>getComputedStyle(n).color),panel=await page.locator('[data-ordered-home]').evaluate(n=>getComputedStyle(n).getPropertyValue('--c-panel').trim());assert.ok(ratio(ink,panel)>=4.5,'Standalone summary More must not inherit white segmented-action ink');await more.click();assert.ok(await page.locator('[role=menuitem]').count()>0);await page.keyboard.press('Escape');report.checks.push(palette+': actual summary form retains readable standalone More and its menu');
 }
 await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(await page.locator('[data-ordered-home]').getAttribute('data-color-style'),'vivid');report.checks.push('Public root defaults to vivid');assert.deepEqual(report.errors,[]);assert.deepEqual(report.outside,[]);report.result='passed';
}catch(e){report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}
finally{await browser?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,views:report.views.length,checks:report.checks,failure:report.failure},null,2))}})();
