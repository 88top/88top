<template><WidgetMenu v-if="scope?.preview&&!scope.compact&&items.length" :label="english?'More widget actions':'更多组件操作'" :items="items" @select="select" data-native-card-menu/></template>
<script setup lang="ts">
import {computed,inject,nextTick,onMounted,onUnmounted,ref} from 'vue'
import {nativePreviewScope} from './nativePreviewScope'
import WidgetMenu from './WidgetMenu.vue'
const scope=inject(nativePreviewScope,undefined),english=window.vue_lang==='en',anchors=ref<HTMLAnchorElement[]>([])
const items=computed(()=>anchors.value.map((a,i)=>({id:'original-'+i,label:(a.textContent||'').trim()})))
function select(id:string){anchors.value[Number(id.slice(9))]?.click()}
let observer:MutationObserver|undefined
let primary:HTMLElement|null=null,oldRole:string|null=null,oldTab:string|null=null
function primaryKey(event:KeyboardEvent){if(event.target===primary&&['Enter',' '].includes(event.key)){event.preventDefault();primary?.click()}}
onMounted(async()=>{if(!scope?.preview||scope.compact)return;await nextTick();const surface=scope.surface();primary=surface?.querySelector<HTMLElement>('.reusable-card>.card-header .settings-btn>.btn_settings')||null;if(primary&&primary.tagName!=='BUTTON'){oldRole=primary.getAttribute('role');oldTab=primary.getAttribute('tabindex');primary.setAttribute('role','button');primary.tabIndex=0;primary.addEventListener('keydown',primaryKey)}const menu=surface?.querySelector<HTMLElement>('.reusable-card>.card-header .dropdown-menu');if(!menu||scope.id==='system')return;const read=()=>anchors.value=Array.from(menu.querySelectorAll<HTMLAnchorElement>('a')).filter(a=>(a.textContent||'').trim());read();observer=new MutationObserver(read);observer.observe(menu,{childList:true,subtree:true,characterData:true})})
onUnmounted(()=>{observer?.disconnect();if(primary&&primary.tagName!=='BUTTON'){primary.removeEventListener('keydown',primaryKey);for(const [key,value]of [['role',oldRole],['tabindex',oldTab]]){if(value===null)primary.removeAttribute(key!);else primary.setAttribute(key!,value!)}}primary=null})
</script>
