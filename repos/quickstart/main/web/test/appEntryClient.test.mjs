import test from 'node:test'
import assert from 'node:assert/strict'
import {homeModule} from './homeModule.mjs'
const {resolveAppEntry,entryTarget,appWebTarget}=await homeModule('../src/home/appEntryClient.ts')
const app={id:'istoreenhance',kind:'app',path:'/cgi-bin/luci/admin/services/istoreenhance',entryScript:true}
const envelope=status=>({code:200,status:[{app:app.id,...status}],errors:[]})
test('running entry normalizes router host, protocol and port, including IPv6',()=>{
 assert.equal(entryTarget(app,envelope({running:true,web:':5003',protocol:'http',port:'5003'}),'https://router.example/cgi-bin/luci/admin/quickstart/'),'http://router.example:5003/')
 assert.equal(appWebTarget({web:':5003/path?a=1',protocol:'https'},'http://[fd00::1]/'),'https://[fd00::1]:5003/path?a=1')
 assert.equal(appWebTarget({web:'/apps/test/'},'https://router.example/'),'https://router.example/apps/test/')
})
test('stopped, undeployed or no Web entry use safe configuration instead of starting anything',()=>{
 for(const status of [{running:false,web:':5003'},{running:false,deployed:false},{running:true}])assert.equal(entryTarget(app,envelope(status),'http://router/'),app.path)
 assert.equal(entryTarget({...app,path:''},envelope({running:false,href:'/configure'}),'http://router/'),'/configure')
})
test('untrusted targets and mismatched/failed status cannot navigate',()=>{
 for(const web of ['javascript:alert(1)','//evil.test','http://user:pass@host/','http://localhost:5003/','http://127.0.0.1/','http://[::1]/',':0',':65536',':5003//evil.test',':5003/\\evil','http://host/\n'])assert.throws(()=>appWebTarget({web,protocol:'http'},'https://router.example/'),web)
 for(const data of [{code:500,status:[],errors:[]},envelope({app:'other',running:true}),envelope({running:'true'}),{code:200,status:[],errors:[]}])assert.throws(()=>entryTarget(app,data,'http://router/'))
 assert.throws(()=>appWebTarget({web:':5003',protocol:'http',port:'5004'},'http://router/'))
})
test('LuCI empty errors table accepts both JSON encodings without ignoring actual errors',()=>{
 const good=envelope({running:true,web:':5003',protocol:'http'})
 for(const errors of [[],{}])assert.equal(entryTarget(app,{...good,errors},'http://router/'),'http://router:5003/')
 for(const errors of [undefined,null,'',0,[{code:500}],{app:'failed'}])assert.throws(()=>entryTarget(app,{...good,errors},'http://router/'))
})
test('one explicit entry resolve uses token GET then one app-scoped fresh status POST',async()=>{
 const calls=[],signal=new AbortController().signal
 const target=await resolveAppEntry(app,'http://192.0.2.1/cgi-bin/luci/admin/quickstart/?panel=applications',signal,async(url,options)=>{
  calls.push(url);assert.equal(options.signal,signal);assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store')
  if(calls.length===1){assert.equal(options.method,'GET');return Response.json({token:'test-token'})}
  assert.equal(options.method,'POST');assert.deepEqual(Object.fromEntries(options.body),{token:'test-token',package:'istoreenhance',hostname:'192.0.2.1',update:'1'});return Response.json(envelope({running:true,web:':5003',protocol:'http'}))
 })
 assert.deepEqual(calls,['/cgi-bin/luci/admin/store/token','/cgi-bin/luci/admin/store/entrysh']);assert.equal(target,'http://192.0.2.1:5003/')
})
test('static apps issue no status request; HTTP, invalid token, cancellation and business failures propagate',async()=>{
 assert.equal(await resolveAppEntry({...app,entryScript:false},'http://router/',new AbortController().signal,()=>assert.fail('static navigation must not fetch')),app.path)
 for(const response of [new Response('',{status:403}),Response.json({token:''}),Response.json({})])await assert.rejects(resolveAppEntry(app,'http://router/',new AbortController().signal,async()=>response))
 const controller=new AbortController();controller.abort();await assert.rejects(resolveAppEntry(app,'http://router/',controller.signal,async()=>{throw new DOMException('aborted','AbortError')}),{name:'AbortError'})
})
