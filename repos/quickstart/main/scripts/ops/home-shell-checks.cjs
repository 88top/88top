const assert=require('node:assert/strict');
async function checkHomeHeader(page){
 const metrics=await page.locator('[data-ordered-home]').evaluate(root=>{
  const top=root.querySelector('[data-home-top]'),r=top.getBoundingClientRect(),s=getComputedStyle(top),parent=root.closest('#maincontent')||root;
  const p=parent.getBoundingClientRect(),a=top.querySelector('a'),b=top.querySelector('[data-home-settings]'),ab=a.getBoundingClientRect(),bb=b.getBoundingClientRect();
  return {height:r.height,expectedHeight:matchMedia('(max-width:600px),(pointer:coarse)').matches?48:32,left:r.left,right:r.right,parentLeft:p.left,parentRight:p.right,background:s.backgroundColor,expectedPrimary:getComputedStyle(document.body).getPropertyValue('--primary').trim(),text:getComputedStyle(a).color,icon:getComputedStyle(b.querySelector('path')).fill,controlsInside:Math.min(ab.top,bb.top)>=r.top&&Math.max(ab.bottom,bb.bottom)<=r.bottom};
 });
 assert.equal(metrics.height,metrics.expectedHeight,'Desktop blue band / touch target height changed');
 assert.ok(Math.abs(metrics.left-metrics.parentLeft)<1&&Math.abs(metrics.right-metrics.parentRight)<1,'Utility bar is inset inside the content');
 const expected=await page.evaluate(color=>{const n=document.createElement('span');n.style.color=color;document.body.append(n);const result=getComputedStyle(n).color;n.remove();return result},metrics.expectedPrimary||'#606de8');
 assert.equal(metrics.background,expected,'Utility bar must use the system blue');
 assert.equal(metrics.text,'rgb(255, 255, 255)');assert.equal(metrics.icon,'rgb(255, 255, 255)');assert.equal(metrics.controlsInside,true);
 assert.equal(await page.locator('[data-home-quick-actions],[data-home-quick]').count(),0,'Legacy shortcut strip must be absent');
 return metrics;
}
async function checkHomeShell(page,report,{editable=true,touch=false}={}){
 assert.equal(await page.locator('.lab-header,.lab-intro,.lab-footer,[data-open-applications]').count(),0,'Removed product header/footer or replacement launcher remains');
 assert.equal(await page.locator('[data-ordered-home] > footer').count(),0);
 const website=page.locator('[data-home-top] a');assert.equal(await website.getAttribute('href'),'https://www.istoreos.com/');assert.match(await website.getAttribute('rel'),/noopener/);
 report.headerMetrics=await checkHomeHeader(page);
 const metrics=await page.locator('[data-ordered-home]').evaluate(root=>{const top=root.querySelector('[data-home-top]').getBoundingClientRect(),first=root.querySelector('[data-layout-card]')?.getBoundingClientRect(),last=[...root.querySelectorAll('[data-ordered-row]')].at(-1)?.getBoundingClientRect(),style=getComputedStyle(root);return {topBottom:top.bottom,firstTop:first?.top,visibleStatus:[...root.querySelectorAll('[data-config-domain]')].some(n=>n.getBoundingClientRect().height>0),bottomGap:last?root.getBoundingClientRect().bottom-last.bottom:null,paddingBottom:style.paddingBottom,minHeight:style.minHeight}});
 assert.equal(metrics.paddingBottom,'24px');assert.equal(metrics.minHeight,'0px');if(metrics.firstTop!==undefined){assert.ok(metrics.firstTop>=metrics.topBottom+20);if(!metrics.visibleStatus)assert.equal(metrics.firstTop-metrics.topBottom,20,'Legacy shortcuts or their spacing remain')}if(metrics.bottomGap!==null)assert.ok(metrics.bottomGap<=60,'Reserved footer whitespace remains');report.shellMetrics=metrics;
 const settings=page.locator('[data-home-settings]');assert.equal(await settings.isEnabled(),editable);
 if(touch){const box=await settings.boundingBox();assert.ok(box.width>=44&&box.height>=44,'Settings touch target smaller than 44px')}
 if(editable){await settings.focus();await page.keyboard.press('Enter');await page.locator('.ordered-editing').waitFor();await page.locator('[data-overview]').click();await page.locator('[data-layout-overview]').waitFor();await page.locator('[data-cancel]').click();assert.equal(await settings.evaluate(n=>n===document.activeElement),true,'Editor did not return focus to the settings icon')}
 report.checks.push('Full-width blue website/settings bar restored; legacy shortcuts and custom footer absent; keyboard editor and content spacing preserved');
}
async function setSystemTheme(page,theme){
 await page.evaluate(theme=>document.body.setAttribute('theme',theme),theme);await page.waitForTimeout(300);
 await checkHomeHeader(page);
}
module.exports={checkHomeShell,setSystemTheme,checkHomeHeader};
