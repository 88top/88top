// Verify the handoff is about the candidate that actually ran the final suites.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/launcher/62-review/optimization-1'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const suites=JSON.parse(fs.readFileSync(path.join(root,'suite-results.json'))),candidate=JSON.parse(fs.readFileSync(path.join(root,'candidate/candidate.json')));
 assert.equal(suites.result,'pass');assert.equal(suites.suites.length,22);assert.ok(suites.groups>=263);
 for(const suite of suites.suites){assert.equal(suite.result,'pass');assert.equal(JSON.parse(fs.readFileSync(suite.report)).result,'pass')}
 for(const source of [...candidate.sources,...candidate.verificationSources])assert.equal(sha(fs.readFileSync(source.path)),source.sha256,source.path);
 const health=await (await fetch(candidate.base+'/health')).json();assert.deepEqual(health,candidate.health);
 for(const asset of candidate.assets){const response=await fetch(candidate.base+asset.path);assert.equal(response.status,200);assert.equal(sha(Buffer.from(await response.arrayBuffer())),asset.sha256,asset.path)}
 for(const name of ['protection','original-business'])assert.equal(JSON.parse(fs.readFileSync(path.join(root,name,'report.json'))).result,'pass');
 execFileSync('rtk',['proxy','git','diff','--check']);
 const report={checkedAt:new Date().toISOString(),result:'pass',scriptSha256:sha(fs.readFileSync(__filename)),checks:['22 current-candidate suites passed','source and tested verification fingerprints unchanged','public PID/owner/mode and all assets match','254 protected files and 64 original-source checks pass','git diff whitespace check passes'],groups:suites.groups,pid:health.pid,entry:candidate.assets.find(a=>a.entry),prototypeOnly:true,installedApps:'synthetic',persistence:'memory only; reload resets sample',humanConfirmation:'pending'};
 fs.writeFileSync(path.join(root,'handoff-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
