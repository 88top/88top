import assert from 'node:assert/strict'
import test from 'node:test'
import {homeModule} from './homeModule.mjs'
const {createHomeConfigClient}=await homeModule('../src/home/configClient.ts')
const value={schemaVersion:1,favorites:[],links:[]}
const version='a'.repeat(32)+':1'
const response=(result,status=200)=>new Response(JSON.stringify({success:0,result}),{status,headers:{'Content-Type':'application/json'}})
test('new read rejects 200 business failure, HTML login, old backend and wrong structure',async()=>{
 for(const make of [()=>new Response('{"success":-1001,"error":"denied"}'),()=>new Response('<html>login</html>'),()=>new Response('old',{status:404}),()=>response({state:'saved',version,value:{schemaVersion:99}})]){
  const client=createHomeConfigClient(async()=>make())
  await assert.rejects(()=>client.read('launcher'))
 }
})
test('empty saved configuration is a valid result',async()=>{
 const client=createHomeConfigClient(async()=>response({state:'saved',version,value}))
 assert.deepEqual((await client.read('launcher')).value,value)
})
test('missing read endpoint is unsupported, while transient errors stay unavailable',async()=>{
 for(const status of [404,503]){
  const client=createHomeConfigClient(async()=>new Response('',{status}))
  await assert.rejects(()=>client.read('layout'),error=>error.code===(status===404?'unsupported':'unavailable'))
 }
})
test('404 after a POST still reconciles because a write may have committed',async()=>{
 const methods=[];const client=createHomeConfigClient(async(_url,options)=>{
  methods.push(options.method)
  return options.method==='POST'?new Response('',{status:404}):response({state:'saved',version,value})
 })
 assert.equal((await client.save('launcher',version,value)).version,version)
 assert.deepEqual(methods,['POST','GET'])
})
test('timeout after commit is confirmed by GET without replaying POST',async()=>{
 const methods=[];const client=createHomeConfigClient(async(_url,options)=>{
  methods.push(options.method)
  if(options.method==='POST')throw new Error('connection lost after commit')
  return response({state:'saved',version,value})
 })
 assert.equal((await client.save('launcher','missing',value)).version,version)
 assert.deepEqual(methods,['POST','GET'])
})
test('uncertain save does not mutate the draft or send a second write',async()=>{
 const methods=[];const client=createHomeConfigClient(async(_url,options)=>{methods.push(options.method);throw new Error('offline')})
 const before=structuredClone(value)
 await assert.rejects(()=>client.save('launcher','missing',value),error=>error.code==='uncertain')
 assert.deepEqual(methods,['POST','GET']);assert.deepEqual(value,before)
})
test('conflict, permission and read-only errors are not retried',async()=>{
 for(const status of [409,403,423]){
  let count=0;const client=createHomeConfigClient(async()=>{count++;return new Response('',{status})})
  await assert.rejects(()=>client.save('launcher',version,value));assert.equal(count,1)
 }
})
test('response must acknowledge precisely the intended configuration',async()=>{
 const methods=[];const client=createHomeConfigClient(async(_url,options)=>{methods.push(options.method);return response({state:'saved',version,value:{...value,favorites:['tool-lan']}})})
 await assert.rejects(()=>client.save('launcher',version,value),error=>error.code==='uncertain');assert.deepEqual(methods,['POST','GET'])
})
test('network timeout aborts and clears pending read',async()=>{
 let aborted=false;const client=createHomeConfigClient(async(_url,{signal})=>new Promise((_resolve,reject)=>{signal.addEventListener('abort',()=>{aborted=true;reject(new Error('timeout'))})}),5)
 await assert.rejects(()=>client.read('launcher'));assert.equal(aborted,true)
})

test('explicit recovery uses its own endpoint and never retries a mutation',async()=>{
 const calls=[];const token='b'.repeat(64)
 const client=createHomeConfigClient(async(url,options)=>{calls.push({url,method:options.method,body:JSON.parse(options.body)});return response({state:'saved',version,value})})
 await client.recover('launcher',token)
 assert.equal(calls[0].url,'/cgi-bin/luci/istore/home/v1/launcher/restore/')
 assert.deepEqual(calls[0].body,{expectedRecovery:token})
 await client.recover('launcher',token,true)
 assert.equal(calls[1].url,'/cgi-bin/luci/istore/home/v1/launcher/reset-damaged/')
 let mutations=0;const offline=createHomeConfigClient(async()=>{mutations++;throw new Error('lost acknowledgement')})
 await assert.rejects(()=>offline.recover('launcher',token),error=>error.code==='uncertain')
 assert.equal(mutations,1)
})
