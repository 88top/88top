const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const capture=require('./ordered-capture.cjs');
const base=process.env.QS_DESIGN_BASE_URL||'http://192.168.9.19:5180';
async function run(stage,work){
 const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||`docs/archive/evidence/m66/direct-edit/${stage}`);fs.mkdirSync(root,{recursive:true});
 const attempt=1+fs.readdirSync(root).filter(f=>/^attempt-\d+\.json$/.test(f)).length;
 const report={checkedAt:new Date().toISOString(),base,stage,attempt,checks:[],errors:[],outside:[]};
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:900}});
 let failurePage=page;
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});page.on('request',r=>{if(new URL(r.url()).origin!==base)report.outside.push(r.url())});
 const pause=()=>page.waitForTimeout(220),state=()=>page.evaluate(()=>window.__quickstartOrdered);
 const visit=async(query='')=>{await page.goto(base+'/?layout=ordered'+query,{waitUntil:'networkidle'});await page.locator('[data-layout-card=traffic] canvas').first().waitFor();await pause()};
 const edit=()=>page.locator('.lab-edit-button').click(),close=()=>page.locator('.direct-panel header button').click();
 const row=async(id)=>{await page.locator(`[data-select-row="${id}"]`).first().click();await page.locator('.direct-panel').waitFor()};
 try{await work({page,browser,assert,root,report,pause,state,visit,edit,close,row,capture,setFailurePage:p=>failurePage=p});assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(report.outside.length,0);report.result='pass';console.log(`PASS ${stage}: ${report.checks.length} groups`)}
 catch(e){report.result='fail';report.failure=e.stack;await failurePage.screenshot({path:path.join(root,`failure-${attempt}.png`)}).catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(root,`attempt-${attempt}.json`),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
}
module.exports={run,base};
