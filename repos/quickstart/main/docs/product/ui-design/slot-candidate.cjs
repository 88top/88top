// Record actual public assets and source fingerprints. Does not publish anything.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../../..'),base='http://192.168.9.19:5180',root=path.resolve(process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/slot-edit/24-review');
const digest=body=>crypto.createHash('sha256').update(body).digest('hex');
(async()=>{
 const health=await (await fetch(base+'/health')).json();assert.equal(health.owner,path.join(repo,'docs/product/ui-design'));assert.equal(health.mode,'vue-design-built');
 const html=await (await fetch(base+'/')).text(),assets=[],buildRoot=path.join(process.env.BUILD_CACHE_WORK_DIR,'vue-preview');
 const entries=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m=>m[1]);
 const assetPaths=[...new Set([...entries,...fs.readdirSync(path.join(buildRoot,'assets')).filter(n=>/\.(js|css)$/.test(n)).map(n=>'/assets/'+n)])];
 for(const assetPath of assetPaths){
  const url=new URL(assetPath,base);assert.equal(url.origin,base);const response=await fetch(url);assert.equal(response.status,200);const body=Buffer.from(await response.arrayBuffer()),file=path.join(buildRoot,url.pathname);assert.equal(digest(fs.readFileSync(file)),digest(body));assets.push({path:url.pathname,entry:entries.includes(assetPath),sha256:digest(body),bytes:body.length,buildFile:file});
 }
 assert.ok(assets.some(a=>a.path.endsWith('.js')));
 const files=fs.readdirSync(path.join(repo,'web/src/design')).filter(n=>/\.(ts|vue|css)$/.test(n)).map(n=>'web/src/design/'+n).concat(['web/vite.design.config.ts','scripts/ui-design.sh','scripts/ui-design-server.cjs','web/src/pages/index/network/NetworkFlow.vue']);
 const sources=files.map(file=>({path:file,sha256:digest(fs.readFileSync(path.join(repo,file)))}));
 const verificationSources=fs.readdirSync(__dirname).filter(n=>n.endsWith('.cjs')).map(n=>({path:'docs/product/ui-design/'+n,sha256:digest(fs.readFileSync(path.join(__dirname,n)))}));
 const gitHead=execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),gitDirty=Boolean(execFileSync('rtk',['proxy','git','status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim());
 const record={checkedAt:new Date().toISOString(),base,health,gitHead,gitDirty,assets,sources,verificationSources,sourceState:'working-tree candidate; hashes identify actual source, not a release',persistence:'memory only; reload resets sample',physicalRouters:'not accessed',userExperience:'awaiting human confirmation'};
 fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'candidate.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({owner:health.owner,pid:health.pid,entry:assets.filter(a=>a.entry),verifiedAssets:assets.length,sources:sources.length},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
