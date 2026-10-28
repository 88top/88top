<template>
 <NetworkWidgetDialog :title="title" @close="$emit('close')">
  <div class="launcher-tool-action" :data-launcher-action="app.tool">
   <p class="launcher-action-notice">{{t('设计预览 · 原业务表单，配置仅为示例','Design preview · Original forms, sample settings')}}</p>
   <template v-if="unavailable"><p role="status">{{unavailable}}</p></template>
   <component v-else-if="form" :is="form" :Close="close"/>
   <template v-else><p>{{t('原业务目标','Original destination')}}</p><code data-tool-destination>{{destination}}</code><p>{{t('预览中不跳转设备或外部服务。','Device and external navigation is previewed here.')}}</p></template>
   <div v-if="app.tool==='firmware'&&!unavailable" class="launcher-firmware-options"><label><input type="checkbox" :checked="autoCheck" :disabled="busy" @change="setAuto(($event.target as HTMLInputElement).checked)"/>{{t('自动检查更新','Automatically check for updates')}}</label><span v-if="system.checkUpdate?.needUpdate">{{t('有可用更新','Update available')}}</span><span role="status">{{message}}</span></div>
  </div>
 </NetworkWidgetDialog>
</template>
<script setup lang="ts">
import {computed,markRaw,onMounted,onUnmounted,ref} from 'vue'
import request from '../request'
import {useNetworkStore,useSystemStore} from '../plugins/store'
import Lan from '../components/action-netip/index.vue'
import Dns from '../components/action-dns/index.vue'
import Source from '../components/action-softwaresource/index.vue'
import Sandbox from '../components/action-sandbox/index.vue'
import SandboxEnvironment from '../components/action-sandboxenvironment/index.vue'
import NetworkWidgetDialog from './NetworkWidgetDialog.vue'
import {entryAvailability,launcherCatalogState} from './launcherCatalog'
import type {HomeApplication} from './homeApplications'
const props=defineProps<{app:HomeApplication}>(),emit=defineEmits<{(e:'close'):void}>()
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh,system=useSystemStore(),network=useNetworkStore()
const title=computed(()=>t(props.app.zh,props.app.en)),close=()=>emit('close')
const unavailable=computed(()=>entryAvailability(props.app)!=='available'?entryAvailability(props.app)==='unsupported'?t('当前固件不支持此功能。','This firmware does not support this tool.'):t('功能状态暂不可用，请稍后重试。','Tool status is unavailable. Try again later.'):props.app.tool==='dns'&&!network.status?.proto?t('网络信息尚未就绪，请稍后重试。','Network details are not ready. Try again later.'):'')
const forms:Record<string,any>={lan:markRaw(Lan),dns:markRaw(Dns),source:markRaw(Source),sandbox:markRaw(Sandbox)}
const form=computed(()=>props.app.tool==='sandbox'&&launcherCatalogState.sandbox==='running'?markRaw(SandboxEnvironment):forms[props.app.tool||''])
const destination=computed(()=>props.app.tool==='terminal'?`${window.quickstart_configs?.ttyd?.ssl?'https':'http'}://${window.location.hostname}:${window.quickstart_configs?.ttyd?.port||7681}/`:props.app.path)
const autoCheck=ref(!window.quickstart_configs?.update?.disable),busy=ref(false),message=ref('');let alive=true
async function setAuto(enable:boolean){if(busy.value)return;busy.value=true;message.value='';try{const response=await request.System.AutoCheckUpdate.POST({enable});if(response.data.error)throw new Error(response.data.error);autoCheck.value=enable;if(alive){window.quickstart_configs.update={...window.quickstart_configs.update,disable:!enable};message.value=t('示例设置已保存','Sample setting saved');if(enable)system.requestCheckUpdate()}}catch{message.value=t('保存失败，请重试','Could not save. Try again.')}finally{busy.value=false}}
onMounted(()=>{if(props.app.tool==='dns'&&!network.status?.proto)void request.Network.Status.GET().then(res=>{if(alive&&res.data.result)network.updateNetworkStatus(res.data.result)})})
onUnmounted(()=>{alive=false})
</script>
<style scoped>
.launcher-tool-action{font:14px/1.7 Arial,"Microsoft YaHei",sans-serif}.launcher-action-notice{color:var(--c-muted);font-size:12px;margin:0 0 14px}.launcher-tool-action code{display:block;overflow-wrap:anywhere;padding:12px;background:var(--c-soft);border-radius:8px}.launcher-firmware-options{display:grid;gap:12px;margin-top:18px}.launcher-firmware-options label{display:flex;align-items:center;gap:10px}.launcher-tool-action :deep(#actioner){position:static!important;display:block;width:100%;height:auto;overflow:visible}.launcher-tool-action :deep(.bg){display:none}.launcher-tool-action :deep(.actioner-dns),.launcher-tool-action :deep(.actioner-tips){width:100%;background:transparent;color:var(--c-text);overflow:visible}.launcher-tool-action :deep(.actioner-dns_header){display:none}.launcher-tool-action :deep(.actioner-dns_body){padding:0;min-height:0}.launcher-tool-action :deep(.actioner-dns_footer){padding:14px 0 0;font-size:14px}.launcher-tool-action :deep(input),.launcher-tool-action :deep(select){max-width:100%;box-sizing:border-box}.launcher-tool-action :deep(.config-message){font-size:15px;min-height:80px}
</style>
