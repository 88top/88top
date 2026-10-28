<template>
 <span v-if="loading" class="system-read-announcement" role="status">{{t('正在读取系统信息','Loading system information')}}</span>
 <div v-else-if="error" class="system-read-error" role="status"><span>{{error}}</span><button type="button" @click="$emit('retry')">{{t('重试','Retry')}}</button></div>
</template>
<script setup lang="ts">
defineProps<{loading?:boolean;error?:string}>()
defineEmits<{(e:'retry'):void}>()
const t=(zh:string,en:string)=>window.vue_lang==='en'?en:zh
</script>
<style>
/* Keep the real view in flow; loading/failure never replaces its geometry. */
.system-read-pending .card-body{filter:blur(3px);opacity:.45;pointer-events:none;user-select:none}
.system-read-card>.card-body{position:relative}
.system-read-announcement{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.system-read-error{position:absolute;inset:0;background:var(--c-panel);display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;align-content:center;padding:16px;text-align:center;color:var(--c-muted);font-size:14px}
.system-read-error button{color:var(--c-accent)!important;background:none;border:0;font:inherit;cursor:pointer;min-height:44px!important;padding:6px!important}
</style>
