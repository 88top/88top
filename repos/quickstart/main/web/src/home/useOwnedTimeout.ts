import {onUnmounted} from 'vue'
// Wizards can schedule another check after an async response. Once unmounted,
// even that late response must not create a new polling timer.
export function useOwnedTimeout(){
 const timers=new Set<number>();let alive=true
 onUnmounted(()=>{alive=false;for(const timer of timers)window.clearTimeout(timer);timers.clear()})
 return (callback:()=>void,delay=0)=>{if(!alive)return 0;const timer=window.setTimeout(()=>{timers.delete(timer);if(alive)callback()},delay);timers.add(timer);return timer}
}
