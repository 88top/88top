<template>
  <section class="common-tools" aria-label="常用工具" data-common-tools>
    <span>{{english?'Common tools':'常用工具'}}</span>
    <div><button v-for="entry in entries" :key="entry.path" @click="$emit('navigate',entry.path)" :data-home-entry="entry.path"><StudioGlyph :name="entry.glyph"/>{{english?entry.en:entry.zh}}<StudioGlyph name="arrow"/></button></div>
  </section>
</template>
<script setup lang="ts">
import StudioGlyph from './StudioGlyph.vue'
import {quickEntrances} from './canvasLayout'
defineProps<{entries:Array<typeof quickEntrances[number]>}>()
defineEmits<{(e:'navigate',path:string):void}>()
const english=window.vue_lang==='en'
</script>
<style scoped>
.common-tools{border-top:1px solid var(--c-line);padding-top:14px;margin-top:17px;display:flex;align-items:start;gap:16px}
.common-tools>span{font-size:10px;color:var(--c-muted);white-space:nowrap;padding-top:6px}
.common-tools>div{display:flex;flex-wrap:wrap;gap:7px 16px;min-width:0;flex:1}
.common-tools button{display:flex;align-items:center;gap:7px;border:0;background:none;color:var(--c-text);cursor:pointer;padding:5px 0;font:inherit;font-size:11px;text-align:left}
.common-tools button:hover{color:var(--c-accent)}.common-tools svg{width:14px;height:14px;flex:none;color:var(--c-accent)}.common-tools svg:last-child{width:11px;height:11px;color:var(--c-muted)}
.common-tools :focus-visible{outline:2px solid var(--c-accent);outline-offset:3px}
@media(max-width:760px){.common-tools{gap:16px}.common-tools button{font-size:12px}}
</style>
