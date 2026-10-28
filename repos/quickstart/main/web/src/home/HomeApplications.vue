<template>
  <section v-if="!collapsed" ref="hub" class="home-applications fluid-applications" :class="{'applications-strip':resolved.id==='strip'}" :data-app-form="resolved.id" data-applications-hub>
    <header class="applications-heading">
      <div><StudioGlyph name="grid"/><h2>{{t('应用工具','Apps & tools')}}</h2></div>
      <div class="applications-actions widget-action-group"><WidgetPrimaryAction icon="grid" @click="openBrowser(false)" data-all-apps>{{t('查看全部','All')}}</WidgetPrimaryAction><WidgetMenu :label="t('应用与工具更多操作','More app and tool actions')" :items="[{id:'favorites',label:t('编辑快捷入口','Edit shortcuts')}]" @select="openBrowser(true)"/></div>
    </header>
      <div v-if="!favorites.length" class="applications-state"><StudioGlyph name="grid"/><span>{{t('把常用应用放在这里','Keep your favorite apps here')}}</span><button @click="openBrowser(true)">{{t('选择应用','Choose apps')}}</button></div>
      <div v-else class="applications-favorites" :style="{gridTemplateColumns:'repeat('+columns+', minmax(0,1fr))'}" :data-app-columns="columns" :data-app-capacity="capacity"><button v-for="app in favorites.slice(0,capacity)" :key="app.id" @click="activate(app)" :title="t(app.zh,app.en)+(entryAvailability(app)==='available'?'':' · '+availabilityText(app))" :data-favorite-app="app.id" :data-availability="entryAvailability(app)" :aria-busy="launchSource==='home'&&launchApp?.id===app.id&&launchStatus==='loading'"><span class="application-icon" :class="app.tone"><ApplicationArtwork :app="app"/><i v-if="launchSource==='home'&&launchApp?.id===app.id&&launchStatus==='loading'" class="home-entry-spinner" aria-hidden="true"/><i v-if="app.tool==='firmware'&&systemStore.checkUpdate?.needUpdate" class="launcher-update-dot" :aria-label="t('有可用更新','Update available')"/></span><span><strong>{{t(app.zh,app.en)}}</strong><small v-if="entryAvailability(app)!=='available'">{{availabilityText(app)}}</small></span></button></div>
    <template v-if="launchSource==='home'&&launchApp&&favorites.some(app=>app.id===launchApp?.id)&&launchStatus!=='idle'">
      <span v-if="launchStatus==='loading'" class="home-entry-announcement" role="status">{{t('正在打开：','Opening: ')+t(launchApp.zh,launchApp.en)}}</span>
      <div v-else class="home-entry-error" role="status" data-home-entry-state><span>{{t(launchApp.zh,launchApp.en)}} · {{entryMessage}}</span><div><button @click="retryLaunch" data-home-entry-retry>{{t('重试','Retry')}}</button><button v-if="launchApp.path" @click="configureLaunch" data-home-entry-config>{{t('打开配置','Open settings')}}</button><button @click="dismissLaunch" :aria-label="t('关闭提示','Dismiss')" data-home-entry-dismiss>×</button></div></div>
    </template>
    <div v-if="fallbackEntries.length" class="applications-fallback" data-applications-fallback><span>{{t('快捷操作','Quick actions')}}</span><button v-for="entry in fallbackEntries" :key="entry.path" @click="navigate(entry.path)" :data-home-entry="entry.path"><StudioGlyph :name="entry.glyph"/>{{t(entry.zh,entry.en)}}<StudioGlyph name="arrow"/></button></div>
  </section>
  <button v-else-if="!hostOnly" class="applications-collapsed" @click="openBrowser(false)" data-open-applications><StudioGlyph name="grid"/>{{t('应用工具','Apps & tools')}}</button>

  <Teleport v-if="browserOpen" to=".canvas-home">
    <div class="applications-backdrop" @click="closeBrowser"></div>
    <section class="applications-browser launchpad-browser" :class="{'launchpad-editor':editing,'launchpad-form':linkFormOpen}" role="dialog" aria-modal="true" :aria-label="linkFormOpen?t('链接设置','Link settings'):editing?t('编辑快捷入口','Edit shortcuts'):t('全部应用与工具','All apps and tools')" data-applications-browser :data-shortcut-history="history.length">
      <header><div><span>{{linkFormOpen?'YOUR SPACE':editing?t('首页常用入口','YOUR FAVORITES'):'APPS & TOOLS'}}</span><h2>{{linkFormOpen?(linkInitial?t('编辑链接','Edit link'):t('添加链接','Add a link')):editing?t('留下常用的，刚刚好','A place for your favorites'):t('你的应用与工具','Your apps & tools')}}</h2></div><button class="applications-close" @click="linkFormOpen?cancelLink():closeBrowser()" :aria-label="linkFormOpen?t('返回全部入口','Return to all entries'):t('关闭应用面板','Close apps')">{{linkFormOpen?'←':'×'}}</button></header>
      <div class="applications-browser-body" :inert="saving()">
        <LauncherLinkForm v-if="linkFormOpen" :initial="linkInitial" :entries="catalogue" @cancel="cancelLink" @saved="linkSaved"/>
        <template v-else>
        <template v-if="editing"><LauncherFavoriteGrid :ids="draft" :columns="editorColumns" :limit="24" @remove="toggleFavorite" @reorder="commit"/><div class="launcher-editor-toolbar"><button @click="undoFavorite" :disabled="!history.length" data-shortcut-undo>↶ {{t('撤销','Undo')}}</button><button @click="commit(applicationDefaults)" data-shortcut-restore>{{t('恢复默认八项','Restore eight defaults')}}</button></div><h3 class="launcher-library-heading">{{t('添加快捷入口','Add shortcuts')}}</h3></template>
        <label class="application-search"><StudioGlyph name="grid"/><input v-model="search" :placeholder="t('搜索应用或系统工具','Search apps or system tools')" :aria-label="t('搜索应用或系统工具','Search apps or system tools')"/></label>
        <div class="launchpad-controls"><div class="browser-category-tabs" role="group" :aria-label="t('入口分类','Shortcut categories')"><button v-for="tab in categories" :key="tab.id" :aria-pressed="browserTab===tab.id" :data-category="tab.id" @click="browserTab=tab.id">{{t(tab.zh,tab.en)}}</button></div><div v-if="!editing" class="launchpad-library-actions"><button @click="openLink()" :disabled="!provider.editable()" data-add-link>＋ {{t('添加链接','Add link')}}</button><button v-if="linkCount" :aria-pressed="managingLinks" @click="managingLinks=!managingLinks" data-manage-links>{{managingLinks?t('完成','Done'):t('管理链接','Manage links')}}</button></div></div>
          <div v-if="catalogueState!=='ready'" class="applications-state launchpad-status" role="status" data-applications-state><span>{{stateText}}</span><button v-if="['error','permission','timeout'].includes(catalogueState)" @click="provider.retry">{{t('重试','Retry')}}</button></div>
          <div v-if="launchApp&&launchStatus!=='idle'" class="applications-state launchpad-status" role="status" data-entry-state :aria-busy="launchStatus==='loading'"><span>{{launchStatus==='loading'?t('正在打开：','Opening: ')+t(launchApp.zh,launchApp.en):t(launchApp.zh,launchApp.en)+' · '+entryMessage}}</span><template v-if="launchStatus!=='loading'"><button @click="retryLaunch">{{t('重试','Retry')}}</button><button v-if="launchApp.path" @click="configureLaunch" data-entry-config>{{t('打开配置','Open settings')}}</button></template></div>
          <div class="launchpad-result-line"><span>{{editing?t('可添加的入口','Available shortcuts'):t('所有入口','Your library')}} <strong data-library-total>{{query.total}}</strong></span></div>
          <div v-if="!filteredApps.length" class="applications-state"><span v-if="catalogueState==='ready'||browserTab==='tools'||browserTab==='links'">{{browserTab==='apps'&&catalogueState==='ready'&&!provider.state.apps.length?t('没有已安装的扩展应用，可前往软件中心。','No additional apps installed. Explore the software center.'):t('没有匹配的入口，试试其他关键词。','No matching entries. Try another search.')}}</span></div>
          <div v-else-if="editing" class="application-catalogue"><div v-for="app in filteredApps" :key="app.id"><span class="application-icon" :class="app.tone"><ApplicationArtwork :app="app"/></span><div><strong>{{t(app.zh,app.en)}}</strong><small>{{entryAvailability(app)!=='available'?availabilityText(app):t(app.detail,app.detailEn)}}</small></div><button @click="toggleFavorite(app.id)" :disabled="!draft.includes(app.id)&&(draft.length>=24||entryAvailability(app)!=='available')" :aria-pressed="draft.includes(app.id)" :aria-label="t('选择','Select ')+t(app.zh,app.en)" :data-select-app="app.id">{{draft.includes(app.id)?'✓':'+'}}</button></div></div>
          <div v-else class="launchpad-grid" data-launchpad-grid><div v-for="app in filteredApps" :key="app.id" class="launchpad-tile"><button class="launchpad-open" @click="activate(app)" :title="t(app.zh,app.en)+(entryAvailability(app)==='available'?'':' · '+availabilityText(app))" :aria-label="(entryAvailability(app)==='available'?t('打开','Open '):t('查看原因：','View reason: '))+t(app.zh,app.en)" :data-open-app="app.id" :data-unavailable-shortcut="entryAvailability(app)!=='available'?app.id:undefined" :data-availability="entryAvailability(app)" :data-browser-tool="app.kind==='tool'?app.id:undefined"><span class="application-icon" :class="app.tone"><ApplicationArtwork :app="app"/><i v-if="homeApplicationSession.favorites.includes(app.id)" class="launchpad-pin" :aria-label="t('已固定到首页','Pinned to home')"></i></span><strong>{{t(app.zh,app.en)}}</strong><small v-if="entryAvailability(app)!=='available'">{{availabilityText(app)}}</small></button><button v-if="managingLinks&&app.kind==='link'" class="launchpad-link-edit" @click="openLink(app)" :data-edit-link="app.id" :aria-label="t('编辑链接：','Edit link: ')+t(app.zh,app.en)">{{t('编辑','Edit')}}</button></div></div>
          <nav v-if="query.pages>1" class="launchpad-pagination" :aria-label="t('入口分页','Library pages')"><button :disabled="query.current===1" @click="changePage(query.current-1)" data-library-prev>{{t('上一页','Previous')}}</button><span data-library-page>{{query.current}} / {{query.pages}}</span><button :disabled="query.current===query.pages" @click="changePage(query.current+1)" data-library-next>{{t('下一页','Next')}}</button></nav>
        <p class="application-limit" v-if="editing&&draft.length>=24">{{t('已保存24个，请先移除一个再添加。','24 selected. Remove a shortcut to add another.')}}</p>
        <div v-if="!editing&&!collapsed&&fallbackEntries.length" class="browser-fallback"><h3>{{t('快捷操作','Quick actions')}}</h3><button v-for="entry in fallbackEntries" :key="entry.path" @click="navigate(entry.path)" :data-browser-quick="entry.path"><StudioGlyph :name="entry.glyph"/>{{t(entry.zh,entry.en)}}<StudioGlyph name="arrow"/></button></div>
        <p v-if="notice" class="launchpad-notice" role="status">{{notice}}</p>
        </template>
      </div>
      <footer v-if="!linkFormOpen"><template v-if="editing"><button @click="closeBrowser">{{t('取消','Cancel')}}</button><button class="applications-save" :disabled="saving()" @click="saveFavorites">{{t('保存到首页','Save to home')}} · {{draft.length}}/24</button></template><template v-else><button @click="startEditing" :disabled="!provider.editable()" data-manage-favorites>{{t('编辑快捷入口','Edit shortcuts')}}</button><button class="software-center" @click="navigate('/cgi-bin/luci/admin/store/pages/store')" data-browser-software-center>{{t('软件中心','Software center')}}<StudioGlyph name="arrow"/></button></template></footer>
    </section>
  </Teleport>
  <LauncherToolAction v-if="activeTool" :app="activeTool" @close="activeTool=null"/>
  <NetworkWidgetDialog v-if="unavailableApp" :title="t('入口暂不可用','Shortcut unavailable')" @close="unavailableApp=null"><div data-shortcut-unavailable><p>{{t(unavailableApp.zh,unavailableApp.en)}} · {{availabilityText(unavailableApp)}}</p><p>{{t('入口保留在原位置，你可以在编辑快捷入口中移除。','The shortcut stays in place. You can remove it in Edit shortcuts.')}}</p></div></NetworkWidgetDialog>
