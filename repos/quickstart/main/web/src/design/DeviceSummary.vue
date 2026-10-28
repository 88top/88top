<template>
  <Card :title="t('局域网设备','LAN devices')" class="home-device-summary">
    <template #icon><TopologyIcon color="#3b82f6" style="width:20px;height:20px" /></template>
    <template #settings><router-link :to="allTarget" class="summary-more">{{ t('查看全部','View all') }} →</router-link></template>
    <p class="summary-count" data-summary-count>{{ countLabel }}</p>
    <PageState v-if="loading" kind="loading" :title="t('正在读取设备清单','Loading devices')" />
    <PageState v-else-if="error" kind="error" :title="error" :description="t('其他首页模块仍可使用。','Other home modules remain available.')" :action-label="t('重试','Retry')" @action="retry" />
    <PageState v-else-if="!items.length" kind="empty" :title="t('暂未发现设备','No devices discovered')" :description="t('本局域网上线的设备会自动出现，也可进入完整管理页添加设备。','Devices appear when observed on this LAN. You can add a device in device management.')" />
    <template v-else>
      <p v-if="stale" class="summary-notice" role="status">{{ t('显示 2 分钟前的快照，当前状态待确认。','Showing a snapshot from 2 minutes ago. Current state is unconfirmed.') }}</p>
      <div class="summary-devices">
        <router-link v-for="device in shown" :key="device.deviceId" :to="deviceTarget(device.deviceId)" class="summary-device" :data-summary-device="device.deviceId">
          <DeviceSceneIcon :scene="device.scene" :icon-key="device.iconKey" :label="deviceCategoryLabel(device.scene,$gettext)" />
          <div class="summary-identity"><strong>{{ deviceDisplayName(device,$gettext) }}</strong><small>{{ [device.brand,device.classification.source==='fallback'?t('类型待确认','Type unconfirmed'):deviceCategoryLabel(device.scene,$gettext)].filter(Boolean).join(' · ') }}</small><small>{{ currentAddress(device) }} · {{ connection(device.connection.kind) }}</small><span v-if="showRates" class="summary-rate">{{ rateLabel(device.deviceId) }}</span></div>
          <span class="summary-presence" :class="{offline:!device.online}">{{ stale?t('上次记录：','Last recorded: '):'' }}{{ devicePresenceLabel(device,$gettext) }}</span>
        </router-link>
      </div>
    </template>
    <div class="summary-footer"><small>{{ t('仅显示前','Showing first') }} {{ shown.length }} {{ t('台 · 点击设备查看详情','devices · Select a device for details') }}</small><button v-if="items.length" @click="toggleRates">{{ showRates?t('收起速率','Hide rates'):t('显示速率','Show rates') }}</button></div>
    <p v-if="capability!=='available'" class="summary-note">{{ capabilityLabel }} {{ t('设备清单与资料仍可查看。','Devices and profiles remain accessible.') }}</p>
    <p class="summary-note">{{ authorityLabel }}</p>
    <div class="summary-footer"><small>{{ stale?t('上次成功更新：2 分钟前','Last successful update: 2 minutes ago'):t('示例快照 · 只包含本机观察范围','Example snapshot · Only devices observed by this router') }}</small><button @click="retry">{{ t('刷新','Refresh') }}</button></div>
  </Card>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGettext } from '../plugins/i18n'
