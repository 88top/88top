import test from 'node:test'
import assert from 'node:assert/strict'
import {homeModule} from './homeModule.mjs'
const {speedTestTarget,fastnetSettings}=await homeModule('../src/home/speedTestTarget.ts')
const app={id:'fastnet',kind:'app',entryScript:true,path:fastnetSettings},url='https://router.example/cgi-bin/luci/admin/quickstart/'
const fresh=()=>new AbortController().signal
test('running FastNet goes directly to resolved Web without an installation check or confirmation',async()=>{
 assert.equal(await speedTestTarget([app],'ready',url,fresh(),{resolve:async(a,u,s)=>{assert.equal(a,app);assert.equal(u,url);assert.ok(s instanceof AbortSignal);return {target:'http://router.example:3200/',direct:true}},install:()=>assert.fail(),confirm:()=>assert.fail()}),'http://router.example:3200/')
})
test('missing FastNet keeps the existing installation confirmation owner and settings destination',async()=>{
 for(const installed of [true,false]){let calls=0;assert.equal(await speedTestTarget([],'ready',url,fresh(),{install:async()=>{calls++;return installed},confirm:()=>assert.fail(),resolve:()=>assert.fail()}),installed?fastnetSettings:null);assert.equal(calls,1)}
})
test('stopped or legacy FastNet requires explicit confirmation before the existing check/config flow',async()=>{
 for(const entryScript of [true,false])for(const consent of [true,false]){let checks=0;assert.equal(await speedTestTarget([{...app,entryScript}],'ready',url,fresh(),{resolve:async()=>({target:fastnetSettings,direct:false}),confirm:()=>consent,install:async()=>{checks++;return true}}),consent?fastnetSettings:null);assert.equal(checks,consent?1:0)}
})
test('unknown, permission, timeout and bad entry responses never offer installation or navigate',async()=>{
 const actions={install:()=>assert.fail(),confirm:()=>assert.fail(),resolve:async()=>{throw new Error('entry-failed')}}
 for(const state of ['loading','error','timeout','permission'])await assert.rejects(speedTestTarget([app],state,url,fresh(),actions))
 await assert.rejects(speedTestTarget([app],'ready',url,fresh(),actions),/entry-failed/)
})
test('late status and installation results are discarded after cancellation',async()=>{
 for(const installed of [true,false]){const controller=new AbortController();await assert.rejects(speedTestTarget(installed?[]:[app],'ready',url,controller.signal,{resolve:async()=>{controller.abort();return {target:fastnetSettings,direct:false}},install:async()=>{controller.abort();return true},confirm:()=>assert.fail()}),{name:'AbortError'})}
})
