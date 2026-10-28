import assert from 'node:assert/strict'
import test from 'node:test'
import {homeModule} from './homeModule.mjs'
const {readInstalledApplications,installedAppsPath}=await homeModule('../src/home/installedAppsClient.ts')
test('reads the software-center raw list once using only authenticated GET',async()=>{
 const signal=new AbortController().signal;let calls=0
 const apps=await readInstalledApplications(signal,async(path,options)=>{
  calls++;assert.equal(path,'/cgi-bin/luci/admin/store/installed');assert.equal(path,installedAppsPath)
  assert.deepEqual(options,{method:'GET',credentials:'same-origin',cache:'no-store',signal})
  return Response.json([{name:'istorex',title:'iStoreNAS',entry:'/apps/'},{name:'without-entry'}])
 })
 assert.equal(calls,1);assert.equal(apps[0].path,'/apps/');assert.equal(apps[0].id,'istorex');assert.equal(apps[1].path,'')
})
test('a successful empty list is valid, failures and old envelopes are never empty lists',async()=>{
 assert.deepEqual(await readInstalledApplications(new AbortController().signal,async()=>Response.json([])),[])
 for(const body of [{success:0,result:[]},{success:-1000,error:'unavailable'},{},null,[{name:'bad/name'}]]){
  await assert.rejects(readInstalledApplications(new AbortController().signal,async()=>Response.json(body)))
 }
 await assert.rejects(readInstalledApplications(new AbortController().signal,async()=>new Response('<html>Login</html>')))
})
test('authentication failures remain distinguishable from other read failures',async()=>{
 for(const status of [401,403,404,503])await assert.rejects(readInstalledApplications(new AbortController().signal,async()=>new Response('',{status})),{message:[401,403].includes(status)?'permission':'error'})
})
test('network failure and aborted reads propagate without a hidden fallback or retry',async()=>{
 for(const error of [new TypeError('Network failed'),new DOMException('Aborted','AbortError')]){
  let calls=0;await assert.rejects(readInstalledApplications(new AbortController().signal,async()=>{calls++;throw error}),e=>e===error);assert.equal(calls,1)
 }
})
