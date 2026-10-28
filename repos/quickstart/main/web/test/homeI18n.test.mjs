import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
const root=new URL('../src/pages/index/',import.meta.url)
function sources(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sources(path.join(dir,entry.name)):entry.name.endsWith('.vue')?[path.join(dir,entry.name)]:[])}
test('formal homepage business labels have English translations',()=>{
 const dictionary=JSON.parse(fs.readFileSync(new URL('../public/luci-static/quickstart/i18n/en.json',import.meta.url),'utf8')).en
 const missing=new Set()
 for(const file of sources(root.pathname))for(const match of fs.readFileSync(file,'utf8').matchAll(/\$[np]?gettext\((["'])(.*?)\1/g))if(!dictionary[match[2]])missing.add(match[2])
 assert.deepEqual([...missing],[])
})
