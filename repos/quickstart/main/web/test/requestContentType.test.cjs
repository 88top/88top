const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

test('legacy password, reboot and module settings clients meet the JSON-only write boundary', async () => {
  const source = fs.readFileSync(path.join(__dirname,'../src/request/request.ts'),'utf8');
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const module = {exports:{}}, requests = [];
  vm.runInNewContext(compiled, {module,exports:module.exports,Headers,require(name) {
    if(name==='./do') return {Do:async(url,init)=>{requests.push({url,init});return {data:{}}}};
    return {useGettextLazy:()=>({$gettext:x=>x,$ngettext:x=>x})};
  }});
  const api = module.exports;
  await api.GuidePage.setPassword.POST({password:'two words'});
  await api.System.Reboot.POST();
  await api.ModuleSettings.POST({diableDisplay:[]});
  for(const request of requests) assert.match(request.init.headers.get('Content-Type'),/^application\/json/);
  assert.equal(requests[0].init.body, JSON.stringify({password:'two words'}));
  assert.equal(requests[1].init.body, undefined);
  requests.length=0;
  await api.System.Version.GET();
  assert(!requests[0].init.headers, 'GET acquired a write-only header');
});
