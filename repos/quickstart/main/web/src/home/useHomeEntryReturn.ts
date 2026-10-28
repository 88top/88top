import {onMounted,onUnmounted,ref,watch} from 'vue'
import {useRoute} from 'vue-router'
import {homeEntryMemory} from './launcherRouteState'

// A homepage launch keeps its existing history entry; it never creates a panel URL.
export function useHomeEntryReturn(enabled:boolean,ready:()=>boolean,settled:(widgets:readonly string[])=>boolean=()=>true){
 const route=useRoute();let observer:MutationObserver|undefined,timer:number|undefined,frame=0,active=false,previousRestoration:ScrollRestoration|undefined,previousAnchor:{value:string;priority:string}|undefined,lastPosition='',stableFrames=0
 const affectedWidgets=ref<string[]>([])
 const inputs=['pointerdown','touchstart','wheel','keydown'] as const
 function consume(){const state={...window.history.state};delete state.qsHomeEntry;window.history.replaceState(state,'')}
 function stop(){
  active=false;observer?.disconnect();observer=undefined;window.clearTimeout(timer);timer=undefined;cancelAnimationFrame(frame);frame=0;lastPosition='';stableFrames=0;affectedWidgets.value=[]
  for(const event of inputs)document.removeEventListener(event,interrupted,true)
  if(previousRestoration!==undefined){window.history.scrollRestoration=previousRestoration;previousRestoration=undefined}
  if(previousAnchor){const style=document.documentElement.style;if(previousAnchor.value)style.setProperty('overflow-anchor',previousAnchor.value,previousAnchor.priority);else style.removeProperty('overflow-anchor');previousAnchor=undefined}
 }
 function interrupted(){if(!active)return;consume();stop()}
 function schedule(){if(active&&!frame)frame=requestAnimationFrame(restore)}
 function restore(){
  frame=0;if(!active)return
  if(route.path!=='/'||route.query.panel){stop();return}
  if(!ready())return
  const memory=homeEntryMemory(window.history.state?.qsHomeEntry);if(!memory){stop();return}
  const target=document.querySelector<HTMLElement>(memory.source==='traffic'?'[data-home-speed]':'[data-favorite-app="'+CSS.escape(memory.id)+'"]')
  if(!target){lastPosition='';stableFrames=0;return}
  const card=target.closest<HTMLElement>('[data-layout-card]'),cards=document.querySelectorAll<HTMLElement>('.canvas-home [data-layout-card]'),top=card?.getBoundingClientRect().top
  const affected=Array.from(cards).filter(node=>top===undefined||node.getBoundingClientRect().top<=top+1).map(node=>node.dataset.layoutCard!)
  if(affected.join('|')!==affectedWidgets.value.join('|'))affectedWidgets.value=affected
  // A few unchanged frames do not establish that a slow initial response has
  // finished. Subscribe to the existing data owner's outcomes before sampling.
  if(!settled(affected)){lastPosition='';stableFrames=0;return}
  const rect=target.getBoundingClientRect(),position=JSON.stringify([rect.top+window.scrollY,rect.left+window.scrollX,rect.width,rect.height])
  stableFrames=position===lastPosition?stableFrames+1:0;lastPosition=position
  // Responsive columns and natural row sizing can commit after the launcher
  // data. Focus must not select a scroll anchor in that temporary geometry.
  if(stableFrames<2||document.documentElement.scrollHeight-window.innerHeight<memory.scroll){schedule();return}
  window.scrollTo({top:memory.scroll,behavior:'auto'});target.focus({preventScroll:true});consume();stop()
 }
 function start(){
  if(!enabled)return;stop();const memory=homeEntryMemory(window.history.state?.qsHomeEntry);if(!memory)return
  active=true;previousRestoration=memory.restoration||window.history.scrollRestoration;window.history.scrollRestoration='manual'
  const style=document.documentElement.style;previousAnchor={value:style.getPropertyValue('overflow-anchor'),priority:style.getPropertyPriority('overflow-anchor')};style.setProperty('overflow-anchor','none','important')
  for(const event of inputs)document.addEventListener(event,interrupted,{capture:true,passive:true})
  observer=new MutationObserver(schedule);observer.observe(document.querySelector('.canvas-home')||document.body,{childList:true,subtree:true});timer=window.setTimeout(()=>{consume();stop()},10000);schedule()
 }
 function remember(id:string,source?:'traffic'){if(!enabled)return;const memory=homeEntryMemory({v:1,id,source,scroll:window.scrollY,restoration:window.history.scrollRestoration});if(memory){window.history.replaceState({...window.history.state,qsHomeEntry:memory},'');window.history.scrollRestoration='manual'}}
 watch(()=>[ready(),settled(affectedWidgets.value),route.fullPath],()=>{if(enabled)schedule()},{flush:'post'})
 onMounted(()=>{if(enabled){start();window.addEventListener('pageshow',start)}})
 onUnmounted(()=>{active=false;stop();window.removeEventListener('pageshow',start)})
 return {remember}
}
