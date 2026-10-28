<template>
  <div class="direct-panel-backdrop" @click="emit('close')"></div>
  <section ref="element" class="direct-panel" role="dialog" aria-modal="true" :aria-label="title" @keydown="keyboard">
    <header><h2>{{title}}</h2><button @click="emit('close')" :aria-label="english?'Close panel':'关闭面板'">×</button></header>
    <div class="direct-panel-body"><slot/></div>
    <footer><slot name="actions"><button @click="emit('close')">{{english?'Back to home':'返回首页'}}</button></slot></footer>
  </section>
</template>
<script setup lang="ts">
import {ref,onMounted,onUnmounted,nextTick} from 'vue'
defineProps<{title:string}>()
const emit=defineEmits<{(e:'close'):void}>(),element=ref<HTMLElement|null>(null),english=window.vue_lang==='en'
let opener:HTMLElement|null=null
function keyboard(e:KeyboardEvent){
  if(e.key==='Escape'){e.stopPropagation();emit('close')}
  if(e.key==='Tab'){
    const all=Array.from(element.value!.querySelectorAll<HTMLElement>('button:not(:disabled),select,input,a[href]')).filter(e=>e.getClientRects().length),first=all[0],last=all[all.length-1]
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
}
onMounted(async()=>{opener=document.activeElement as HTMLElement;await nextTick();element.value?.querySelector<HTMLElement>('button')?.focus()})
onUnmounted(()=>{if(opener?.isConnected)opener.focus({preventScroll:true})})
</script>
