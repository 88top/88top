const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {suites:expected}=require('./widget-composition-final-runner.cjs'),root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/widget-composition/81-review'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const suites=JSON.parse(fs.readFileSync(root+'/suite-results.json')),candidate=JSON.parse(fs.readFileSync(root+'/candidate/candidate.json'));
 assert.equal(suites.result,'pass');assert.deepEqual(suites.suites.map(s=>s.name).sort(),[...expected].sort());for(const s of suites.suites)assert.equal(JSON.parse(fs.readFileSync(s.report)).result,'pass',s.name);
 for(const f of [...candidate.sources,...candidate.verificationSources])assert.equal(sha(fs.readFileSync(f.path)),f.sha256,f.path);
 assert.deepEqual(await(await fetch(candidate.base+'/health')).json(),candidate.health);
 for(const a of candidate.assets){const r=await fetch(candidate.base+a.path);assert.equal(r.status,200);assert.equal(sha(Buffer.from(await r.arrayBuffer())),a.sha256);assert.equal(sha(fs.readFileSync(a.buildFile)),a.sha256)}
 const protection=JSON.parse(fs.readFileSync(root+'/protection/report.json')),original=JSON.parse(fs.readFileSync(root+'/original-business/report.json'));assert.equal(protection.result,'pass');assert.equal(original.result,'pass');assert.equal(protection.templates.length,8);assert.equal(original.files.length,64);
 assert.ok(fs.existsSync(root+'/visual-review.md'));assert.equal(fs.readdirSync(root+'/comparisons').filter(f=>f.endsWith('.png')).length,14);
 const typecheck={command:'rtk proxy /var/cache/build-cache/run.sh -- node node_modules/vue-tsc/bin/vue-tsc.js --noEmit',cwd:'web',output:execFileSync('rtk',['proxy','/var/cache/build-cache/run.sh','--','node','node_modules/vue-tsc/bin/vue-tsc.js','--noEmit'],{cwd:path.resolve('web'),encoding:'utf8'}),result:'pass'};
 execFileSync('rtk',['proxy','git','diff','--check']);
 const report={at:new Date().toISOString(),result:'pass',suites:suites.suites.length,groups:suites.groups,protectedFiles:protection.protected.length,originalBusinessFiles:original.files.length,originalScriptsAndBindings:protection.templates.length,typecheck,pid:candidate.health.pid,assets:candidate.assets,developerVisualReview:'Recorded separately after actual image inspection; automated checks do not prove beauty',userVisualConfirmation:'pending',prototypeOnly:true,physicalRouters:'not accessed',persistence:'memory only'};
 fs.writeFileSync(root+'/handoff-review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
