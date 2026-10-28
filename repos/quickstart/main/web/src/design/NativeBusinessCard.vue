<template>
 <section class="native-business-card" :class="{'native-summary':summary&&id!=='system'}" :data-native-widget="id" :data-system-presentation="id==='system'?(summary?'summary':'standard'):undefined">
  <NativeBusinessSurface v-if="id==='system'" :id="id" :data="data" :errors="errors" :compact="summary" @details="details=true" @retry="$emit('retry')"/>
  <template v-else-if="summary"><header><h2><StudioGlyph :name="widget(id).glyph"/>{{title}}</h2></header><p v-if="failure" role="status">{{t('信息暂不可用','Information unavailable')}} <button @click="$emit('retry')">{{t('重试','Retry')}}</button></p><template v-else><p v-for="line in summaryLines" :key="line">{{line}}</p></template></template>
  <NativeBusinessSurface v-else :id="id" :data="data" :errors="errors" @details="details=true" @retry="$emit('retry')"/>
  <NetworkWidgetDialog v-if="details" :title="title" @close="details=false"><NativeBusinessSurface :id="id" :data="data" :errors="errors" unbounded @retry="$emit('retry')"/></NetworkWidgetDialog>
 </section>
</template>
<script setup lang="ts">
import {computed,ref} from 'vue'
import NativeBusinessSurface from './NativeBusinessSurface.vue'
import NetworkWidgetDialog from './NetworkWidgetDialog.vue'
import StudioGlyph from './StudioGlyph.vue'
import {widget,type WidgetId} from './rowLayout'
const props=defineProps<{id:WidgetId;data:Record<string,any>;errors:Record<string,string>;summary?:boolean}>()
defineEmits<{(e:'retry'):void}>()
const details=ref(false),english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh
const titles:Record<string,[string,string]>={storage:['磁盘信息','Disk information'],sharing:['存储服务','Storage services'],docker:['Docker','Docker'],downloads:['下载服务','Download services'],remote:['远程域名','Remote domains'],system:['系统信息','System information']}
const title=computed(()=>t(...titles[props.id])),aliases:Record<string,string>={storage:'disks',downloads:'download'},channel=computed(()=>aliases[props.id]||props.id),failure=computed(()=>props.id==='storage'?props.errors.disks&&props.errors.raid:props.errors[channel.value]||props.id==='system'&&props.errors.version)
const summaryLines=computed(()=>{
 const d=props.data
 if(props.id==='system'&&!d.system)return [t('读取中','Loading')]
 if(props.id==='system')return [t('CPU使用率','CPU usage')+' '+(d.system?.cpuUsage||0)+'% · '+t('CPU温度','CPU temperature')+' '+(d.system?.cpuTemperature||0)+'℃',t('内存使用率','Memory usage')+' '+(100-(d.system?.memAvailablePercentage||100))+'%',d.version?.firmwareVersion||t('读取中','Loading')]
 if(props.id==='storage')return [`${props.errors.disks||!d.disks?'—':d.disks.disks?.length||0} ${t('块磁盘','disks')} · RAID ${props.errors.raid||!d.raid?'—':d.raid.disks?.length||0}`,...(props.errors.disks||props.errors.raid?[t('部分磁盘信息暂不可用','Some disk information is unavailable')]:[])]
 if(props.id==='sharing')return d.sharing?[`易有云 · ${d.sharing.linkease?.enabel?t('已配置','Configured'):t('未配置','Not configured')}`,`SAMBA · ${d.sharing.sambas?.length?t('已启用','Enabled'):t('未启用','Disabled')}`,`WEBDAV · ${d.sharing.webdav?.path?t('已启用','Enabled'):t('未启用','Disabled')}`]:[t('读取中','Loading')]
 if(props.id==='docker')return [d.docker?.status==='not installed'?t('未安装','Not installed'):d.docker?.status==='running'?t('运行中','Running'):d.docker?t('未运行','Stopped'):t('读取中','Loading'),d.docker?.status==='running'?d.docker.path:''].filter(Boolean)
 if(props.id==='downloads')return ['aria2','qbittorrent','transmission'].map(name=>`${name} · ${d.download?.[name]?.status==='running'?t('运行中','Running'):d.download?t('未运行','Stopped'):t('读取中','Loading')}`)
 return [d.remote?.ddnstoDomain?'DDNSTO · '+t('正常','Online'):'DDNSTO · '+t('未启动','Not started'),...['ipv4Domain','ipv6Domain'].filter(k=>d.remote?.[k]).map(k=>k.slice(0,4).toUpperCase()+' · '+(['Stopped','Disabled'].includes(d.remote[k])?t('未启动','Not started'):d.remote[k]))]
})
</script>
<style scoped>
.native-business-card{height:100%;min-height:0;min-width:0;box-sizing:border-box}.native-summary{padding:14px 18px;background:var(--c-panel);border:1px solid var(--c-line);border-radius:12px;color:var(--c-text);overflow:auto;font:14px/1.5 Arial,"Microsoft YaHei",sans-serif}.native-summary header{display:flex;align-items:center;justify-content:space-between;gap:10px}.native-summary h2{font-size:14px;font-weight:600;margin:0}.native-summary p{margin:8px 0;overflow-wrap:anywhere}.native-summary small{font-size:12px;color:var(--c-muted)}.native-summary button{border:0;background:none;color:var(--c-accent);cursor:pointer;font:inherit;font-size:12px}
</style>
