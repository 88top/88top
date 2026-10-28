<template>
 <section class="network-business-card interface-business" :class="{summary,'compact-ports':summary&&!legacySummary}" :data-interface-form="summary?(legacySummary?'legacy-summary':'compact-ports'):'standard'" data-network-interface>
  <header><h2><StudioGlyph name="network"/>{{t('网络接口','Network interfaces')}}</h2><div class="network-header-actions widget-action-group"><WidgetPrimaryAction icon="tune" data-interface-config @click="$emit('navigate','/interfaceconfig')">{{t('接口配置','Configure')}}</WidgetPrimaryAction><WidgetMenu :label="t('网络接口更多操作','More interface actions')" :items="[{id:'interfaces-all',label:t('查看全部','View all')+(ports.length?' · '+ports.length:'')}]" @select="openAll"/></div></header>
  <div v-if="error||!data" class="network-widget-message"><strong>{{error?t('接口信息暂不可用','Interface information unavailable'):t('正在读取接口','Loading interfaces')}}</strong><small v-if="error&&data">{{t('上次快照，当前状态待确认','Previous snapshot; current state unconfirmed')}}</small><button v-if="error" @click="$emit('retry')">{{t('重试','Retry')}}</button></div>
  <template v-else><div v-if="!summary||legacySummary" class="interface-totals"><strong>{{counts.up}}<small>/ {{counts.total}}</small></strong><span>{{t('端口已连接','ports connected')}}</span><small>{{t('链路状态','Link state')}}</small></div><p v-if="!ports.length" class="network-widget-empty">{{t('暂未读取到网络接口','No interfaces returned')}}</p><div v-else-if="!summary||!legacySummary" class="interface-list"><button v-for="port in ports.slice(0,2)" :key="port.name" :data-port="port.name" @click="openPort(port.name)"><span class="interface-link-mark" :class="portState(port.linkState)"><StudioGlyph name="network"/></span><span class="interface-name"><strong>{{port.name}}</strong><small>{{(port.interfaceNames||[]).join(' / ')||t('未关联逻辑接口','No logical interface')}}</small></span><span class="interface-link-state"><strong>{{linkLabel(port.linkState)}}</strong><small v-if="port.linkSpeed">{{port.linkSpeed}}</small><small v-else>{{t('速率待确认','Speed unknown')}}</small></span><StudioGlyph name="arrow"/></button></div></template>
  <footer><small>{{t('端口连接不代表互联网可用','Link state does not establish Internet access')}}</small></footer>
  <NetworkWidgetDialog v-if="details" :title="selected?t('端口详情','Port details')+' · '+selected:t('网络接口状态','Network interfaces')" @close="close">
   <div class="interface-full-details" data-interface-details><p v-if="error&&data" class="network-snapshot-note">{{t('上次快照 · 当前接口状态待确认','Previous snapshot · Current link state unconfirmed')}}</p><template v-if="selectedPort"><button class="network-back" @click="selected=''">← {{t('全部接口','All interfaces')}}</button><dl><div v-for="field in portFields" :key="field[0]"><dt>{{t(field[1],field[2])}}</dt><dd>{{portValue(field[0])}}</dd></div></dl></template><template v-else><p v-if="!data">{{error?t('接口信息暂不可用','Interface information unavailable'):t('正在读取接口','Loading interfaces')}}</p><p v-else-if="!ports.length">{{t('暂未读取到网络接口','No interfaces returned')}}</p><div class="interface-detail-list"><button v-for="port in shownPorts" :key="port.name" :data-detail-port="port.name" @click="selected=port.name"><strong>{{port.name}}</strong><span>{{(port.interfaceNames||[]).join(' / ')||'—'}}</span><small>{{linkLabel(port.linkState)}} · {{port.linkSpeed||t('速率待确认','Speed unknown')}}</small><StudioGlyph name="arrow"/></button></div><nav v-if="ports.length>20"><button :disabled="page===0" @click="page--">{{t('上一页','Previous')}}</button><span>{{page+1}} / {{Math.ceil(ports.length/20)}}</span><button :disabled="(page+1)*20>=ports.length" @click="page++">{{t('下一页','Next')}}</button></nav></template><div class="network-detail-actions"><button @click="close();$emit('navigate','/interfaceconfig')">{{t('配置网络接口','Configure network interfaces')}}</button><button v-if="error" @click="$emit('retry')">{{t('重试','Retry')}}</button></div></div>
  </NetworkWidgetDialog>
 </section>
</template>
<script setup lang="ts">
import WidgetPrimaryAction from './WidgetPrimaryAction.vue'
import {computed,ref,watch} from 'vue'
import {portCounts,portState} from './networkBusiness'
import NetworkWidgetDialog from './NetworkWidgetDialog.vue'
import StudioGlyph from './HomeGlyph.vue'
import WidgetMenu from './WidgetMenu.vue'
const props=defineProps<{data?:{ports?:NetworkPort[]};error?:string;summary?:boolean;legacySummary?:boolean}>()
defineEmits<{(e:'navigate',path:string):void;(e:'retry'):void}>()
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh,ports=computed(()=>props.data?.ports||[]),counts=computed(()=>portCounts(ports.value))
const details=ref(false),selected=ref(''),page=ref(0),selectedPort=computed(()=>ports.value.find(p=>p.name===selected.value)),shownPorts=computed(()=>ports.value.slice(page.value*20,page.value*20+20))
const linkLabel=(state?:string)=>portState(state)==='up'?t('已连接','Connected'):portState(state)==='down'?t('未连接','Disconnected'):t('状态待确认','State unknown')
const portFields=[['name','名称','Name'],['interfaceNames','关联逻辑接口','Logical interfaces'],['linkState','链路状态','Link state'],['linkSpeed','协商速率','Negotiated speed'],['macAddress','MAC','MAC'],['duplex','双工','Duplex'],['rx_packets','接收包数','Received packets'],['tx_packets','发送包数','Sent packets']]
function portValue(key:string){const port=selectedPort.value;if(!port)return '—';if(key==='linkState')return linkLabel(port.linkState);if(key==='interfaceNames')return (port.interfaceNames||[]).join(' / ')||'—';if(key==='duplex')return port.duplex==='full'?t('全双工','Full duplex'):port.duplex==='half'?t('半双工','Half duplex'):'—';return (port as unknown as Record<string,string>)[key]||'—'}
function openPort(name:string){selected.value=name;details.value=true}
function openAll(){selected.value='';page.value=0;details.value=true}
function close(){details.value=false;selected.value='';page.value=0}
watch(()=>props.summary,close)
watch(selectedPort,port=>{if(selected.value&&!port)selected.value=''})
watch(()=>ports.value.length,()=>{page.value=Math.min(page.value,Math.max(0,Math.ceil(ports.value.length/20)-1));if(selected.value&&!selectedPort.value)selected.value=''})
</script>
<style src="./networkWidgets.css" scoped></style>
