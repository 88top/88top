const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module');
const {parse}=require('../../../web/node_modules/@vue/compiler-sfc');
const baseline=JSON.parse(fs.readFileSync('docs/archive/evidence/m66/widget-composition/76-baseline/sources.json'));
const root=process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/widget-composition/81-review/protection';fs.mkdirSync(root,{recursive:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),allowed=new Set(['web/src/design/homeWidgetDetails.css','web/src/design/NetworkConnectionCard.vue','web/vite.design.config.ts']);
const report={at:new Date().toISOString(),protected:[],exceptions:[],templates:[]};
try{
 for(const f of baseline.files){const s=fs.readFileSync(f.file,'utf8');if(allowed.has(f.file)){report.exceptions.push(f.file);if(f.file.endsWith('NetworkConnectionCard.vue'))assert.equal(s.match(/<script[\s\S]*?<\/script>/)[0],f.script)}else{assert.equal(hash(s),f.sha256,f.file);report.protected.push(f.file)}}
 const file=path.resolve('web/src/design/widgetComposition.ts'),source=fs.readFileSync(file,'utf8');
 const code=require('../../../web/node_modules/esbuild').transformSync(source,{loader:'ts',format:'cjs'}).code;
 const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(code,file);
 const script=s=>s.match(/<script[\s\S]*?<\/script>/)?.[0];
 const bindings=s=>{const values=[];const walk=n=>{for(const p of n.props||[])if(p.type===7)values.push([p.name,p.arg?.content,p.exp?.content].join('|'));if(n.type===5)values.push('text|'+n.content.content);for(const c of n.children||[])walk(c)};walk(parse(s).descriptor.template.ast);return values};
 for(const name of ['info/SystemInfo','Storage/index','Storage/samba','info/status','service/DownloadService','service/RemoteDomain','components/DiskItem']){
  const file=path.resolve('web/src/pages/index/'+name+'.vue'),before=fs.readFileSync(file,'utf8'),after=m.exports.composeWidgetTemplate(before,file);
  assert.equal(script(after),script(before),name+' script');const values=bindings(after);
  for(const value of bindings(before)){const index=values.indexOf(value);assert.ok(index>=0,name+' lost '+value);values.splice(index,1)}
  report.templates.push({file:path.relative(process.cwd(),file),scriptUnchanged:true,originalBindingsRetained:true,addedBindings:values});
 }
 const connection='web/src/design/NetworkConnectionCard.vue',before=require('node:child_process').execFileSync('rtk',['proxy','git','show',baseline.head+':'+connection],{encoding:'utf8'}),after=fs.readFileSync(connection,'utf8');
 assert.equal(script(before),script(after));assert.deepEqual(bindings(before),bindings(after));report.templates.push({file:connection,scriptUnchanged:true,originalBindingsRetained:true,addedBindings:[]});
 assert.ok(!fs.readFileSync('web/vite.config.ts','utf8').includes('widgetComposition'));
 const changes=require('node:child_process').execFileSync('rtk',['proxy','git','diff','--name-only',baseline.head,'--','web'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert.ok(changes.every(f=>allowed.has(f)),changes.join('\n'));
 const untracked=require('node:child_process').execFileSync('rtk',['proxy','git','ls-files','--others','--exclude-standard','--','web'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert.deepEqual(untracked,['web/src/design/widgetComposition.ts']);
 report.result='pass';console.log(`PASS ${report.protected.length} frozen files / ${report.templates.length} original scripts and template bindings`);
}catch(e){report.result='fail';report.failure=e.stack;throw e}finally{fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n')}
