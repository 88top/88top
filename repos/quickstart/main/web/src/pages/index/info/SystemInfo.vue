<template>
    <Card class="system-read-card" :class="{'system-read-pending':loading}" :aria-busy="loading||undefined" :data-system-loading="loading||undefined" :home-menu="[{label:$gettext('系统监控'),action:onClickSystem},{label:$gettext('备份升级'),href:'/cgi-bin/luci/admin/system/flash'},{label:$gettext('插件备份'),href:'/cgi-bin/luci/admin/store/pages/maintance'}]" :title='$gettext("系统信息")' :showFooter="false" style="width: 100%;height: 100%; display: block;">
        <template #icon>
            <computerIcon class="icon computerIcon" />
        </template>
        <template #settings>
            <button type="button" class="btn_settings" @click="openInfo">
                <computerIcon color="#0a0a0a" class="icon2 computerIcon" style="margin-right: 6px;" />
                <span>{{ $gettext('信息概览') }}</span>
            </button>
        </template>
        <template #settings-menu>
            <div><a @click="onClickSystem">{{ $gettext("系统监控") }}</a></div>
            <div><a href="/cgi-bin/luci/admin/system/flash">{{ $gettext("备份升级") }}</a></div>
            <div><a href="/cgi-bin/luci/admin/store/pages/maintance">{{ $gettext("插件备份") }}</a></div>
        </template>
        <div class="content system-composition" :aria-hidden="loading||undefined" :inert="loading">
            <div class="chart_box">
                <div class="chart">
                    <PieChart :value="getCpuUsage" :color="getCpuUsageColor" icon="chip" :label="systemStatus?`${getCpuUsage}%`:'—'" width="150px"
                        height="150px" />
                    <div>{{ $gettext("CPU使用率") }}</div>
                </div>
                <div class="chart">
                    <PieChart :value="getTemperature / 1.5" :color="getTemperatureColor" icon="temperature"
                        :label="systemStatus?`${getTemperature}℃`:'—'" width="150px" height="150px" />
                    <div>{{ $gettext("CPU温度") }}</div>
                </div>
                <div class="chart">
                    <PieChart :value="getMemUsage" :color="getMemUsageColor" icon="lightning" :label="systemStatus?`${getMemUsage}%`:'—'"
                        width="150px" height="150px" />
                    <div>{{ $gettext("内存使用率") }}</div>
                </div>
            </div>
            <div class="system-facts" data-system-facts>
                <dl class="system-fact-list">
                    <div class="system-fact system-fact--wide system-fact--model" data-system-fact="model">
                        <dt class="system-fact-label"><chipIcon color="currentColor" aria-hidden="true"/><span>{{ $gettext("设备型号") }}</span></dt>
                        <dd class="system-fact-value">{{ version?.model || '—' }}</dd>
                    </div>
                    <div class="system-fact system-fact--wide system-fact--firmware" data-system-fact="firmware">
                        <dt class="system-fact-label"><systemIcon color="currentColor" aria-hidden="true"/><span>{{ $gettext("固件版本") }}</span></dt>
                        <dd class="system-fact-value">{{ version?.firmwareVersion || '—' }}<small class="system-kernel">{{ $gettext("内核") }} {{ version?.kernelVersion || '—' }}</small></dd>
                    </div>
                    <div class="system-fact" data-system-fact="time">
                        <dt class="system-fact-label"><HomeGlyph name="clock"/><span>{{ $gettext("系统时间") }}</span></dt>
                        <dd class="system-fact-value">{{ systemStatus?.localtime || '—' }}</dd>
                    </div>
                    <div class="system-fact" data-system-fact="uptime">
                        <dt class="system-fact-label"><HomeGlyph name="power"/><span>{{ $gettext("已启动") }}</span></dt>
                        <dd class="system-fact-value">{{ systemStatus?stamp(systemStatus.uptime):'—' }}</dd>
                    </div>
                </dl>
            </div>
        </div>
        <SystemReadState :loading="loading" :error="readError" @retry="$emit('retry')"/>
    </Card>
</template>

<script lang="ts" setup>
import Card from "../components/Card.vue"
import PieChart from "../components/PieChart.vue"
import computerIcon from "/@/components/svg/computer.vue"
import chipIcon from "/@/components/svg/chip.vue"
import systemIcon from "/@/components/svg/system1.vue"
import HomeGlyph from '/@/home/HomeGlyph.vue'

import { computed, onMounted, ref } from "vue"
import { useGettext } from '/@/plugins/i18n'
import { useSystemStore } from "/@/plugins/store"
import utils from "/@/utils"
import appUtils from "/@/utils/app";
import SystemReadState from '/@/home/SystemReadState.vue'
import {useHomeProjection} from '/@/home/widgetContext'

