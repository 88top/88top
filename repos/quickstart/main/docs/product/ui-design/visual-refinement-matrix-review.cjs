const {run}=require('./direct-test-utils.cjs');
run('visual-refinement-matrix',async({page,assert,report,visit,state,pause})=>{
 page.setDefaultTimeout(20000);const allProblems=[];
 async function inspect(label){
  const result=await page.locator('.ordered-content').evaluate(root=>{
   const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>{const a=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*a[0]+.7152*a[1]+.0722*a[2]},ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
   const bg=e=>{if(!e)return [255,255,255];const c=rgb(getComputedStyle(e).backgroundColor),alpha=c.length===3?1:c[3]||0;if(alpha===1)return c;const p=bg(e.parentElement);return c.slice(0,3).map((v,i)=>v*alpha+p[i]*(1-alpha))};
   const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}},overlap=(a,b)=>a&&b&&Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1;
   const problems=[],texts=[],cards=Array.from(root.querySelectorAll('[data-ordered-card]')).map(n=>{
    const id=n.dataset.orderedCard,w=n.querySelector('.layout-widget'),frame=w?.querySelector('.network_container,.network-business-card,.home-applications,.canvas-module,.native-summary,.native-business-surface>.reusable-card'),title=frame?.querySelector('.card-header>.left,header>h2,.applications-heading>div:first-child,.canvas-module>header>div:first-child,.title_box>.display_flex'),action=w?.querySelector('.traffic-header-actions')||frame?.querySelector('.widget-action-group,.card-header>.settings-wrapper,header>.widget-menu'),legend=frame?.querySelector('.network_tag');
    if(n.scrollWidth>n.clientWidth+2)problems.push({id,kind:'horizontal overflow',width:n.clientWidth,scroll:n.scrollWidth});
    if(overlap(box(title),box(action))||overlap(box(legend),box(action))||overlap(box(title),box(legend)))problems.push({id,kind:'header overlap',title:box(title),action:box(action),legend:box(legend)});
    for(const e of [n,...n.querySelectorAll('.layout-widget,.native-business-surface,.reusable-card')])if(['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+2)problems.push({id,kind:'internal scroll',element:e.className});
    const walker=document.createTreeWalker(w||n,NodeFilter.SHOW_TEXT);let text;
    while(text=walker.nextNode()){const e=text.parentElement;if(!text.textContent.trim()||!e||e.closest('svg,canvas,style,script')||!e.getClientRects().length)continue;const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none')continue;const sample={id,text:text.textContent.trim().slice(0,55),size:parseFloat(s.fontSize),color:s.color,contrast:ratio(rgb(s.color),bg(e))};texts.push(sample);if(sample.size<12)problems.push({...sample,kind:'font below 12px'});if(sample.contrast<4.5)problems.push({...sample,kind:'text contrast'})}
    return {id,width:n.clientWidth,height:n.clientHeight,form:w?.dataset.presentation};
   });return {cards,problems,textCount:texts.length};
  });assert.equal(result.cards.length,11,label);if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))result.problems.push({kind:'page overflow'});allProblems.push(...result.problems.map(p=>({label,...p})));report.checks.push({name:label,...result});
 }
 for(const theme of ['light','dark'])for(const lang of ['zh-cn','en']){
  await page.setViewportSize({width:1440,height:1000});await visit('&scenario=business-all&theme='+theme+'&lang='+lang);const doc=(await state()).document;
  for(const width of [1440,1280,1024,768,390,320]){await page.setViewportSize({width,height:1000});await pause();await inspect(`default/${width}/${lang}/${theme}`);assert.deepEqual((await state()).document,doc)}
 }
 for(const scene of ['loading','empty','error','old','permission','no-speed','disabled','speed-error','apps-error','apps-loading','storage-error','services-error','system-error','business-disks','business-missing','long-names']){
  await page.setViewportSize({width:320,height:1000});await visit('&scenario='+scene+'&lang=en&theme=dark');await page.waitForTimeout(1300);await inspect('state/320/en/dark/'+scene);
 }
 await visit('&scenario=business-disks&lang=en&theme=dark');await page.locator('.native-storage .disk_icon .tooltip-trigger').first().hover();await page.waitForTimeout(800);const tip=await page.locator('.native-storage .disk_icon .tooltip-trigger').first().locator('.tooltip-text').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {left:r.left,right:r.right,visible:s.visibility,text:e.textContent.trim(),width:innerWidth}});assert.equal(tip.visible,'visible');assert.ok(tip.text.length>30&&tip.left>=0&&tip.right<=tip.width,JSON.stringify(tip));report.checks.push({name:'Original disk warning tooltip remains visible, readable and inside the phone viewport',tip});
 report.problems=allProblems;assert.deepEqual(allProblems,[]);
}).catch(e=>{console.error(e);process.exitCode=1});
