// Resume only unfinished suites after the orchestration process received 143.
// Accept completed reports solely when this candidate's runtime, public assets
// and every suite implementation still match the original run fingerprint.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const {suites}=require('./widget-composition-final-runner.cjs'),root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const before=JSON.parse(fs.readFileSync(root+'/suite-results.json')),candidate=JSON.parse(fs.readFileSync(root+'/candidate/candidate.json'));
 for(const f of candidate.sources)assert.equal(sha(fs.readFileSync(f.path)),f.sha256,f.path);
 for(const name of suites){const file='docs/product/ui-design/'+name+'.cjs',record=candidate.verificationSources.find(f=>f.path===file);assert.ok(record);assert.equal(sha(fs.readFileSync(file)),record.sha256,file)}
 assert.deepEqual(await(await fetch(candidate.base+'/health')).json(),candidate.health);
 for(const a of candidate.assets)assert.equal(sha(Buffer.from(await(await fetch(candidate.base+a.path)).arrayBuffer())),a.sha256);
 assert.ok(before.suites.every(s=>s.result==='pass'&&JSON.parse(fs.readFileSync(s.report)).result==='pass'));
 const pending=suites.filter(name=>!before.suites.some(s=>s.name===name));assert.deepEqual(pending,['row-sort-review','structure-resource-review']);
 fs.copyFileSync(root+'/suite-results.json',root+'/interrupted-suite-results.json');
 fs.writeFileSync(root+'/runner-interruption.json',JSON.stringify({at:new Date().toISOString(),observedExitCode:143,cause:'SIGTERM received; origin not established',completedSuites:before.suites.length,pending,runtimeAndSuiteFingerprintsUnchanged:true,productFailure:false},null,2)+'\n');
 const continuation=path.join(root,'continuation');const r=spawnSync('rtk',['proxy','node',path.join(__dirname,'launcher-final-runner.cjs'),...pending],{env:{...process.env,QS_DESIGN_EVIDENCE_ROOT:continuation},stdio:'inherit'});assert.equal(r.status,0);
 const tail=JSON.parse(fs.readFileSync(continuation+'/suite-results.json'));assert.equal(tail.result,'pass');
 const result={...before,endedAt:new Date().toISOString(),suites:[...before.suites,...tail.suites],continuation:'Same runtime/assets/test implementations verified before completing pending suites; interrupted report retained'};
 assert.deepEqual(result.suites.map(s=>s.name).sort(),[...suites].sort());result.result='pass';result.groups=result.suites.reduce((n,s)=>n+s.groups,0);
 fs.writeFileSync(root+'/suite-results.json',JSON.stringify(result,null,2)+'\n');console.log(`PASS ${result.groups} groups / ${result.suites.length} suites on the same current candidate`);
})().catch(e=>{console.error(e);process.exitCode=1});
