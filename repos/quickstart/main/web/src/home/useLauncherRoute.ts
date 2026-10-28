import {nextTick,onMounted,onUnmounted,ref,watch,type Ref} from 'vue'
import {onBeforeRouteLeave,onBeforeRouteUpdate,useRoute,useRouter} from 'vue-router'
import {launcherMemory,launcherQuery,launcherView,type LauncherMemory,type LauncherView} from './launcherRouteState'

// Only the stable host owns browser history; responsive cards only request it.
export function useLauncherRoute(options:{enabled:boolean;opened:Ref<boolean>;tab:Ref<string>;page:Ref<number>;search:Ref<string>;dirty:Ref<boolean>;saving:()=>boolean;show:(edit:boolean,view:LauncherView,memory:LauncherMemory)=>Promise<void>;hide:()=>void;confirm:()=>boolean;settled:()=>boolean;currentPage:()=>number}){
 const router=useRouter(),route=useRoute(),applying=ref(false)
 let mounted=false,closing=false,pendingEdit=false,restore:LauncherMemory|null=null,serial=0
 let queue:Promise<unknown>=Promise.resolve()
 const currentMemory=()=>launcherMemory(window.history.state?.qsLauncher)
 function snapshot(focus?:string){const previous=currentMemory(),body=document.querySelector('.applications-browser-body');return {...previous,search:options.search.value,scroll:body?.scrollTop||0,focus:focus??previous.focus}}
 function saveMemory(focus?:string){if(!options.enabled||!options.opened.value)return;window.history.replaceState({...window.history.state,qsLauncher:snapshot(focus)},'')}
 async function position(){
  if(!restore||!options.opened.value)return
  const memory=restore;await nextTick();if(!options.opened.value||restore!==memory)return
  const body=document.querySelector('.applications-browser-body');if(body)body.scrollTop=memory.scroll
  const target=memory.focus?document.querySelector<HTMLElement>('[data-open-app="'+CSS.escape(memory.focus)+'"]'):null
  if(target)target.focus({preventScroll:true})
  if(options.settled()){restore=null;if(!target&&memory.focus)document.querySelector<HTMLElement>('.application-search input')?.focus({preventScroll:true})}
 }
 async function sync(){
  if(!mounted||!options.enabled)return
  const ticket=++serial,view=route.path==='/'?launcherView(route.query):null
  applying.value=true
  try{
   if(!view){restore=null;if(options.opened.value)options.hide();return}
   restore=currentMemory();await options.show(pendingEdit,view,restore);pendingEdit=false
   if(ticket===serial)await position()
  }finally{if(ticket===serial)applying.value=false}
 }
 function persist(){
  if(!options.enabled||!mounted||closing||applying.value||!options.opened.value||!launcherView(route.query))return queue
  const view={tab:options.tab.value as LauncherView['tab'],page:options.page.value},memory=snapshot()
  queue=queue.catch(()=>{}).then(async()=>{
   if(!mounted||closing||!options.opened.value||!launcherView(route.query))return
   const query=launcherQuery(route.query,view)
   if(route.query.tab!==query.tab||route.query.page!==query.page)await router.replace({query,state:{qsLauncher:memory}})
   else window.history.replaceState({...window.history.state,qsLauncher:memory},'')
  });return queue
 }
 async function open(edit:boolean){
  if(!options.enabled)return
  pendingEdit=edit
  if(launcherView(route.query)){await sync();return}
  const memory={...launcherMemory(null),from:route.fullPath}
  await router.push({query:launcherQuery(route.query,{tab:'all',page:1}),state:{qsLauncher:memory}})
 }
 async function close(){
  if(!options.enabled)return true
  closing=true
  try{
   await queue.catch(()=>{});const memory=currentMemory()
   if(memory.from&&window.history.state?.back===memory.from){
    await new Promise<void>(resolve=>{const remove=router.afterEach(()=>{remove();clearTimeout(timer);resolve()}),timer=window.setTimeout(()=>{remove();resolve()},1500);router.back()})
   }else await router.replace({query:launcherQuery(route.query,null)})
   await nextTick();return !options.opened.value
  }finally{closing=false}
 }
 async function remember(focus?:string){await persist();saveMemory(focus)}
 function leave(){if(!options.enabled)return true;if(options.saving())return false;return !options.dirty.value||options.confirm()}
 onBeforeRouteLeave(leave)
 onBeforeRouteUpdate(to=>to.path==='/'&&launcherView(to.query)?true:leave())
 watch(()=>route.fullPath,()=>{void sync()},{flush:'post'})
 watch([options.tab,options.search,options.page],()=>{void persist()},{flush:'post'})
 watch(()=>[options.settled(),options.currentPage()],()=>{if(!options.enabled)return;void position();if(options.settled()&&options.opened.value&&!applying.value&&options.page.value!==options.currentPage())options.page.value=options.currentPage()},{flush:'post'})
 const pagehide=()=>saveMemory(),pageshow=()=>{if(options.enabled&&options.opened.value){restore=currentMemory();void position()}}
 onMounted(()=>{mounted=true;if(options.enabled){window.addEventListener('pagehide',pagehide);window.addEventListener('pageshow',pageshow);void sync()}})
 onUnmounted(()=>{mounted=false;serial++;window.removeEventListener('pagehide',pagehide);window.removeEventListener('pageshow',pageshow)})
 return {applying,open,close,remember,persist}
}
