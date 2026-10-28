<template>
    <main id="page" class="device-management" :aria-label="$gettext('局域网设备管理')">
        <nav class="breadcrumbs" :aria-label="$gettext('面包屑')"><router-link to="/">{{ $gettext('首页') }}</router-link><span aria-hidden="true">›</span><span>{{ $gettext('局域网设备管理') }}</span></nav>
        <nav class="primary-tabs" role="tablist" :aria-label="$gettext('局域网设备管理')">
            <button v-for="tab in tabs" :key="tab.id" type="button" role="tab" :aria-selected="activeTab === tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id"><HomeGlyph :name="tab.icon" />{{ tab.label }}</button>
        </nav>
        <section class="primary-content" role="tabpanel">
            <DeviceCenterList v-if="activeTab === 'devices'" />
            <DeviceGroupsPanel v-else-if="activeTab === 'groups'" />
            <LanSettingsPanel v-else />
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGettext } from '/@/plugins/i18n'
import DeviceCenterList from './deviceCenterList.vue'
import DeviceGroupsPanel from './deviceGroupsPanel.vue'
import LanSettingsPanel from './lanSettingsPanel.vue'
import HomeGlyph from '/@/home/HomeGlyph.vue'
import './deviceVisualTokens.css'

const { $gettext } = useGettext()
const activeTab = ref<'devices'|'groups'|'settings'>('devices')
const tabs = computed(() => [
    { id: 'devices' as const, icon: 'devices', label: $gettext('设备') },
    { id: 'groups' as const, icon: 'layers', label: $gettext('分组与计划') },
    { id: 'settings' as const, icon: 'tune', label: $gettext('局域网设置') },
])
</script>

<style lang="scss" scoped>
.device-management { width: 100%; max-width: none; margin: 0; color: var(--device-text); font-size: 14px; }.breadcrumbs { display: flex; align-items: center; gap: 7px; margin-bottom: 18px; padding-top: 4px; font-size: 13px; }.breadcrumbs a { color: var(--breadcrumbs-tit-color); text-decoration: none; }.breadcrumbs span:last-child { color: var(--breadcrumbs-tit-color1); }.primary-tabs { display: flex; gap: 6px; padding: 5px; background: var(--device-panel); border: 1px solid var(--device-line); border-bottom: 0; border-radius: 10px 10px 0 0; }.primary-tabs button { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 8px 16px; color: var(--device-muted); background: transparent; border: 0; border-radius: 7px; cursor: pointer; }.primary-tabs button svg { width: 18px; height: 18px; flex: none; }.primary-tabs button.active { color: var(--device-accent); background: var(--device-accent-soft); font-weight: 600; }.primary-tabs button:focus-visible { outline: 2px solid var(--device-accent); outline-offset: 2px; }.primary-content { min-height: 62vh; padding: 18px; background: var(--device-panel); border: 1px solid var(--device-line); border-top: 0; border-radius: 0 0 10px 10px; }
@media(max-width:700px){.primary-tabs{overflow-x:auto}.primary-tabs button{flex:1;justify-content:center;min-width:max-content;padding:8px 11px}.primary-content{padding:13px}}
@media(max-width:420px){.primary-tabs button{min-width:0;padding:8px 6px;font-size:13px;white-space:normal}.primary-tabs button svg{display:none}.primary-content{padding:11px 8px}}
</style>

<style lang="scss">
.device-management header::before,
.device-management header::after { content: none!important; display: none!important; pointer-events: none!important; }
.device-management .group-header,
.device-management .lan-settings > header { color: var(--tit-color)!important; background: transparent!important; }
@media(max-width:420px){a.btn[href="/cgi-bin/luci/admin/system/admin"]{max-width:140px;white-space:normal;overflow-wrap:anywhere;text-align:center}}
@media(prefers-color-scheme:dark){body:not([theme="light"]){background:#151518}}
body[theme="dark"]{background:#151518}
@media(prefers-color-scheme:dark){
    body:not([theme="light"]) .device-management .feedback.error,
    body:not([theme="light"]) .device-management .batch-result.partial,
    body:not([theme="light"]) .device-management .batch-result.failed,
    body:not([theme="light"]) .device-management .state-pill.orphaned,
    body:not([theme="light"]) .device-management .state-pill.unsupported,
    body:not([theme="light"]) .device-management .capability-pill.not_installed,
    body:not([theme="light"]) .device-management .capability-pill.error { color:#ffbd8a!important; background:rgba(255,145,77,.12)!important }
    body:not([theme="light"]) .device-management .feedback.success,
    body:not([theme="light"]) .device-management .batch-result.all_success,
    body:not([theme="light"]) .device-management .capability-pill.available { color:#7cdda9!important; background:rgba(38,162,105,.14)!important }
    body:not([theme="light"]) .device-management .telemetry-notice,
    body:not([theme="light"]) .device-management .attention { color:#ffd37a!important; background:rgba(255,196,77,.11)!important; border-color:rgba(255,196,77,.3)!important }
}
body[theme="dark"] .device-management .feedback.error,
body[theme="dark"] .device-management .batch-result.partial,
body[theme="dark"] .device-management .batch-result.failed { color:#ffbd8a!important; background:rgba(255,145,77,.12)!important }
</style>
