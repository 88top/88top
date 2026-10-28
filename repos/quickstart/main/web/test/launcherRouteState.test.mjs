import assert from 'node:assert/strict'
import test from 'node:test'
import {homeModule} from './homeModule.mjs'
const {launcherView,launcherQuery,launcherMemory}=await homeModule('../src/home/launcherRouteState.ts')
test('launcher URL accepts only bounded browsing state',()=>{
 assert.equal(launcherView({}),null)
 assert.deepEqual(launcherView({panel:'applications',tab:'apps',page:'2'}),{tab:'apps',page:2})
 for(const page of ['0','-1','9999','2.5',['2']])assert.equal(launcherView({panel:'applications',tab:['apps'],page}).page,1)
 assert.equal(launcherView({panel:'applications',tab:'script'}).tab,'all')
})
test('launcher query updates preserve unrelated route parameters',()=>{
 const q={other:'x',panel:'applications',tab:'links',page:'2'}
 assert.deepEqual(launcherQuery(q,null),{other:'x'})
 assert.deepEqual(launcherQuery(q,{tab:'tools',page:1}),{other:'x',panel:'applications',tab:'tools',page:'1'})
})
test('private browser memory is bounded and contains no arbitrary properties',()=>{
 assert.deepEqual(launcherMemory(null),{v:1,search:'',scroll:0,focus:''})
 const m=launcherMemory({search:'x'.repeat(500),scroll:Infinity,focus:'app\nname',from:'/home',token:'secret'})
 assert.equal(m.search.length,256);assert.equal(m.scroll,0);assert.equal(m.focus,'appname');assert.equal(m.token,undefined)
 assert.equal(launcherMemory({from:'https://example.com'}).from,undefined)
})
