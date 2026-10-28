const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/launcher/62-review/protection';fs.mkdirSync(root,{recursive:true});
const files=JSON.parse(fs.readFileSync('docs/archive/evidence/m66/launcher/57-contract/protected-sources.json'));
const baseline=JSON.parse(fs.readFileSync('docs/archive/evidence/m66/launcher/57-contract/candidate/candidate.json')).gitHead;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const {file,sha256}of files){if(file==='web/src/design/LayoutPreviewCard.vue'){const body=fs.readFileSync(file,'utf8').replace(' :network="data.network"','');assert.equal(crypto.createHash('sha256').update(body).digest('hex'),sha256,'only pass the existing network snapshot to the launcher');}else assert.equal(sha(file),sha256,file);}
const file='web/src/design/widgetPresentation.ts',old=execFileSync('rtk',['proxy','git','show',baseline+':'+file],{encoding:'utf8'}),now=fs.readFileSync(file,'utf8');
function nonApp(s){return s.replace(/count=Math\.min\([^\n]+?,role=ctx\.role/,'count=APPLICATION_COUNT,role=ctx.role').replace(/if\(id==='applications'\)\{[\s\S]+?\}else if\(id==='devices'\)/,"if(APPLICATIONS){APP_BRANCH}else if(id==='devices')")}
assert.equal(nonApp(now),nonApp(old),'non-application presentation contract');
fs.writeFileSync(root+'/report.json',JSON.stringify({checkedAt:new Date().toISOString(),result:'pass',baseline,protected:files.length,nonApplicationPresentation:'unchanged',physicalRouters:'not accessed'},null,2)+'\n');console.log('PASS '+files.length+' protected files and non-application presentation against '+baseline);
