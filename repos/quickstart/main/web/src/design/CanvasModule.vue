<template>
  <article class="canvas-module" :class="['module-'+item.id,{'is-wide':item.span>=8,'is-device-summary':summary&&item.id==='devices'}]" :data-device-form="item.id==='devices'?(summary?'summary':'standard'):undefined" :data-canvas-module="item.id" :style="'--span:'+item.span">
    <header><div><StudioGlyph :name="definition.glyph"/><h2>{{t(definition.zh,definition.en)}}</h2></div><div v-if="item.id==='devices'" class="device-header-actions widget-action-group"><WidgetPrimaryAction icon="devices" @click="navigate('/devicemanagement')" data-canvas-view-all :data-home-entry="contextualActions?'/devicemanagement':undefined">{{t('查看全部','View all')}}</WidgetPrimaryAction><WidgetMenu v-if="contextualActions" :label="t('设备更多操作','More device actions')" :items="[{id:'parental',label:t('家长控制','Parental controls')}]" @select="navigate('/parental')"/></div><button v-else class="module-more" @click="navigate(destinations[item.id])" :aria-label="t('管理','Manage')+t(definition.zh,definition.en)"><StudioGlyph name="arrow"/></button></header>

    <template v-if="item.id==='devices'">
      <div class="inventory-heading"><strong>{{loading||!devices.length&&errors.inventory?'—':devices.filter(d=>d.online).length}}<span>{{errors.inventory&&devices.length?t('上次在线','previously online'):t('在线','online')}}</span></strong><small>{{loading||!devices.length&&errors.inventory?t('数量待确认','Count unconfirmed'):`${devices.length} ${t('台 · 本次开机发现','discovered this boot')}`}}</small><button @click="$emit('retry')" :aria-label="t('刷新设备','Refresh devices')" data-refresh-inventory>↻</button></div>
      <div v-if="loading" class="module-state"><div class="skeleton" v-for="n in (summary?1:3)" :key="n"></div><span>{{t('正在读取设备清单','Loading devices')}}</span></div>
      <div v-else-if="errors.inventory&&!devices.length" class="module-state"><StudioGlyph v-if="!summary" name="devices"/><strong>{{inventoryError}}</strong><p v-if="!summary">{{t('其他首页模块仍可使用。','Other modules remain available.')}}</p><button @click="$emit('retry')">{{t('重试','Retry')}}</button></div>
      <div v-else-if="!devices.length" class="module-state"><StudioGlyph v-if="!summary" name="devices"/><strong>{{t('暂未发现设备','No devices discovered')}}</strong><p v-if="!summary">{{t('本局域网设备上线后会自动出现。','Devices appear when observed on this LAN.')}}</p><button v-if="!summary" @click="navigate('/devicemanagement')">{{t('添加或查看设备','Add or view devices')}}</button></div>
      <template v-else><p v-if="errors.inventory" class="module-notice">{{t('上次快照 · 当前状态待确认','Previous snapshot · Current state unconfirmed')}}</p><div v-if="!summary" class="canvas-devices"><button v-for="device in shownDevices" :key="device.deviceId" @click="$emit('device',device.deviceId)" :data-canvas-device="device.deviceId"><DeviceSceneIcon :scene="device.scene" :icon-key="device.iconKey" :label="deviceCategoryLabel(device.scene,translate)"/><span><strong>{{deviceDisplayName(device,translate)}}</strong><small>{{[device.brand,device.classification.source==='fallback'?t('类型待确认','Type unconfirmed'):deviceCategoryLabel(device.scene,translate)].filter(Boolean).join(' · ')}}</small></span><span class="device-online" :class="{offline:!device.online}"><i></i>{{errors.inventory?t('上次记录','Last recorded'):devicePresenceLabel(device,translate)}}</span></button></div></template>
      <p v-if="capabilityMissing" class="module-notice">{{capabilityText}} {{t('设备清单仍可使用。','Inventory remains available.')}}</p><footer class="inventory-footer"><small>{{t('仅显示本机观察到的设备','Only devices observed by this router')}}</small><details><summary>{{t('地址与路线权限','Address & path permissions')}}</summary><p>{{authorityText}}</p></details></footer>
    </template>

    <template v-else-if="item.id==='system'">
      <div v-if="errors.system" class="module-state"><strong>{{t('系统信息暂不可用','System information unavailable')}}</strong><button @click="$emit('retry')">{{t('重试','Retry')}}</button></div><template v-else><div class="resource-meters"><div><span>CPU</span><strong>{{data.system?.cpuUsage??'—'}}<small>%</small></strong><div class="meter"><i :style="{width:(data.system?.cpuUsage||0)+'%'}"></i></div></div><div><span>{{t('内存','Memory')}}</span><strong>{{data.system?100-data.system.memAvailablePercentage:'—'}}<small>%</small></strong><div class="meter memory"><i :style="{width:(data.system?100-data.system.memAvailablePercentage:0)+'%'}"></i></div></div></div><div class="system-line"><span>{{t('温度','Temperature')}}</span><strong>{{data.system?.cpuTemperature?data.system.cpuTemperature+' °C':t('暂无数据','Unavailable')}}</strong></div><div class="system-line"><span>{{t('已运行','Uptime')}}</span><strong>{{uptime}}</strong></div><div class="firmware-line"><i></i><span>{{data.version?.firmwareVersion?.split(' ').slice(0,2).join(' ')||'iStoreOS'}}</span><details><summary>{{t('详情','Details')}}</summary><p>{{data.version?.model||'—'}}</p><p>Kernel {{data.version?.kernelVersion||'—'}}</p><p>{{data.system?.localtime||'—'}}</p></details></div></template>
    </template>

    <template v-else-if="item.id==='storage'">
      <div v-if="errors.disks" class="module-state"><strong>{{t('磁盘信息暂不可用','Disk information unavailable')}}</strong><button @click="$emit('retry')">{{t('重试','Retry')}}</button></div><template v-else><div class="storage-summary"><span><strong>{{data.disks?.disks?.length??'—'}}</strong>{{t('块磁盘','disks')}}</span><small v-if="data.disks?.disks?.some((d:any)=>d.usage>=85)">{{t('有磁盘接近满载','A disk is nearly full')}}</small></div><div class="disk-grid"><div v-for="disk in shownDisks" :data-preview-disk="disk.name" :key="disk.name"><div><span class="disk-mark"><StudioGlyph name="disk"/></span><span><strong>{{disk.isSystemRoot?t('系统磁盘','System disk'):disk.name.toUpperCase()}}</strong><small>{{disk.used}} / {{disk.total}}</small></span><span>{{disk.usage}}%</span></div><div class="meter" :class="{warning:disk.usage>=85}"><i :style="{width:disk.usage+'%'}"></i></div></div></div><small v-if="diskLimit&&data.disks?.disks?.length>diskLimit" class="disk-overflow-note">{{t('仅展示前','Showing ')}}{{diskLimit}}{{t(' 块，完整清单请查看磁盘管理。',' disks. Open disk management for the full list.')}}</small><button class="module-bottom-link" @click="navigate('/nas')"><StudioGlyph name="folder"/>{{t('文件与磁盘管理','Files & disks')}}<StudioGlyph name="arrow"/></button></template>
    </template>

    <template v-else-if="item.id==='sharing'">
      <div v-if="errors.sharing" class="module-state"><strong>{{t('存储服务信息暂不可用','Storage service status unavailable')}}</strong><button @click="$emit('retry')">{{t('重试','Retry')}}</button></div><template v-else><div class="sharing-list"><button v-for="service in sharing" :key="service.name" @click="navigate('/storage')"><span class="service-symbol"><StudioGlyph :name="service.icon"/></span><span>{{service.name}}<small>{{service.subtitle}}</small></span><span class="service-state" :class="{running:service.enabled}"><i></i>{{service.enabled?t('已启用','Enabled'):t('未启用','Disabled')}}</span></button></div><div class="sharing-path" v-if="data.sharing?.sambas?.length"><small>{{t('当前共享目录','Shared folder')}}</small><strong>{{data.sharing.sambas[0].path}}</strong></div></template>
    </template>

    <template v-else-if="item.id==='docker'">
      <div class="app-overview"><span class="app-symbol"><StudioGlyph name="layers"/></span><div><strong>Docker</strong><span class="service-state" :class="{running:data.docker?.status==='running'&&!errors.docker}"><i></i>{{errors.docker?t('状态不可用','Status unavailable'):data.docker?.status==='running'?t('运行中','Running'):t('未运行','Stopped')}}</span></div></div><div class="app-detail"><small>{{t('容器数据目录','Container data directory')}}</small><strong>{{data.docker?.path||'—'}}</strong></div><button class="module-bottom-link" @click="navigate('/docker')">{{t('管理容器与迁移','Manage & migrate')}}<StudioGlyph name="arrow"/></button>
    </template>

    <template v-else-if="item.id==='downloads'">
      <div class="download-list"><button v-for="service in downloadServices" :key="service.key" @click="navigate('/download')"><StudioGlyph name="download"/><span>{{service.name}}</span><span class="service-state" :class="{running:service.running}">{{errors.download?t('不可用','Unavailable'):service.running?t('运行中','Running'):t('未启用','Disabled')}}</span></button></div><button class="module-bottom-link" @click="navigate('/download')">{{t('下载管理','Manage downloads')}}<StudioGlyph name="arrow"/></button>
    </template>

    <template v-else-if="item.id==='remote'">
      <div class="app-overview"><span class="app-symbol"><StudioGlyph name="globe"/></span><div><strong>DDNSTO</strong><span class="service-state" :class="{running:Boolean(data.remote?.ddnstoDomain)&&!errors.remote}"><i></i>{{errors.remote?t('状态不可用','Status unavailable'):data.remote?.ddnstoDomain?t('已配置','Configured'):t('未配置','Not configured')}}</span></div></div><div class="remote-domain">{{data.remote?.ddnstoDomain?.replace(/^https?:\/\//,'')||'—'}}</div><div class="remote-protocols"><span v-for="key in ['ipv4Domain','ipv6Domain']" :key="key">{{key==='ipv4Domain'?'IPv4':'IPv6'}} <small>{{errors.remote?t('不可用','Unavailable'):data.remote?.[key]&&data.remote[key]!=='Stopped'?t('已配置','Configured'):t('未启用','Disabled')}}</small></span></div><button class="module-bottom-link" @click="navigate('/ddns')">{{t('配置远程访问','Configure remote access')}}<StudioGlyph name="arrow"/></button>
    </template>
  </article>
</template>
<script setup lang="ts">
import WidgetPrimaryAction from './WidgetPrimaryAction.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import StudioGlyph from './StudioGlyph.vue'
import WidgetMenu from './WidgetMenu.vue'
import DeviceSceneIcon from '../pages/device/components/deviceSceneIcon.vue'
import { deviceCategoryLabel, deviceDisplayName, devicePresenceLabel } from '../pages/device/devicePresentation'
import type { DeviceListItem } from '../pages/device/deviceInventory'
import { canvasModules, type CanvasLayoutItem } from './canvasLayout'
import { demo } from './fixtures'
const props=defineProps<{item:CanvasLayoutItem;data:Record<string,any>;errors:Record<string,string>;devices:DeviceListItem[];contextualActions?:boolean;summaryLimit?:number;diskLimit?:number;summary?:boolean}>()
const emit=defineEmits<{(e:'navigate',path:string):void;(e:'device',id:string):void;(e:'retry'):void}>()
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh
const translate=(text:string)=>english?({'手机':'Phone','电脑':'Computer','平板':'Tablet','电视与影音':'TV & media','网络设备':'Network','智能家居':'Smart home','摄像头':'Camera','游戏设备':'Gaming','存储与服务器':'Storage & server','打印机':'Printer','穿戴设备':'Wearable','未知设备':'Unknown device','未命名设备':'Unnamed device','在线':'Online','离线':'Offline','尚未上线':'Not yet seen','设备':'Device'}[text]||text):text
const definition=computed(()=>canvasModules.find(m=>m.id===props.item.id)!)
const mobile=ref(innerWidth<=760),resize=()=>mobile.value=innerWidth<=760
onMounted(()=>window.addEventListener('resize',resize));onUnmounted(()=>window.removeEventListener('resize',resize))
const shownDevices=computed(()=>props.devices.slice(0,props.summaryLimit??(mobile.value?3:6)))
const shownDisks=computed(()=>props.data.disks?.disks?.slice(0,props.diskLimit)||[])
const loading=computed(()=>demo.scenario==='loading'&&!demo.recovered||!props.data.inventory&&!props.errors.inventory)
const inventoryError=computed(()=>demo.scenario==='old'?t('后端版本不兼容','Incompatible backend version'):demo.scenario==='permission'?t('登录或读取权限失效','Session or access expired'):t('设备清单暂不可用','Device inventory unavailable'))
const capabilityMissing=computed(()=>['no-speed','disabled','speed-error','unsupported'].includes(demo.scenario))
const capabilityText=computed(()=>({'no-speed':t('设备流量服务未安装。','Device traffic service missing.'),disabled:t('设备流量服务未启用。','Device traffic service disabled.'),'speed-error':t('设备流量服务异常。','Device traffic service unavailable.'),unsupported:t('固件不支持设备流量服务。','Device traffic unsupported.')}[demo.scenario]||''))
const authorityText=computed(()=>demo.authority==='local'?t('本机负责此局域网地址分配，可在设备详情设置固定地址与上网路线。','This router allocates LAN addresses. Configure reservations and internet paths in device details.'):demo.authority==='external'?t('本机不负责此局域网地址分配；固定地址与上网路线请到分配地址的主路由设置。','This router does not allocate LAN addresses. Set reservations and paths on the allocating router.'):t('地址分配方尚不明确；固定地址与上网路线暂为只读。','Address allocator unconfirmed. Reservations and paths are read-only.'))
const uptime=computed(()=>props.data.system?`${Math.floor(props.data.system.uptime/86400)}${t('天','d')} ${Math.floor(props.data.system.uptime%86400/3600)}${t('小时','h')}`:'—')
const sharing=computed(()=>[
  {name:'SAMBA',icon:'folder',subtitle:t('局域网文件共享','LAN file sharing'),enabled:Boolean(props.data.sharing?.sambas?.length)},
  {name:t('易有云','LinkEase'),icon:'globe',subtitle:t('随时访问你的文件','Access your files anywhere'),enabled:Boolean(props.data.sharing?.linkease?.enabel)},
  {name:'WebDAV',icon:'network',subtitle:t('标准文件访问协议','Standard file access'),enabled:Boolean(props.data.sharing?.webdav?.enable)},
])
const downloadServices=computed(()=>[{key:'aria2',name:'Aria2'},{key:'qbittorrent',name:'qBittorrent'},{key:'transmission',name:'Transmission'}].map(service=>({...service,running:props.data.download?.[service.key]?.status==='running'&&!props.errors.download})))
const destinations:Record<string,string>={system:'/system',storage:'/nas',sharing:'/storage',docker:'/docker',downloads:'/download',remote:'/ddns'}
const navigate=(path:string)=>emit('navigate',path)
</script>
<style src="./canvasModules.css" scoped></style>
