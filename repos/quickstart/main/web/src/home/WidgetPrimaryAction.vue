<template>
 <button type="button" class="widget-primary-action" data-widget-primary-action @click="$emit('click',$event)"><span class="widget-action-icon" data-widget-action-icon aria-hidden="true"><slot name="icon"><StudioGlyph :name="icon"/></slot></span><span class="widget-action-label" data-widget-action-label><slot/></span></button>
</template>
<script setup lang="ts">
import StudioGlyph from './HomeGlyph.vue'
defineProps<{icon:string}>()
defineEmits<{(e:'click',event:MouseEvent):void}>()
</script>
<style scoped>
.widget-primary-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;font:inherit;color:inherit;cursor:pointer}
.widget-action-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none;line-height:0}.widget-action-icon :deep(svg){width:16px!important;height:16px!important;margin:0!important;flex:none;color:inherit!important}
.widget-action-label{display:inline-flex;align-items:center;gap:6px;min-width:0;line-height:inherit}
</style>
