<template>
 <div ref="host" class="layout-notice-host" :class="{'layout-notice-editing':editing}" :style="bounds" data-layout-notice-host>
  <div v-if="notice.message&&positioned" class="layout-notice" :class="'layout-notice-'+notice.kind" role="status" aria-live="polite" aria-atomic="true" data-layout-notice :data-notice-kind="notice.kind" @click.stop @pointerenter="pointerEnter" @pointerleave="pointerLeave" @focusin="focusIn" @focusout="focusOut" @keydown.esc.stop.prevent="close">
   <span>{{notice.message}}</span><button ref="closeButton" type="button" :aria-label="english?'Dismiss notification':'关闭提示'" :title="english?'Dismiss notification':'关闭提示'" @click="close" data-layout-notice-close>×</button>
  </div>
 </div>
</template>
<script setup lang="ts">
import {nextTick,onMounted,onUnmounted,ref,watch} from 'vue'
import type {LayoutNoticeState} from './useLayoutNotice'
const props=defineProps<{notice:LayoutNoticeState;editing:boolean}>(),emit=defineEmits<{(e:'dismiss',id:number):void}>()
const english=window.vue_lang==='en',host=ref<HTMLElement|null>(null),closeButton=ref<HTMLButtonElement|null>(null),positioned=ref(false),bounds=ref({left:'0px',width:'0px'})
let timer:ReturnType<typeof setTimeout>|undefined,frame=0,observer:ResizeObserver|undefined,active=true,hovered=false,focused=false
function clearTimer(){if(timer!==undefined)clearTimeout(timer);timer=undefined}
function schedule(){clearTimer();if(!active||!props.notice.message||props.notice.kind!=='info'||hovered||focused)return;const id=props.notice.id;timer=setTimeout(()=>{timer=undefined;if(active&&id===props.notice.id)emit('dismiss',id)},3000)}
function focusIn(){focused=true;clearTimer()}
function focusOut(){void nextTick(()=>{if(!active)return;focused=!!host.value?.contains(document.activeElement);schedule()})}
function pointerEnter(event:PointerEvent){if(event.pointerType==='mouse'){hovered=true;clearTimer()}}
function pointerLeave(event:PointerEvent){if(event.pointerType==='mouse'){hovered=false;schedule()}}
function close(){
 const restore=document.activeElement===closeButton.value,root=host.value?.closest('[data-ordered-home]')
 emit('dismiss',props.notice.id)
 if(restore)void nextTick(()=>root?.querySelector<HTMLElement>(props.editing?'.direct-toolbar button:not(:disabled)':'[data-home-settings]')?.focus({preventScroll:true}))
}
function measure(){const root=host.value?.closest('[data-ordered-home]');if(!root)return;const r=root.getBoundingClientRect(),left=Math.max(0,r.left),right=Math.min(innerWidth,r.right);bounds.value={left:left+'px',width:Math.max(0,right-left)+'px'};positioned.value=right>left}
function scheduleMeasure(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;measure()})}
watch(()=>props.notice,()=>{hovered=matchMedia('(hover: hover)').matches&&!!host.value?.querySelector('.layout-notice')?.matches(':hover');focused=!!host.value?.contains(document.activeElement);schedule()},{immediate:true,flush:'post'})
onMounted(()=>{measure();observer=new ResizeObserver(scheduleMeasure);const root=host.value?.closest('[data-ordered-home]');if(root)observer.observe(root);window.addEventListener('resize',scheduleMeasure);document.addEventListener('scroll',scheduleMeasure,true);window.visualViewport?.addEventListener('resize',scheduleMeasure);window.visualViewport?.addEventListener('scroll',scheduleMeasure)})
onUnmounted(()=>{active=false;clearTimer();cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',scheduleMeasure);document.removeEventListener('scroll',scheduleMeasure,true);window.visualViewport?.removeEventListener('resize',scheduleMeasure);window.visualViewport?.removeEventListener('scroll',scheduleMeasure)})
</script>
<style scoped>
.layout-notice-host{position:fixed;bottom:max(20px,env(safe-area-inset-bottom));z-index:90;pointer-events:none;box-sizing:border-box;padding:0 16px;display:flex;justify-content:center}.layout-notice-editing{bottom:max(88px,env(safe-area-inset-bottom))}.layout-notice{pointer-events:auto;display:flex;align-items:center;gap:12px;max-width:640px;min-width:0;box-sizing:border-box;padding:4px 6px 4px 14px;background:var(--c-panel,var(--card-bg-color,#fff));color:var(--c-text,var(--tit-color,#253247));border:1px solid var(--c-line,var(--border-color,#dce3eb));border-left:3px solid var(--c-accent,#2563eb);border-radius:8px;box-shadow:0 6px 24px #0002;font:13px/1.6 Arial,"Microsoft YaHei",sans-serif}.layout-notice>span{min-width:0;max-height:40vh;overflow:auto;overflow-wrap:anywhere}.layout-notice-error{border-left-color:#dc3545}.layout-notice>button{flex:none;display:grid;place-items:center;min-width:44px;min-height:44px;border:0;border-radius:6px;background:transparent;color:inherit;font:22px/1 Arial;cursor:pointer;padding:0}.layout-notice>button:hover{background:var(--c-soft,#8881)}.layout-notice>button:focus-visible{outline:2px solid var(--c-accent,#2563eb);outline-offset:1px}@media(max-width:450px){.layout-notice-host{padding:0 12px}.layout-notice{font-size:12px;gap:6px;padding-left:10px}}
</style>
