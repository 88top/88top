<template>
 <section class="network-business-card connection-business" :class="{summary}" data-connection-card :data-connection-state="state">
  <header><h2><StudioGlyph v-if="summary" name="network"/><NetworkIcon v-else color="currentColor"/>{{summary?t('网络连接','Connection'):t('网络连接','Connection & IP')}}</h2><div class="network-header-actions widget-action-group"><WidgetPrimaryAction icon="devices" data-connection-wizard @click="$emit('navigate','/network')"><template #icon><TopologyIcon color="currentColor"/></template>{{t('网络向导','Network setup')}}</WidgetPrimaryAction><WidgetMenu :label="t('网络连接更多操作','More connection actions')" :items="[{id:'connection-details',label:t('连接详情','Connection details')}]" @select="details=true"/></div></header>
  <div class="connection-status"><span class="connection-status-mark" :class="state"><SuccessIcon v-if="!summary&&state==='netSuccess'" color="currentColor"/><StudioGlyph v-else :name="state==='netSuccess'?'check':'network'"/></span><div class="connection-status-text"><strong>{{stateLabel}}</strong><small v-if="summary">{{data?.defaultInterface||'—'}} · {{protocol}}</small></div><button v-if="actionKind" class="connection-remedy" :data-connection-remedy="actionKind" @click="openAction(actionKind)">{{actionKind==='dns'?t('DNS配置','DNS settings'):t('软件源配置','Source settings')}}</button><button v-else-if="error" data-connection-retry @click="$emit('retry')">{{t('重试','Retry')}}</button><span v-if="!summary" class="connection-uptime-badge" :class="{normal:state==='netSuccess'}" :title="t('接口在线时长，不代表互联网持续可用','Interface uptime, not continuous Internet availability')" :aria-label="t('接口在线时长：','Interface uptime: ')+duration" data-connection-uptime>{{duration}}</span></div>
  <p v-if="error&&data" class="network-snapshot-note">{{t('上次快照 · 当前连接状态待确认','Previous snapshot · Current state unconfirmed')}}</p>
  <dl v-if="!summary" class="connection-addresses">
   <div v-for="family in families" :key="family" class="connection-address-group"><dt>{{family==='ipv4'?'IPv4'+(data?.defaultInterface?'（'+data.defaultInterface+'）':''):'IPv6'}}</dt><dd><span :data-address-value="family" :title="isRevealed(family)?address(family):undefined">{{address(family)?isRevealed(family)?address(family):'••••••••••':t('暂无地址','No address')}}</span><button v-if="address(family)" class="connection-reveal" :data-reveal="family" :aria-pressed="isRevealed(family)" :aria-label="addressLabel(family)" :title="addressLabel(family)" @click="privacy.toggle(family)"><CloseEyesIcon v-if="isRevealed(family)" color="currentColor"/><OpenEyesIcon v-else color="currentColor"/></button><span v-if="family==='ipv4'" class="connection-address-meta">{{protocol}}</span></dd></div>
   <div class="connection-dns-group"><dt>DNS</dt><dd class="connection-dns"><span>{{dnsList.slice(0,2).join(' · ')||'—'}}</span><button v-if="dnsList.length>2" @click="details=true">+{{dnsList.length-2}}</button><span class="connection-address-meta">{{dnsMode}}</span></dd></div>
  </dl>
  <footer v-if="summary"><span :title="t('接口在线时长，不代表互联网持续可用','Interface uptime, not continuous Internet availability')"><small>{{t('接口在线','Interface uptime')}}</small><b data-connection-uptime>{{duration}}</b></span></footer>
  <NetworkWidgetDialog v-if="details" :title="t('网络连接和IP地址','Connection & IP addresses')" @close="closeDetails">
   <div class="connection-full-details" data-connection-full-details><p class="network-detail-status">{{stateLabel}}</p><p v-if="error" class="network-snapshot-note">{{t('读取失败；以下为上次信息（若有），不能证明当前连接正常。','Read failed; previous information, if any, does not establish current connectivity.')}}</p><dl><div><dt>{{t('当前接口','Current interface')}}</dt><dd>{{data?.defaultInterface||'—'}}</dd></div><div><dt>{{t('上网协议','Protocol')}}</dt><dd>{{protocol}}</dd></div><div><dt>{{t('接口在线时长','Interface uptime')}}</dt><dd>{{duration}}</dd></div><div v-for="family in families" :key="family"><dt>{{family==='ipv4'?'IPv4':'IPv6'}}</dt><dd><span :data-detail-address="family">{{address(family)?isRevealed(family)?address(family):'••••••••••':t('暂无地址','No address')}}</span><button v-if="address(family)" :data-detail-reveal="family" :aria-pressed="isRevealed(family)" :aria-label="addressLabel(family)" @click="privacy.toggle(family)">{{isRevealed(family)?t('隐藏','Hide'):t('显示60秒','Show for 60s')}}</button></dd></div><div><dt>{{t('DNS来源','DNS source')}}</dt><dd>{{dnsMode}}</dd></div><div><dt>{{t('DNS地址','DNS addresses')}}</dt><dd><span v-if="!dnsList.length">—</span><span v-for="(value,index) in shownDNS" :key="index" data-detail-dns>{{value}}</span><nav v-if="dnsList.length>20"><button :disabled="dnsPage===0" @click="dnsPage--">{{t('上一页','Previous')}}</button><span>{{dnsPage+1}} / {{Math.ceil(dnsList.length/20)}}</span><button :disabled="(dnsPage+1)*20>=dnsList.length" @click="dnsPage++">{{t('下一页','Next')}}</button></nav></dd></div><div v-if="data?.gateway"><dt>{{t('本机出口网关','Router outbound gateway')}}</dt><dd>{{data.gateway}}<small>{{t('详情补充；不是局域网设备上网路线设置','Additional detail; not the LAN device Internet Path setting')}}</small></dd></div></dl><p class="network-privacy-note">{{t('IPv4／IPv6独立显示60秒；关闭详情或切换形态后恢复隐藏。','IPv4 / IPv6 reveal independently for 60s. Closing details or changing form hides them.')}}</p><div class="network-detail-actions"><button @click="closeAndNavigate('/devicemanagement')">{{t('设备管理','Device management')}}</button><button v-if="actionKind" @click="openAction(actionKind)">{{actionKind==='dns'?t('DNS配置','DNS settings'):t('软件源配置','Software source settings')}}</button><button v-if="error" @click="$emit('retry')">{{t('重试','Retry')}}</button></div></div>
  </NetworkWidgetDialog>
  <NetworkBusinessAction v-if="action" :kind="action" @close="action=null"/>
 </section>
