// Read exported PNG pixels, independently of the live ECharts canvas.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/row-layout/11-review');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'review-report.json'))).baseline;
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage(),report={checkedAt:new Date().toISOString(),images:[]};
 try{
  for(const file of fs.readdirSync(root).filter(f=>/^\d+-.+-(viewport|normal)\.png$/.test(f))){
   const row=baseline.find(r=>file.startsWith(r.width+'-'+r.theme+'-'+r.lang+'-'));assert.ok(row&&Number.isFinite(row.chart.x)&&Number.isFinite(row.chart.y),'Canvas bounds required: '+file);
   const cyan=await page.evaluate(async ({base64,rect})=>{
    const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const data=ctx.getImageData(Math.floor(rect.x),Math.floor(rect.y),Math.floor(rect.w),Math.floor(rect.h)).data;
    let n=0;for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2];if(g>90&&b>120&&b>r+40&&r<150)n++}return n;
   },{base64:fs.readFileSync(path.join(root,file)).toString('base64'),rect:row.chart});
   report.images.push({file,canvasBounds:row.chart,cyan,pass:cyan>1000});
  }
  report.result=report.images.every(r=>r.pass)?'pass':'fail';fs.writeFileSync(path.join(root,'screenshot-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.images.filter(r=>!r.pass)));assert.equal(report.images.length,48);assert.equal(report.result,'pass');console.log('PASS: 48 exported PNG graph regions contain the actual curve');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
