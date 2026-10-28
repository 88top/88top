import {onUnmounted} from 'vue'
import {useHomeProjection} from './widgetContext'
type Handle={Close:()=>void}
export function useOwnedBusinessActions(){
 const context=useHomeProjection(),handles=new Set<Handle>();let alive=true
 onUnmounted(()=>{alive=false;for(const handle of handles)handle.Close();handles.clear()})
 return (open:(props:any)=>Handle,props:Record<string,any>)=>{
  let handle:Handle|undefined
  handle=open({...props,onClosed:()=>{if(handle)handles.delete(handle);if(alive)context?.invalidate()}})
  handles.add(handle);return handle
 }
}
