<template>
 <NetworkWidgetDialog :title="kind==='dns'?t('DNS配置','DNS settings'):t('软件源配置','Software source settings')" @close="$emit('close')">
  <div class="network-business-action" :data-network-action="kind"><DnsAction v-if="kind==='dns'" :Close="close"/><SourceAction v-else :Close="close"/></div>
 </NetworkWidgetDialog>
</template>
<script setup lang="ts">
import DnsAction from '../components/action-dns/index.vue'
import SourceAction from '../components/action-softwaresource/index.vue'
import NetworkWidgetDialog from './NetworkWidgetDialog.vue'
defineProps<{kind:'dns'|'source'}>();const emit=defineEmits<{(e:'close'):void}>(),english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh
const close=()=>emit('close')
</script>
<style scoped>
.network-action-notice{font-size:11px;color:var(--c-muted);line-height:1.7;margin:0 0 14px}.network-business-action :deep(#actioner){position:static!important;width:100%;height:auto;display:block;overflow:visible}.network-business-action :deep(.bg){display:none}.network-business-action :deep(.actioner-dns){width:100%!important;background:transparent;color:var(--c-text);overflow:visible;position:static}.network-business-action :deep(.actioner-dns_header){display:none}.network-business-action :deep(.actioner-dns_body){padding:0;min-height:0;max-height:none}.network-business-action :deep(.actioner-dns_footer){font-size:13px;padding:18px 0 0;gap:8px;justify-content:flex-end}.network-business-action :deep(.actioner-dns_footer button){width:auto!important;min-width:75px;margin:0!important;padding:8px 14px!important}.network-business-action :deep(.label-item){margin:14px 0}.network-business-action :deep(.label-item_key){color:var(--c-muted)!important}.network-business-action :deep(.label-item_value){margin-top:7px}.network-business-action :deep(input),.network-business-action :deep(select){width:100%;max-width:100%;box-sizing:border-box;background:var(--c-panel);color:var(--c-text);border:1px solid var(--c-line);border-radius:7px}.network-business-action :deep(.config-message){font-size:15px;line-height:1.8;min-height:70px}.network-business-action :deep(.successed){font-size:15px}.network-business-action :deep(.finished){width:64px;height:64px}.network-business-action :deep(.label-message){font-size:12px!important}
</style>
