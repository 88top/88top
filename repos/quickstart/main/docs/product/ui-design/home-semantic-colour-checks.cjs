const assert=require('node:assert/strict');
const tokens=['--c-bg','--c-panel','--c-text','--c-muted','--c-line','--c-accent','--c-good','--c-warning','--home-icon-blue','--home-icon-teal','--home-icon-violet','--home-icon-orange','--home-flow-down','--home-flow-up','--color-action-bg','--color-action-ink'];
async function snapshot(page){return page.locator('[data-ordered-home]').evaluate((root,tokens)=>{
 const s=getComputedStyle(root),colour=n=>{const c=getComputedStyle(n);return {ink:c.color,background:c.backgroundColor}};
 return {tokens:Object.fromEntries(tokens.map(k=>[k,s.getPropertyValue(k).trim()])),services:[...root.querySelectorAll('.native-business-surface .tab>.item')].map(n=>({widget:n.closest('[data-layout-card]')?.dataset.layoutCard,kind:['cloud','memory','network'].find(k=>n.classList.contains(k)),title:colour(n.querySelector('.title')),icon:getComputedStyle(n.querySelector('svg')).color,state:getComputedStyle(n.querySelector('span')).color,background:getComputedStyle(n).backgroundColor}))};
},tokens)}
function ratio(a,b){const lum=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
async function check(page,root=page.locator('[data-ordered-home]')){
 const metrics=await root.evaluate(root=>{
  const s=getComputedStyle(root),rgb=value=>{const n=document.createElement('span');n.style.color=value;root.append(n);const c=getComputedStyle(n).color;n.remove();return c},token=k=>rgb(s.getPropertyValue(k));
  const expected={downloads:['--home-icon-orange','--color-icon-slate','--home-icon-teal'],sharing:['--home-icon-blue','--color-icon-green','--home-icon-violet'],remote:['--home-icon-blue','--color-icon-green','--color-icon-slate']};
  const services=[...root.querySelectorAll('.native-business-surface .tab>.item')].map(n=>{const surface=n.closest('[data-business-surface]'),id=surface?.dataset.businessSurface,index=['cloud','memory','network'].findIndex(k=>n.classList.contains(k)),name=n.querySelector('.title'),svg=n.querySelector('svg'),state=n.querySelector('span');return {id,index,expected:expected[id]?token(expected[id][index]):null,ink:getComputedStyle(name).color,icon:getComputedStyle(svg).color,state:getComputedStyle(state).color,expectedState:state.dataset.serviceState==='running'?token('--color-icon-green'):token('--c-muted'),muted:token('--c-muted'),background:getComputedStyle(n).backgroundColor,hover:token('--c-hover')}});
  const tools=[...root.querySelectorAll('.home-applications .application-icon,.applications-browser .application-icon')].filter(n=>!n.querySelector('img')&&n.closest('[data-availability]')?.dataset.availability==='available').map(n=>({ink:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor}));
  const connection=root.querySelector('[data-connection-card]');
  return {services,tools,connection:connection?{state:connection.dataset.connectionState,ink:getComputedStyle(connection.querySelector('.connection-status-text strong')).color,good:token('--c-good'),uptime:getComputedStyle(connection.querySelector('[data-connection-uptime]')).color}:null};
 });
 for(const s of metrics.services){if(s.expected)assert.equal(s.ink,s.expected,JSON.stringify(s));assert.equal(s.ink,s.icon);assert.equal(s.state,s.expectedState);for(const foreground of [s.ink,s.state])for(const background of [s.background,s.hover])assert.ok(ratio(foreground,background)>=4.5,JSON.stringify(s))}
 for(const t of metrics.tools)assert.ok(ratio(t.ink,t.background)>=4.5,JSON.stringify(t));
 if(metrics.connection){const c=metrics.connection;assert.equal(c.ink===c.good,c.state==='netSuccess');assert.notEqual(c.uptime,c.good)}
 return metrics;
}
module.exports={snapshot,check,ratio};
