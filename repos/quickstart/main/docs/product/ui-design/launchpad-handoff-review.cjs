const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/launchpad/68-review'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const suites=JSON.parse(fs.readFileSync(root+'/suite-results.json')),candidate=JSON.parse(fs.readFileSync(root+'/candidate/candidate.json'));
 assert.equal(suites.result,'pass');assert.equal(suites.suites.length,28);for(const suite of suites.suites){assert.equal(suite.result,'pass');assert.equal(JSON.parse(fs.readFileSync(suite.report)).result,'pass')}
 for(const source of [...candidate.sources,...candidate.verificationSources])assert.equal(sha(fs.readFileSync(source.path)),source.sha256,source.path);
 const health=await(await fetch(candidate.base+'/health')).json();assert.deepEqual(health,candidate.health);for(const asset of candidate.assets){const r=await fetch(candidate.base+asset.path);assert.equal(r.status,200);assert.equal(sha(Buffer.from(await r.arrayBuffer())),asset.sha256,asset.path)}
 for(const name of ['protection','original-business','model'])assert.equal(JSON.parse(fs.readFileSync(root+'/'+name+'/report.json')).result,'pass');execFileSync('rtk',['proxy','git','diff','--check']);
 const model=JSON.parse(fs.readFileSync(root+'/model/report.json'));
 const report={checkedAt:new Date().toISOString(),result:'pass',browserSuites:suites.suites.length,browserGroups:suites.groups,modelGroups:model.checks.length,protectedFiles:JSON.parse(fs.readFileSync(root+'/protection/report.json')).protected,originalFiles:JSON.parse(fs.readFileSync(root+'/original-business/report.json')).files.length,checks:['28 current browser suites pass','current model and protected business sources pass','all source/test fingerprints match','public owner/PID/assets match tested candidate','git diff whitespace check passes'],pid:health.pid,entry:candidate.assets.find(a=>a.entry),prototypeOnly:true,installedApps:'synthetic',persistence:'memory only; reload resets sample',humanConfirmation:'pending'};
 fs.writeFileSync(root+'/handoff-review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
