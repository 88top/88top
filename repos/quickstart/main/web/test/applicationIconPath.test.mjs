import assert from 'node:assert/strict'
import test from 'node:test'
import {homeModule} from './homeModule.mjs'
const {applicationIconPath}=await homeModule('../src/home/applicationIconPath.ts')
test('installed app identity selects the canonical same-origin PNG',()=>{
 assert.equal(applicationIconPath({kind:'app',id:'istorex'}),'/luci-static/resources/app-icons/istorex.png')
 assert.equal(applicationIconPath({kind:'app',id:'some-app+addon'}),'/luci-static/resources/app-icons/some-app%2Baddon.png')
})
test('tools, builtin actions and custom links retain their own glyphs',()=>{
 for(const kind of ['tool','builtin','link'])assert.equal(applicationIconPath({kind,id:'istorex'}),'')
})
test('untrusted identities cannot escape the local icon directory',()=>{
 for(const id of ['','..','../logo','a/b','a\\b','https://example.com/icon','//example.com','a?x','a#x','a\n','a'.repeat(129)])assert.equal(applicationIconPath({kind:'app',id}),'')
})
