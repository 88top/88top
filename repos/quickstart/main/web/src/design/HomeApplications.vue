<template>
  <section v-if="!collapsed" ref="hub" class="home-applications fluid-applications" :class="{'applications-strip':resolved.id==='strip'}" :data-app-form="resolved.id" data-applications-hub>
    <header class="applications-heading">
      <div><StudioGlyph name="grid"/><h2>{{t('应用工具','Apps & tools')}}</h2></div>
      <div class="applications-actions widget-action-group"><WidgetPrimaryAction icon="grid" @click="openBrowser(false)" data-all-apps>{{t('查看全部','All')}}</WidgetPrimaryAction><WidgetMenu :label="t('应用与工具更多操作','More app and tool actions')" :items="[{id:'favorites',label:t('编辑快捷入口','Edit shortcuts')}]" @select="openBrowser(true)"/></div>
    </header>
      <div v-if="!favorites.length" class="applications-state"><StudioGlyph name="grid"/><span>{{t('把常用应用放在这里','Keep your favorite apps here')}}</span><button @click="openBrowser(true)">{{t('选择应用','Choose apps')}}</button></div>
      <div v-else class="applications-favorites" :style="{gridTemplateColumns:'repeat('+columns+', minmax(0,1fr))'}" :data-app-columns="columns" :data-app-capacity="capacity"><button v-for="app in favorites.slice(0,capacity)" :key="app.id" @click="activate(app)" :title="t(app.zh,app.en)+(entryAvailability(app)==='available'?'':' · '+availabilityText(app))" :data-favorite-app="app.id" :data-availability="entryAvailability(app)"><span class="application-icon" :class="app.tone"><StudioGlyph :name="app.glyph"/><i v-if="app.tool==='firmware'&&systemStore.checkUpdate?.needUpdate" class="launcher-update-dot" :aria-label="t('有可用更新','Update available')"/></span><span><strong>{{t(app.zh,app.en)}}</strong><small v-if="entryAvailability(app)!=='available'">{{availabilityText(app)}}</small></span></button></div>
    <div v-if="fallbackEntries.length" class="applications-fallback" data-applications-fallback><span>{{t('快捷操作','Quick actions')}}</span><button v-for="entry in fallbackEntries" :key="entry.path" @click="navigate(entry.path)" :data-home-entry="entry.path"><StudioGlyph :name="entry.glyph"/>{{t(entry.zh,entry.en)}}<StudioGlyph name="arrow"/></button></div>
  </section>
  <button v-else class="applications-collapsed" @click="openBrowser(false)" data-open-applications><StudioGlyph name="grid"/>{{t('应用工具','Apps & tools')}}</button>

  <Teleport v-if="browserOpen" to=".canvas-home">
    <div class="applications-backdrop" @click="closeBrowser"></div>
    <section class="applications-browser launchpad-browser" :class="{'launchpad-editor':editing,'launchpad-form':linkFormOpen}" role="dialog" aria-modal="true" :aria-label="linkFormOpen?t('链接设置','Link settings'):editing?t('编辑快捷入口','Edit shortcuts'):t('全部应用与工具','All apps and tools')" data-applications-browser :data-shortcut-history="history.length">
      <header><div><span>{{linkFormOpen?'YOUR SPACE':editing?t('首页常用入口','YOUR FAVORITES'):'APPS & TOOLS'}}</span><h2>{{linkFormOpen?(linkInitial?t('编辑链接','Edit link'):t('添加链接','Add a link')):editing?t('留下常用的，刚刚好','A place for your favorites'):t('你的应用与工具','Your apps & tools')}}</h2></div><button class="applications-close" @click="linkFormOpen?cancelLink():closeBrowser()" :aria-label="linkFormOpen?t('返回全部入口','Return to all entries'):t('关闭应用面板','Close apps')">{{linkFormOpen?'←':'×'}}</button></header>
      <div class="applications-browser-body">
        <LauncherLinkForm v-if="linkFormOpen" :initial="linkInitial" :entries="catalogue" @cancel="cancelLink" @saved="linkSaved"/>
        <template v-else>
        <template v-if="editing"><LauncherFavoriteGrid :ids="draft" :columns="editorColumns" :limit="24" @remove="toggleFavorite" @reorder="commit"/><div class="launcher-editor-toolbar"><button @click="undoFavorite" :disabled="!history.length" data-shortcut-undo>↶ {{t('撤销','Undo')}}</button><button @click="commit(applicationDefaults)" data-shortcut-restore>{{t('恢复默认八项','Restore eight defaults')}}</button></div><h3 class="launcher-library-heading">{{t('添加快捷入口','Add shortcuts')}}<small>{{t('应用目录为合成示例','Synthetic app catalogue')}}</small></h3></template>
        <label class="application-search"><StudioGlyph name="grid"/><input v-model="search" :placeholder="t('搜索应用或系统工具','Search apps or system tools')" :aria-label="t('搜索应用或系统工具','Search apps or system tools')"/></label>
        <div class="launchpad-controls"><div class="browser-category-tabs" role="group" :aria-label="t('入口分类','Shortcut categories')"><button v-for="tab in categories" :key="tab.id" :aria-pressed="browserTab===tab.id" :data-category="tab.id" @click="browserTab=tab.id">{{t(tab.zh,tab.en)}}</button></div><div v-if="!editing" class="launchpad-library-actions"><button @click="openLink()" data-add-link>＋ {{t('添加链接','Add link')}}</button><button v-if="linkCount" :aria-pressed="managingLinks" @click="managingLinks=!managingLinks" data-manage-links>{{managingLinks?t('完成','Done'):t('管理链接','Manage links')}}</button></div></div>
          <div v-if="catalogueState!=='ready'" class="applications-state launchpad-status" role="status" data-applications-state><span>{{stateText}}</span><button v-if="catalogueState==='error'||catalogueState==='permission'" @click="provider.retry">{{t('重试','Retry')}}</button></div>
          <div class="launchpad-result-line"><span>{{editing?t('可添加的入口','Available shortcuts'):t('所有入口','Your library')}} <strong data-library-total>{{query.total}}</strong></span><small>{{t('设计预览 · 合成数据','Design preview · Sample data')}}</small></div>
          <div v-if="!filteredApps.length" class="applications-state"><span>{{browserTab==='apps'&&catalogueState==='ready'&&!provider.state.apps.length?t('没有已安装的扩展应用，可前往软件中心。','No additional apps installed. Explore the software center.'):t('没有匹配的入口，试试其他关键词。','No matching entries. Try another search.')}}</span></div>
          <div v-else-if="editing" class="application-catalogue"><div v-for="app in filteredApps" :key="app.id"><span class="application-icon" :class="app.tone"><StudioGlyph :name="app.glyph"/></span><div><strong>{{t(app.zh,app.en)}}</strong><small>{{entryAvailability(app)!=='available'?availabilityText(app):t(app.detail,app.detailEn)}}</small></div><button @click="toggleFavorite(app.id)" :disabled="!draft.includes(app.id)&&(draft.length>=24||entryAvailability(app)!=='available')" :aria-pressed="draft.includes(app.id)" :aria-label="t('选择','Select ')+t(app.zh,app.en)" :data-select-app="app.id">{{draft.includes(app.id)?'✓':'+'}}</button></div></div>
          <div v-else class="launchpad-grid" data-launchpad-grid><div v-for="app in filteredApps" :key="app.id" class="launchpad-tile"><button class="launchpad-open" @click="activate(app)" :title="t(app.zh,app.en)+(entryAvailability(app)==='available'?'':' · '+availabilityText(app))" :aria-label="(entryAvailability(app)==='available'?t('打开','Open '):t('查看原因：','View reason: '))+t(app.zh,app.en)" :data-open-app="app.id" :data-unavailable-shortcut="entryAvailability(app)!=='available'?app.id:undefined" :data-availability="entryAvailability(app)" :data-browser-tool="app.kind==='tool'?app.id:undefined"><span class="application-icon" :class="app.tone"><StudioGlyph :name="app.glyph"/><i v-if="homeApplicationSession.favorites.includes(app.id)" class="launchpad-pin" :aria-label="t('已固定到首页','Pinned to home')"></i></span><strong>{{t(app.zh,app.en)}}</strong><small v-if="entryAvailability(app)!=='available'">{{availabilityText(app)}}</small></button><button v-if="managingLinks&&app.kind==='link'" class="launchpad-link-edit" @click="openLink(app)" :data-edit-link="app.id" :aria-label="t('编辑链接：','Edit link: ')+t(app.zh,app.en)">{{t('编辑','Edit')}}</button></div></div>
          <nav v-if="query.pages>1" class="launchpad-pagination" :aria-label="t('入口分页','Library pages')"><button :disabled="query.current===1" @click="changePage(query.current-1)" data-library-prev>{{t('上一页','Previous')}}</button><span data-library-page>{{query.current}} / {{query.pages}}</span><button :disabled="query.current===query.pages" @click="changePage(query.current+1)" data-library-next>{{t('下一页','Next')}}</button></nav>
        <p class="application-limit" v-if="editing&&draft.length>=24">{{t('已保存24个，请先移除一个再添加。','24 selected. Remove a shortcut to add another.')}}</p>
        <div v-if="!editing&&!collapsed&&fallbackEntries.length" class="browser-fallback"><h3>{{t('快捷操作','Quick actions')}}</h3><button v-for="entry in fallbackEntries" :key="entry.path" @click="navigate(entry.path)" :data-browser-quick="entry.path"><StudioGlyph :name="entry.glyph"/>{{t(entry.zh,entry.en)}}<StudioGlyph name="arrow"/></button></div>
        <p v-if="notice" class="launchpad-notice" role="status">{{notice}}</p>
        </template>
      </div>
      <footer v-if="!linkFormOpen"><template v-if="editing"><button @click="closeBrowser">{{t('取消','Cancel')}}</button><button class="applications-save" @click="saveFavorites">{{t('保存到首页','Save to home')}} · {{draft.length}}/24</button></template><template v-else><button @click="startEditing" data-manage-favorites>{{t('编辑快捷入口','Edit shortcuts')}}</button><button class="software-center" @click="navigate('/cgi-bin/luci/admin/store/pages/store')" data-browser-software-center>{{t('软件中心','Software center')}}<StudioGlyph name="arrow"/></button></template></footer>
    </section>
  </Teleport>
  <LauncherToolAction v-if="activeTool" :app="activeTool" @close="activeTool=null"/>
  <NetworkWidgetDialog v-if="linkTarget" :title="t('链接打开预览','Link destination preview')" @close="linkTarget=null"><div data-link-destination><p>{{t(linkTarget.zh,linkTarget.en)}}</p><p style="overflow-wrap:anywhere">{{linkTarget.path}}</p><p>{{t('正式环境将在新标签页打开；本次设计预览未访问该地址。','Opens in a new tab in the real product. This preview has not visited the address.')}}</p></div></NetworkWidgetDialog>
  <NetworkWidgetDialog v-if="unavailableApp" :title="t('入口暂不可用','Shortcut unavailable')" @close="unavailableApp=null"><div data-shortcut-unavailable><p>{{t(unavailableApp.zh,unavailableApp.en)}} · {{availabilityText(unavailableApp)}}</p><p>{{t('入口保留在原位置，你可以在编辑快捷入口中移除。','The shortcut stays in place. You can remove it in Edit shortcuts.')}}</p></div></NetworkWidgetDialog>