</template>
<script setup lang="ts">
import WidgetPrimaryAction from './WidgetPrimaryAction.vue'
import {computed,onMounted,onUnmounted,ref,watch} from 'vue'
import {useNetworkStore} from '../plugins/store'
import {connectionState,connectionLabels,protocolLabel,dnsSource,onlineSeconds,onlineDuration,type NetworkSnapshot} from './networkBusiness'
import {useAddressPrivacy} from './useAddressPrivacy'
import StudioGlyph from './HomeGlyph.vue'
import NetworkIcon from '../components/svg/DNS.vue'
import SuccessIcon from '../components/svg/success.vue'
import TopologyIcon from '../components/svg/topology.vue'
import OpenEyesIcon from '../components/svg/openEyes.vue'
import CloseEyesIcon from '../components/svg/closeEyes.vue'
import NetworkWidgetDialog from './NetworkWidgetDialog.vue'
import NetworkBusinessAction from './NetworkBusinessAction.vue'
import WidgetMenu from './WidgetMenu.vue'
const props=defineProps<{data?:NetworkSnapshot;error?:string;summary?:boolean}>(),emit=defineEmits<{(e:'navigate',path:string):void;(e:'retry'):void}>()
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh,pick=(label:[string,string])=>label[english?1:0]
const state=computed(()=>connectionState(props.data,props.error)),stateLabel=computed(()=>pick(connectionLabels[state.value])),protocol=computed(()=>pick(protocolLabel(props.data?.proto))),dnsMode=computed(()=>pick(dnsSource(props.data?.dnsProto)))
const privacy=useAddressPrivacy(computed(()=>JSON.stringify([props.data?.ipv4addr,props.data?.ipv6addr,props.summary]))),families=['ipv4','ipv6'] as const
const isRevealed=(family:'ipv4'|'ipv6')=>(family==='ipv4'?privacy.ipv4:privacy.ipv6).value
const address=(family:'ipv4'|'ipv6')=>family==='ipv4'?props.data?.ipv4addr:props.data?.ipv6addr
const addressLabel=(family:string)=>(isRevealed(family as 'ipv4'|'ipv6')?t('隐藏','Hide '):t('显示60秒：','Show for 60s: '))+family.toUpperCase()
const dnsList=computed(()=>(props.data?.dnsList||[]).filter(v=>typeof v==='string'&&v.length)),dnsPage=ref(0),shownDNS=computed(()=>dnsList.value.slice(dnsPage.value*20,dnsPage.value*20+20))
const details=ref(false),action=ref<'dns'|'source'|null>(null),actionKind=computed(()=>state.value==='dnsFailed'?'dns':state.value==='softSourceFailed'?'source':null)
function closeDetails(){details.value=false;privacy.hideAll();dnsPage.value=0}
function closeAndNavigate(path:string){closeDetails();emit('navigate',path)}
const network=useNetworkStore()
function openAction(kind:'dns'|'source'|null){if(!kind)return;closeDetails();network.updateNetworkStatus({...props.data,dnsList:[...(props.data?.dnsList||[])]});action.value=kind}
let started=Date.now(),ticker:ReturnType<typeof setInterval>|undefined
const now=ref(Date.now()),seconds=computed(()=>onlineSeconds(props.data,props.error?0:(now.value-started)/1000)),duration=computed(()=>onlineDuration(seconds.value,english)+(seconds.value===null?'':english?` ${seconds.value%60}s`:`${seconds.value%60}秒`))
function restart(){if(ticker!==undefined)clearInterval(ticker);ticker=undefined;if(!document.hidden&&onlineSeconds(props.data)!==null&&!props.error)ticker=setInterval(()=>now.value=Date.now(),1000)}
function visibility(){if(document.hidden){closeDetails();action.value=null}now.value=Date.now();restart()}
watch(()=>props.data,()=>{started=Date.now();now.value=started;restart()})
watch(()=>props.error,restart)
watch(()=>props.summary,()=>{closeDetails();action.value=null})
watch(()=>dnsList.value.length,()=>dnsPage.value=0)
onMounted(()=>{restart();document.addEventListener('visibilitychange',visibility)})
onUnmounted(()=>{if(ticker!==undefined)clearInterval(ticker);document.removeEventListener('visibilitychange',visibility)})
</script>
<style src="./networkWidgets.css" scoped></style>
