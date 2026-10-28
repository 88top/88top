import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import {homeModule} from './homeModule.mjs'
const {parseComponentCatalog,componentAction,createComponentClient}=await homeModule('../src/pages/device/featureComponents.ts')
const fixture=JSON.parse(fs.readFileSync(new URL('../../docs/contracts/feature-components.json',import.meta.url)))
const response=result=>new Response(JSON.stringify({success:0,result}))
test('shared component contract separates selected eqos from missing native',()=>{
 const result=parseComponentCatalog(structuredClone(fixture))
 assert.equal(result.currentProvider,'eqos')
 assert.equal(result.components[1].selected,true)
 assert.equal(componentAction(result.components[0]),'install')
})
test('component catalogue rejects unknown, duplicate, missing and broken records',()=>{
 for(const change of [r=>r.schemaVersion=2,r=>r.components.pop(),r=>r.components[1]=r.components[0],r=>r.components[0].status.state='future',r=>r.components[0].package='arbitrary-package',r=>r.components[0].status.actions=[{kind:'run'}]]){
  const value=structuredClone(fixture);change(value);assert.throws(()=>parseComponentCatalog(value))
 }
})
test('only confirmed applicable state offers install/enable; pending never resubmits',()=>{
 const item=structuredClone(fixture.components[0]);assert.equal(componentAction(item),'install')
 item.operation='pending';assert.equal(componentAction(item),undefined);delete item.operation
 item.status={state:'disabled',actions:[{kind:'enable'}]};assert.equal(componentAction(item),'enable')
 item.id='floatip';assert.equal(componentAction(item),undefined)
 for(const state of ['error','unsupported','available']){item.status.state=state;assert.equal(componentAction(item),undefined)}
})
test('read handles HTTP, login, malformed and 200 business failures without fallback',async()=>{
 for(const [body,status] of [['404',404],['<html>Login</html>',200],[JSON.stringify({success:-1001}),200],[JSON.stringify({success:-1,error:'failed'}),200]]){
  let reads=0;const client=createComponentClient(async()=>{reads++;return new Response(body,{status})})
  await assert.rejects(()=>client.read());assert.equal(reads,1)
 }
})
test('current Go response may omit zero success and an empty provider',async()=>{
 const result=structuredClone(fixture)
 delete result.components[2].provider
 const client=createComponentClient(async()=>new Response(JSON.stringify({result})))
 const catalog=await client.read()
 assert.equal(catalog.components[2].id,'floatip')
 assert.equal(componentAction(catalog.components[0]),'install')
})
test('plan and apply are separate and network loss never replays a mutation',async()=>{
 const calls=[],item=fixture.components[0]
 const client=createComponentClient(async(url,options)=>{
  calls.push({url,body:JSON.parse(options.body)})
  if(url.endsWith('/apply/'))throw new Error('reply lost')
  return response({plan:{capabilityKey:item.capabilityKey,action:'install',current:item.status,target:item.package,canApply:true,requiresConfirmation:true,requiredFreeBytes:8388608,availableFreeBytes:99999999,draftToken:'components:'+item.id}})
 })
 const plan=await client.plan(item,'install');assert.equal(calls.length,1)
 await assert.rejects(()=>client.apply(plan),error=>error.code==='uncertain')
 assert.equal(calls.length,2);assert.equal(calls[1].body.confirm,true);assert.equal(calls[1].body.expectedState,'not_installed')
 assert.ok(calls.every(call=>!('provider' in call.body)&&!('settings' in call.body)))
})
test('closing a read owner aborts its request without retrying',async()=>{
 const controller=new AbortController();let aborted=false,calls=0
 const client=createComponentClient(async(_url,{signal})=>{calls++;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new Error('cancelled'))}))})
 const pending=client.read(controller.signal);controller.abort();await assert.rejects(()=>pending);assert.equal(aborted,true);assert.equal(calls,1)
})