</template>
<script setup lang="ts">
import WidgetPrimaryAction from './WidgetPrimaryAction.vue'
import {computed,nextTick,onMounted,onUnmounted,ref,watch} from 'vue'
import StudioGlyph from './StudioGlyph.vue'
import WidgetMenu from './WidgetMenu.vue'
import {quickEntrances} from './canvasLayout'
import {applicationDefaults,homeApplicationSession,type HomeApplication} from './homeApplications'
import LauncherFavoriteGrid from './LauncherFavoriteGrid.vue'
import {registerLauncherBrowser,requestLauncherBrowser} from './launcherBrowserHost'
import {useLauncherCatalog,entryAvailability} from './launcherCatalog'
import {PAGE_SIZE,queryLibrary,linkSession} from './launcherLibrary'
import LauncherLinkForm from './LauncherLinkForm.vue'
import LauncherToolAction from './LauncherToolAction.vue'
import {useNetworkStore,useSystemStore} from '../plugins/store'
import NetworkWidgetDialog from './NetworkWidgetDialog.vue'
import {demo} from './fixtures'
import {resolvePresentation,type WidgetPreference} from './widgetPresentation'
const props=defineProps<{collapsed:boolean;fallbackEntries:Array<typeof quickEntrances[number]>;contained?:boolean;preference?:WidgetPreference;natural?:boolean;network?:any}>()
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
const favorites=computed(()=>homeApplicationSession.favorites.map(provider.resolve))
const stateText=computed(()=>catalogueState.value==='permission'?t('没有读取应用目录的权限，系统工具仍可使用。','No permission to read apps. System tools remain available.'):catalogueState.value==='error'?t('应用清单暂不可用，系统工具仍可使用。','Apps unavailable. System tools remain available.'):catalogueState.value==='loading'?t('正在读取应用清单…','Loading applications…'):t('还没有安装扩展应用，去软件中心发现更多。','No additional apps installed. Explore the software center.'))
function availabilityText(app:HomeApplication){const status=entryAvailability(app);return status==='uninstalled'?t('应用已卸载','App uninstalled'):status==='permission'?t('无访问权限','No access'):status==='unsupported'?t('固件不支持','Unsupported'):status==='no-entry'?t('暂无可用入口','No verified entry'):t('状态待确认','Status unknown')}
const query=computed(()=>queryLibrary(catalogue.value.map(a=>provider.resolve(a.id)),search.value,browserTab.value,libraryPage.value))
const filteredApps=computed(()=>query.value.entries)
watch([search,browserTab],()=>{libraryPage.value=1})
function changePage(page:number){libraryPage.value=page;document.querySelector('.applications-browser-body')?.scrollTo({top:0})}
async function openLink(app?:HomeApplication){if(editing.value)return;linkInitial.value=app;linkFormOpen.value=true;notice.value='';await nextTick();document.querySelector('.applications-browser-body')?.scrollTo({top:0})}
async function cancelLink(){linkFormOpen.value=false;linkInitial.value=undefined;await nextTick();document.querySelector<HTMLButtonElement>('[data-add-link]')?.focus()}
async function linkSaved(message:string,id?:string){await cancelLink();notice.value=message;search.value='';browserTab.value='links';await nextTick();const index=id?catalogue.value.filter(app=>app.kind==='link').findIndex(app=>app.id===id):-1;libraryPage.value=index>=0?Math.floor(index/PAGE_SIZE)+1:query.value.current;await nextTick();if(id)document.querySelector<HTMLButtonElement>('[data-open-app="'+id+'"]')?.focus()}
const networkStore=useNetworkStore()
function activate(app:HomeApplication){const snapshot=props.network||browserNetwork;if(browserOpen.value)closeBrowser();if(app.kind==='tool'){if(snapshot)networkStore.updateNetworkStatus({...snapshot});activeTool.value=app;return}if(entryAvailability(app)!=='available'){unavailableApp.value=app;return}if(app.kind==='link'){linkTarget.value=app;return}emit('navigate',app.path)}
let opener:HTMLElement|null=null,bodyOverflow='',inerted:HTMLElement[]=[],browserNetwork:Record<string,any>|undefined,unregisterBrowser:(()=>void)|undefined
function startEditing(){editing.value=true;linkFormOpen.value=false;managingLinks.value=false;notice.value='';draft.value=[...homeApplicationSession.favorites];history.value=[]}
async function openBrowser(edit:boolean){if(!props.collapsed&&requestLauncherBrowser(edit,props.network))return;if(document.querySelector('.ordered-editing')||document.querySelector('[data-applications-browser]'))return;opener=document.activeElement as HTMLElement;editing.value=edit;search.value='';browserTab.value='all';libraryPage.value=1;linkFormOpen.value=false;managingLinks.value=false;notice.value='';draft.value=[...homeApplicationSession.favorites];history.value=[];bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';browserOpen.value=true;await nextTick();const root=document.querySelector('.canvas-home');inerted=Array.from(root?.children||[]).filter((node):node is HTMLElement=>node instanceof HTMLElement&&!node.matches('.applications-browser,.applications-backdrop')&&!node.hasAttribute('inert'));inerted.forEach(node=>node.setAttribute('inert',''));document.querySelector<HTMLButtonElement>('.applications-close')?.focus()}
function releaseModal(){inerted.forEach(node=>node.removeAttribute('inert'));inerted=[];document.body.style.overflow=bodyOverflow}
function closeBrowser(){browserOpen.value=false;linkFormOpen.value=false;releaseModal();draft.value=[];history.value=[];browserNetwork=undefined;const target=opener?.isConnected?opener:document.querySelector<HTMLElement>('[data-applications-hub] [data-all-apps]');target?.focus({preventScroll:true});opener=null;emit('close')}
function saveFavorites(){homeApplicationSession.favorites=[...draft.value];closeBrowser()}
function commit(ids:string[]){const next=[...new Set(ids)].slice(0,24);if(next.join('|')===draft.value.join('|'))return;history.value=[...history.value.slice(-29),[...draft.value]];draft.value=next}
function undoFavorite(){if(history.value.length)draft.value=history.value.pop()!}
function toggleFavorite(id:string){if(draft.value.includes(id))commit(draft.value.filter(v=>v!==id));else if(draft.value.length<24)commit([...draft.value,id])}
function navigate(path:string){if(browserOpen.value)closeBrowser();emit('navigate',path)}
function keyboard(event:KeyboardEvent){if(!browserOpen.value)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(linkFormOpen.value)void cancelLink();else closeBrowser();return}if(event.key==='Tab'){const controls=Array.from(document.querySelectorAll<HTMLElement>('.applications-browser button:not(:disabled),.applications-browser input:not(:disabled)')).filter(node=>node.getClientRects().length);const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}}
function resizeEditor(){editorColumns.value=window.innerWidth<650?2:4}
function visibility(){if(document.hidden){if(browserOpen.value)closeBrowser();activeTool.value=null;unavailableApp.value=null;linkTarget.value=null}}
onMounted(()=>{if(props.collapsed)unregisterBrowser=registerLauncherBrowser((edit,network)=>{browserNetwork=network;void openBrowser(edit)});document.addEventListener('keydown',keyboard,true);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',resizeEditor);if(hub.value){hubObserver=new ResizeObserver(()=>{const box=hub.value!.getBoundingClientRect();hubWidth.value=box.width;hubHeight.value=box.height});hubObserver.observe(hub.value)}});onUnmounted(()=>{unregisterBrowser?.();hubObserver?.disconnect();document.removeEventListener('keydown',keyboard,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',resizeEditor);if(browserOpen.value)releaseModal()})
</script>
<style src="./homeApplications.css" scoped></style>
