import {onUnmounted} from 'vue'
// Preserve native startup timing while cancelling the two original one-shot
// callbacks if their design wrapper disappears before the first read.
export function nativeStartup(read:()=>void,delay:number){const timer=window.setTimeout(read,delay);onUnmounted(()=>window.clearTimeout(timer));return timer}
