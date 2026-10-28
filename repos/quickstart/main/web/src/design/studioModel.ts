// DESIGN ONLY. Existing Quickstart readers; no persistence or router mutation.
import { computed, onMounted, onUnmounted, reactive, watch, type Ref } from 'vue'
import request from '../request'
import { buildDeviceListItems } from '../pages/device/deviceInventory'
import { demo } from './fixtures'
import { inventory } from './devices'

export type ModuleKey = 'traffic'|'devices'|'connection'|'storage'|'services'|'system'|'shortcuts'
export type LayoutItem = { id: ModuleKey; enabled: boolean; span: number }
export type Variant = 'studio'|'network'|'device'
export const sessionLayouts=new Map<Variant,LayoutItem[]>()
export const moduleCatalog: Array<{id:ModuleKey; title:string; en:string; description:string; glyph:string}> = [
  {id:'traffic',title:'网络流量',en:'Network activity',description:'实时速率与短时间趋势',glyph:'activity'},
  {id:'devices',title:'局域网设备',en:'LAN devices',description:'名称、品牌、连接状态与详情入口',glyph:'devices'},
  {id:'connection',title:'网络连接和IP地址',en:'Connection & IP',description:'联网状态、地址与DNS；接口状态独立管理',glyph:'network'},
  {id:'storage',title:'存储空间',en:'Storage',description:'磁盘容量与占用情况',glyph:'disk'},
  {id:'services',title:'应用与服务',en:'Apps & services',description:'共享、容器、下载与远程访问',glyph:'layers'},
  {id:'system',title:'系统状态',en:'System health',description:'CPU、内存、温度与版本',glyph:'chip'},
  {id:'shortcuts',title:'常用入口',en:'Quick access',description:'网络、应用及高级配置工具',glyph:'grid'},
]
const presetIds:Record<Variant,Array<[ModuleKey,number]>> = {
  studio:[['traffic',7],['devices',5],['storage',4],['services',4],['system',4],['shortcuts',12]],
  network:[['traffic',8],['system',4],['connection',8],['devices',4],['shortcuts',12]],
  device:[['devices',8],['traffic',4],['services',8],['system',4],['storage',12],['shortcuts',12]],
}
export const makePreset=(variant:Variant):LayoutItem[]=>[
  ...presetIds[variant].map(([id,span])=>({id,span,enabled:true})),
  ...moduleCatalog.filter(m=>!presetIds[variant].some(([id])=>id===m.id)).map(m=>({id:m.id,span:4,enabled:false})),
]
type Reader = ()=>Promise<{data:{result?:any}}>
type Channel = {id:string; modules:string[]; seconds:number; get:Reader}
const channels:Channel[] = [
  {id:'network',modules:[],seconds:30,get:request.Network.Status.GET},
  {id:'traffic',modules:['traffic'],seconds:5,get:request.Network.Statistics.GET},
  {id:'ports',modules:['traffic','connection'],seconds:30,get:request.Network.PortList.GET},
  {id:'inventory',modules:['devices'],seconds:30,get:request.DeviceMangement.deviceInventoryV2.GET},
  {id:'disks',modules:['storage'],seconds:60,get:request.Nas.Disk.Status.GET},
  {id:'raid',modules:['storage'],seconds:60,get:request.Raid.List.GET},
  {id:'sharing',modules:['services','sharing'],seconds:60,get:request.Nas.Service.Status.GET},
  {id:'docker',modules:['services','docker'],seconds:60,get:request.Guide.DockerStatus.GET},
  {id:'download',modules:['services','downloads'],seconds:60,get:request.Guide.DownloadService.Status.GET},
  {id:'remote',modules:['services','remote'],seconds:60,get:request.Guide.GetDdns.GET},
  {id:'system',modules:['system'],seconds:30,get:request.System.Status.GET},
  {id:'version',modules:['system'],seconds:60,get:request.System.Version.GET},
]
export function useStudioModel(layout:Ref<Array<{id:string;enabled:boolean}>>,skipChannels:string[]=[],networkBusiness=false,nativeBusiness=false) {
  // Archived design comparisons keep their original fixture readers. The current
  // ordered prototype adopts the audited 5s status / 10s interface contracts.
  const readers=channels.filter(c=>nativeBusiness||c.id!=='raid').map(c=>networkBusiness&&c.id==='network'?{...c,seconds:5}:networkBusiness&&c.id==='ports'?{...c,modules:['networkInterface'],seconds:10}:nativeBusiness&&c.id==='remote'?{...c,seconds:3}:nativeBusiness&&c.id==='system'?{...c,seconds:5}:nativeBusiness&&['disks','raid','sharing','docker','download','version'].includes(c.id)?{...c,seconds:0}:c)
  const data=reactive<Record<string,any>>({})
  const errors=reactive<Record<string,string>>({})
  const updated=reactive<Record<string,string>>({})
  if(demo.scenario==='stale')data.inventory={devices:inventory()}
  const devices=computed(()=>buildDeviceListItems(data.inventory?.devices||[]))
  const pending=new Set<string>(),timers=new Map<string,number>()
  let active=false,revision=0
  const wanted=(channel:Channel)=>!skipChannels.includes(channel.id)&&(!channel.modules.length||layout.value.some(m=>m.enabled&&channel.modules.includes(m.id)))
  function stop(){for(const timer of timers.values())window.clearTimeout(timer);timers.clear()}
  async function load(channel:Channel){
    if(!active||document.hidden||!wanted(channel)||pending.has(channel.id))return
    if(channel.id==='inventory'&&demo.scenario==='loading'&&!demo.recovered)return
    pending.add(channel.id);const startedRevision=revision
    try{
      const response=await channel.get()
      if(!active||!wanted(channel)||startedRevision!==revision)return
      if(!response.data.result)throw new Error('Missing result')
      data[channel.id]=channel.id==='traffic'?{...response.data.result,items:(response.data.result.items||[]).slice(-60)}:response.data.result
      errors[channel.id]='';updated[channel.id]=new Date().toISOString()
    }catch(e){if(active&&startedRevision===revision)errors[channel.id]=String(e)}
    finally{pending.delete(channel.id);if(active&&!document.hidden&&wanted(channel)){if(startedRevision!==revision)void load(channel);else if(channel.seconds>0)timers.set(channel.id,window.setTimeout(()=>void load(channel),channel.seconds*1000))}}
  }
  // Moving/replacing cards must not restart readers that are still wanted.
  // Force refresh remains explicit for retry, visibility restoration and scenes.
  function refresh(force=false){
    for(const channel of readers){
      const timer=timers.get(channel.id)
      if(!wanted(channel)||force){if(timer!==undefined)window.clearTimeout(timer);timers.delete(channel.id)}
      if(wanted(channel)&&(force||(!timers.has(channel.id)&&(!nativeBusiness||channel.seconds>0||!updated[channel.id]&&!errors[channel.id]))))void load(channel)
    }
  }
  function visibility(){stop();if(!document.hidden)refresh(true)}
  function retry(){demo.recovered=true;refresh(true)}
  function businessRefresh(event:Event){for(const channel of readers)if((event as CustomEvent<string[]>).detail.includes(channel.id))void load(channel)}
  watch(()=>layout.value.filter(m=>m.enabled).map(m=>m.id).sort().join(','),()=>refresh())
  watch(()=>demo.scenario,()=>{revision++;delete data.inventory;errors.inventory='';if(demo.scenario==='stale')data.inventory={devices:inventory()};refresh(true)})
  onMounted(()=>{active=true;refresh();document.addEventListener('visibilitychange',visibility);if(nativeBusiness)window.addEventListener('quickstart-business-refresh',businessRefresh)})
  onUnmounted(()=>{active=false;stop();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('quickstart-business-refresh',businessRefresh)})
  return {data,errors,updated,devices,retry}
}
