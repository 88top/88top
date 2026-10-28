import {computed,inject,onMounted,onUnmounted,provide,reactive,type InjectionKey} from 'vue'
import {homeApplications,systemTools,type HomeApplication} from './homeApplications'
import {mergeLibrary,type LinkDraft} from './launcherLibrary'
import {readInstalledApplications} from './installedAppsClient'
import {configValue,type LauncherConfig} from './configContract'
import type {useHomeConfig} from './useHomeConfig'
import {useSystemStore} from '../plugins/store'

type Availability='available'|'unknown'|'uninstalled'|'unsupported'|'permission'|'no-entry'
function createLauncher(config:ReturnType<typeof useHomeConfig>){
 const state=reactive({status:'loading',apps:[] as HomeApplication[],sandbox:'unknown'}),retained=new Map<string,HomeApplication>()
 const homeApplicationSession={get favorites(){return config.launcher.value.favorites}}
 const linkSession={get entries():HomeApplication[]{return config.launcher.value.links.map(l=>({id:l.id,zh:l.name,en:l.name,path:l.url,glyph:l.glyph,detail:'用户添加的链接',detailEn:'Custom link',kind:'link',tone:'teal'}))}}
 let controller:AbortController|undefined,alive=true,pendingRead:Promise<void>|undefined
 function refresh(){return pendingRead=read()}
 async function read(){
  controller?.abort();const current=new AbortController();controller=current;state.status='loading'
  let timedOut=false
  const timer=window.setTimeout(()=>{timedOut=true;current.abort()},8000)
  try{
   const apps=await readInstalledApplications(current.signal)
   if(alive&&controller===current){for(const app of state.apps)if(homeApplicationSession.favorites.includes(app.id))retained.set(app.id,app);for(const id of retained.keys())if(!homeApplicationSession.favorites.includes(id))retained.delete(id);state.apps=apps;state.status='ready'}
  }catch(error){if(alive&&controller===current)state.status=timedOut?'timeout':error instanceof Error&&error.message==='permission'?'permission':'error'}finally{window.clearTimeout(timer)}
 }
 async function readSandbox(){const current=new AbortController(),timer=window.setTimeout(()=>current.abort(),8000);try{const r=await fetch('/cgi-bin/luci/istore/nas/sandbox/',{signal:current.signal,credentials:'same-origin',cache:'no-store'});const e=await r.json();if(alive&&r.ok&&(e.success===undefined||e.success===0)&&!e.error)state.sandbox=e.result?.status||'unknown'}catch{}finally{window.clearTimeout(timer)}}
 function resolveEntry(id:string):HomeApplication{return [...systemTools,...state.apps,...linkSession.entries,...retained.values(),...homeApplications].find(a=>a.id===id)||{id,zh:'不可用入口',en:'Unavailable shortcut',detail:id,detailEn:id,glyph:'grid',path:'',kind:'app',tone:'blue'}}
 function entryAvailability(app:HomeApplication):Availability{
  if(app.kind==='link')return linkSession.entries.some(a=>a.id===app.id)?'available':'unknown'
  if(app.kind==='app')return state.status==='ready'?(state.apps.some(a=>a.id===app.id)?app.path||app.entryScript?'available':'no-entry':'uninstalled'):state.status==='permission'?'permission':'unknown'
  const feature=({terminal:'ttyd',firmware:'ota',sandbox:'sandbox'} as Record<string,string>)[app.tool||'']
  if(feature&&!window.quickstart_features?.includes(feature))return 'unsupported'
  if(app.tool==='sandbox')return state.sandbox==='unsupport'?'unsupported':state.sandbox==='unknown'?'unknown':'available'
  return 'available'
 }
 const catalogue=computed(()=>mergeLibrary([...systemTools,...homeApplications.filter(a=>a.kind==='builtin'),...state.apps,...linkSession.entries],homeApplicationSession.favorites,resolveEntry))
 async function saveFavorites(ids:string[]){await config.save('launcher',{...config.launcher.value,favorites:ids})}
 async function saveLink(draft:LinkDraft){
  const current=config.launcher.value
  if(draft.id&&!current.links.some(l=>l.id===draft.id))return {error:'missing'}
  if(!draft.id&&current.links.length>=64)return {error:'limit'}
  if(draft.pin&&!current.favorites.includes(draft.id||'')&&current.favorites.length>=24)return {error:'pins'}
  const id=draft.id||'user-link:'+Array.from(crypto.getRandomValues(new Uint8Array(16)),value=>value.toString(16).padStart(2,'0')).join(''),name=draft.name.trim(),url=draft.url.trim()
  const link={id,name,url,glyph:draft.glyph},value:LauncherConfig={schemaVersion:1,links:[...current.links.filter(l=>l.id!==id),link],favorites:draft.pin&&!current.favorites.includes(id)?[...current.favorites,id]:[...current.favorites]}
  try{configValue('launcher',value)}catch{return {error:!name||Array.from(name).length>64?'name':'url'}}
  await config.save('launcher',value);return {entry:resolveEntry(id)}
 }
 async function deleteLink(id:string){const current=config.launcher.value;await config.save('launcher',{...current,links:current.links.filter(l=>l.id!==id),favorites:current.favorites.filter(pin=>pin!==id)})}
 const system=useSystemStore();let updateTimer:number|undefined
 onMounted(()=>{void refresh();void readSandbox();if(!window.quickstart_configs?.update?.disable&&window.quickstart_features?.includes('ota'))updateTimer=window.setTimeout(()=>{if(!document.hidden)system.requestCheckUpdate()},1100)})
 onUnmounted(()=>{alive=false;controller?.abort();window.clearTimeout(updateTimer)})
 return {state,catalogue,resolve:resolveEntry,resolveEntry,entryAvailability,homeApplicationSession,linkSession,saveLink,deleteLink,saveFavorites,retry:refresh,waitForRead:()=>pendingRead||Promise.resolve(),begin:()=>config.begin('launcher'),editable:()=>config.editable('launcher'),saving:()=>config.state.launcher.saving,preferencesLoading:()=>config.state.launcher.loading}
}
type Launcher=ReturnType<typeof createLauncher>
const key:InjectionKey<Launcher>=Symbol('quickstart-home-launcher')
export function provideLauncher(config:ReturnType<typeof useHomeConfig>){const launcher=createLauncher(config);provide(key,launcher);return launcher}
export function useLauncherCatalog(){const launcher=inject(key);if(!launcher)throw new Error('Launcher owner missing');return launcher}
