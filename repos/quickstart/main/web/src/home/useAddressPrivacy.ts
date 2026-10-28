import {onUnmounted,ref,watch,type Ref} from 'vue'
// One mounted connection widget, two independent 60-second reveal leases.
export function useAddressPrivacy(snapshot:Ref<unknown>){
 const ipv4=ref(false),ipv6=ref(false)
 const timers:Partial<Record<'ipv4'|'ipv6',ReturnType<typeof setTimeout>>>={}
 function hide(family:'ipv4'|'ipv6'){(family==='ipv4'?ipv4:ipv6).value=false;const timer=timers[family];if(timer!==undefined)clearTimeout(timer);delete timers[family]}
 function hideAll(){hide('ipv4');hide('ipv6')}
 function toggle(family:'ipv4'|'ipv6'){const flag=family==='ipv4'?ipv4:ipv6;if(flag.value)hide(family);else{flag.value=true;timers[family]=setTimeout(()=>hide(family),60000)}}
 function visibility(){if(document.hidden)hideAll()}
 document.addEventListener('visibilitychange',visibility)
 watch(snapshot,hideAll)
 onUnmounted(()=>{hideAll();document.removeEventListener('visibilitychange',visibility)})
 return {ipv4,ipv6,toggle,hideAll}
}
