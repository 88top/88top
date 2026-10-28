// Actual click, semantic and layout regression for the DHCP-authority explanation.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base='http://192.168.9.19:5180',root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/row-layout/11-review');fs.mkdirSync(root,{recursive:true});
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage(),report={checkedAt:new Date().toISOString(),base,cases:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
 try{
  for(const width of [320,390,768,1024,1440,1920])for(const theme of ['light','dark'])for(const lang of ['zh-cn','en'])for(const authority of ['external','local','unknown']){
   await page.setViewportSize({width,height:844});await page.goto(base+'/?layout=ordered&authority='+authority+'&theme='+theme+'&lang='+lang,{waitUntil:'networkidle'});
   const card=page.locator('[data-layout-card=devices]'),before=await card.evaluate(e=>e.getBoundingClientRect().height);await card.locator('details summary').click();
   const bounds=await card.locator('details p').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,text:e.textContent,sh:e.scrollHeight,ch:e.clientHeight}}),left=await page.locator('[data-quickstart-content]').evaluate(e=>e.getBoundingClientRect().left),height=await card.evaluate(e=>e.getBoundingClientRect().height);
   const expected=authority==='external'?lang==='en'?'does not allocate':'不负责此局域网地址分配':authority==='local'?lang==='en'?'allocates':'本机负责':lang==='en'?'unconfirmed':'尚不明确';
   const pass=bounds.x>=left&&bounds.right<=width&&bounds.sh<=bounds.ch+1&&height===before&&bounds.text.includes(expected);
   report.cases.push({width,theme,lang,authority,contentLeft:left,bounds,height,pass});
   if(authority==='external'&&(width===320||width===1440))await page.screenshot({path:path.join(root,'authority-'+width+'-'+theme+'-'+lang+'.png')});
  }
  report.result=report.cases.every(c=>c.pass)&&!report.errors.length?'pass':'fail';fs.writeFileSync(path.join(root,'authority-popover-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,cases:report.cases.length,failed:report.cases.filter(c=>!c.pass)}));assert.equal(report.result,'pass');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
