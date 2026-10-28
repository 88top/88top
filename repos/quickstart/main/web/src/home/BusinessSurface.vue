<template>
 <div ref="surface" class="native-business-surface" :class="['native-'+id,{unbounded,'native-compact':compact}]" :data-business-surface="id">
  <template v-if="id==='system'"><p v-if="ready&&partial&&!failed" class="native-partial" role="status">{{t('部分信息读取失败，以下为已取得的快照，当前状态待确认。','Some information is unavailable. Showing previous snapshots; current state is unconfirmed.')}} <button @click="$emit('retry')">{{t('重试','Retry')}}</button></p><component :is="compact?SystemOverview:System" :loading="!ready" :read-error="failed?t('读取失败，其他组件仍可使用','Unavailable; other widgets remain usable'):undefined" @details="$emit('details')" @retry="$emit('retry')"/></template>
  <div v-else-if="failed" class="native-read-state" role="status">{{title}} · {{t('读取失败，其他组件仍可使用','Unavailable; other widgets remain usable')}}<button @click="$emit('retry')">{{t('重试','Retry')}}</button></div>
  <template v-else><p v-if="partial" class="native-partial" role="status">{{t('部分信息读取失败，以下为已取得的快照，当前状态待确认。','Some information is unavailable. Showing previous snapshots; current state is unconfirmed.')}} <button @click="$emit('retry')">{{t('重试','Retry')}}</button></p><component v-if="ready&&visible" :is="component"/><div v-else class="native-read-state" role="status">{{title}} · {{t('读取中…','Loading…')}}</div></template>
  <p v-if="ready&&!unbounded&&projectionWarning" class="native-partial" role="status" data-projection-warning>{{projectionWarning}} <button @click="$emit('details')" data-projection-warning-open>{{t('查看异常','View warnings')}}</button></p>
 </div>
</template>
<script setup lang="ts">
import {computed,onMounted,onUnmounted,provide,ref} from 'vue'
import {widgetContext} from './widgetContext'
import Disk from '../pages/index/info/DiskInfo.vue'
import Sharing from '../pages/index/Storage/index.vue'
import Docker from '../pages/index/info/Docker.vue'
import Download from '../pages/index/service/DownloadService.vue'
import Remote from '../pages/index/service/RemoteDomain.vue'
import System from '../pages/index/info/SystemInfo.vue'
import SystemOverview from './SystemOverview.vue'
import type {WidgetId} from './layout/rowLayout'
const props=defineProps<{id:WidgetId;data:Record<string,any>;errors:Record<string,string>;unbounded?:boolean;compact?:boolean}>()
const emit=defineEmits<{(e:'retry'):void;(e:'details'):void}>()
const surface=ref<HTMLElement|null>(null)
provide(widgetContext,{data:props.data,bounded:()=>!props.unbounded,details:()=>emit('details'),invalidate:()=>emit('retry')})
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh,visible=ref(!document.hidden),visibility=()=>visible.value=!document.hidden
const components:Record<string,any>={storage:Disk,sharing:Sharing,docker:Docker,downloads:Download,remote:Remote,system:System},component=computed(()=>components[props.id])
const channels:Record<string,string[]>={storage:['disks','raid'],sharing:['sharing'],docker:['docker'],downloads:['download'],remote:['remote'],system:['system','version']},keys=computed(()=>channels[props.id])
const titles:Record<string,string>={storage:t('磁盘信息','Disk information'),sharing:t('存储服务','Storage services'),docker:'Docker',downloads:t('下载服务','Download services'),remote:t('远程域名','Remote domains'),system:t('系统信息','System information')},title=computed(()=>titles[props.id])
const failed=computed(()=>keys.value.every(k=>props.errors[k]&&!props.data[k]))
const partial=computed(()=>keys.value.some(k=>props.errors[k]))
const ready=computed(()=>keys.value.every(k=>props.data[k]||props.errors[k]))
const projectionWarning=computed(()=>{
 if(props.id!=='storage')return ''
 const physical=props.errors.disks?[]:props.data.disks?.disks||[],raid=props.errors.raid?[]:props.data.raid?.disks||[]
 return [...physical,...raid].slice(3).some(d=>d.errorInfo||d.smartWarning||d.childrens?.some((p:any)=>p.isReadOnly&&p.filesystem!=='swap'))?t('有未展开的磁盘异常。','Additional disks have warnings.'):''
})
onMounted(()=>document.addEventListener('visibilitychange',visibility))
onUnmounted(()=>document.removeEventListener('visibilitychange',visibility))
</script>
<style>
.native-business-surface{height:100%;min-height:0;min-width:0;overflow:auto;border-radius:10px;overscroll-behavior:contain;font:14px Arial,"Microsoft YaHei",sans-serif;color:var(--c-text);container-type:inline-size}.native-business-surface.unbounded{height:auto;overflow:visible}.native-business-surface>.reusable-card{min-height:100%;height:auto!important;box-sizing:border-box}.native-business-surface .card-header{flex-wrap:wrap;gap:10px}.native-business-surface .card-header .title{font-size:16px!important;font-weight:600!important}.native-business-surface .card-header .settings{margin-left:auto}.native-business-surface .card-header .btn_settings{font-size:14px;cursor:pointer}.native-business-surface .content{min-width:0}.native-business-surface a,.native-business-surface .name{overflow-wrap:anywhere}.native-business-surface .chart_box{flex-wrap:wrap!important;overflow:visible!important;gap:8px}.native-business-surface .chart_box .chart{flex:1 0 150px!important}.native-business-surface .info{grid-template-columns:repeat(2,minmax(0,1fr))!important}.native-business-surface .info .item{flex-wrap:wrap;gap:6px}.native-business-surface .info .item1{min-width:0;overflow-wrap:anywhere}.native-business-surface .info .item>span{line-height:1.5!important}.native-read-state{min-height:100%;padding:20px;background:var(--c-panel);box-sizing:border-box;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:12px}.native-read-state button,.native-partial button{font:inherit;border:0;color:var(--c-accent);background:none;cursor:pointer}.native-partial{padding:10px;margin:0;background:var(--c-soft);font-size:12px}
@container(max-width:440px){.native-business-surface .card-header .title{font-size:14px!important}.native-business-surface .info{grid-template-columns:minmax(0,1fr)!important}.native-business-surface .info .item1{padding:12px!important}.native-business-surface .tab{gap:4px!important}.native-business-surface .tab>.item{min-width:0;padding:10px 4px!important}.native-business-surface .btn_settings{padding-left:8px!important}.native-business-surface .content{font-size:13px}}
.native-business-surface .system-overview .card-header .title{font-size:14px!important}
.native-business-surface:not(.unbounded) .rotation{display:none!important}.native-business-surface:not(.unbounded) .dropdown-menu{display:none!important}
</style>
