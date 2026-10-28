<template>
 <img v-if="source&&!failed" class="application-artwork" :data-app-artwork="app.id" :src="source" alt="" aria-hidden="true" draggable="false" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="failed=true"/>
 <StudioGlyph v-else :name="app.glyph" :data-app-artwork="app.id"/>
</template>
<script setup lang="ts">
import {computed,ref,watch} from 'vue'
import type {HomeApplication} from './homeApplications'
import {applicationIconPath} from './applicationIconPath'
import StudioGlyph from './HomeGlyph.vue'
const props=defineProps<{app:HomeApplication}>()
const source=computed(()=>applicationIconPath(props.app)),failed=ref(false)
watch(source,()=>{failed.value=false})
</script>
<style scoped>
.application-artwork{display:block;width:100%;height:100%;object-fit:contain;border-radius:inherit}
</style>
