// Freeze the actual working tree before the launcher work; never compare to a
// historical release when the working tree already contains accepted changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {run}=require('./direct-test-utils.cjs');
const root='docs/archive/evidence/m66/launcher/57-contract';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const mutable=new Set(['HomeApplications.vue','homeApplications.ts','homeApplications.css','widgetPresentation.ts','NativeBusinessHost.vue','fixtures.ts','main.ts']);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
const protectedFiles=[...walk('web/src/design').filter(p=>/\.(vue|css|ts)$/.test(p)&&!mutable.has(path.basename(p))),...walk('web/src/pages/index'),...walk('web/src/components').filter(p=>/\.(vue|ts)$/.test(p)), 'web/vite.config.ts','web/src/request/request.ts','scripts/ui-design.sh','scripts/ui-design-server.cjs'];
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(root+'/protected-sources.json',JSON.stringify(protectedFiles.map(file=>({file,sha256:sha(file)})),null,2)+'\n');
fs.writeFileSync(root+'/allowed-changes.json',JSON.stringify({existing:[...mutable].map(n=>'web/src/design/'+n).concat('web/vite.design.config.ts'),new:'Launcher-specific design adapters, fixtures, editor and verification only',presentation:'Only applications count and grid packing may change; all non-application calculations protected'},null,2)+'\n');
process.env.QS_DESIGN_EVIDENCE_ROOT=root+'/baseline';
run('launcher-baseline',async({page,visit,report,capture,root})=>{await visit();await capture(page,path.join(root,'desktop.png'));report.checks.push('Current unmodified working-tree default homepage captured');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1400);await capture(page,path.join(root,'phone.png'));report.checks.push('Current phone captured');}).catch(e=>{console.error(e);process.exitCode=1});