</template>
<script setup lang="ts">
import {useLauncherRoute} from './useLauncherRoute'
import type {LauncherMemory,LauncherView} from './launcherRouteState'
import {resolveAppEntry,resolveAppEntryResult} from './appEntryClient'
import {speedTestTarget} from './speedTestTarget'
import appUtils from '../utils/app'
import WidgetPrimaryAction from './WidgetPrimaryAction.vue'
import {computed,nextTick,onMounted,onUnmounted,ref,toRef,watch} from 'vue'
import StudioGlyph from './HomeGlyph.vue'
import ApplicationArtwork from './ApplicationArtwork.vue'
import WidgetMenu from './WidgetMenu.vue'
type QuickEntrance={path:string;zh:string;en:string;glyph:string}
import {applicationDefaults,type HomeApplication} from './homeApplications'
import LauncherFavoriteGrid from './LauncherFavoriteGrid.vue'
import {registerLauncherBrowser,requestLauncherBrowser,requestLauncherApp,cancelLauncherApp,launcherActivation,type ActivationSource} from './launcherBrowserHost'
import {useHomeEntryReturn} from './useHomeEntryReturn'
import {useLauncherCatalog} from './launcherContext'
const {entryAvailability,homeApplicationSession,linkSession,saving}=useLauncherCatalog()
import {PAGE_SIZE,queryLibrary} from './launcherLibrary'
import LauncherLinkForm from './LauncherLinkForm.vue'
import LauncherToolAction from './LauncherToolAction.vue'
import {useNetworkStore,useSystemStore} from '../plugins/store'
import NetworkWidgetDialog from './NetworkWidgetDialog.vue'
import {resolvePresentation,type WidgetPreference} from './layout/widgetPresentation'
const props=defineProps<{collapsed:boolean;hostOnly?:boolean;fallbackEntries:QuickEntrance[];contained?:boolean;preference?:WidgetPreference;natural?:boolean;network?:any;returnReady?:(widgets:readonly string[])=>boolean}>()
const emit=defineEmits<{(e:'navigate',path:string):void;(e:'close'):void}>()
const hub=ref<HTMLElement|null>(null),hubWidth=ref(600),hubHeight=ref(240)
const resolved=computed(()=>resolvePresentation('applications',props.preference||{mode:'auto',iconRows:0},{width:hubWidth.value,height:props.natural?100000:hubHeight.value,role:'ordinary',favoriteCount:favorites.value.length,mobile:hubWidth.value<650,natural:props.natural}))
const columns=computed(()=>resolved.value.columns)
const capacity=computed(()=>resolved.value.capacity)
let hubObserver:ResizeObserver|undefined
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh
const browserTab=ref('all'),browserOpen=ref(false),editing=ref(false),search=ref(''),draft=ref<string[]>([]),history=ref<string[][]>([]),libraryPage=ref(1)
const categories=[{id:'all',zh:'全部',en:'All'},{id:'apps',zh:'已安装应用',en:'Apps'},{id:'tools',zh:'系统工具',en:'Tools'},{id:'links',zh:'链接',en:'Links'}]
const linkFormOpen=ref(false),linkInitial=ref<HomeApplication>(),linkTarget=ref<HomeApplication|null>(null),managingLinks=ref(false),notice=ref('')
const linkCount=computed(()=>linkSession.entries.length)
const editorColumns=ref(window.innerWidth<650?2:4)
const provider=useLauncherCatalog(),catalogueState=computed(()=>provider.state.status),catalogue=provider.catalogue
const activeTool=ref<HomeApplication|null>(null),unavailableApp=ref<HomeApplication|null>(null),systemStore=useSystemStore()
const launchApp=toRef(launcherActivation,'app'),launchStatus=toRef(launcherActivation,'status'),launchSource=toRef(launcherActivation,'source')
let entryController:AbortController|undefined,activationGeneration=0,activationAlive=true,ownsActivation=false
const homeReturn=useHomeEntryReturn(!!props.hostOnly,()=>!provider.preferencesLoading()&&provider.state.status!=='loading',widgets=>props.returnReady?.(widgets)??true)
const entryMessage=computed(()=>launchStatus.value==='timeout'?t('打开应用超时，请重试。','Opening timed out. Please retry.'):launchStatus.value==='permission'?t('没有解析入口的权限，请重新登录后重试。','No permission to resolve this entry. Sign in and retry.'):t('暂时无法打开，请重试或打开配置。','Unable to open now. Retry or open settings.'))
function cancelLaunch(){if(!ownsActivation)return;activationGeneration++;entryController?.abort();entryController=undefined;launchStatus.value='idle';launchApp.value=null;ownsActivation=false}
async function dismissLaunch(){const traffic=launchSource.value==='traffic',id=launchSource.value==='home'?launchApp.value?.id:undefined;cancelLauncherApp();cancelLaunch();await nextTick();if(traffic)document.querySelector<HTMLElement>('[data-home-speed]')?.focus({preventScroll:true});else if(id)document.querySelector<HTMLElement>('[data-favorite-app="'+CSS.escape(id)+'"]')?.focus({preventScroll:true})}
function retryLaunch(){if(launchApp.value)void activate(launchApp.value)}
function configureLaunch(){if(!launchApp.value)return;const app={...launchApp.value,entryScript:false};if(launchSource.value==='home'&&!props.collapsed&&requestLauncherApp(app))return;void launchInstalled(app,launchSource.value)}
async function launchInstalled(app:HomeApplication,source:ActivationSource='browser'){
 if(launchStatus.value==='loading'&&launchApp.value?.id===app.id&&launchSource.value===source)return
 cancelLaunch();ownsActivation=true;const generation=activationGeneration,current=new AbortController();entryController=current;launchApp.value=app;launchSource.value=source
 const valid=()=>activationAlive&&generation===activationGeneration&&!current.signal.aborted&&(source==='browser'?browserOpen.value:!browserOpen.value&&!document.querySelector('.ordered-editing')&&(source==='traffic'?!!document.querySelector('[data-home-speed]'):homeApplicationSession.favorites.includes(app.id)&&!!document.querySelector('[data-favorite-app="'+CSS.escape(app.id)+'"]')))
 let timedOut=false,timer:number|undefined
 const deadline=()=>{timer=window.setTimeout(()=>{timedOut=true;current.abort()},5000)}
 if(app.entryScript||source==='traffic')launchStatus.value='loading'
 try{
  let target:string|null
  if(source==='traffic'){
   if(provider.state.status==='loading')await provider.waitForRead()
   else if(provider.state.status!=='ready')await provider.retry()
   if(!valid()){if(generation===activationGeneration)cancelLaunch();return}
   target=await speedTestTarget(provider.state.apps,provider.state.status,window.location.href,current.signal,{
    resolve:async(...args)=>{deadline();try{return await resolveAppEntryResult(...args)}finally{window.clearTimeout(timer)}},
    confirm:()=>valid()&&window.confirm(t('FastNet暂未就绪，是否继续检查安装并打开配置？','FastNet is not ready. Continue with the installation check and open settings?')),
    install:async()=>valid()?appUtils.checkAndInstallApp('app-meta-fastnet','FastNet',undefined,valid):false
   })
  }else{if(app.entryScript)deadline();target=await resolveAppEntry(app,window.location.href,current.signal)}
  if(!target){if(generation===activationGeneration)cancelLaunch();return}
  if(!valid()){if(generation===activationGeneration)cancelLaunch();return}
  if(source==='browser')await navigation.remember(app.id);else homeReturn.remember(app.id,source==='traffic'?'traffic':undefined)
  if(valid())window.location.assign(target);else if(generation===activationGeneration)cancelLaunch()
 }catch(error){if(activationAlive&&generation===activationGeneration)launchStatus.value=timedOut?'timeout':error instanceof Error&&['permission','timeout'].includes(error.message)?error.message:'error'}finally{window.clearTimeout(timer)}
}
const favorites=computed(()=>homeApplicationSession.favorites.map(provider.resolve))
const stateText=computed(()=>catalogueState.value==='permission'?t('没有读取应用目录的权限，系统工具仍可使用。','No permission to read apps. System tools remain available.'):catalogueState.value==='timeout'?t('读取应用清单超时，请点击重试。系统工具仍可使用。','Loading applications timed out. Select Retry. System tools remain available.'):catalogueState.value==='error'?t('应用清单暂不可用，系统工具仍可使用。','Apps unavailable. System tools remain available.'):catalogueState.value==='loading'?t('正在读取应用清单…','Loading applications…'):t('还没有安装扩展应用，去软件中心发现更多。','No additional apps installed. Explore the software center.'))
function availabilityText(app:HomeApplication){const status=entryAvailability(app);return status==='uninstalled'?t('应用已卸载','App uninstalled'):status==='permission'?t('无访问权限','No access'):status==='unsupported'?t('固件不支持','Unsupported'):status==='no-entry'?t('暂无可用入口','No verified entry'):t('状态待确认','Status unknown')}
const query=computed(()=>queryLibrary(catalogue.value.map(a=>provider.resolve(a.id)),search.value,browserTab.value,libraryPage.value))
const filteredApps=computed(()=>query.value.entries)
watch([search,browserTab],()=>{if(!navigation?.applying.value)libraryPage.value=1})
function changePage(page:number){libraryPage.value=page;document.querySelector('.applications-browser-body')?.scrollTo({top:0})}
async function openLink(app?:HomeApplication){if(editing.value||!provider.begin())return;linkInitial.value=app;linkFormOpen.value=true;notice.value='';await nextTick();document.querySelector('.applications-browser-body')?.scrollTo({top:0})}
async function cancelLink(){if(saving())return;linkFormOpen.value=false;linkInitial.value=undefined;await nextTick();document.querySelector<HTMLButtonElement>('[data-add-link]')?.focus()}
async function linkSaved(message:string,id?:string){await cancelLink();notice.value=message;search.value='';browserTab.value='links';await nextTick();const index=id?catalogue.value.filter(app=>app.kind==='link').findIndex(app=>app.id===id):-1;libraryPage.value=index>=0?Math.floor(index/PAGE_SIZE)+1:query.value.current;await nextTick();if(id)document.querySelector<HTMLButtonElement>('[data-open-app="'+id+'"]')?.focus()}
const networkStore=useNetworkStore()
async function activate(app:HomeApplication){
 if(app.kind==='app'&&!props.collapsed&&requestLauncherApp(app))return
 if(app.kind==='app'&&entryAvailability(app)==='available'){await launchInstalled(app);return}
 if(app.id==='files'){if(browserOpen.value&&!await closeBrowser())return;void appUtils.installAndGo('luci-app-linkease',t('易有云','LinkEase'),'/cgi-bin/luci/admin/services/linkease/file/','app-meta-linkease');return}
 const snapshot=props.network||browserNetwork
 if(app.kind==='builtin'){await navigation?.remember(app.id);emit('navigate',app.path);return}
 if(browserOpen.value&&!await closeBrowser())return
 if(app.kind==='tool'){if(snapshot)networkStore.updateNetworkStatus({...snapshot});activeTool.value=app;return}
 if(entryAvailability(app)!=='available'){unavailableApp.value=app;return}
 if(app.kind==='link'){window.open(app.path,'_blank','noopener,noreferrer');return}
}
async function launchPinned(app:HomeApplication){if(entryAvailability(app)!=='available'){unavailableApp.value=app;return}await launchInstalled(app,'home')}
let opener:HTMLElement|null=null,bodyOverflow='',inerted:HTMLElement[]=[],browserNetwork:Record<string,any>|undefined,unregisterBrowser:(()=>void)|undefined
function startEditing(){if(!provider.begin())return;cancelLaunch();editing.value=true;linkFormOpen.value=false;managingLinks.value=false;notice.value='';draft.value=[...homeApplicationSession.favorites];history.value=[]}
async function openBrowser(edit:boolean){if(edit&&!provider.editable())return;if(!props.collapsed&&requestLauncherBrowser(edit,props.network))return;if(document.querySelector('.ordered-editing'))return;if(props.hostOnly)await navigation?.open(edit);else await showBrowser(edit,{tab:'all',page:1},{v:1,search:'',scroll:0,focus:''})}
async function showBrowser(edit:boolean,view:LauncherView,memory:LauncherMemory){
 if(browserOpen.value){browserTab.value=view.tab;search.value=memory.search;libraryPage.value=view.page;if(edit)startEditing();return}
 if(document.querySelector('[data-applications-browser]'))return
 cancelLaunch()
 opener=document.activeElement as HTMLElement;if(edit)provider.begin();editing.value=edit;search.value=memory.search;browserTab.value=view.tab;libraryPage.value=view.page;linkFormOpen.value=false;managingLinks.value=false;notice.value='';draft.value=[...homeApplicationSession.favorites];history.value=[];bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';browserOpen.value=true
 await nextTick();const root=document.querySelector('.canvas-home');inerted=Array.from(root?.children||[]).filter((node):node is HTMLElement=>node instanceof HTMLElement&&!node.matches('.applications-browser,.applications-backdrop')&&!node.hasAttribute('inert'));inerted.forEach(node=>node.setAttribute('inert',''));document.querySelector<HTMLButtonElement>('.applications-close')?.focus()
}
function releaseModal(){inerted.forEach(node=>node.removeAttribute('inert'));inerted=[];document.body.style.overflow=bodyOverflow}
function hideBrowser(){cancelLaunch();browserOpen.value=false;linkFormOpen.value=false;releaseModal();draft.value=[];history.value=[];browserNetwork=undefined;const target=opener?.isConnected?opener:document.querySelector<HTMLElement>('[data-applications-hub] [data-all-apps]');target?.focus({preventScroll:true});opener=null;emit('close')}
async function closeBrowser(){if(saving())return false;if(props.hostOnly)return navigation?.close()??false;if(unsaved.value&&!window.confirm(t('尚有未保存的入口修改，确定放弃？','Discard unsaved shortcut changes?')))return false;hideBrowser();return true}
async function saveFavorites(){if(saving())return;try{await provider.saveFavorites([...draft.value]);closeBrowser()}catch(error){notice.value=error instanceof Error?error.message:t('保存失败，草稿保留','Save failed; draft retained')}}
function commit(ids:string[]){const next=[...new Set(ids)].slice(0,24);if(next.join('|')===draft.value.join('|'))return;history.value=[...history.value.slice(-29),[...draft.value]];draft.value=next}
function undoFavorite(){if(history.value.length)draft.value=history.value.pop()!}
function toggleFavorite(id:string){if(draft.value.includes(id))commit(draft.value.filter(v=>v!==id));else if(draft.value.length<24)commit([...draft.value,id])}
async function navigate(path:string){if(unsaved.value||saving())return;await navigation?.remember();emit('navigate',path)}
const unsaved=computed(()=>browserOpen.value&&(linkFormOpen.value||editing.value&&draft.value.join('|')!==homeApplicationSession.favorites.join('|')))
function beforeUnload(event:BeforeUnloadEvent){if(unsaved.value||saving()){event.preventDefault();event.returnValue=''}}
const navigation=useLauncherRoute({enabled:!!props.hostOnly,opened:browserOpen,tab:browserTab,page:libraryPage,search,dirty:unsaved,saving,show:showBrowser,hide:hideBrowser,confirm:()=>window.confirm(t('尚有未保存的入口修改，确定离开？','Leave without saving shortcut changes?')),settled:()=>provider.state.status!=='loading'&&!provider.preferencesLoading(),currentPage:()=>query.value.current})
function keyboard(event:KeyboardEvent){if(!browserOpen.value){if(event.key==='Escape'&&launchSource.value!=='browser'&&launchStatus.value!=='idle'){event.preventDefault();event.stopImmediatePropagation();dismissLaunch()}return}if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(linkFormOpen.value)void cancelLink();else closeBrowser();return}if(event.key==='Tab'){const controls=Array.from(document.querySelectorAll<HTMLElement>('.applications-browser button:not(:disabled),.applications-browser input:not(:disabled)')).filter(node=>node.getClientRects().length);const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}}
function resizeEditor(){editorColumns.value=window.innerWidth<650?2:4}
function visibility(){if(document.hidden){cancelLaunch();activeTool.value=null;unavailableApp.value=null;linkTarget.value=null}}
onMounted(()=>window.addEventListener('pagehide',cancelLaunch))
onUnmounted(()=>{activationAlive=false;cancelLaunch();window.removeEventListener('pagehide',cancelLaunch)})
onMounted(()=>{window.addEventListener('beforeunload',beforeUnload);if(props.collapsed)unregisterBrowser=registerLauncherBrowser((edit,network)=>{browserNetwork=network;void openBrowser(edit)},(app,source)=>{if(source==='traffic')void launchInstalled(app,'traffic');else void launchPinned(app)},cancelLaunch);document.addEventListener('keydown',keyboard,true);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',resizeEditor);if(hub.value){hubObserver=new ResizeObserver(()=>{const box=hub.value!.getBoundingClientRect();hubWidth.value=box.width;hubHeight.value=box.height});hubObserver.observe(hub.value)}});onUnmounted(()=>{window.removeEventListener('beforeunload',beforeUnload);unregisterBrowser?.();hubObserver?.disconnect();document.removeEventListener('keydown',keyboard,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',resizeEditor);if(browserOpen.value)releaseModal()})
</script>
<style src="./homeApplications.css" scoped></style>
