const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/widget-body/75-review/protection';
const baseline=JSON.parse(fs.readFileSync('docs/archive/evidence/m66/widget-body/70-baseline/sources.json'));
const sha=body=>crypto.createHash('sha256').update(body).digest('hex');
fs.mkdirSync(root,{recursive:true});
const report={at:new Date().toISOString(),baseline:baseline.head,checks:[],protected:[],presentationExceptions:[]};
try {
  for(const file of baseline.files){
    const body=fs.readFileSync(file.file,'utf8');
    if(!file.mutable){assert.equal(sha(body),file.sha256,file.file);report.protected.push(file.file)}
    else {
      if(file.script)assert.equal(body.match(/<script[\s\S]*?<\/script>/)?.[0],file.script,file.file+' business script');
      if(file.file.endsWith('NetworkConnectionCard.vue')){
        const original=require('node:child_process').execFileSync('rtk',['proxy','git','show',baseline.head+':'+file.file],{encoding:'utf8'});
        assert.ok(body===original||body===original.replace("'***************************************'","'••••••••••'"),'Only approved address-mask presentation may change');
      }
      report.presentationExceptions.push(file.file);
    }
  }
  report.checks.push('All frozen non-presentation web sources unchanged, including original business cards, request/ACL, layout, apps, charts, privacy and readers');
  report.checks.push('Connection script exactly unchanged; template differs only in fixed-length hidden-address mask');
  const css=fs.readFileSync('web/src/design/homeWidgetDetails.css','utf8');
  assert.doesNotMatch(css,/url\(\s*https?:|animation\s*:/);
  report.checks.push('Body stylesheet adds no external asset requests or decorative animations');
  report.result='pass';console.log('PASS '+report.protected.length+' frozen sources / exact connection script and mask-only template');
}catch(e){report.result='fail';report.failure=e.stack;process.exitCode=1;console.error(e)}
finally{fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n')}
