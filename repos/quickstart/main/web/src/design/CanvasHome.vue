<template>
  <main class="canvas-home" :class="'layout-'+variant" data-canvas-home>
    <header class="canvas-header">
      <router-link class="canvas-brand" :to="target('/')"><span class="canvas-logo">Q<i></i></span><span>Quickstart<small>iStoreOS</small></span></router-link>
      <span class="header-divider"></span><span class="header-context">{{t('我的网络空间','My network space')}}</span>
      <div class="header-controls"><span class="header-status" :class="{ready:networkReady}"><i></i>{{networkReady?t('网络已连接','Internet connected'):errors.network?t('连接状态未知','Connection unconfirmed'):t('读取连接中','Reading connection')}}</span><button class="theme-toggle" @click="toggleTheme" :aria-label="t('切换主题','Toggle theme')">{{theme==='dark'?'☼':'◐'}}</button><details class="canvas-scenes"><summary>{{t('示例场景','Scenarios')}}</summary><div>
        <p>{{t('设计预览 · 合成示例数据','Design preview · Synthetic data')}}</p><label>{{t('数据场景','Scenario')}}<select aria-label="数据场景" :value="demo.scenario" @change="changeQuery('scenario',$event)"><option v-for="scene in scenes" :key="scene[0]" :value="scene[0]">{{t(scene[1],scene[2])}}</option></select></label><label>{{t('地址分配方','Address allocator')}}<select aria-label="地址分配方" :value="demo.authority" @change="changeQuery('authority',$event)"><option value="external">{{t('外部分配','External')}}</option><option value="local">{{t('本机分配','This router')}}</option><option value="unknown">{{t('尚不明确','Unconfirmed')}}</option></select></label><button @click="toggleLanguage">中文 / English</button>
      </div></details><button class="canvas-edit-button" @click="openEditor" :aria-label="t('自定义首页','Customize')"><StudioGlyph name="tune"/><span>{{t('自定义首页','Customize')}}</span></button></div>
    </header>

    <div class="canvas-frame">
      <aside class="canvas-navigation expanded" v-if="variant==='sidebar'" aria-label="首页工具区">
        <div v-if="variant==='sidebar'" class="navigation-caption">{{t('首页常用工具','HOME TOOLS')}}</div>
        <button v-for="entry in quickEntrances" :key="entry.path" @click="go(entry.path)" class="navigation-entry" :data-quick-entry="entry.path"><StudioGlyph :name="entry.glyph"/><span>{{t(entry.zh,entry.en)}}</span><small v-if="entry.path==='/devicemanagement'&&data.inventory&&!errors.inventory">{{devices.filter(d=>d.online).length}}</small></button>
        <template v-if="variant==='sidebar'&&enabled('tools')"><div class="navigation-separator"></div><div class="navigation-caption">{{t('配置与维护','CONFIGURATION')}}</div><CanvasTools expanded @navigate="go"/></template>
        <span class="navigation-footnote" v-if="variant==='sidebar'">{{t('你的网络，按你的方式。','Your network, your way.')}}</span>
      </aside>

      <section class="canvas-workspace">
        <div class="workspace-heading"><div><span class="workspace-eyebrow">NETWORK OVERVIEW</span><h1>{{t('网络总览','Network overview')}}</h1></div><span class="workspace-caption">{{t('连接与流量，尽在眼前。','A clear view of your connections and traffic.')}}</span></div>
        <section class="canvas-hero" :class="{ 'has-side':variant!=='sidebar'&&enabled('connection') }" aria-label="网络主视觉">
          <div class="hero-flow" data-native-chart>
            <NetworkFlow :key="theme"/>
            <button v-if="variant==='canvas'" class="chart-speed-action" @click="go('/networkSpeedTest')" data-home-entry="/networkSpeedTest" :aria-label="t('网络测速','Network speed test')" :title="t('网络测速','Network speed test')"><StudioGlyph name="activity"/>{{t('测速','Test')}}</button>
            <span v-if="demo.scenario==='network-error'" class="chart-notice">{{t('当前流量采样暂不可用','Current traffic sampling unavailable')}}</span>
          </div>
          <aside class="hero-side" v-if="variant!=='sidebar'&&enabled('connection')">
            <section v-if="enabled('connection')" class="connection-card" data-canvas-connection>
              <div class="small-heading"><span><StudioGlyph name="network"/>{{t('网络连接','Connection')}}</span><button @click="go('/network')" :aria-label="t('网络设置','Network settings')" :data-home-entry="variant==='canvas'?'/network':undefined" :class="{'contextual-action':variant==='canvas'}"><span v-if="variant==='canvas'">{{t('网络设置','Settings')}}</span><StudioGlyph name="arrow"/></button></div>
              <div class="connection-health"><span class="health-icon" :class="{ready:networkReady}"><StudioGlyph :name="networkReady?'check':'network'"/></span><div><strong>{{networkReady?t('连接正常','Connected'):errors.network?t('状态待确认','Unconfirmed'):t('正在读取','Loading')}}</strong><small>{{data.network?.defaultInterface||'—'}} · {{data.network?.proto==='static'?t('静态网络','Static network'):data.network?.proto||'—'}}</small></div></div>
              <dl><div><dt>IPv4</dt><dd>{{data.network?.ipv4addr?(showAddresses?data.network.ipv4addr:'••••••••••'):'—'}}<button @click="showAddresses=!showAddresses" :aria-label="showAddresses?t('隐藏地址','Hide address'):t('显示地址','Show address')">{{showAddresses?'◉':'◎'}}</button></dd></div><div><dt>{{t('网关','Gateway')}}</dt><dd>{{data.network?.gateway||'—'}}</dd></div><div><dt>DNS</dt><dd>{{data.network?.dnsList?.join(' · ')||'—'}}</dd></div></dl>
              <div class="connection-interfaces"><span v-for="port in data.ports?.ports||[]" :key="port.name" :title="port.interfaceNames.join(' / ')+' · '+(port.linkState==='UP'?t('已连接','Connected'):t('未连接','Disconnected'))"><i :class="{up:port.linkState==='UP'}"></i>{{port.name}}</span></div>
              <details class="connection-detail"><summary>{{t('协议与接口详情','Protocols & interfaces')}}</summary><p>IPv6 · {{data.network?.ipv6addr||t('未观察到地址','No address observed')}}</p><p>{{t('DNS来源','DNS source')}} · {{data.network?.dnsProto==='manual'?t('手动配置','Manual'):data.network?.dnsProto||'—'}}</p><p v-for="port in data.ports?.ports||[]" :key="port.name">{{port.name}} · {{port.interfaceNames.join(' / ')}} · {{port.linkState==='UP'?t('已连接','Connected'):t('未连接','Disconnected')}}</p></details>
            </section>
            <section v-if="variant==='stage'&&enabled('connection')" class="stage-context"><span class="context-orbit"><StudioGlyph name="network"/></span><small>{{t('地址分配','ADDRESS ALLOCATION')}}</small><strong>{{demo.authority==='local'?t('由本机管理','Managed here'):demo.authority==='external'?t('由主路由分配','Allocated externally'):t('分配方待确认','Allocator unconfirmed')}}</strong><p>{{t('设备资料独立保存，联网状态与上网权限分别呈现。','Profiles are stored independently. Presence and internet permissions are separate.')}}</p><button @click="go('/devicemanagement')">{{t('进入设备管理','Manage devices')}}<StudioGlyph name="arrow"/></button></section>
          </aside>
        </section>

        <section v-if="variant==='sidebar'&&enabled('connection')" class="connection-ribbon" data-canvas-connection><span><i :class="{ready:networkReady}"></i>{{networkReady?t('连接正常','Connected'):t('状态待确认','Unconfirmed')}}</span><span>IPv4 <strong>{{data.network?.ipv4addr||'—'}}</strong></span><span>{{t('网关','Gateway')}} <strong>{{data.network?.gateway||'—'}}</strong></span><span>DNS <strong>{{data.network?.dnsList?.join(' · ')||'—'}}</strong></span><button @click="go('/network')">{{t('网络设置','Network settings')}}<StudioGlyph name="arrow"/></button></section>

        <HomeApplications v-if="variant==='canvas'" :collapsed="!enabled('tools')" :fallback-entries="applicationFallbacks" @navigate="go"/>

        <div class="module-section-heading"><span>{{t('设备、资源与服务','DEVICES, RESOURCES & SERVICES')}}</span><button @click="openEditor">{{t('编辑模块','Edit modules')}}<StudioGlyph name="tune"/></button></div>
        <section class="canvas-modules" aria-label="可选首页模块"><CanvasModule v-for="item in visibleModules" :key="item.id" :item="item" :data="data" :errors="errors" :devices="devices" :contextual-actions="variant==='canvas'" @navigate="go" @device="openDevice" @retry="retry"/></section>
        <footer class="canvas-footer"><span>Quickstart <i>/</i> {{t('设计预览','Design preview')}}</span><span>{{t('合成示例数据 · 非当前设备验收','Synthetic examples · Not current device acceptance')}}</span></footer>
      </section>
    </div>

    <nav v-if="variant!=='canvas'" class="canvas-action-dock" :class="{desktop:variant==='stage'}" aria-label="操作台"><button v-for="entry in quickEntrances" :key="entry.path" @click="go(entry.path)" :data-dock-entry="entry.path"><StudioGlyph :name="entry.glyph"/><span>{{t(entry.zh,entry.en)}}</span></button><span class="dock-separator" v-if="enabled('tools')"></span><button v-if="enabled('tools')" @click="toolsOpen=true" class="dock-tools" data-config-position="dock"><StudioGlyph name="tune"/><span>{{t('配置工具','Tools')}}</span></button></nav>

    <template v-if="toolsOpen"><div class="canvas-overlay" @click="toolsOpen=false"></div><section class="canvas-tool-tray" role="dialog" aria-modal="true" :aria-label="t('配置工具','Configuration tools')" @keydown.esc="toolsOpen=false"><div class="tray-heading"><div><small>QUICK CONFIGURATION</small><h2>{{t('配置与维护','Configure & maintain')}}</h2></div><button class="tray-close" @click="toolsOpen=false" :aria-label="t('关闭工具','Close tools')">×</button></div><CanvasTools @navigate="go"/><p>{{t('配置工具始终有独立入口，不受设备数量影响。','Configuration has an independent entry, unaffected by device count.')}}</p></section></template>

    <template v-if="editing"><div class="canvas-overlay" @click="cancelEdit"></div><aside class="canvas-editor" role="dialog" aria-modal="true" :aria-label="t('首页布局编辑器','Home layout editor')" @keydown.esc="cancelEdit"><div class="tray-heading"><div><small>MAKE IT YOURS</small><h2>{{t('布局，由你决定','Your layout, your choice')}}</h2></div><button class="editor-close" @click="cancelEdit" :aria-label="t('关闭编辑器','Close editor')">×</button></div><div class="editor-content"><h3>{{t('选择空间结构','Choose your workspace')}}</h3><div class="canvas-presets"><button v-for="v in canvasVariants" :key="v.id" :class="{selected:variant===v.id}" @click="chooseVariant(v.id,true)"><span class="layout-mini" :class="v.id"><i v-for="n in 4" :key="n"></i></span><span>{{t(v.zh,v.en)}}</span></button></div><div class="chart-anchor"><StudioGlyph name="activity"/><div><strong>{{t('原版大流量图','Original large traffic chart')}}</strong><small>{{t('保留原曲线 · 高度独立','Original curve · Independent height')}}</small></div><span>✓</span></div><h3>{{t('选择内容，调整顺序','Choose content & order')}}</h3><p class="editor-help">{{t('独立选择每个模块。内容区支持拖动或上下排序。','Select modules independently. Drag or use arrows to reorder content.')}}</p><div class="canvas-editor-modules"><div v-for="(item,index) in draft" :key="item.id" :data-canvas-editor="item.id" class="editor-item" :class="{disabled:!item.enabled}" @dragover.prevent @drop.prevent="dropAt(index)"><div><span v-if="!definition(item.id).fixed" class="editor-drag" draggable="true" @dragstart="dragged=index" @dragend="dragged=-1">⠿</span><StudioGlyph :name="definition(item.id).glyph"/><label :for="'canvas-enable-'+item.id">{{t(definition(item.id).zh,definition(item.id).en)}}</label><button v-if="!definition(item.id).fixed" @click="move(index,-1)" :disabled="!canMove(index,-1)" :aria-label="t('上移','Move up')+t(definition(item.id).zh,definition(item.id).en)">↑</button><button v-if="!definition(item.id).fixed" @click="move(index,1)" :disabled="!canMove(index,1)" :aria-label="t('下移','Move down')+t(definition(item.id).zh,definition(item.id).en)">↓</button><input :id="'canvas-enable-'+item.id" type="checkbox" v-model="item.enabled"/></div><span class="fixed-placement" v-if="definition(item.id).fixed">{{item.id==='tools'?t('独立操作区 · 不撑高图表','Separate area · Independent of chart height'):t('跟随网络主视觉','Alongside the network visual')}}</span><select v-else :disabled="!item.enabled" v-model.number="item.span" :aria-label="t(definition(item.id).zh,definition(item.id).en)+t('宽度',' width')"><option :value="4">{{t('紧凑 · ⅓','Compact · ⅓')}}</option><option :value="6">{{t('标准 · ½','Standard · ½')}}</option><option :value="8">{{t('宽幅 · ⅔','Wide · ⅔')}}</option><option :value="12">{{t('整行','Full row')}}</option></select></div></div><button class="editor-reset" @click="draft=canvasPreset(variant)">{{t('恢复当前预设','Reset this preset')}}</button><p class="editor-help">{{t('页面内保存，刷新恢复预设。应用入口与服务详情可独立选择。','Saved in this preview. Reload restores the preset. App shortcuts and service details are independent.')}}</p></div><div class="editor-bottom"><button @click="cancelEdit">{{t('取消','Cancel')}}</button><button @click="applyEdit" class="editor-apply">{{t('应用布局','Apply layout')}}</button></div></aside></template>
    <div class="canvas-variant-picker" v-if="route.query.tools!=='0'" aria-label="设计方案"><button @click="cycle(-1)" aria-label="上一个方案">‹</button><button v-for="(v,i) in canvasVariants" :key="v.id" :class="{selected:v.id===variant}" @click="chooseVariant(v.id)">{{String.fromCharCode(65+i)}}<span>{{t(v.zh,v.en)}}</span></button><button @click="cycle(1)" aria-label="下一个方案">›</button></div>
  </main>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { getTheme } from '../utils/theme'
