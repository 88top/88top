<template>
  <main class="studio-home" :class="['variant-'+variant,{'is-editing':editing}]" data-studio-home>
    <header class="studio-header">
      <router-link to="/" class="studio-brand"><span class="brand-mark">Q<span></span></span><span>Quickstart<small>iStoreOS</small></span></router-link>
      <nav class="studio-nav" aria-label="首页导航"><a class="selected" href="#" @click.prevent>{{t('概览','Overview')}}</a><router-link :to="target('/devicemanagement')">{{t('设备','Devices')}}</router-link><button @click="go('/applications')">{{t('应用','Apps')}}</button></nav>
      <div class="header-actions"><span class="prototype-label">{{t('设计原型 · 示例数据','Prototype · Sample data')}}</span><details class="scene-controls"><summary>{{t('预览设置','Preview')}}</summary><div class="scene-popover">
        <label>{{t('场景','Scenario')}}<select aria-label="场景" :value="demo.scenario" @change="queryChange('scenario',$event)"><option v-for="s in scenarios" :value="s[0]" :key="s[0]">{{t(s[1],s[2])}}</option></select></label>
        <label>{{t('地址分配','Address allocator')}}<select aria-label="地址分配" :value="demo.authority" @change="queryChange('authority',$event)"><option value="external">{{t('外部分配','External')}}</option><option value="local">{{t('本机分配','This router')}}</option><option value="unknown">{{t('尚不明确','Unconfirmed')}}</option></select></label>
        <button @click="toggleTheme">{{t('切换深浅主题','Toggle theme')}}</button><button @click="toggleLanguage">中文 / English</button>
      </div></details></div>
    </header>

    <section class="studio-intro">
      <div><div class="eyebrow">{{t('你的数字空间','YOUR CONNECTED SPACE')}}</div><h1>{{t('家庭控制中心','Home control center')}}</h1><p>{{t('连接、设备与服务，一眼尽览。','Your connections, devices and services at a glance.')}}</p></div>
      <div class="intro-actions"><span class="connection-pill" :class="{'not-ready':!data.network?.internetConnected}"><i></i>{{data.network?.internetConnected?t('网络已连接','Internet connected'):errors.network?t('连接状态未知','Connection unconfirmed'):t('正在读取连接','Reading connection')}}</span><button class="customize-button" @click="openEditor"><StudioGlyph name="tune"/>{{t('自定义首页','Customize')}}</button></div>
    </section>

    <div v-if="editing" class="editing-note" role="status">{{t('正在预览布局草稿，应用后本次预览生效。','Previewing a layout draft. Apply to use it in this preview.')}}</div>
    <section class="studio-grid" aria-label="首页模块" :data-variant="variant">
      <article v-for="module in shownModules" :key="module.id" :data-module="module.id" class="studio-panel" :class="['panel-'+module.id,{'panel-wide':module.span>=7}]" :style="'--module-span:'+module.span">
        <div class="panel-heading"><div><span class="panel-icon"><StudioGlyph :name="catalog(module.id).glyph"/></span><h2>{{t(catalog(module.id).title,catalog(module.id).en)}}</h2></div><button v-if="module.id==='devices'" @click="go('/devicemanagement')" class="text-link" data-view-all>{{t('查看全部','View all')}}<StudioGlyph name="arrow"/></button><button v-else-if="module.id==='traffic'" @click="go('/networkSpeedTest')" class="text-link">{{t('测速','Speed test')}}<StudioGlyph name="arrow"/></button><button v-else-if="module.id==='shortcuts'" @click="advanced=!advanced" class="text-link">{{advanced?t('收起高级工具','Hide advanced'):t('高级工具','Advanced tools')}}<StudioGlyph name="arrow"/></button><button v-else @click="go(moduleDestinations[module.id])" class="icon-button" :aria-label="t('查看详情','View details')"><StudioGlyph name="arrow"/></button></div>

        <template v-if="module.id==='traffic'">
          <div v-if="errors.traffic" class="studio-state" role="status"><strong>{{t('流量暂不可用','Traffic unavailable')}}</strong><p>{{t('设备与其他模块仍可使用。','Devices and other modules remain available.')}}</p><button @click="retry">{{t('重试','Retry')}}</button></div>
          <template v-else><div class="traffic-metrics"><div><small><i class="down-dot"></i>{{t('下载','Download')}}</small><strong>{{speed(latestTraffic?.downloadSpeed)}}<span>{{speedUnit(latestTraffic?.downloadSpeed)}}</span></strong></div><div><small><i class="up-dot"></i>{{t('上传','Upload')}}</small><strong>{{speed(latestTraffic?.uploadSpeed)}}<span>{{speedUnit(latestTraffic?.uploadSpeed)}}</span></strong></div><span class="live-label">{{t('最近 60 秒','Last 60 seconds')}}</span></div>
          <div class="traffic-chart" role="img" :aria-label="t('最近一分钟的上传下载速率趋势','Upload and download rates in the last minute')"><div class="chart-scale"><span>{{chartMaxLabel}}</span><span>{{chartHalfLabel}}</span><span>0</span></div><svg viewBox="0 0 600 160" preserveAspectRatio="none"><defs><linearGradient id="studio-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="currentColor" stop-opacity=".2"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path class="chart-grid" d="M0 15H600 M0 80H600 M0 145H600"/><path :d="areaPath" fill="url(#studio-fill)"/><path class="download-line" :d="chartPath('downloadSpeed')"/><path class="upload-line" :d="chartPath('uploadSpeed')"/></svg></div><div class="chart-times"><span>−60s</span><span>−30s</span><span>{{t('现在','Now')}}</span></div>
          <div class="traffic-bottom"><div><small>{{t('连接地址','Connection address')}}</small><strong>{{data.network?.ipv4addr || '—'}}</strong></div><div><small>{{t('上级网关','Upstream gateway')}}</small><strong>{{data.network?.gateway || '—'}}</strong></div><button class="text-link" @click="go('/network')">{{t('网络设置','Network settings')}}<StudioGlyph name="arrow"/></button></div>
          <div class="port-strip"><span v-for="port in data.ports?.ports || []" :key="port.name" :class="{up:port.linkState==='UP'}"><i></i>{{port.name}}<small>{{port.linkState==='UP'?t('已连接','Connected'):t('未连接','Disconnected')}}</small></span></div></template>
        </template>

        <template v-else-if="module.id==='devices'">
          <div class="device-counts" data-studio-count><strong>{{inventoryLoading?'—':errors.inventory&&!devices.length?'—':onlineCount}}<small>{{t('在线','Online')}}</small></strong><span>{{inventoryLoading||errors.inventory&&!devices.length?t('数量待确认','Count unconfirmed'):`${devices.length} ${t('台 · 本次开机发现','devices discovered this boot')}`}}</span><button class="icon-button" :aria-label="t('刷新设备','Refresh devices')" @click="retry">↻</button></div>
          <div v-if="inventoryLoading" class="studio-state loading-state"><div v-for="n in 3" :key="n" class="device-skeleton"></div><p>{{t('正在读取设备清单…','Reading devices…')}}</p></div>
          <div v-else-if="errors.inventory && !devices.length" class="studio-state" role="status"><span class="state-symbol">!</span><strong>{{inventoryError}}</strong><p>{{t('首页其他模块仍可使用。','Other home modules remain available.')}}</p><button @click="retry">{{t('重试','Retry')}}</button></div>
          <div v-else-if="!devices.length" class="studio-state"><StudioGlyph name="devices"/><strong>{{t('还没有发现设备','No devices discovered yet')}}</strong><p>{{t('本局域网设备上线后会出现在这里。','Devices appear when observed on this LAN.')}}</p><button @click="go('/devicemanagement')">{{t('添加或查看设备','Add or view devices')}}</button></div>
          <template v-else><p v-if="errors.inventory" class="snapshot-notice" role="status">{{t('显示上次快照 · 当前状态待确认','Previous snapshot · Current state unconfirmed')}}</p><div class="studio-devices" :class="{'device-tiles':variant==='device'&&module.span>=7}"><router-link v-for="device in shownDevices" :key="device.deviceId" :to="target('/devicemanagement',device.deviceId)" class="studio-device" :data-studio-device="device.deviceId"><DeviceSceneIcon :scene="device.scene" :icon-key="device.iconKey" :label="deviceCategoryLabel(device.scene,translate)"/><div class="device-identity"><strong>{{deviceDisplayName(device,translate)}}</strong><small>{{deviceMeta(device)}}</small><span v-if="variant==='device'&&module.span>=7" class="device-address">{{device.addresses.current[0]?.address || t('暂无当前地址','No current address')}}</span></div><span class="presence" :class="{offline:!device.online}"><i></i>{{errors.inventory?t('上次记录','Last recorded'):devicePresenceLabel(device,translate)}}</span><StudioGlyph class="row-arrow" name="arrow"/></router-link></div></template>
          <p v-if="capabilityMissing" class="capability-note">{{capabilityText}} {{t('设备清单仍可查看。','Device inventory remains available.')}}</p>
          <div class="device-footnote"><span>{{t('本机观察范围 · 点击设备查看详情','Observed by this router · Select a device for details')}}</span><details><summary>{{t('地址与路线权限','Address & path permissions')}}</summary><p>{{authorityText}}</p></details></div>
        </template>

        <template v-else-if="module.id==='connection'">
          <div class="connection-overview"><StudioGlyph name="network"/><div><strong>{{data.network?.internetConnected?t('连接正常','Connected'):t('连接状态待确认','Connection unconfirmed')}}</strong><span>{{data.network?.proto==='static'?t('静态网络','Static network'):data.network?.proto||'—'}} · {{data.network?.defaultInterface||'—'}}</span></div></div><div class="connection-details"><div><small>IPv4</small><strong>{{data.network?.ipv4addr||'—'}}</strong></div><div><small>{{t('网关','Gateway')}}</small><strong>{{data.network?.gateway||'—'}}</strong></div><div><small>DNS</small><strong>{{data.network?.dnsList?.join(' · ')||'—'}}</strong></div></div><div class="connection-ports"><div v-for="port in data.ports?.ports||[]" :key="port.name"><span><i :class="{up:port.linkState==='UP'}"></i>{{port.name}} <small>{{port.interfaceNames.join(' / ')}}</small></span><strong>{{port.linkState==='UP'?t('已连接','Connected'):t('未连接','Disconnected')}}</strong></div></div><p class="muted-note">{{authorityText}}</p>
        </template>

        <template v-else-if="module.id==='storage'">
          <div v-if="errors.disks" class="studio-state"><strong>{{t('存储信息暂不可用','Storage unavailable')}}</strong><button @click="retry">{{t('重试','Retry')}}</button></div><template v-else><div class="storage-headline"><strong>{{dataDisks.length}}<span>{{t('块数据磁盘','data disks')}}</span></strong><span class="storage-warning" v-if="dataDisks.some((d:any)=>d.usage>=85)">{{t('有磁盘接近满载','A disk is nearly full')}}</span></div><div class="disk-list"><div v-for="disk in displayedDisks" :key="disk.name" class="disk-row"><div><span>{{disk.isSystemRoot?t('系统磁盘','System disk'):disk.name.toUpperCase()}}</span><small>{{disk.used}} / {{disk.total}}</small></div><div class="disk-track"><span :style="{width:disk.usage+'%'}" :class="{warning:disk.usage>=85}"></span></div><small class="disk-percentage">{{disk.usage}}%</small></div></div><button class="panel-footer-link" @click="go('/nas')"><StudioGlyph name="folder"/>{{t('打开文件与磁盘管理','Open files & disks')}}<StudioGlyph name="arrow"/></button></template>
        </template>

        <template v-else-if="module.id==='services'">
          <div class="service-list"><button v-for="service in services" :key="service.name" class="service-row" @click="go(service.path)"><span class="service-icon"><StudioGlyph :name="service.icon"/></span><span>{{service.name}}<small>{{service.detail}}</small></span><span class="service-status" :class="{running:service.running}"><i></i>{{service.state}}</span><StudioGlyph name="arrow" class="row-arrow"/></button></div><details class="additional-services"><summary>{{t('下载与其他共享服务','Downloads & other sharing services')}}</summary><div v-for="service in additionalServices" :key="service.name"><span>{{service.name}}</span><strong>{{service.state}}</strong></div><button @click="go('/download')" class="text-link">{{t('下载管理','Manage downloads')}} →</button></details>
        </template>

        <template v-else-if="module.id==='system'">
          <div v-if="errors.system" class="studio-state"><strong>{{t('系统状态暂不可用','System status unavailable')}}</strong><button @click="retry">{{t('重试','Retry')}}</button></div><template v-else><div class="system-overview"><span class="system-icon"><StudioGlyph name="chip"/></span><div><strong>iStoreOS</strong><small>{{data.version?.firmwareVersion?.replace('iStoreOS ','').split(' ')[0] || '—'}} · {{t('运行中','Running')}}</small></div><span class="uptime">{{uptime}}</span></div><div class="resource-row"><div><span>CPU</span><strong>{{data.system?.cpuUsage ?? '—'}}<small>%</small></strong></div><div class="resource-track"><span :style="{width:(data.system?.cpuUsage||0)+'%'}"></span></div></div><div class="resource-row"><div><span>{{t('内存','Memory')}}</span><strong>{{data.system?100-data.system.memAvailablePercentage:'—'}}<small>%</small></strong></div><div class="resource-track memory"><span :style="{width:(data.system?100-data.system.memAvailablePercentage:0)+'%'}"></span></div></div><div class="system-meta"><div><span>{{t('内核','Kernel')}}</span><strong>{{data.version?.kernelVersion||'—'}}</strong></div><div><span>{{t('温度','Temperature')}}</span><strong>{{data.system?.cpuTemperature?data.system.cpuTemperature+' °C':t('不可用','Unavailable')}}</strong></div></div><details class="system-details"><summary>{{t('硬件与系统详情','Hardware & system details')}}</summary><p>{{data.version?.model||'—'}}</p><p>{{data.system?.localtime||'—'}}</p></details></template>
        </template>

        <template v-else-if="module.id==='shortcuts'">
          <div class="shortcut-grid"><button v-for="item in shortcuts" :key="item.title" @click="go(item.path)"><StudioGlyph :name="item.icon"/><span>{{t(item.title,item.en)}}</span><StudioGlyph name="arrow"/></button></div><div v-if="advanced" class="advanced-grid"><button v-for="item in advancedLinks" :key="item.title" @click="go(item.path)">{{t(item.title,item.en)}}<span>↗</span></button></div>
        </template>
      </article>
    </section>
    <footer class="studio-footer"><span>Quickstart <span class="footer-separator">/</span> {{t('属于你的首页','Make it yours')}}</span><span>{{t('示例数据，不代表测试设备状态','Sample data, not current device verification')}}</span></footer>

    <aside v-if="editing" class="layout-editor" role="dialog" :aria-modal="mobile" :aria-label="t('首页布局编辑器','Home layout editor')" @keydown.esc="cancelEdit">
      <div class="editor-header"><div><small>MAKE IT YOURS</small><h2>{{t('设计你的首页','Make it your home')}}</h2></div><button @click="cancelEdit" class="editor-close" :aria-label="t('关闭布局编辑器','Close layout editor')">×</button></div><p class="editor-description">{{t('留下关心的内容，排成喜欢的样子。','Choose what matters. Arrange it your way.')}}</p>
      <div class="editor-scroll"><h3>{{t('01 · 选择起点','01 · Choose a starting point')}}</h3><div class="preset-picker"><button v-for="v in variants" :key="v.id" :class="{selected:variant===v.id}" @click="selectVariant(v.id,true)"><span class="preset-miniature" :class="'mini-'+v.id"><i v-for="n in 4" :key="n"></i></span><strong>{{t(v.zh,v.en)}}</strong></button></div><h3>{{t('02 · 内容与顺序','02 · Content & order')}}</h3><p class="editor-help">{{t('拖动排序，也可使用上下按钮。手机自动单列。','Drag to reorder, or use arrows. Mobile uses one column.')}}</p><div class="editor-modules"><div v-for="(item,index) in draft" :key="item.id" class="editor-module" :class="{disabled:!item.enabled}" :data-editor-module="item.id" @dragover.prevent @drop.prevent="dropAt(index)"><div class="editor-module-top"><span class="drag-handle" draggable="true" @dragstart="dragged=index" @dragend="dragged=-1" :title="t('拖动排序','Drag to reorder')">⠿</span><StudioGlyph :name="catalog(item.id).glyph"/><label :for="'module-'+item.id">{{t(catalog(item.id).title,catalog(item.id).en)}}</label><button class="move-button" :disabled="index===0" :aria-label="t('上移','Move up')+t(catalog(item.id).title,catalog(item.id).en)" @click="move(index,-1)">↑</button><button class="move-button" :disabled="index===draft.length-1" :aria-label="t('下移','Move down')+t(catalog(item.id).title,catalog(item.id).en)" @click="move(index,1)">↓</button><input :id="'module-'+item.id" type="checkbox" :checked="item.enabled" :disabled="item.enabled&&draft.filter(m=>m.enabled).length===1" @change="item.enabled=!item.enabled"/></div><div class="module-size"><small>{{english?catalog(item.id).en:catalog(item.id).description}}</small><select :disabled="!item.enabled" :aria-label="t(catalog(item.id).title,catalog(item.id).en)+t('宽度',' width')" v-model.number="item.span"><option :value="4">{{t('紧凑 · ⅓','Compact · ⅓')}}</option><option :value="6">{{t('标准 · ½','Standard · ½')}}</option><option :value="8">{{t('宽幅 · ⅔','Wide · ⅔')}}</option><option :value="12">{{t('整行','Full row')}}</option><option v-if="item.span===7||item.span===5" :value="item.span">{{t('预设比例','Preset ratio')}}</option></select></div></div></div><button class="reset-layout" @click="draft=makePreset(variant)">{{t('恢复当前预设','Reset this preset')}}</button><p class="editor-help">{{t('此原型仅保存本次页面内的选择，刷新恢复预设。','Prototype changes live in this page only. Reload restores the preset.')}}</p></div><div class="editor-actions"><button @click="cancelEdit">{{t('取消','Cancel')}}</button><button @click="applyEdit" class="apply-layout">{{t('应用布局','Apply layout')}}</button></div>
    </aside>
    <div v-if="route.query.tools!=='0'" class="variant-switcher" aria-label="设计方案"><button @click="cycle(-1)" aria-label="上一个方案">‹</button><button v-for="(v,i) in variants" :key="v.id" :class="{selected:variant===v.id}" @click="selectVariant(v.id)">{{String.fromCharCode(65+i)}}<span>{{t(v.zh,v.en)}}</span></button><button @click="cycle(1)" aria-label="下一个方案">›</button></div>
  </main>
</template>
<script setup lang="ts">
// Three homepage structures, under the isolated Vue entry, using shared identities.
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudioGlyph from './StudioGlyph.vue'
import DeviceSceneIcon from '../pages/device/components/deviceSceneIcon.vue'
import { deviceDisplayName, devicePresenceLabel, deviceCategoryLabel } from '../pages/device/devicePresentation'
import type { DeviceListItem } from '../pages/device/deviceInventory'
import { demo } from './fixtures'
import { byteToSize } from '../utils/utils'
import { moduleCatalog, makePreset, sessionLayouts, useStudioModel, type ModuleKey, type LayoutItem, type Variant } from './studioModel'
const route=useRoute(),router=useRouter(),english=window.vue_lang==='en'
const t=(zh:string,en:string)=>english?en:zh
const translate=(text:string)=>english?({'手机':'Phone','电脑':'Computer','平板':'Tablet','电视与影音':'TV & media','网络设备':'Network','智能家居':'Smart home','摄像头':'Camera','游戏设备':'Gaming','存储与服务器':'Storage & server','打印机':'Printer','穿戴设备':'Wearable','未知设备':'Unknown device','未命名设备':'Unnamed device','在线':'Online','离线':'Offline','尚未上线':'Not yet seen','设备':'Device'}[text]||text):text
const variants:Array<{id:Variant;zh:string;en:string}>=[{id:'studio',zh:'均衡概览',en:'Overview'},{id:'network',zh:'网络监控',en:'Network'},{id:'device',zh:'设备优先',en:'Devices'}]
const variant=ref<Variant>(variants.some(v=>v.id===route.query.variant)?route.query.variant as Variant:route.query.layout==='network'||route.query.layout==='device'?route.query.layout as Variant:'studio')
const saved=ref<LayoutItem[]>(sessionLayouts.get(variant.value)||makePreset(variant.value)),draft=ref<LayoutItem[]>([]),editing=ref(false),advanced=ref(false),mobile=ref(innerWidth<=700)
let dragged=-1,previousVariant=variant.value,opener:HTMLElement|null=null
const layout=computed(()=>editing.value?draft.value:saved.value),shownModules=computed(()=>layout.value.filter(m=>m.enabled))
const {data,errors,devices,retry}=useStudioModel(layout)
const catalog=(id:ModuleKey)=>moduleCatalog.find(m=>m.id===id)!
const inventoryLoading=computed(()=>demo.scenario==='loading'&&!demo.recovered||!data.inventory&&!errors.inventory)
const onlineCount=computed(()=>devices.value.filter(d=>d.online).length)
const shownDevices=computed(()=>devices.value.slice(0,mobile.value?3:6))
const inventoryError=computed(()=>demo.scenario==='old'?t('后端版本不兼容','Incompatible backend version'):demo.scenario==='permission'?t('登录或读取权限失效','Session or read access expired'):t('设备清单暂不可用','Device list unavailable'))
const deviceMeta=(device:DeviceListItem)=>[device.brand,device.classification.source==='fallback'?t('类型待确认','Type unconfirmed'):deviceCategoryLabel(device.scene,translate)].filter(Boolean).join(' · ')
const capabilityMissing=computed(()=>['no-speed','disabled','speed-error','unsupported'].includes(demo.scenario))
const capabilityText=computed(()=>({'no-speed':t('设备流量服务未安装。','Device traffic service not installed.'),disabled:t('设备流量服务未启用。','Device traffic service disabled.'),'speed-error':t('设备流量服务异常。','Device traffic service unavailable.'),unsupported:t('固件不支持设备流量服务。','Device traffic unsupported on this firmware.')}[demo.scenario]||''))
const authorityText=computed(()=>demo.authority==='local'?t('本机负责此局域网地址分配，可在设备详情设置固定地址与上网路线。','This router allocates addresses on this LAN. Set reservations and internet paths in device details.'):demo.authority==='external'?t('本机不负责此局域网地址分配；固定地址与上网路线，请到分配地址的主路由设置。','This router does not allocate addresses on this LAN. Set reservations and internet paths on the allocating router.'):t('地址分配方尚不明确；固定地址与上网路线暂为只读。','The address allocator is unconfirmed. Reservations and internet paths are read-only.'))
const target=(path:string,device?:string)=>({path,query:{...route.query,layout:'studio',variant:variant.value,filter:path==='/devicemanagement'?'all':undefined,device}})
const go=(path:string)=>void router.push(target(path))
const moduleDestinations:Record<string,string>={connection:'/network',storage:'/nas',services:'/applications',system:'/system',shortcuts:'/settings'}
const queryChange=(key:string,event:Event)=>{demo.recovered=false;void router.replace({query:{...route.query,layout:'studio',variant:variant.value,[key]:(event.target as HTMLSelectElement).value}})}
const toggleTheme=()=>{const theme=document.body.getAttribute('theme')==='dark'?'light':'dark';document.body.setAttribute('theme',theme);void router.replace({query:{...route.query,theme}})}
const toggleLanguage=()=>{location.href=router.resolve({path:'/',query:{...route.query,lang:english?'zh-cn':'en'}}).href}
const latestTraffic=computed(()=>data.traffic?.items?.at(-1))
const speedUnit=(n?:number)=>!Number.isFinite(n)?'':byteToSize(Number(n)).split(' ')[1]+'/s'
const speed=(n?:number)=>!Number.isFinite(n)?'—':byteToSize(Number(n)).split(' ')[0]
const chartMax=computed(()=>Math.max(1024,...(data.traffic?.items||[]).map((v:any)=>Math.max(v.downloadSpeed||0,v.uploadSpeed||0)))*1.15)
const chartMaxLabel=computed(()=>`${speed(chartMax.value)} ${speedUnit(chartMax.value)}`)
const chartHalfLabel=computed(()=>`${speed(chartMax.value/2)} ${speedUnit(chartMax.value/2)}`)
const chartPath=(key:string)=>{const samples=data.traffic?.items||[];return samples.map((p:any,i:number)=>`${i?'L':'M'}${i/Math.max(1,samples.length-1)*600},${145-Math.max(0,p[key]||0)/chartMax.value*130}`).join(' ')}
const areaPath=computed(()=>data.traffic?.items?.length?chartPath('downloadSpeed')+' L600,160 L0,160 Z':'')
const dataDisks=computed(()=>data.disks?.disks?.filter((disk:any)=>!disk.isSystemRoot)||[])
const displayedDisks=computed(()=>data.disks?.disks||[])
const uptime=computed(()=>data.system?`${Math.floor(data.system.uptime/86400)}${t('天','d')} ${Math.floor(data.system.uptime%86400/3600)}${t('小时','h')}`:'—')
const services=computed(()=>[
  {name:'Docker',icon:'layers',running:data.docker?.status==='running',state:errors.docker?t('不可用','Unavailable'):data.docker?.status==='running'?t('运行中','Running'):t('未运行','Stopped'),detail:t('容器服务','Container service'),path:'/docker'},
  {name:'SAMBA',icon:'folder',running:Boolean(data.sharing?.sambas?.length),state:errors.sharing?t('不可用','Unavailable'):data.sharing?.sambas?.length?t('已启用','Enabled'):t('未启用','Disabled'),detail:t('局域网文件共享','LAN file sharing'),path:'/storage'},
  {name:t('远程访问','Remote access'),icon:'globe',running:Boolean(data.remote?.ddnstoDomain),state:errors.remote?t('不可用','Unavailable'):data.remote?.ddnstoDomain?t('已配置','Configured'):t('未配置','Not configured'),detail:'DDNSTO',path:'/ddns'},
])
const additionalServices=computed(()=>[
  {name:t('易有云','LinkEase'),state:errors.sharing?t('不可用','Unavailable'):data.sharing?.linkease?.enabel?t('已启用','Enabled'):t('未配置','Not configured')},
  {name:'WebDAV',state:errors.sharing?t('不可用','Unavailable'):data.sharing?.webdav?.enable?t('已启用','Enabled'):t('未启用','Disabled')},
  ...['aria2','qbittorrent','transmission'].map(name=>({name:name==='qbittorrent'?'qBittorrent':name==='aria2'?'Aria2':'Transmission',state:errors.download?t('不可用','Unavailable'):data.download?.[name]?.status==='running'?t('运行中','Running'):t('未启用','Disabled')})),
  ...['ipv4Domain','ipv6Domain'].map(name=>({name:name==='ipv4Domain'?'IPv4 DDNS':'IPv6 DDNS',state:errors.remote?t('不可用','Unavailable'):data.remote?.[name]&&data.remote[name]!=='Stopped'?t('已配置','Configured'):t('未启用','Disabled')})),
])
const shortcuts=[{title:'网络向导',en:'Network setup',icon:'network',path:'/network'},{title:'应用商店',en:'App store',icon:'grid',path:'/applications'},{title:'家长控制',en:'Parental controls',icon:'shield',path:'/parental'},{title:'终端',en:'Terminal',icon:'terminal',path:'/terminal'}]
const advancedLinks=[{title:'内网配置',en:'LAN setup',path:'/lan'},{title:'固件更新',en:'Firmware update',path:'/update'},{title:'DNS配置',en:'DNS settings',path:'/dns'},{title:'软件源配置',en:'Package sources',path:'/sources'},{title:'沙箱管理',en:'Sandbox',path:'/sandbox'},{title:'日志查看',en:'System logs',path:'/logs'},{title:'系统维护',en:'Maintenance',path:'/maintenance'}]
const scenarios=[['normal','正常','Normal'],['many','128台设备','128 devices'],['empty','没有设备','Empty'],['loading','加载中','Loading'],['error','设备API失败','Inventory error'],['stale','上次快照','Stale snapshot'],['old','旧后端','Old backend'],['permission','权限失败','Access denied'],['no-speed','服务未安装','Service missing'],['disabled','服务未启用','Service disabled'],['speed-error','服务异常','Service error'],['unsupported','固件不支持','Unsupported'],['network-error','网络模块失败','Network unavailable'],['storage-error','存储模块失败','Storage unavailable'],['services-error','服务模块失败','Services unavailable']]
async function openEditor(){opener=document.activeElement as HTMLElement;previousVariant=variant.value;draft.value=saved.value.map(m=>({...m}));editing.value=true;await nextTick();document.querySelector<HTMLButtonElement>('.editor-close')?.focus()}
function cancelEdit(){variant.value=previousVariant;editing.value=false;opener?.focus();void router.replace({query:{...route.query,variant:variant.value}})}
function applyEdit(){saved.value=draft.value.map(m=>({...m}));sessionLayouts.set(variant.value,saved.value);editing.value=false;opener?.focus()}
function move(index:number,direction:number){const rows=[...draft.value];const next=index+direction;if(next<0||next>=rows.length)return;[rows[index],rows[next]]=[rows[next],rows[index]];draft.value=rows}
function dropAt(index:number){if(dragged<0||dragged===index)return;const rows=[...draft.value],item=rows.splice(dragged,1)[0];rows.splice(index,0,item);draft.value=rows;dragged=-1}
function selectVariant(id:Variant,fromEditor=false){if(editing.value&&!fromEditor)applyEdit();variant.value=id;if(fromEditor)draft.value=makePreset(id);else saved.value=sessionLayouts.get(id)||makePreset(id);void router.replace({query:{...route.query,layout:'studio',variant:id}})}
function cycle(direction:number){const index=variants.findIndex(v=>v.id===variant.value);selectVariant(variants[(index+direction+3)%3].id)}
function keyboard(e:KeyboardEvent){if(editing.value){if(mobile.value&&e.key==='Tab'){const controls=Array.from(document.querySelectorAll<HTMLElement>('.layout-editor button:not(:disabled),.layout-editor select:not(:disabled),.layout-editor input:not(:disabled)'));const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}return}if(e.altKey||e.ctrlKey||e.metaKey||!(e.target instanceof HTMLElement)||e.target.closest('input,textarea,select,button,a,summary,[contenteditable]'))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();cycle(e.key==='ArrowRight'?1:-1)}}
function resize(){mobile.value=innerWidth<=700}
watch(()=>route.query.variant,v=>{if(v&&variants.some(item=>item.id===v)&&v!==variant.value){variant.value=v as Variant;saved.value=sessionLayouts.get(variant.value)||makePreset(variant.value)}})
onMounted(()=>{window.addEventListener('resize',resize);document.addEventListener('keydown',keyboard)})
onUnmounted(()=>{window.removeEventListener('resize',resize);document.removeEventListener('keydown',keyboard)})
</script>
<style src="./studio.css" scoped></style>
