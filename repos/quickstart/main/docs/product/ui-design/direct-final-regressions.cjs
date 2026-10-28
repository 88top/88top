// Sequential browser suites: one current preview, isolated evidence, no router access.
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/direct-edit/18-review/current'),report={checkedAt:new Date().toISOString(),checks:[]};fs.mkdirSync(root,{recursive:true});
try{
 for(const [name,file]of [['editor','direct-editor-review.cjs'],['movement','direct-movement-review.cjs'],['layout','direct-layout-review.cjs'],['inputs','direct-input-review.cjs'],['resources','direct-resource-review.cjs']]){
  execFileSync('rtk',['proxy','/var/cache/build-cache/run.sh','--','node',path.join(__dirname,file)],{stdio:'inherit',env:{...process.env,QS_DESIGN_EVIDENCE_ROOT:path.join(root,name)}});report.checks.push({name,result:'pass'});
 }
 report.result='pass';
}catch(e){report.result='fail';report.failure=e.message;process.exitCode=1}
finally{fs.writeFileSync(path.join(root,'regressions.json'),JSON.stringify(report,null,2)+'\n')}