import NetworkFlow from '../pages/index/network/NetworkFlow.vue'
import StudioGlyph from './StudioGlyph.vue'
import CanvasTools from './CanvasTools.vue'
import HomeApplications from './HomeApplications.vue'
import CanvasModule from './CanvasModule.vue'
import { canvasModules,canvasVariants,canvasPreset,canvasSession,quickEntrances,type CanvasVariant,type CanvasModuleKey,type CanvasLayoutItem } from './canvasLayout'
import { useStudioModel } from './studioModel'
import { demo } from './fixtures'
const route=useRoute(),router=useRouter(),english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh
const variant=ref<CanvasVariant>(canvasVariants.some(v=>v.id===route.query.variant)?route.query.variant as CanvasVariant:'canvas')
const saved=ref<CanvasLayoutItem[]>(canvasSession.get(variant.value)||canvasPreset(variant.value)),draft=ref<CanvasLayoutItem[]>([]),editing=ref(false),toolsOpen=ref(false),showAddresses=ref(false),theme=ref(getTheme())
const layout=computed(()=>editing.value?draft.value:saved.value)
// The existing graph owns its sampler. Do not create a second statistics poll.
const {data,errors,devices,retry}=useStudioModel(layout,['traffic'])
const enabled=(id:CanvasModuleKey)=>layout.value.some(item=>item.id===id&&item.enabled)
// Keep destinations reachable when their overview module is hidden.
const applicationFallbacks=computed(()=>quickEntrances.filter(entry=>entry.path==='/network'&&!enabled('connection')||['/devicemanagement','/parental'].includes(entry.path)&&!enabled('devices')))
const visibleModules=computed(()=>layout.value.filter(item=>item.enabled&&!definition(item.id).fixed))
const definition=(id:CanvasModuleKey)=>{const item=canvasModules.find(m=>m.id===id)!;return id==='tools'&&variant.value==='canvas'?{...item,zh:'应用与工具',en:'Apps & tools'}:item}
const networkReady=computed(()=>Boolean(data.network?.internetConnected)&&!errors.network)
let dragged=-1,originalVariant=variant.value,originalScroll=0,opener:HTMLElement|null=null
const target=(path:string,device?:string)=>({path,query:{...route.query,layout:'canvas',variant:variant.value,filter:path==='/devicemanagement'?'all':undefined,device}})
const go=(path:string)=>{toolsOpen.value=false;void router.push(target(path))}
const openDevice=(id:string)=>void router.push(target('/devicemanagement',id))
const changeQuery=(key:string,event:Event)=>{demo.recovered=false;void router.replace({query:{...route.query,layout:'canvas',variant:variant.value,[key]:(event.target as HTMLSelectElement).value}})}
function toggleTheme(){theme.value=theme.value==='dark'?'light':'dark';document.body.setAttribute('theme',theme.value);void router.replace({query:{...route.query,theme:theme.value}})}
function toggleLanguage(){location.href=router.resolve({path:'/',query:{...route.query,layout:'canvas',variant:variant.value,lang:english?'zh-cn':'en'}}).href}
async function openEditor(){opener=document.activeElement as HTMLElement;originalVariant=variant.value;originalScroll=scrollY;draft.value=saved.value.map(item=>({...item}));editing.value=true;await nextTick();document.querySelector<HTMLButtonElement>('.canvas-editor .editor-close')?.focus();document.querySelector('.canvas-modules')?.scrollIntoView({block:'start'})}
function closeEditor(){editing.value=false;opener?.focus({preventScroll:true});window.scrollTo({top:originalScroll})}
function cancelEdit(){variant.value=originalVariant;closeEditor();void router.replace({query:{...route.query,variant:variant.value}})}
function applyEdit(){saved.value=draft.value.map(item=>({...item}));canvasSession.set(variant.value,saved.value);closeEditor()}
function canMove(index:number,direction:number){const next=index+direction;return next>=0&&next<draft.value.length&&!definition(draft.value[next].id).fixed}
function move(index:number,direction:number){if(!canMove(index,direction))return;const rows=[...draft.value];[rows[index],rows[index+direction]]=[rows[index+direction],rows[index]];draft.value=rows}
function dropAt(index:number){if(dragged<0||dragged===index||definition(draft.value[index].id).fixed)return;const rows=[...draft.value];rows.splice(index,0,rows.splice(dragged,1)[0]);draft.value=rows;dragged=-1}
function chooseVariant(id:CanvasVariant,inEditor=false){variant.value=id;if(inEditor)draft.value=canvasPreset(id);else{saved.value=canvasSession.get(id)||canvasPreset(id);editing.value=false}void router.replace({query:{...route.query,layout:'canvas',variant:id}})}
function cycle(direction:number){const index=canvasVariants.findIndex(v=>v.id===variant.value);chooseVariant(canvasVariants[(index+direction+3)%3].id)}
function keyboard(event:KeyboardEvent){if(editing.value||toolsOpen.value){const selector=editing.value?'.canvas-editor':'.canvas-tool-tray';if(event.key==='Escape'){if(editing.value)cancelEdit();else toolsOpen.value=false;return}if(event.key==='Tab'){const controls=Array.from(document.querySelectorAll<HTMLElement>(selector+' button:not(:disabled),'+selector+' input:not(:disabled),'+selector+' select:not(:disabled)'));const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}return}if(event.ctrlKey||event.metaKey||event.altKey||!(event.target instanceof HTMLElement)||event.target.closest('input,textarea,select,button,a,summary,[contenteditable]'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();cycle(event.key==='ArrowRight'?1:-1)}}
watch(()=>route.query.theme,()=>theme.value=getTheme())
watch(()=>route.query.variant,value=>{if(canvasVariants.some(v=>v.id===value)&&value!==variant.value){variant.value=value as CanvasVariant;saved.value=canvasSession.get(variant.value)||canvasPreset(variant.value)}})
watch(toolsOpen,async value=>{if(value){opener=document.activeElement as HTMLElement;await nextTick();document.querySelector<HTMLButtonElement>('.canvas-tool-tray .tray-close')?.focus()}else opener?.focus({preventScroll:true})})
onMounted(()=>document.addEventListener('keydown',keyboard));onUnmounted(()=>document.removeEventListener('keydown',keyboard))
const scenes=[['normal','正常','Normal'],['many','128台设备','128 devices'],['empty','没有设备','Empty'],['loading','加载中','Loading'],['error','设备API失败','Inventory error'],['stale','上次快照','Stale snapshot'],['old','旧后端','Old backend'],['permission','权限失败','Access denied'],['no-speed','服务未安装','Service missing'],['disabled','服务未启用','Service disabled'],['speed-error','服务异常','Service error'],['unsupported','固件不支持','Unsupported'],['network-error','网络模块失败','Network unavailable'],['storage-error','存储模块失败','Storage unavailable'],['services-error','服务模块失败','Services unavailable'],['apps-empty','没有扩展应用','No extra apps'],['apps-error','应用清单失败','App list unavailable'],['apps-loading','应用清单加载中','Apps loading'],['apps-many','大量应用','Many apps']]
</script>
<style src="./canvas.css" scoped></style>