import request from '../request'
import Card from '../pages/index/components/Card.vue'
import TopologyIcon from '../components/svg/topology.vue'
import PageState from '../pages/device/components/pageState.vue'
import DeviceSceneIcon from '../pages/device/components/deviceSceneIcon.vue'
import { buildDeviceListItems, type DeviceListItem } from '../pages/device/deviceInventory'
import { deviceDisplayName, devicePresenceLabel, deviceCategoryLabel } from '../pages/device/devicePresentation'
import { telemetrySpeedLabel, telemetryByDevice, type DeviceTelemetryItem } from '../pages/device/deviceTelemetry'
import { demo } from './fixtures'
import { inventory } from './devices'
const { $gettext }=useGettext()
const t=(zh:string,en:string)=>window.vue_lang==='en'?en:$gettext(zh)
const route=useRoute()
const items=ref<DeviceListItem[]>(demo.scenario==='stale'?buildDeviceListItems(inventory()):[]),loading=ref(true),error=ref(''),showRates=ref(false),mobile=ref(matchMedia('(max-width:700px)').matches)
const telemetry=ref(new Map<string,DeviceTelemetryItem>())
const stale=computed(()=>demo.scenario==='stale'&&!demo.recovered)
const capability=computed(()=>({'no-speed':'not_installed',disabled:'disabled','speed-error':'error',unsupported:'unsupported'}[demo.scenario]||'available'))
const capabilityLabel=computed(()=>({not_installed:t('流量统计服务未安装。','Traffic monitoring is not installed.'),disabled:t('流量统计服务未启用。','Traffic monitoring is disabled.'),error:t('流量统计服务异常。','Traffic monitoring encountered an error.'),unsupported:t('当前固件不支持流量统计。','Traffic monitoring is unsupported on this firmware.')}[capability.value]||''))
const shown=computed(()=>items.value.slice(0,mobile.value?3:6))
const countLabel=computed(()=>loading.value||error.value?t('设备数量暂不可用','Device count unavailable'):`${stale.value?t('快照：','Snapshot: '):''}${t('在线','Online')} ${items.value.filter(d=>d.online).length} · ${t('本次开机发现','Discovered this boot')} ${items.value.length}`)
const authorityLabel=computed(()=>demo.authority==='local'?t('本机负责此局域网的地址分配，可在设备详情中设置固定地址与上网路线。','This router allocates addresses on this LAN. Configure reservations and internet paths in device details.'):demo.authority==='external'?t('本机不负责此局域网的地址分配；固定地址与上网路线请到分配地址的主路由设置。','This router does not allocate addresses on this LAN. Set reservations and internet paths on the router that does.'):t('地址分配方尚不明确；固定地址与上网路线暂为只读。','The address allocator is unconfirmed. Reservations and internet paths are read-only.'))
const allTarget=computed(()=>({path:'/devicemanagement',query:{...route.query,device:undefined,filter:'all'}}))
const deviceTarget=(device:string)=>({path:'/devicemanagement',query:{...route.query,device,filter:'all'}})
const currentAddress=(d:DeviceListItem)=>d.addresses.current[0]?.address || t('暂无当前地址','No current address')
const connection=(kind:string)=>kind==='wifi'?'Wi-Fi':kind==='lan'?t('有线','Wired'):t('未知','Unknown')
const rateLabel=(id:string)=>capability.value!=='available'?t('速率暂不可用','Rate unavailable'):`↓ ${telemetrySpeedLabel(telemetry.value.get(id),'down',t('采集中','Collecting'))} · ↑ ${telemetrySpeedLabel(telemetry.value.get(id),'up',t('采集中','Collecting'))}`
let inventoryTimer:number|undefined,trafficTimer:number|undefined,mounted=true,pending=false,ratePending=false
async function load(){if(pending||document.hidden||!mounted)return;if(demo.scenario==='loading'&&!demo.recovered){loading.value=true;items.value=[];return}pending=true;loading.value=items.value.length===0;error.value='';try{const res=await request.DeviceMangement.deviceInventoryV2.GET();if(!res.data?.result)throw new Error(res.data?.error || 'Inventory result missing');items.value=buildDeviceListItems(res.data.result.devices||[])}catch(e){if(!stale.value||!items.value.length){items.value=[];error.value=demo.scenario==='old'?t('设备管理需要兼容版本的 Quickstart 后端','Device management requires a compatible Quickstart backend'):demo.scenario==='permission'?t('登录已过期或没有设备读取权限','Session expired or device read access denied'):t('设备清单暂不可用，请重试','Device list unavailable. Please retry.')}}finally{pending=false;loading.value=false;if(mounted&&!document.hidden)inventoryTimer=window.setTimeout(load,30000)}}
async function loadRates(){if(ratePending||!mounted||document.hidden||!showRates.value||capability.value!=='available')return;ratePending=true;try{const res=await request.DeviceMangement.deviceTrafficV2.GET();if(mounted&&res.data?.result)telemetry.value=telemetryByDevice(res.data.result.items||[])}catch(_){telemetry.value=new Map()}finally{ratePending=false;if(mounted&&!document.hidden&&showRates.value)trafficTimer=window.setTimeout(loadRates,5000)}}
const toggleRates=()=>{showRates.value=!showRates.value;if(showRates.value)void loadRates();else window.clearTimeout(trafficTimer)}
const retry=()=>{demo.recovered=true;window.clearTimeout(inventoryTimer);void load()}
const resize=()=>{mobile.value=matchMedia('(max-width:700px)').matches}
const visibility=()=>{window.clearTimeout(inventoryTimer);window.clearTimeout(trafficTimer);if(!document.hidden){void load();void loadRates()}}
watch(()=>demo.scenario,()=>{window.clearTimeout(inventoryTimer);if(demo.scenario==='stale'&&!items.value.length)items.value=buildDeviceListItems(inventory());void load()})
onMounted(()=>{void load();window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility)})
onUnmounted(()=>{mounted=false;window.clearTimeout(inventoryTimer);window.clearTimeout(trafficTimer);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility)})
</script>
<style scoped>
.home-device-summary{margin-top:20px}.summary-more{font-size:14px;color:#3b82f6;text-decoration:none}.summary-count{font-size:13px;color:var(--flow-span-color);margin:0 0 14px}.summary-devices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.summary-device{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border-color);border-radius:7px;text-decoration:none;color:var(--tit-color);min-width:0}.summary-device:hover{background:rgba(59,130,246,.04);border-color:#93b5e9}.summary-identity{flex:1;min-width:0}.summary-identity strong,.summary-identity small{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.summary-identity strong{font-size:14px}.summary-identity small{font-size:12px;opacity:.7;margin-top:3px}.summary-presence{font-size:12px;color:#00a63e;flex:none}.summary-presence.offline{color:#8b9098}.summary-rate{display:block;font-size:12px;color:#3b82f6;margin-top:5px}.summary-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;color:var(--flow-span-color)}.summary-footer small{font-size:12px}.summary-footer button{font-size:12px;flex:none;border:1px solid var(--btn-border-color);border-radius:4px;padding:5px 10px;background:var(--card-bg-color);color:var(--tit-color)}.summary-note{font-size:12px;color:var(--flow-span-color);margin:12px 0 0;border-top:1px solid var(--border-color);padding-top:10px}.summary-notice{background:#fff7e6;color:#9c6420;padding:10px;border-radius:5px;font-size:12px}
@media(max-width:1200px){.summary-devices{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.summary-devices{grid-template-columns:1fr}.home-device-summary{margin-top:12px}.summary-device{padding:10px;gap:8px}.summary-presence{max-width:84px;white-space:normal;text-align:right}}
</style>
