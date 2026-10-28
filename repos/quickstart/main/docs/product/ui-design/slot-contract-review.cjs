// Meaningful model checks; browser paths are verified separately in M66.21–24.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module');
const repo=path.resolve(__dirname,'../../..'),ts=require(path.join(repo,'web/node_modules/typescript'));
const original=Module._extensions['.ts'];
Module._extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
global.location={search:''};
const m=require(path.join(repo,'web/src/design/slotLayout.ts')),o=require(path.join(repo,'web/src/design/orderedLayout.ts')),c=require(path.join(repo,'web/src/design/moduleCapability.ts'));
const root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/slot-edit/19-contract');fs.mkdirSync(root,{recursive:true});
const attempt=1+fs.readdirSync(root).filter(f=>/^attempt-\d+.json$/.test(f)).length,report={attempt,checkedAt:new Date().toISOString(),checks:[],capabilities:c.moduleCapabilities};
function check(name,run){run();report.checks.push(name)}
const row=(ids,t='pair',id='test')=>o.makeRow(ids,t,340,id),a={row:'a',column:0,slot:0},b={row:'b',column:0,slot:0};
try{
 check('SC01–05 atomic add, migrate, replace, self and immutable input',()=>{
  const before=[row(['system'],'single','a'),row(['connection'],'single','b'),row([],'single','empty')],copy=JSON.stringify(before);
  let result=m.assignSlot(before,{row:'empty',column:0,slot:0},'docker');assert.equal(result.issue,'');assert.equal(m.at(result.rows,{row:'empty',column:0,slot:0}),'docker');
  result=m.assignSlot(before,{row:'empty',column:0,slot:0},'system');assert.equal(m.at(result.rows,a),null);assert.equal(m.at(result.rows,{row:'empty',column:0,slot:0}),'system');
  result=m.assignSlot(before,b,'system');assert.equal(m.at(result.rows,a),null);assert.equal(m.at(result.rows,b),'system');assert.deepEqual(result.hidden,['connection']);assert.equal(JSON.stringify(before),copy);
  assert.equal(m.assignSlot(before,a,'system').changed,false);assert.equal(m.assignSlot(before,{...a,slot:4},'system').issue,'target');
 });
 check('SC06 all 10 capabilities × exact minimum / width-1 / height-1 / stack role',()=>{
  assert.equal(c.moduleCapabilities.length,11);for(const item of c.moduleCapabilities){assert.equal(c.spaceIssue(item.id,item.minWidth,item.minHeight),'');assert.match(c.spaceIssue(item.id,item.minWidth-1,item.minHeight),/^width:/);assert.match(c.spaceIssue(item.id,item.minWidth,item.minHeight-1),/^height:/);assert.equal(c.spaceIssue(item.id,item.minWidth,148,true),item.stacked?'':'compact')}
 });
 check('SC07–09 five templates, explicit retained items and mirrored roles',()=>{
  for(const t of o.templates){const ids=t.id==='left-big'?['traffic','system','connection']:t.id==='right-big'?['system','connection','traffic']:t.id==='triple'?['system','docker','remote']:['system'];assert.equal(m.validate([row(ids,t.id)]).issue,'')}
  const before=[row(['system','docker','remote'],'triple')];assert.equal(m.reshape(before,'test','pair').issue,'choose-retained');const result=m.reshape(before,'test','pair',['remote','system']);assert.deepEqual(o.visibleIds(result.rows),['remote','system']);assert.deepEqual(result.hidden,['docker']);assert.equal(result.rows.length,1);
  const mirror=m.reshape([row(['traffic','system','connection'],'left-big')],'test','right-big');assert.deepEqual(mirror.rows[0].columns.map(c=>c.cards),[['system','connection'],['traffic']]);
  const right=m.reshape([row(['traffic','system'],'pair')],'test','right-big');assert.equal(right.issue,'');assert.deepEqual(right.rows[0].columns.at(-1).cards,['traffic']);
  const denied=m.reshape([row(['system','traffic'],'pair')],'test','left-big');assert.equal(denied.issue,'compact');
 });
 check('SC10–13 draft holes, normalization order, no cross-row fill, hard and stack failures',()=>{
  const before=[row(['system','docker','remote'],'triple')],hidden=m.assignSlot(before,{row:'test',column:1,slot:0},null);assert.equal(hidden.rows[0].columns.length,3);
  const n=m.normalize(hidden.rows);assert.equal(n.issue,'');assert.deepEqual(o.visibleIds(n.rows),['system','remote']);assert.deepEqual(n.rows[0].columns.map(c=>c.weight),[50,50]);
  const single=m.normalize([row(['system',null],'pair','a'),row(['remote',null],'pair','b'),row([],'single','empty')]);assert.equal(single.rows.length,2);assert.ok(single.rows.every(r=>r.template==='single'));
  assert.equal(m.normalize([row(['system',null])],()=>false).issue,'hard-spec');assert.equal(m.normalize([row(['traffic','system',null],'left-big')]).issue,'incomplete-stack');
  const short=row(['traffic','system'],'pair');short.height=180;assert.match(m.normalize([short]).issue,/^height:/);assert.equal(m.normalize([row(['traffic',null,null],'left-big')]).rows[0].template,'single');
 });
 check('SC15 capacity, insertion and row order use one validator',()=>{
  const before=[row(['system'],'single','a'),row(['docker'],'single','b')];const insert=m.insertBeside(before,'docker','a',1);assert.equal(insert.issue,'');assert.deepEqual(o.visibleIds([insert.rows[0]]),['system','docker']);assert.equal(m.at(insert.rows,b),null);
  assert.equal(m.insertBeside([row(['system','docker','remote'],'triple')],'connection','test',1).issue,'capacity');assert.deepEqual(m.moveRowTo(before,'b','a').rows.map(r=>r.id),['b','a']);
  assert.equal(m.changeSize(before,'a',{weights:[80]}).issue,'structure');assert.equal(m.changeSize(before,'a',{height:1}).changed,false);
 });
 report.result='pass';console.log('PASS slot contract: '+report.checks.length+' groups; 11 capability boundary sets');
}catch(e){report.result='fail';report.failure=e.stack;process.exitCode=1}finally{fs.writeFileSync(path.join(root,`attempt-${attempt}.json`),JSON.stringify(report,null,2)+'\n');if(original)Module._extensions['.ts']=original;else delete Module._extensions['.ts']}
