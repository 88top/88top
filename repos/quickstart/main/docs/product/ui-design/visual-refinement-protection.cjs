// Protect business and layout implementations while allowing isolated CSS work.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const baseline='docs/archive/evidence/m66/visual-refinement/51-baseline/protected.json';
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/visual-refinement/56-review/protection');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const digest=file=>hash(file.startsWith('web/src/design/')&&file.endsWith('.vue')?fs.readFileSync(file,'utf8').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,''):fs.readFileSync(file));
fs.mkdirSync(root,{recursive:true});
if(process.argv.includes('--freeze')){
 const prefixes=['web/src/pages/index','web/src/plugins/store','web/src/plugins/router','web/src/request','web/src/utils/app.ts','web/src/design','web/vite.design.config.ts',...['action-nas','action-docker','action-download','action-domain','action-ddnsto','action-disk','action-disk-part','action-disk-format','action-disk-mount','action-confirm'].map(n=>'web/src/components/'+n)];
 const files=execFileSync('rtk',['proxy','git','ls-files','--',...prefixes],{encoding:'utf8'}).trim().split('\n').filter(f=>f&&!f.endsWith('.css'));
 fs.mkdirSync(path.dirname(baseline),{recursive:true});fs.writeFileSync(baseline,JSON.stringify({checkedAt:new Date().toISOString(),base:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{encoding:'utf8'}).trim(),policy:'All listed files byte-identical; design Vue files may change style blocks only',files:files.map(file=>({path:file,sha256:digest(file)}))},null,2)+'\n');
}
const frozen=JSON.parse(fs.readFileSync(baseline)),report={checkedAt:new Date().toISOString(),base:frozen.base,files:[]};
try{for(const f of frozen.files){let current=digest(f.path),expected=f.sha256;if(f.path.startsWith('web/src/design/')&&f.path.endsWith('.vue')){const previous=execFileSync('rtk',['proxy','git','show',frozen.base+':'+f.path],{encoding:'utf8'}).replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'');assert.equal(hash(previous),f.sha256,'Frozen source mismatch: '+f.path);expected=hash(previous.trimEnd());current=hash(fs.readFileSync(f.path,'utf8').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'').trimEnd())}const unchanged=current===expected;report.files.push({...f,currentSha256:current,unchanged});assert.ok(unchanged,f.path)}report.result='pass';console.log('PASS '+report.files.length+' protected business/layout implementations')}
catch(e){report.result='fail';report.failure=e.stack;process.exitCode=1}
finally{const attempt=1+fs.readdirSync(root).filter(f=>/^attempt-\d+\.json$/.test(f)).length;report.attempt=attempt;fs.writeFileSync(path.join(root,'attempt-'+attempt+'.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n')}
