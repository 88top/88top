// One design-only owner, no polling, no automatic pinning. Unknown != removed.
import {computed,onMounted,onUnmounted,reactive,watch,type WatchStopHandle} from 'vue'
import {demo} from './fixtures'
import {homeApplications,sampleApplications,systemTools,type HomeApplication} from './homeApplications'
import {normalizeInstalled} from './launcherMetadata'
import {linkSession,mergeLibrary} from './launcherLibrary'
import {homeApplicationSession} from './homeApplications'
import {useSystemStore} from '../plugins/store'
export type Availability='available'|'unknown'|'uninstalled'|'unsupported'|'permission'|'no-entry'
const state=reactive({status:'loading',apps:[] as HomeApplication[],sandbox:'unknown',revision:0})
const savedMetadata=new Map<string,HomeApplication>()
let owners=0,stop:WatchStopHandle|undefined,controller:AbortController|undefined,generation=0,updateTimer=0
async function read(recover=false){
 const token=++generation;controller?.abort();controller=new AbortController();const signal=controller.signal
 state.status='loading';state.sandbox='unknown'
 await Promise.allSettled([
  ...(demo.scenario==='apps-loading'&&!recover?[]:[fetch('/cgi-bin/luci/istore/app/install-list/'+(recover?'?launcher-retry=1':''),{signal}).then(async r=>{if(!r.ok)throw new Error(r.status===403?'permission':'error');const apps=normalizeInstalled(await r.json());if(token===generation){for(const app of state.apps)if(homeApplicationSession.favorites.includes(app.id))savedMetadata.set(app.id,app);for(const id of savedMetadata.keys())if(!homeApplicationSession.favorites.includes(id))savedMetadata.delete(id);const byId=new Map(apps.map(a=>[a.id,a]));const stable=state.apps.filter(a=>byId.has(a.id)).map(a=>byId.get(a.id)!);const previous=new Set(stable.map(a=>a.id));state.apps=[...stable,...apps.filter(a=>!previous.has(a.id))];state.status='ready';state.revision++}}).catch(e=>{if(token===generation&&!signal.aborted)state.status=e.message==='permission'?'permission':'error'})]),
  fetch('/cgi-bin/luci/istore/nas/sandbox/',{signal}).then(r=>r.json()).then(data=>{if(token===generation)state.sandbox=data.result?.status||'unknown'}),
 ])
}
export function useLauncherCatalog(){
 const system=useSystemStore()
 onMounted(()=>{if(++owners===1){stop=watch(()=>demo.scenario,()=>void read());void read();if(!window.quickstart_configs?.update?.disable&&window.quickstart_features?.includes('ota'))updateTimer=window.setTimeout(()=>{if(!document.hidden)system.requestCheckUpdate()},1100)}})
 onUnmounted(()=>{if(--owners===0){generation++;controller?.abort();stop?.();stop=undefined;window.clearTimeout(updateTimer)}})
 return {state,retry:()=>read(true),catalogue:computed(()=>mergeLibrary([...systemTools,...homeApplications.filter(a=>a.kind==='builtin'),...state.apps,...linkSession.entries],homeApplicationSession.favorites,resolveEntry)),resolve:(id:string)=>resolveEntry(id)}
}
export function resolveEntry(id:string):HomeApplication{
 const entry=[...systemTools,...state.apps,...linkSession.entries,...savedMetadata.values(),...homeApplications,...sampleApplications].find(a=>a.id===id)
 if(!entry)return {id,zh:'不可用入口',en:'Unavailable shortcut',detail:id,detailEn:id,glyph:'grid',path:'',kind:'app',tone:'blue'}
 return entry.tool==='sandbox'&&state.sandbox==='running'?{...entry,zh:'沙箱已开启',en:'Sandbox running'}:entry
}
export function entryAvailability(app:HomeApplication):Availability{
 if(app.kind==='link')return linkSession.entries.some(a=>a.id===app.id)?'available':'unknown'
 if(app.kind==='app')return state.status==='ready'?(state.apps.some(a=>a.id===app.id)?app.path?'available':'no-entry':'uninstalled'):state.status==='permission'?'permission':'unknown'
 if(app.tool&&({terminal:'ttyd',firmware:'ota',sandbox:'sandbox'} as Record<string,string>)[app.tool]&&!window.quickstart_features?.includes(({terminal:'ttyd',firmware:'ota',sandbox:'sandbox'} as Record<string,string>)[app.tool]))return 'unsupported'
 if(app.tool==='sandbox')return state.sandbox==='unsupport'?'unsupported':state.sandbox==='unknown'?'unknown':'available'
 return 'available'
}
export const launcherCatalogState=state
