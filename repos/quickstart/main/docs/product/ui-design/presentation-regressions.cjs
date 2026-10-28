// Run independent browser suites serially; collect all failures for one review.
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/widget-presentation/30-review/regression');fs.mkdirSync(root,{recursive:true});
const attempt=1+fs.readdirSync(root).filter(n=>/^batch-\d+\.json$/.test(n)).length,report={attempt,checkedAt:new Date().toISOString(),suites:[]};
for(const name of ['presentation-applications','presentation-devices','presentation-negotiation','slot-primary','slot-normalization','slot-overview','slot-input','row-sort','row-sort-lifecycle','slot-navigation','slot-resource','presentation-resource']){
 const filename=name==='presentation-resource'?'presentation-resource-review.cjs':name+'-review.cjs';
 const child=spawnSync(process.execPath,[path.join(__dirname,filename)],{env:{...process.env,QS_DESIGN_EVIDENCE_ROOT:path.join(root,name)},stdio:'inherit'});report.suites.push({name,exitCode:child.status,error:child.error?.message});
}
report.result=report.suites.every(s=>s.exitCode===0)?'pass':'fail';fs.writeFileSync(path.join(root,`batch-${attempt}.json`),JSON.stringify(report,null,2)+'\n');console.log('REGRESSION '+report.result);if(report.result!=='pass')process.exitCode=1;
