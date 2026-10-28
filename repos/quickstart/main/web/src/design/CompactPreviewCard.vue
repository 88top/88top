<template>
  <NetworkConnectionCard v-if="id==='connection'" data-layout-card="connection" data-compact-card :data="data.network" :error="errors.network" summary @navigate="$emit('navigate',$event)" @retry="$emit('retry')"/>
  <NetworkInterfaceCard v-else-if="id==='networkInterface'" legacy-summary data-layout-card="networkInterface" data-compact-card :data="data.ports" :error="errors.ports" summary @navigate="$emit('navigate',$event)" @retry="$emit('retry')"/>
  <NativeBusinessCard v-else-if="nativeBusiness&&['storage','sharing','docker','downloads','remote','system'].includes(id)" :data-layout-card="id" data-compact-card :id="id" :data="data" :errors="errors" summary @retry="$emit('retry')"/>
  <section v-else class="compact-preview" :data-layout-card="id" data-compact-card>
    <header><h2><StudioGlyph :name="definition.glyph"/>{{t(definition.zh,definition.en)}}</h2><button @click="$emit('navigate',destination)" :aria-label="t('查看详情：','Details: ')+t(definition.zh,definition.en)"><StudioGlyph name="arrow"/></button></header>
    <div v-if="failure" class="compact-message" role="status"><span>{{t('信息暂不可用','Information unavailable')}}</span><button @click="$emit('retry')">{{t('重试','Retry')}}</button><small>{{t('其他模块仍可使用','Other modules remain available')}}</small></div>
    <template v-else-if="id==='system'"><div class="compact-meters"><div><span>CPU</span><strong>{{data.system?.cpuUsage??'—'}}<small>%</small></strong><i><b :style="{width:(data.system?.cpuUsage||0)+'%'}"></b></i></div><div><span>{{t('内存','Memory')}}</span><strong>{{data.system?100-data.system.memAvailablePercentage:'—'}}<small>%</small></strong><i><b :style="{width:(data.system?100-data.system.memAvailablePercentage:0)+'%'}"></b></i></div></div></template>
    <template v-else-if="id==='sharing'"><div class="compact-service"><strong>SMB</strong><span>{{data.sharing?data.sharing.sambas?.length?t('已启用','Enabled'):t('未启用','Disabled'):t('读取中','Loading')}}</span></div><small class="compact-subtext">{{t('易有云与 WebDAV · 查看详情','LinkEase & WebDAV · See details')}}</small></template>
    <template v-else-if="id==='docker'"><div class="compact-service"><strong>Docker</strong><span :class="{good:data.docker?.status==='running'}">{{data.docker?data.docker.status==='running'?t('运行中','Running'):t('未运行','Stopped'):t('读取中','Loading')}}</span></div><small class="compact-subtext" :title="data.docker?.path">{{data.docker?.path||'—'}}</small></template>
    <template v-else-if="id==='downloads'"><div class="compact-service"><strong>{{t('下载服务','Downloads')}}</strong><span>{{data.download?runningDownloads:t('读取中','Loading')}}</span></div><small class="compact-subtext">Aria2 · qBittorrent · Transmission</small></template>
    <template v-else><div class="compact-service"><strong>DDNSTO</strong><span>{{data.remote?data.remote.ddnstoDomain?t('已配置','Configured'):t('未配置','Not configured'):t('读取中','Loading')}}</span></div><small class="compact-subtext">{{t('地址与远程配置 · 查看详情','Addresses & remote access · Details')}}</small></template>
  </section>
</template>
<script setup lang="ts">
import {computed,inject} from 'vue'
import StudioGlyph from './StudioGlyph.vue'
import NetworkConnectionCard from './NetworkConnectionCard.vue'
import NetworkInterfaceCard from './NetworkInterfaceCard.vue'
import NativeBusinessCard from './NativeBusinessCard.vue'
import {widget,type WidgetId} from './rowLayout'
const props=defineProps<{id:WidgetId;data:Record<string,any>;errors:Record<string,string>}>()
const nativeBusiness=inject<boolean>('quickstart-native-business',false)
defineEmits<{(e:'navigate',path:string):void;(e:'retry'):void}>()
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh
const definition=computed(()=>widget(props.id))
const channels:Partial<Record<WidgetId,string>>={connection:'network',downloads:'download',sharing:'sharing'}
const channel=computed(()=>channels[props.id]||props.id)
const failure=computed(()=>Boolean(props.errors[channel.value]))
const destinations:Partial<Record<WidgetId,string>>={connection:'/network',system:'/system',sharing:'/storage',docker:'/docker',downloads:'/download',remote:'/ddns'}
const destination=computed(()=>destinations[props.id]||'/')
const runningDownloads=computed(()=>{const count=Object.values(props.data.download||{}).filter((v:any)=>v.status==='running').length;return count?count+t(' 项运行中',' running'):t('均未运行','None running')})
</script>
<style scoped>
.compact-preview{height:100%;min-height:0;box-sizing:border-box;background:var(--c-panel);border:1px solid var(--c-line);border-radius:15px;padding:17px 20px;color:var(--c-text);display:flex;flex-direction:column;gap:15px}
header{display:flex;align-items:center;justify-content:space-between;gap:10px}h2{font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;margin:0}header svg{width:15px;height:15px;color:var(--c-muted)}button{font:inherit;border:0;background:none;padding:0;cursor:pointer;color:var(--c-accent)}header button{display:grid;place-items:center;width:24px;height:24px}header button svg{color:var(--c-accent)}
.compact-connection{display:flex;align-items:center;gap:9px}.compact-connection i{width:7px;height:7px;border-radius:50%;background:var(--c-muted)}.compact-connection i.good{background:var(--c-good)}.compact-connection strong{font-size:17px;font-weight:550}.compact-connection>span{font-size:10px;color:var(--c-muted);margin-left:auto}
.compact-meta{display:flex;align-items:center;gap:9px;font-size:10px;color:var(--c-muted);margin-top:auto}.compact-meta strong{font-size:11px;color:var(--c-text);font-weight:500}.compact-meta button{margin-left:auto;white-space:nowrap;font-size:10px}
.compact-meters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px;margin-top:auto}.compact-meters span{font-size:10px;color:var(--c-muted)}.compact-meters strong{display:block;font-size:25px;font-weight:500;margin:3px 0 7px}.compact-meters small{font-size:10px;margin-left:2px}.compact-meters i{display:block;background:var(--c-soft);height:3px;border-radius:3px;overflow:hidden}.compact-meters b{display:block;height:100%;background:var(--c-accent)}.compact-meters>div:last-child b{background:var(--c-good)}
.compact-service{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}.compact-service strong{font-weight:550}.compact-service>span{font-size:11px;color:var(--c-muted)}.compact-service>span.good{color:var(--c-good)}.compact-subtext{font-size:10px;color:var(--c-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:auto}.compact-message{display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:12px;color:var(--c-warning)}.compact-message small{width:100%;font-size:10px;color:var(--c-muted)}.compact-message button{font-size:11px}
</style>
