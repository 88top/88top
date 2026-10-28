const {run}=require('./direct-test-utils.cjs');
run('visual-refinement-accessibility',async({page,assert,report,visit})=>{
 page.setDefaultTimeout(20000);
 for(const theme of ['light','dark']){
  await visit('&scenario=business-all&theme='+theme);await page.locator('.native-downloads .tab').waitFor();
  const borders=await page.locator('.ordered-content .tab .active').evaluateAll(nodes=>{
   const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),lum=s=>{const a=rgb(s).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*a[0]+.7152*a[1]+.0722*a[2]},ratio=(a,b)=>{a=lum(a);b=lum(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   return nodes.map(n=>{const s=getComputedStyle(n);return {text:n.innerText,border:s.borderTopWidth,contrast:ratio(s.borderTopColor,s.backgroundColor)}})
  });assert.equal(borders.length,3);assert.ok(borders.every(b=>b.border==='1px'&&b.contrast>=3),JSON.stringify(borders));report.checks.push({name:'Selected option boundaries exceed 3:1 without thick gray border',theme,borders});
  await page.locator('[data-connection-wizard]').focus();await page.keyboard.press('Tab');const focused=await page.evaluate(()=>{const n=document.activeElement,s=getComputedStyle(n);return {more:n.hasAttribute('data-widget-more'),width:s.outlineWidth,style:s.outlineStyle,color:s.outlineColor,focus:n.matches(':focus-visible')}});assert.equal(focused.more,true);assert.equal(focused.focus,true);assert.equal(focused.width,'2px');assert.equal(focused.style,'solid');report.checks.push({name:'Keyboard main/more are independent and have a visible focus outline',theme,focused});
 }
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.ordered-home').evaluate(n=>getComputedStyle(n).getPropertyValue('--home-motion').trim()),'0ms');report.checks.push('Reduced-motion preference disables visual transitions');
}).catch(e=>{console.error(e);process.exitCode=1});
