import {onUnmounted,watch} from 'vue'
import request from '../request'
import {useSystemStore} from '../plugins/store'

// Native cards retain their original local state and tab selection. Their reads
// consume the root owner's snapshots; the root captures its readers at import.
export function useNativeBusinessReads(data:Record<string,any>,errors:Record<string,string>){
  const store=useSystemStore()
  const targets:Array<[string,any]>=[['disks',request.Nas.Disk.Status],['raid',request.Raid.List],['sharing',request.Nas.Service.Status],['docker',request.Guide.DockerStatus],['download',request.Guide.DownloadService.Status],['remote',request.Guide.GetDdns]]
  let active=true
  const pending=new Map<string,Promise<any>>()
  const restore=targets.map(([id,target])=>{
    const original=target.GET
    const bridge=async()=>{
      if(!active)return {data:{}}
      if(data[id]||errors[id])return {data:errors[id]?{error:errors[id]}:{result:data[id]}}
      // A wizard can need disk inventory while the disk card is hidden.
      if(!pending.has(id))pending.set(id,original().then((response:any)=>{if(active&&response.data?.result)data[id]=response.data.result;return response}).catch((error:any)=>({data:{error:String(error)}})).finally(()=>pending.delete(id)))
      return pending.get(id)
    }
    target.GET=bridge
    return ()=>{if(target.GET===bridge)target.GET=original}
  })
  watch(()=>data.system,value=>{if(value)store.updateSystemStatus({...value})},{immediate:true})
  watch(()=>data.version,value=>{if(value)store.version={...value}},{immediate:true})
  let clock:number|undefined
  function visibility(){if(clock!==undefined)window.clearInterval(clock);clock=undefined;if(!document.hidden&&data.system)clock=window.setInterval(()=>store.incrTime(),1000)}
  watch(()=>Boolean(data.system),visibility,{immediate:true})
  document.addEventListener('visibilitychange',visibility)
  onUnmounted(()=>{active=false;restore.forEach(fn=>fn());if(clock!==undefined)window.clearInterval(clock);document.removeEventListener('visibilitychange',visibility)})
}
