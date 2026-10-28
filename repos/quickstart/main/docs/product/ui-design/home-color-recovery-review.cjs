const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const out=process.env.QS_DESIGN_EVIDENCE_ROOT;fs.mkdirSync(out,{recursive:true});const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:1000}}),r={result:'running'};try{
 await p.goto('http://192.168.9.19:5180/?layout=ordered&scenario=error',{waitUntil:'networkidle'});
 const status=()=>p.evaluate(async()=>(await fetch('/cgi-bin/luci/istore/lanctrl/v2/devices/')).status);
 assert.equal(await status(),503);await p.locator('[data-refresh-inventory]').click();await p.locator('[data-canvas-device]').first().waitFor();r.before=await status();assert.equal(r.before,200);
 await p.locator('.lab-scenes>summary').click();await p.locator('[data-color-select]').selectOption('bold');await p.waitForFunction(()=>document.querySelector('[data-ordered-home]')?.dataset.colorStyle==='bold');r.after=await status();assert.equal(r.after,200,'Changing colours must retain recovered fixture data');r.result='passed';
}catch(e){r.result='failed';r.failure=e.stack;process.exitCode=1;await p.screenshot({path:path.join(out,'failure.png')})}finally{await b.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r))}})();
