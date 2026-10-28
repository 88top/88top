import {onUnmounted} from 'vue'
// Design Vite transform only. Native address-change timers keep their timing
// while mounted, and cannot outlive the preview form that created them.
export function useLauncherTimers(){
 const timers=new Set<number>();let alive=true
 onUnmounted(()=>{alive=false;for(const timer of timers)window.clearTimeout(timer);timers.clear()})
 return (callback:()=>void,delay:number)=>{const timer=window.setTimeout(()=>{timers.delete(timer);if(alive)callback()},delay);timers.add(timer);return timer}
}