defineProps<{loading?:boolean;readError?:string}>()
defineEmits<{(e:'retry'):void}>()

const { $gettext } = useGettext()
const systemStore = useSystemStore()
const home = useHomeProjection()
const version = computed(() => home ? home.data.version : systemStore.version)
const systemStatus = computed(() => home ? home.data.system : systemStore.systemStatus)
const showBlockMenu = ref(false)
const getCpuUsage = computed(() => {
    return systemStatus.value?.cpuUsage || 0
})
const getTemperature = computed(() => {
    return systemStatus.value?.cpuTemperature || 0
})
const getMemUsage = computed(() => {
    const result = systemStatus.value?.memAvailablePercentage || 100
    return 100 - result
})

// 计算 CPU 使用率颜色
const getCpuUsageColor = computed(() => {
    const cpuUsage = getCpuUsage.value;
    if (cpuUsage < 76) return "#3b82f6";
    if (cpuUsage >= 76 && cpuUsage < 96) return "#f59e0b";
    return "#ef4444";
});
// 计算 CPU 温度颜色
const getTemperatureColor = computed(() => {
    const temperature = getTemperature.value;
    // if (temperature <= 55) return "#22c55e"; // Green
    // if (temperature > 55 && temperature <= 70) return "#f97316"; // Orange
    // return "#dc2626"; // Red
    if (temperature <= 115) return "#22c55e";
    return "#f97316"
});
// 计算内存使用率颜色
const getMemUsageColor = computed(() => {
    const memUsage = getMemUsage.value;
    if (memUsage < 76) return "#8b5cf6"; // Green
    if (memUsage >= 76 && memUsage < 96) return "#fb923c"; // Orange
    return "#b91c1c"; // Red
});

const openInfo = () => {
    location.href = "/cgi-bin/luci/admin/status/overview"
}

const stamp = utils.stampForm
onMounted(() => {
})

const BlockMenu = () => {
    showBlockMenu.value = !showBlockMenu.value
}

const onClickSystem = () => {
    BlockMenu()
    appUtils.installAndGo("app-meta-netdata", "NetData", "/cgi-bin/luci/admin/status/netdata")
}
</script>

<style lang="scss" scoped>
.icon {
    width: 1.3rem;
    height: 1.3rem;
}

.icon2 {
    width: 1rem;
    height: 1rem;
}

:deep(.computerIcon) {
    path {
        fill: var(--app-container_title-color) !important;
    }
}

a {
    color: #1e1e1e;
    text-decoration: none;
    cursor: pointer;
    font-size: 14px;
    display: block;

}

.content {
    color: #333;
    margin-top: 20px;
    margin-bottom: 20px;
    padding: 0 10px;
    font-weight: normal;

    .chart_box {
        padding-bottom: 20px;
        border-bottom: 1px solid var(--btn-border-color);
        margin-bottom: 20px;
        display: flex;

        .chart {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            color: var(--app-container_title-color);

            >div {
                margin-top: 4px;
            }
        }
    }

}
.system-facts{min-width:0;container:system-facts / inline-size}
.system-fact-list{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin:0;padding:0}
.system-fact{min-width:0;text-align:left}
.system-fact--wide{grid-column:1 / -1}
.system-fact-label{display:flex;align-items:center;gap:8px;margin:0;color:var(--c-muted,#5b687a);font-size:12px;font-weight:400;line-height:18px}
.system-fact-label>svg{width:16px;height:16px;flex:none;color:var(--color-icon-slate,#526078)}
.system-fact-value{margin:4px 0 0;color:var(--c-text,#253247);font-size:14px;font-weight:400;line-height:21px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.system-fact--model>.system-fact-value,.system-fact--model>.system-fact-label>svg{color:var(--home-icon-blue,#155dfc)}
.system-fact--firmware>.system-fact-value,.system-fact--firmware>.system-fact-label>svg{color:var(--color-icon-green,#007e34)}
.system-fact--wide>.system-fact-value{font-weight:500}
.system-kernel{display:block;margin-top:4px;color:var(--c-muted,#5b687a);font-size:12px;font-weight:400;line-height:18px}
@container system-facts (min-width:296px){.system-fact-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
.btn_settings {
    position: relative;
    padding: 6px 18px;
    border-radius: 4px;
    border: 1px solid var(--btn-border-color);
    line-height: 1;
    display: flex;
    align-items: center;
}
</style>

<style lang="scss" scoped>
@media screen and (max-width: 768px) {
    .content {
        margin-top: 10px;
        margin-bottom: 10px;
        padding: 0 4px;

        .chart_box {
            padding-bottom: 10px;
            margin-bottom: 10px;
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;

            &::-webkit-scrollbar {
                display: none; // ✅ 推荐：直接隐藏滚动条（webkit）
            }

            scrollbar-width: none;
        }

    }
}
</style>
