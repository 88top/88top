const assert=require('node:assert/strict');
async function checkDeviceAddresses(page,report,devices){
 const widget=page.locator('[data-layout-card=devices]'),buttons=widget.locator('[data-canvas-device]');
 assert.ok(await buttons.count(),'Expected observed device tiles');
 const byId=new Map(devices.map(d=>[d.deviceId,d])),items=[];
 for(const button of await buttons.all()){
  const id=await button.getAttribute('data-canvas-device'),source=byId.get(id);assert.ok(source,'Home item must retain the real deviceId');
  const meta=button.locator('[data-device-address]'),kind=await meta.getAttribute('data-device-address'),text=await meta.innerText(),description=await meta.getAttribute('title');
  const current=source.addresses.current,historical=source.addresses.historical;
  if(current.length){assert.equal(kind,'current');const candidates=current.filter(a=>a.family===4).length?current.filter(a=>a.family===4):current;assert.ok(candidates.some(a=>description.endsWith(a.address)),'Displayed IP must belong to current addresses, preferring IPv4');if(candidates.some(a=>a.family===4)){assert.ok(candidates.some(a=>text===a.address));assert.equal(await meta.evaluate(n=>n.scrollWidth>n.clientWidth+1),false,'Current IPv4 is clipped')}}
  else if(historical.length){assert.equal(kind,'historical');assert.match(text,/^(历史|Prev\.) /);assert.ok(historical.some(a=>description.endsWith(a.address)))}
  else{assert.equal(kind,source.mac?'mac':'identity');assert.ok(description.includes(source.mac||source.deviceId))}
  assert.ok((await button.getAttribute('aria-label')).includes(description),'Complete address must remain accessible');
  items.push({id,kind,text});
 }
 const size=await widget.evaluate(root=>{const metas=[...root.querySelectorAll('[data-device-address]')],saved=metas.map(n=>[n,[...n.childNodes]]),height=root.getBoundingClientRect().height,tiles=[...root.querySelectorAll('[data-canvas-device]')].map(n=>n.getBoundingClientRect().height);for(const [n] of saved)n.textContent='类型待确认';const previousHeight=root.getBoundingClientRect().height;for(const [n,nodes] of saved)n.replaceChildren(...nodes);return {height,previousHeight,tiles}});
 assert.ok(Math.abs(size.height-size.previousHeight)<=1,'Adding an address must not add a row or increase widget height');
 report.deviceAddressViews??=[];report.deviceAddressViews.push({width:await page.evaluate(()=>innerWidth),...size,items});
}
module.exports={checkDeviceAddresses};
