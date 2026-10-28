// Design-only, in-memory responses for the original six home widgets/forms.
// Passwords/tokens stay in volatile fixture state, never diagnostic metadata.
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value))
let previous='',state:Record<string,any>={},users:any[]=[],shares:any[]=[],installed=new Set<string>(),started=Date.now()
function disk(name:string,extra:Record<string,any>={}){return {name,path:'/dev/'+name,size:'32 GiB',total:'32 GiB',used:'12 GiB',usage:38,venderModel:'Preview disk',childrens:[{name:name+'1',path:'/dev/'+name+'1',uuid:'preview-'+name,filesystem:'ext4',mountPoint:'/mnt/'+name+'1',total:'32 GiB',used:'12 GiB',usage:38}],...extra}}
function reset(scenario:string){
 previous=scenario;started=Date.now();users=[];shares=[];installed=new Set()
 state={
  '/nas/disk/status/':{disks:[disk('sda',{isSystemRoot:true,isDockerRoot:true,childrens:[{path:'/dev/sda1',name:'sda1',filesystem:'ext4',mountPoint:'/',isSystemRoot:true,usage:64}]}),disk('sdb'),disk('sdc'),disk('sdd')]},
  '/raid/list/':{disks:[]},
  '/u/nas/service/status/':{linkease:{enabel:false},sambas:[{shareName:'test',path:'/mnt/sdb1'}],webdav:{}},
  '/guide/docker/status/':{status:'running',path:'/mnt/sdb1/docker',errorInfo:''},
  '/guide/download-service/status/':Object.fromEntries(['aria2','qbittorrent','transmission'].map(name=>[name,{status:'stopped',rpcToken:'',rpcPort:6800,webPath:'',configPath:'/mnt/sdb1/'+name,downloadPath:'/mnt/sdb1/downloads'}])),
  '/u/guide/ddns/':{ipv4Domain:'Stopped',ipv6Domain:'Stopped',ddnstoDomain:'https://demo.example.invalid:443'},
  '/guide/download/partition/list/':{partitionList:['/mnt/sdb1','/mnt/sdc1']},
  '/guide/docker/partition/list/':{partitionList:['/mnt/sdc1','/mnt/sdd1']},
  '/guide/ddnsto/config/':{token:'',address:'',netAddr:'192.0.2.50',deviceId:'preview-router'},
 }
 if(scenario==='business-all'||scenario==='business-write-error'||scenario==='business-http-error'||scenario==='business-migration-warning'){
  state['/u/nas/service/status/']={linkease:{enabel:true,port:8897},sambas:[{shareName:'photos',path:'/mnt/sdb1/photos'},{shareName:'media',path:'/mnt/sdc1/media'}],webdav:{enable:false,path:'/mnt/sdd1/public',port:8080}}
  for(const name of ['aria2','qbittorrent','transmission'])Object.assign(state['/guide/download-service/status/'][name],{status:'running',webPath:name==='aria2'?'/aria2':name==='qbittorrent'?':8081':':9091',rpcToken:name==='aria2'?'preview-token':''})
  state['/u/guide/ddns/']={ddnstoDomain:'https://demo.example.invalid',ipv4Domain:'v4.example.invalid',ipv6Domain:'https://v6.example.invalid'}
 }
 if(scenario==='business-disks'){
  state['/nas/disk/status/'].disks=[disk('sda',{isSystemRoot:true,isDockerRoot:true,usage:95}),disk('smart',{smartWarning:true}),disk('new',{childrens:[]}),disk('unmounted',{childrens:[{path:'/dev/unmounted1',name:'unmounted1',uuid:'preview-unmounted',filesystem:'ext4'}]}),disk('swap',{childrens:[{path:'/dev/swap1',name:'swap1',filesystem:'swap'}]}),disk('readonly',{childrens:[{path:'/dev/readonly1',name:'readonly1',filesystem:'ext4',mountPoint:'/mnt/readonly1',isReadOnly:true,errorInfo:'Preview read-only filesystem'}]}),disk('failed',{errorInfo:'Preview disk I/O error'})]
  state['/raid/list/'].disks=[disk('md0',{venderModel:'RAID1 Preview'})]
 }
 if(scenario==='many-disks')state['/nas/disk/status/'].disks=Array.from({length:24},(_,i)=>disk('disk-'+(i+1),{isSystemRoot:i===0}))
 if(scenario==='business-empty'){state['/nas/disk/status/'].disks=[];state['/raid/list/'].disks=[]}
 if(scenario==='many-shares')state['/u/nas/service/status/'].sambas=Array.from({length:24},(_,i)=>({shareName:'preview-share-'+(i+1),path:'/mnt/sdb1/share-'+(i+1)}))
 if(scenario==='business-missing'){state['/u/nas/service/status/']={linkease:{enabel:false},sambas:[],webdav:{enable:true}};state['/guide/docker/status/']={status:'not installed'};state['/u/guide/ddns/']={ddnstoDomain:'',ipv4Domain:'Disabled',ipv6Domain:'Stopped'}}
 if(scenario==='business-ipv6')state['/u/guide/ddns/']={ddnstoDomain:'',ipv6Domain:'v6.example.invalid'}
 if(scenario==='business-stopped')state['/guide/docker/status/']={status:'stopped'}
 if(scenario==='business-docker-error')state['/guide/docker/status/'].errorInfo='Preview Docker root directory unavailable'
}
const writes=['/app/install/','/guide/docker/switch/','/guide/docker/transfer/','/guide/aria2/init/','/guide/qbittorrent/init/','/guide/transmission/init/','/u/guide/ddns/','/guide/ddnsto/','/guide/ddnsto/address/','/u/nas/linkease/enable','/share/user/create/','/share/user/update/','/share/service/create/','/share/service/update/','/nas/disk/init/','/nas/disk/initrest/','/nas/disk/partition/format','/nas/disk/partition/mount']
const affected:Record<string,string>={'/guide/docker/switch/':'docker','/guide/docker/transfer/':'docker','/u/guide/ddns/':'remote','/guide/ddnsto/':'remote','/guide/ddnsto/address/':'remote','/u/nas/linkease/enable':'sharing','/share/service/create/':'sharing','/share/service/update/':'sharing'}
export function businessFixture(key:string,method:string,body:Record<string,any>,scenario:string,recovered:boolean){
 if(previous!==scenario)reset(scenario)
 const result=(value:unknown)=>({status:200,data:{success:0,result:clone(value),previewOnly:true}})
 if(method==='GET'){
  if(!recovered&&((scenario==='storage-error'&&key==='/nas/disk/status/')||(scenario==='business-raid-error'&&key==='/raid/list/')||(scenario==='services-error'&&['/u/nas/service/status/','/guide/docker/status/','/guide/download-service/status/','/u/guide/ddns/'].includes(key))))return {status:503,data:{error:'Synthetic business read failure',previewOnly:true}}
  if(key==='/system/status/')return result(scenario==='system-missing'?{}:{cpuUsage:scenario==='system-zero'?0:scenario==='system-high'?96:1,cpuTemperature:scenario==='system-zero'?0:scenario==='system-high'?116:48,memAvailablePercentage:scenario==='system-zero'?0:scenario==='system-high'?4:73,memTotal:'4 GiB',memAvailable:'3 GiB',uptime:109000+Math.floor((Date.now()-started)/1000),localtime:'2026-10-16 12:52:59'})
  if(key==='/share/user/list/')return result({users})
  if(key==='/share/service/list/')return result({services:shares})
  if(key in state)return result(state[key])
 }
 if(method!=='POST')return
 if(key==='/app/check/')return result({status:body.checkRunning?'running':scenario==='business-install'&&!installed.has(body.name)?'uninstalled':'installed'})
 if(key==='/network/checkPublicNet/')return result(scenario==='business-public-warning'?{}:{address:body.ipVersion==='ipv6'?'2001:db8::50':'192.0.2.50'})
 if(!writes.includes(key))return
 if(scenario==='business-write-error')return {status:200,data:{success:1,error:'Synthetic write rejected; no settings changed',previewOnly:true}}
 if(scenario==='business-http-error')return {status:503,data:{error:'Synthetic HTTP write failure; no settings changed',previewOnly:true}}
 if(key==='/app/install/'){installed.add(body.name);if(body.name==='app-meta-linkease'){installed.add('luci-app-linkease');installed.add('linkease')}if(body.name==='app-meta-ddnsto')installed.add('ddnsto')}
 if(key==='/guide/docker/switch/')state['/guide/docker/status/'].status=body.enable?'running':'stopped'
 if(key==='/guide/docker/transfer/'){
  if(scenario==='business-migration-warning'&&!body.force)return result({emptyPathWarning:true})
  if(!body.path)return {status:400,data:{error:'Missing migration path'}}
  state['/guide/docker/status/'].path=body.path
 }
 const download=key.match(/^\/guide\/(aria2|qbittorrent|transmission)\/init\/$/)
 if(download){if(!body.configPath||!body.downloadPath)return {status:400,data:{error:'Missing download path'}};Object.assign(state['/guide/download-service/status/'][download[1]],body,{status:'running'})}
 if(key==='/u/guide/ddns/')state[key][body.ipVersion==='ipv6'?'ipv6Domain':'ipv4Domain']=body.domain
 if(key==='/guide/ddnsto/')state['/u/guide/ddns/'].ddnstoDomain='https://preview-ddnsto.example.invalid'
 if(key==='/u/nas/linkease/enable')state['/u/nas/service/status/'].linkease={enabel:true,port:8897}
 if(key==='/share/user/create/'||key==='/share/user/update/'){users=users.filter(u=>u.userName!==body.userName);users.push({...body})}
 if(key==='/share/service/create/'||key==='/share/service/update/'){shares=shares.filter(s=>s.name!==body.name);shares.push({...body});state['/u/nas/service/status/'].sambas=shares.filter(s=>s.samba).map(s=>({shareName:s.name,path:s.path}));if(body.webdav)state['/u/nas/service/status/'].webdav={path:body.path,port:8080}}
 let diskResult:unknown
 if(key.startsWith('/nas/disk/')){
  const disks=state['/nas/disk/status/'].disks
  const match=disks.find((d:any)=>d.path===body.path||d.childrens?.some((p:any)=>p.path===body.path))
  if(match){if(key==='/nas/disk/init/')match.childrens=[{name:match.name+'1',path:match.path+'1',filesystem:'ext4',mountPoint:'/mnt/'+match.name+'1'}];else{const partition=match.childrens?.find((p:any)=>p.path===body.path)||match.childrens?.[0];if(partition){Object.assign(partition,{mountPoint:body.mountPoint||'/mnt/'+partition.name,filesystem:'ext4',isReadOnly:false});diskResult=partition}}if(!diskResult)diskResult=match}
 }
 const changed=affected[key]|| (key.startsWith('/nas/disk/')?'disks':undefined)
 if(changed)window.setTimeout(()=>window.dispatchEvent(new CustomEvent('quickstart-business-refresh',{detail:[changed]})),0)
 return result(diskResult||(key==='/u/nas/linkease/enable'?{port:'8897'}:{}))
}
