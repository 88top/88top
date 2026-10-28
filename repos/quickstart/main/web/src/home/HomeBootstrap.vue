<template>
 <section class="home-bootstrap" role="status" aria-busy="true" :aria-label="label" data-home-bootstrap>
  <div class="home-bootstrap-lines" aria-hidden="true"><i/><i/><i/></div>
  <p v-if="slow">{{label}}</p>
 </section>
</template>
<script setup lang="ts">
import {onMounted,onUnmounted,ref} from 'vue'
const label=window.vue_lang==='en'?'Loading homepage…':'正在加载首页…',slow=ref(false)
let timer:number|undefined
onMounted(()=>{timer=window.setTimeout(()=>slow.value=true,800)})
onUnmounted(()=>window.clearTimeout(timer))
</script>
<style scoped>
.home-bootstrap{min-height:max(320px,calc(100vh - 200px));box-sizing:border-box;border:1px solid var(--c-line);border-radius:15px;background:var(--c-panel);padding:24px;color:var(--c-muted);position:relative}
.home-bootstrap-lines{display:grid;gap:18px;max-width:720px;opacity:.55}.home-bootstrap-lines i{display:block;height:12px;border-radius:6px;background:var(--c-soft);width:65%}.home-bootstrap-lines i:nth-child(2){width:90%}.home-bootstrap-lines i:nth-child(3){width:45%}
.home-bootstrap p{position:absolute;left:24px;right:24px;top:116px;margin:0;font-size:13px;line-height:1.5}
</style>
