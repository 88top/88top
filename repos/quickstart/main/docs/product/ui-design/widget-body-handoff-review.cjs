const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {suites:expected}=require('./widget-body-final-runner.cjs');
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/widget-body/75-review');
const sha=body=>crypto.createHash('sha256').update(body).digest('hex');
(async()=>{
  const suites=JSON.parse(fs.readFileSync(root+'/suite-results.json')),candidate=JSON.parse(fs.readFileSync(root+'/candidate/candidate.json'));
  assert.equal(suites.result,'pass');assert.deepEqual(suites.suites.map(s=>s.name).sort(),[...expected].sort());
  for(const suite of suites.suites)assert.equal(JSON.parse(fs.readFileSync(suite.report)).result,'pass',suite.name);
  for(const file of [...candidate.sources,...candidate.verificationSources])assert.equal(sha(fs.readFileSync(file.path)),file.sha256,file.path);
  assert.deepEqual(await(await fetch(candidate.base+'/health')).json(),candidate.health);
  for(const asset of candidate.assets){const response=await fetch(candidate.base+asset.path);assert.equal(response.status,200);assert.equal(sha(Buffer.from(await response.arrayBuffer())),asset.sha256,asset.path)}
  const protection=JSON.parse(fs.readFileSync(root+'/protection/report.json')),business=JSON.parse(fs.readFileSync(root+'/original-business/report.json'));assert.equal(protection.result,'pass');assert.equal(business.result,'pass');
  const baseline=JSON.parse(fs.readFileSync('docs/archive/evidence/m66/widget-body/70-baseline/sources.json'));
  const changed=execFileSync('rtk',['proxy','git','diff','--name-only',baseline.head,'--','web'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort();
  assert.deepEqual(changed,['web/src/design/NetworkConnectionCard.vue','web/src/design/homeWidgetDetails.css']);
  assert.equal(execFileSync('rtk',['proxy','git','ls-files','--others','--exclude-standard','--','web'],{encoding:'utf8'}).trim(),'');
  execFileSync('rtk',['proxy','git','diff','--check']);
  const typecheck={command:'rtk proxy /var/cache/build-cache/run.sh -- node node_modules/vue-tsc/bin/vue-tsc.js --noEmit',cwd:'web'};
  typecheck.output=execFileSync('rtk',['proxy','/var/cache/build-cache/run.sh','--','node','node_modules/vue-tsc/bin/vue-tsc.js','--noEmit'],{cwd:path.resolve('web'),encoding:'utf8'});typecheck.result='pass';
  const report={at:new Date().toISOString(),result:'pass',suites:suites.suites.length,groups:suites.groups,protectedFiles:protection.protected.length,originalBusinessFiles:business.files.length,changedRuntimeFiles:changed,typecheck,pid:candidate.health.pid,assets:candidate.assets,checks:['Current browser suites and original business protections pass','Runtime and test fingerprints match actual public assets','Only two approved presentation files differ in all of web; no untracked web sources','TypeScript and diff whitespace pass'],prototypeOnly:true,humanConfirmation:'pending',physicalRouters:'not accessed'};
  fs.writeFileSync(root+'/handoff-review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,suites:report.suites,groups:report.groups,protectedFiles:report.protectedFiles,originalBusinessFiles:report.originalBusinessFiles,pid:report.pid},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
