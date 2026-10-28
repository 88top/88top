// Design question: three structurally different Quickstart home layouts.
// Prototype only. All data and actions are in memory; no router API is called.
const qs = new URLSearchParams(location.search);
const variants = { A: '均衡概览 · 推荐', B: '网络优先 · 设备横列', C: '设备优先 · 工作台' };
const scenarios = ['normal','many','empty','loading','error','stale','old','no-speed','disabled','speed-error','unsupported','permission'];
let variant = variants[qs.get('variant')] ? qs.get('variant') : 'A';
let scenario = scenarios.includes(qs.get('scenario')) ? qs.get('scenario') : 'normal';
let authority = ['local','external','unknown'].includes(qs.get('authority')) ? qs.get('authority') : 'external';
let filter = 'all', keyword = '', showRates = false, detailTab = 'overview';
const fixtures = [
  {deviceId:'mac:02:00:00:00:00:01',displayName:'书房的 MacBook',brand:'Apple',category:'笔记本电脑',icon:'laptop',online:true,ip:'192.168.30.101',connection:'Wi-Fi',rate:'↓ 2.4 MB/s · ↑ 82 KB/s',policy:'默认路线',access:'允许联网'},
  {deviceId:'mac:02:00:00:00:00:02',displayName:'客厅电视',brand:'Xiaomi',category:'电视与影音',icon:'tv',online:true,ip:'192.168.30.102',connection:'有线',rate:'↓ 6.8 MB/s · ↑ 24 KB/s',policy:'自定义路线 · 等待续租',access:'允许联网'},
  {deviceId:'mac:02:00:00:00:00:03',displayName:'小林的手机',brand:'Apple',category:'手机',icon:'phone',online:true,ip:'192.168.30.103',connection:'Wi-Fi',rate:'↓ 120 KB/s · ↑ 18 KB/s',policy:'默认路线',access:'允许联网'},
  {deviceId:'mac:02:00:00:00:00:04',displayName:'家庭 NAS',brand:'',category:'存储与服务器',icon:'home-server',online:true,ip:'192.168.30.104',connection:'有线',rate:'↓ 1.2 MB/s · ↑ 860 KB/s',policy:'地址已保留',access:'允许联网'},
  {deviceId:'mac:02:00:00:00:00:05',displayName:'',brand:'',category:'待确认类型',icon:'computer',online:true,ip:'192.168.30.105',connection:'未知',rate:'↓ 8 KB/s · ↑ 2 KB/s',policy:'默认路线',access:'允许联网'},
  {deviceId:'mac:02:00:00:00:00:06',displayName:'孩子的平板',brand:'HUAWEI',category:'平板电脑',icon:'tablet',online:true,ip:'192.168.30.106',connection:'Wi-Fi',rate:'↓ 0 B/s · ↑ 0 B/s',policy:'时段规则',access:'暂停联网 · 分组时段'},
  {deviceId:'mac:02:00:00:00:00:07',displayName:'卧室音箱',brand:'Xiaomi',category:'智能音箱',icon:'smart-speaker',online:false,ip:'',connection:'Wi-Fi',rate:'—',policy:'默认路线',access:'允许联网'},
  {deviceId:'mac:02:00:00:00:00:08',displayName:'访客电脑',brand:'',category:'电脑',icon:'computer',online:false,ip:'',connection:'有线',rate:'—',policy:'默认路线',access:'允许联网'}
];
function devices() {
  if (['empty','old','error','loading','permission'].includes(scenario)) return [];
  return scenario === 'many' ? Array.from({length:128},(_,i)=> i<8 ? fixtures[i] : {...fixtures[4],deviceId:`demo:${i}`,displayName:`家庭设备 ${i+1}`,ip:`192.168.30.${i+20}`,online:i<96}) : fixtures;
}
function esc(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function name(d) { return d.displayName || (d.brand ? `${d.brand} ${d.category}` : '未命名设备'); }
function stateURL(path='/', id='') { const p = new URLSearchParams({variant,scenario,authority}); if(id) p.set('device',id); return `${path}?${p}`; }
function allLink(label='查看全部') { return `<a href="${stateURL('/devicemanagement')}" data-all>${label} →</a>`; }
function countText() { return devices().length ? `${devices().filter(d=>d.online).length} 台在线 · 本次开机发现 ${devices().length} 台` : ['empty'].includes(scenario) ? '在线 0 台 · 本次开机发现 0 台' : '设备数量暂不可用'; }
function authorityNote() { return authority==='local' ? '本机负责此局域网的地址分配，可在设备详情中设置固定地址与上网路线。' : authority==='external' ? '本机不负责此局域网的地址分配；固定地址与上网路线请到分配地址的主路由设置。' : '地址分配方尚不明确；固定地址与上网路线暂为只读，请先确认分配地址的路由器。'; }
function row(d) { const id=esc(d.deviceId); return `<a class="device ${qs.get('device')===d.deviceId?'selected':''}" href="${stateURL('/devicemanagement',d.deviceId)}" data-device="${id}"><img class="icon" src="/assets/device-icons/${d.icon}.webp" alt=""><div class="identity"><strong>${esc(name(d))}</strong><small>${esc([d.brand,d.category].filter(Boolean).join(' · '))}</small><small>${d.ip || '暂无当前地址'} · ${d.connection}</small><span class="device-rate">${['no-speed','disabled','speed-error','unsupported'].includes(scenario)?'速率暂不可用':d.rate}</span></div><span class="presence ${d.online?'':'offline'}"><i class="dot"></i>${d.online?'在线':'离线'}</span></a>`; }
function contentError() {
  const states = {
    empty:['◉','暂未发现设备','设备在本局域网上线后会自动出现。只显示本机可观察到的设备。','查看设备管理'],
    error:['!','设备清单暂不可用','本次读取失败。网络、存储和其他服务仍可查看。','重试'],
    old:['↥','设备管理需要兼容版本','当前后端不支持设备管理接口。请安装与前端匹配的 Quickstart 软件包；流量服务不能补齐设备接口。','查看安装说明'],
    permission:['↗','登录已过期','重新登录后即可继续查看设备。当前无法确认设备数量与状态。','重新登录']
  };
  if (scenario==='loading') return `<div class="devices" aria-busy="true" aria-label="设备清单加载中">${Array.from({length:6},()=>'<div class="skeleton"></div>').join('')}</div><p class="subnote">正在读取设备清单…</p>`;
  if(states[scenario]) { const [symbol,title,desc,action]=states[scenario]; return `<div class="empty" role="status"><div class="empty-symbol">${symbol}</div><h3>${title}</h3><p>${desc}</p><button ${scenario==='empty'?'data-all':scenario==='error'?'data-retry':`data-entry="${action}"`} class="primary">${action}</button></div>`; }
  return '';
}
function summary() {
  const capNotice = {'no-speed':'流量与限速服务未安装，设备清单仍可查看。','disabled':'流量服务未启用，设备清单仍可查看。','speed-error':'流量服务异常，速率暂不可用。','unsupported':'当前固件不支持流量统计，设备清单仍可查看。'}[scenario];
  return `<section class="card device-summary"><div class="section-head"><div><h2>局域网设备</h2><p>${countText()}</p></div>${allLink()}</div>${scenario==='stale'?'<div class="notice">刷新失败 · 显示 2 分钟前的设备快照，当前状态待确认。 <button data-retry>重试</button></div>':''}${capNotice?`<p class="subnote">${capNotice}</p>`:''}${contentError() || `<div class="devices ${showRates?'show-rates':''}">${devices().slice(0,matchMedia('(max-width:700px)').matches?3:6).map(row).join('')}</div><div class="device-footer"><span>仅展示前 ${Math.min(devices().length,matchMedia('(max-width:700px)').matches?3:6)} 台 · 点击设备进入详情</span><button id="rates">${showRates?'收起速率':'显示速率'}</button></div>`}<p class="subnote">${authorityNote()}</p><div class="device-footer"><span>${scenario==='stale'?'上次成功更新：2 分钟前':scenario==='normal'||scenario==='many'?'刚刚更新 · 示例快照':'独立于流量统计'}</span><button data-refresh>刷新</button></div></section>`;
}
function overview() { return `<div class="overview"><section class="card"><small>网络连接</small><div class="metric good">已连接 <small>经上级路由</small></div><span class="muted">本机 192.168.30.244 · 示例</span></section><section class="card"><small>本机可见设备</small><div class="metric">${devices().length?devices().filter(d=>d.online).length:scenario==='empty'?'0':'—'} <small>在线</small></div><span class="muted">${devices().length?`本次开机发现 ${devices().length} 台`:scenario==='empty'?'等待设备上线':'设备状态未取得'}</span></section><section class="card"><small>系统运行</small><div class="metric">正常 <small>运行 3 天</small></div><span class="muted">CPU 8% · 内存 32% · 示例</span></section></div>`; }
function quick() { return `<section class="card"><div class="section-head"><h2>常用入口</h2></div><div class="quick-grid">${[['◎','网络设置','连接与地址'],['↗','网络测速','打开测速工具'],['▦','应用商店','管理已安装应用'],['◷','分组与计划','安排设备上网']].map(([icon,label,sub])=>`<button class="quick" ${label==='分组与计划'?'data-groups':`data-entry="${label}"`}><b>${icon}</b><span>${label}<small>${sub}</small></span></button>`).join('')}</div></section>`; }
function flow() { return `<section class="card"><div class="section-head"><h2>网络流量</h2><small>本路由接口 · 示例</small></div><div class="flow-metrics"><div><small>下载</small><strong>10.5 <small>MB/s</small></strong></div><div><small>上传</small><strong>1.2 <small>MB/s</small></strong></div></div><svg class="chart" viewBox="0 0 500 110" preserveAspectRatio="none" aria-label="示例网络流量趋势"><line x1="0" x2="500" y1="90" y2="90"/><line x1="0" x2="500" y1="40" y2="40"/><path class="chart-fill" d="M0 80 L25 74 50 82 75 57 100 66 125 40 150 55 175 49 200 69 225 43 250 30 275 40 300 16 325 23 350 39 375 31 400 45 425 23 450 35 475 42 500 28 L500 110 L0 110Z"/><path d="M0 80 L25 74 50 82 75 57 100 66 125 40 150 55 175 49 200 69 225 43 250 30 275 40 300 16 325 23 350 39 375 31 400 45 425 23 450 35 475 42 500 28"/></svg><div class="chart-labels"><span>1 分钟前</span><span>现在</span></div><p class="subnote">接口流量不等于全网设备流量；旁路由只能观察经过本机的流量。</p></section>`; }
function connections() { return `<section class="card"><div class="section-head"><h2>网络概况</h2><button data-entry="网络接口详情">详情</button></div><div class="kv"><span>拓扑位置</span><span>旁路由</span></div><div class="kv"><span>地址分配</span><span>${authority==='local'?'本机负责':authority==='external'?'外部路由负责':'尚不明确'}</span></div><div class="kv"><span>上级网关</span><span>192.168.30.1</span></div><div class="kv"><span>网口连接</span><span class="good">1 个已连接</span></div></section>`; }
function modules() { return `<div class="modules"><section class="card"><div class="section-head"><h2>存储空间</h2><button data-entry="磁盘与 SMART">管理</button></div><div class="metric">1.26 <small>TB 可用</small></div><div class="progress"><i></i></div><p class="muted">已使用 740 GB / 2 TB · 示例</p><p class="subnote">磁盘、SMART 与 RAID 保留独立入口</p></section><section class="card"><div class="section-head"><h2>共享与远程访问</h2></div><div class="kv"><span>文件共享</span><span class="good">已开启</span></div><div class="kv"><span>远程访问</span><span>未配置</span></div><button data-entry="存储与远程访问" style="margin-top:12px">管理服务 →</button></section><section class="card"><div class="section-head"><h2>应用与服务</h2></div><div class="kv"><span>下载服务</span><span>无任务</span></div><div class="kv"><span>容器</span><span>2 个运行中</span></div><button data-entry="应用与服务" style="margin-top:12px">查看服务 →</button></section></div>`; }
function footer() { return `<div class="system-foot"><span>iStoreOS · Quickstart</span><span>系统信息与更新</span><span>全部为示例数据 · 设计尚待确认</span></div><p class="review-state">评审状态：方案 ${variant} / 场景 ${scenario} / DHCP 分配权 ${authority}。首页只概览；设备策略在完整管理页处理。</p>`; }
function home() {
  const heading = `<div class="heading"><div><div class="eyebrow">QUICKSTART / OVERVIEW</div><h1>家里的网络，一眼看清</h1><p>看连接、认设备，再进入需要的设置。</p></div><button data-entry="首页模块设置">模块设置</button></div>`;
  let layout;
  if(variant==='A') layout=`${overview()}<div class="two-col"><div>${summary()}${flow()}</div><aside class="rail">${quick()}${connections()}</aside></div>${modules()}`;
  if(variant==='B') layout=`${overview()}<div class="b-top">${flow()}<aside class="rail">${connections()}${quick()}</aside></div>${summary()}${modules()}`;
  if(variant==='C') layout=`<div class="layout-C"><aside class="sidebar">${overview()}${quick()}${connections()}</aside><div class="workspace">${summary()}${modules()}${flow()}</div></div>`;
  return `${heading}<div class="layout-${variant}">${layout}</div>${footer()}`;
}
function detail(d) {
  const tabs={overview:'概览',profile:'设备资料',network:'网络与上网',management:'使用管理'};
  let body = '';
  if(detailTab==='overview') body=`<div class="detail-grid"><div><span>连接状态</span>${d.online?'在线':'离线'} · ${d.connection}</div><div><span>联网权限（与在线状态独立）</span>${d.access}</div><div><span>当前地址</span>${d.ip || '暂无当前地址 · 历史地址仅在历史区显示'}</div><div><span>速率</span>${['no-speed','disabled','speed-error','unsupported'].includes(scenario)?'暂不可用 · 其他信息仍可查看':d.rate}</div></div>`;
  if(detailTab==='profile') body=`<div class="detail-grid"><div><span>设备备注</span>${esc(d.displayName)||'尚未命名'} · 支持中文</div><div><span>品牌 / 类型</span>${esc(d.brand)||'品牌待确认'} · ${d.category}</div><div><span>图标</span>沿用设备管理的图标偏好；可恢复自动推荐</div><div><span>资料任务</span>资料独立保存，不修改地址或网络主机名</div></div>`;
  if(detailTab==='network') body=`<p class="notice">${authorityNote()}</p><div class="detail-grid"><div><span>期望设置</span>${d.policy}</div><div><span>配置与观察</span>${d.policy.includes('等待')?'配置已应用；终端等待续租，尚未确认采用路线':'示例：没有待应用的路线变更'}</div><div><span>DNS</span>跟随上网路线</div><div><span>任务范围</span>地址、网络主机名与路线：预览 → 应用 → 验证 → 恢复</div></div>`;
  if(detailTab==='management') body=`<div class="detail-grid"><div><span>联网权限</span>${d.access}</div><div><span>最高速度</span>${['no-speed','disabled','speed-error','unsupported'].includes(scenario)?'对应能力暂不可用；资料与无关功能继续可用':'未设置'}</div><div><span>分组与计划</span>${d.access.includes('暂停')?'儿童设备 · 晚间时段（示例）':'没有分组计划'}</div><div><span>流量额度</span>未设置 · 不开启额外后台采样</div></div>`;
  return `<section class="card detail" id="device-detail" aria-label="设备详情"><div class="detail-header"><img class="icon" src="/assets/device-icons/${d.icon}.webp" alt=""><div><h2>${esc(name(d))}</h2><p class="muted">${esc(d.brand)||'品牌待确认'} · ${d.category} · ${d.online?'在线':'离线'}</p></div><button class="close" data-close-detail aria-label="关闭设备详情">×</button></div><div class="tabs">${Object.entries(tabs).map(([key,label])=>`<button class="${key===detailTab?'active':''}" data-detail-tab="${key}">${label}</button>`).join('')}</div>${body}<p class="subnote">此处是正式管理页的导航与语义示意；原型不执行真实保存。设备身份：${esc(d.deviceId)}（合成示例）。</p></section>`;
}
function management() {
  const selected=devices().find(d=>d.deviceId===qs.get('device'));
  const visible=devices().filter(d=>(filter!=='online'||d.online)&&(!keyword||[name(d),d.brand,d.ip].join(' ').toLowerCase().includes(keyword.toLowerCase())));
  const tab = qs.get('tab') || 'devices';
  return `<a class="back" href="${stateURL()}" data-home>← 返回首页</a><div class="heading"><div><h1>局域网设备管理</h1><p>认识每台设备，并安排它如何连接和上网。</p></div></div><div class="tabs">${[['devices','设备'],['groups','分组与计划'],['settings','局域网设置']].map(([key,label])=>`<button data-main-tab="${key}" class="${tab===key?'active':''}">${label}</button>`).join('')}</div>${tab==='devices'?`<section class="card device-list"><div class="section-head"><h2>${countText()}</h2><button data-refresh>刷新</button></div>${contentError() || `<div class="searchbar"><input id="search" aria-label="搜索设备" placeholder="搜索名称、品牌或地址" value="${esc(keyword)}"><button data-filter="all" class="${filter==='all'?'primary':''}">全部</button><button data-filter="online" class="${filter==='online'?'primary':''}">在线</button></div>${scenario==='stale'?'<div class="notice">显示 2 分钟前快照，当前状态待确认。</div>':''}<div class="devices">${visible.slice(0,24).map(row).join('')}</div>${!visible.length?'<p class="list-limit">没有匹配设备；可清除搜索或切换“全部”。</p>':''}${visible.length>24?'<p class="list-limit">原型仅渲染前 24 台；正式管理页沿用有界列表。</p>':''}`}</section>${selected?detail(selected):''}`:`<section class="card"><h2>${tab==='groups'?'分组与计划':'局域网设置'}</h2><p class="subnote">沿用现有完整管理页。${tab==='settings'?authorityNote():'全局 → 分组 → 设备例外；不使用 DHCP 标签作为分组。'}</p><button data-main-tab="devices">回到设备</button></section>`}${footer()}`;
}
function render() {
  document.body.classList.toggle('dark', qs.get('theme')==='dark');
  document.querySelector('#theme').textContent = qs.get('theme')==='dark'?'浅色':'深色';
  document.querySelector('#scenario').value=scenario;
  document.querySelector('#authority').value=authority;
  document.querySelector('#variant-label').textContent=`${variant} · ${variants[variant]}`;
  document.querySelector('#app').innerHTML = location.pathname==='/devicemanagement'?management():home();
  document.querySelectorAll('[data-all]').forEach(a=>{if(a.tagName==='A') a.href=stateURL('/devicemanagement');});
  document.querySelectorAll('[data-home]').forEach(a=>a.href=stateURL());
}
function navigate(path='/', values={}) { Object.entries(values).forEach(([k,v])=>v?qs.set(k,v):qs.delete(k)); qs.set('variant',variant);qs.set('scenario',scenario);qs.set('authority',authority);history.pushState({},'',`${path}?${qs}`); render(); }
function cycle(delta){const keys=Object.keys(variants);variant=keys[(keys.indexOf(variant)+delta+3)%3];navigate(location.pathname);}
document.addEventListener('click', e=>{
  const t=e.target.closest('button,a'); if(!t)return;
  if(t.hasAttribute('data-device')){e.preventDefault();detailTab='overview';navigate('/devicemanagement',{device:t.dataset.device,tab:'devices'});requestAnimationFrame(()=>document.querySelector('#device-detail')?.scrollIntoView({block:'start',behavior:'smooth'}));}
  else if(t.hasAttribute('data-all')){e.preventDefault();filter='all';keyword='';navigate('/devicemanagement',{device:'',tab:'devices'});scrollTo(0,0);}
  else if(t.hasAttribute('data-home')){e.preventDefault();navigate('/',{device:'',tab:''});scrollTo(0,0);}
  else if(t.hasAttribute('data-close-detail'))navigate('/devicemanagement',{device:''});
  else if(t.dataset.detailTab){detailTab=t.dataset.detailTab;render();document.querySelector('#device-detail')?.scrollIntoView({block:'start'});}
  else if(t.dataset.mainTab)navigate('/devicemanagement',{tab:t.dataset.mainTab,device:''});
  else if(t.hasAttribute('data-groups'))navigate('/devicemanagement',{tab:'groups',device:''});
  else if(t.dataset.filter){filter=t.dataset.filter;render();}
  else if(t.hasAttribute('data-retry')||t.hasAttribute('data-refresh')){scenario='loading';render();setTimeout(()=>{scenario='normal';navigate(location.pathname);},650);}
  else if(t.id==='rates'){showRates=!showRates;render();}
  else if(t.id==='prev')cycle(-1);
  else if(t.id==='next')cycle(1);
  else if(t.id==='theme')navigate(location.pathname,{theme:qs.get('theme')==='dark'?'':'dark'});
  else if(t.dataset.entry){document.querySelector('#entry-title').textContent=t.dataset.entry;document.querySelector('#entry-dialog').showModal();}
  else if(['entry-close','entry-ok'].includes(t.id))document.querySelector('#entry-dialog').close();
});
document.addEventListener('input',e=>{if(e.target.id==='search'){keyword=e.target.value;const start=e.target.selectionStart;render();const input=document.querySelector('#search');input.focus();input.setSelectionRange(start,start);}});
document.querySelector('#scenario').addEventListener('change',e=>{scenario=e.target.value;navigate(location.pathname,{device:''});});
document.querySelector('#authority').addEventListener('change',e=>{authority=e.target.value;navigate(location.pathname);});
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,[contenteditable]')||document.querySelector('dialog[open]'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();cycle(e.key==='ArrowLeft'?-1:1);}});
window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);[...qs.keys()].forEach(k=>qs.delete(k));p.forEach((v,k)=>qs.set(k,v));variant=variants[qs.get('variant')]?qs.get('variant'):'A';scenario=scenarios.includes(qs.get('scenario'))?qs.get('scenario'):'normal';authority=qs.get('authority')||'external';render();});
let resizeTimer; window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,150);});
render();
