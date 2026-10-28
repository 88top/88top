<template>
  <div class="canvas-tools-grid" :class="{expanded}"><button v-for="tool in configurationTools" :key="tool.path" @click="$emit('navigate',tool.path)" :data-config-tool="tool.path"><StudioGlyph :name="tool.glyph"/><span>{{english?tool.en:tool.zh}}</span></button></div>
</template>
<script setup lang="ts">
import StudioGlyph from './StudioGlyph.vue'
import { configurationTools } from './canvasLayout'
defineProps<{expanded?:boolean}>()
defineEmits<{(e:'navigate',path:string):void}>()
const english=window.vue_lang==='en'
</script>
<style scoped>
.canvas-tools-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.canvas-tools-grid button{display:flex;align-items:center;gap:10px;background:var(--c-soft);color:var(--c-text);border:1px solid transparent;border-radius:9px;padding:12px 11px;font:inherit;cursor:pointer;text-align:left;min-width:0}.canvas-tools-grid svg{width:17px;height:17px;flex:none;color:var(--c-accent)}.canvas-tools-grid span{font-size:12px;line-height:1.5}.canvas-tools-grid button:hover{border-color:var(--c-line);background:var(--c-hover)}.canvas-tools-grid :focus-visible{outline:2px solid var(--c-accent);outline-offset:2px}.expanded{grid-template-columns:1fr;gap:3px}.expanded button{padding:10px 12px;background:transparent}.expanded button:hover{background:var(--c-soft)}
@media(max-width:760px){.canvas-tools-grid:not(.expanded){gap:12px}.canvas-tools-grid:not(.expanded) button{padding:16px 13px}.canvas-tools-grid span{font-size:13px}}
</style>
