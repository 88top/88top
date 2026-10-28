import {onMounted,onUnmounted,ref,watch,type Ref} from 'vue'
import type {ActualRow} from './layout/orderedLayout'
import type {NaturalSize} from './layout/rowSizing'

// One coalesced pass over existing DOM; no clones, readers, timers or persisted
// measured heights. Synchronous styles are restored before the browser paints.
export function useNaturalSizing(root:Ref<HTMLElement|null>,rows:Ref<ActualRow[]>,inputs:()=>unknown,parked:()=>boolean){
 const sizes=ref<Record<string,NaturalSize>>({})
 let frame=0,alive=false,passes=0
 function measure(){
  frame=0;if(!alive||document.hidden||parked()||!root.value)return
  const next:Record<string,NaturalSize>={}
  for(const row of rows.value){
   const element=Array.from(root.value.children).find(e=>(e as HTMLElement).dataset.orderedRow===row.id) as HTMLElement|undefined
   if(!element)continue
   // Measuring briefly changes grid geometry. Keep the browser from choosing
   // an anchor in that temporary layout, including on data refresh after Back.
   const style=document.documentElement.style,anchor=style.getPropertyValue('overflow-anchor'),priority=style.getPropertyPriority('overflow-anchor')
   style.setProperty('overflow-anchor','none','important')
   try{
    element.setAttribute('data-size-measuring','')
    const columns=Array.from(element.querySelectorAll<HTMLElement>(':scope > .ordered-column')).map(c=>Array.from(c.querySelectorAll<HTMLElement>(':scope > .ordered-card')).map(card=>Math.ceil(card.getBoundingClientRect().height)))
    next[row.id]={height:Math.ceil(Math.max(row.chartHeight||0,...columns.map(c=>c.reduce((sum,h)=>sum+h,0)+Math.max(0,c.length-1)*18))),columns}
   }finally{
    element.removeAttribute('data-size-measuring')
    if(anchor)style.setProperty('overflow-anchor',anchor,priority);else style.removeProperty('overflow-anchor')
   }
  }
  passes++
  if(JSON.stringify(next)!==JSON.stringify(sizes.value))sizes.value=next
 }
 function schedule(){if(alive&&!document.hidden&&!parked()&&!frame)frame=requestAnimationFrame(measure)}
 watch(inputs,schedule,{deep:true,flush:'post'})
 onMounted(()=>{alive=true;document.addEventListener('visibilitychange',schedule);schedule()})
 onUnmounted(()=>{alive=false;if(frame)cancelAnimationFrame(frame);frame=0;document.removeEventListener('visibilitychange',schedule)})
 return {sizes,schedule,debug:()=>({passes,pending:!!frame,count:Object.keys(sizes.value).length})}
}
