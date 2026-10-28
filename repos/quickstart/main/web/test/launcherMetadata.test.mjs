import assert from 'node:assert/strict'
import test from 'node:test'
import {homeModule} from './homeModule.mjs'
const {normalizeInstalled}=await homeModule('../src/home/launcherMetadata.ts')
test('invalid identity makes catalogue unknown instead of reporting an uninstall',()=>{
 for(const row of [null,{}, {name:''},{name:'bad/name'}])assert.throws(()=>normalizeInstalled([{name:'valid-app',entry:'/app'},row]))
 assert.deepEqual(normalizeInstalled([]),[])
})
test('valid missing entry and duplicate identity retain their existing semantics',()=>{
 const rows=normalizeInstalled([{name:'valid-app'},{name:'valid-app',entry:'/other'}])
 assert.equal(rows.length,1)
 assert.equal(rows[0].id,'valid-app')
 assert.equal(rows[0].path,'')
})
test('only declared entrysh capability plus a valid UCI identity enables dynamic entries',()=>{
 const rows=normalizeInstalled([{name:'dynamic',flags:['entrysh'],uci:'app_config'},{name:'static',entry:'/config',flags:'entrysh',uci:'app'},{name:'invalid-config',flags:['entrysh'],uci:'../file'}])
 assert.equal(rows[0].entryScript,true);assert.equal(rows[0].path,'');assert.equal(rows[1].entryScript,false);assert.equal(rows[2].entryScript,false)
})
