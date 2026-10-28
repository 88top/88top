import test from 'node:test'
import assert from 'node:assert/strict'
import {homeModule} from './homeModule.mjs'
const {homeEntryMemory}=await homeModule('../src/home/launcherRouteState.ts')
test('homepage return state is a bounded identity and scroll, without target URL or credentials',()=>{
 assert.deepEqual(homeEntryMemory({v:1,id:'istoreenhance',scroll:270,url:'https://secret/',token:'private'}),{v:1,id:'istoreenhance',scroll:270})
 assert.equal(homeEntryMemory({v:1,id:'app',scroll:-20}).scroll,0)
 assert.equal(homeEntryMemory({v:1,id:'app',scroll:1e9}).scroll,1000000)
 assert.equal(homeEntryMemory({v:1,id:'app',scroll:0,restoration:'auto'}).restoration,'auto')
 assert.equal(homeEntryMemory({v:1,id:'app',scroll:0,restoration:'manual'}).restoration,'manual')
 assert.equal(homeEntryMemory({v:1,id:'app',scroll:0,restoration:'invalid'}).restoration,undefined)
 assert.deepEqual(homeEntryMemory({v:1,id:'fastnet',scroll:100,source:'traffic'}),{v:1,id:'fastnet',scroll:100,source:'traffic'})
 for(const source of ['other','[data-anything]'])assert.equal(homeEntryMemory({v:1,id:'fastnet',scroll:0,source}).source,undefined)
 assert.equal(homeEntryMemory({v:1,id:'other',scroll:0,source:'traffic'}).source,undefined)
 for(const value of [null,{},[],{v:2,id:'app',scroll:0},{v:1,id:'bad"]',scroll:0},{v:1,id:'app',scroll:Infinity},{v:1,id:'app',scroll:'20'}])assert.equal(homeEntryMemory(value),null)
})
