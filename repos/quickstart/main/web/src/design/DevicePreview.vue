<template>
  <p class="design-context">{{ english?'Design mode: real device-management components, synthetic policy and traffic.':'设计模式：使用真实设备管理组件，策略与流量均为示例。' }}</p>
  <p v-if="missing" class="design-missing" role="status">{{english?'This device is no longer in the list. No other device was selected.':'该设备当前不在清单中，未选择其他设备。'}} <button @click="clearDevice">{{english?'Back to list':'返回列表'}}</button></p>
  <div ref="root"><DeviceManagement /></div>
</template>
<script setup lang="ts">
// Design-only adapter: drives the real list's controls after an async load.
// Production route/query support remains a separate M69 implementation.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DeviceManagement from '../pages/device/index.vue'
import { inventory } from './devices'
const root=ref<HTMLElement>(),route=useRoute(),router=useRouter()
const english=window.vue_lang==='en'
const missing=computed(()=>Boolean(route.query.device)&&!inventory().some(d=>d.deviceId===route.query.device))
let observer:MutationObserver|undefined,opened=''
const clearDevice=()=>router.replace({query:{...route.query,device:undefined}})
function sync(){
 if(route.query.filter==='all'){
   const all=root.value?.querySelector<HTMLButtonElement>('.device-filters button:nth-child(2)')
   if(all&&!all.classList.contains('active'))all.click()
 }
 const id=String(route.query.device||'')
 if(!id||id===opened||missing.value)return
 const row=Array.from(root.value?.querySelectorAll<HTMLElement>('[data-device-id]')||[]).find(el=>el.dataset.deviceId===id&&el.offsetParent!==null)
 if(row){opened=id;row.click()}
}
function clicked(event:Event){
 const target=event.target as HTMLElement
 if(target.closest('.drawer-close') || target.classList.contains('drawer-backdrop')){opened='';void clearDevice();return}
 const row=target.closest<HTMLElement>('[data-device-id]')
 if(row&&row.dataset.deviceId!==route.query.device){opened=row.dataset.deviceId||'';void router.replace({query:{...route.query,device:opened}})}
}
function key(event:KeyboardEvent){if(event.key==='Escape'&&root.value?.querySelector('.device-drawer')){opened='';void clearDevice()}}
watch(()=>route.query.device,()=>{if(!route.query.device)opened='';sync()})
onMounted(()=>{observer=new MutationObserver(sync);if(root.value){observer.observe(root.value,{subtree:true,childList:true});root.value.addEventListener('click',clicked,true)}document.addEventListener('keydown',key,true);sync()})
onUnmounted(()=>{observer?.disconnect();root.value?.removeEventListener('click',clicked,true);document.removeEventListener('keydown',key,true)})
</script>
<style scoped>.design-context{font-size:12px;color:var(--flow-span-color);margin:0;padding:13px 0}.design-missing{padding:12px;background:#fff7e6;color:#9c6420;border-radius:6px}.design-missing button{margin-left:12px;border:1px solid currentColor;padding:6px;background:transparent;color:inherit;cursor:pointer}</style>
