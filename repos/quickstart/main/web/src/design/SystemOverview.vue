<template><Card :title="t('系统信息','System information')" class="system-overview" data-system-form="summary"><template #icon><ComputerIcon class="icon"/></template><template #settings><div class="system-overview-actions widget-action-group"><WidgetPrimaryAction icon="chip" class="system-overview-primary" @click="overview" data-system-overview><template #icon><ComputerIcon color="currentColor"/></template>{{t('信息概览','Overview')}}</WidgetPrimaryAction></div></template><div class="system-overview-metrics"><div v-for="metric in metrics" :key="metric.id" :data-system-metric="metric.id"><span>{{metric.label}}</span><strong>{{metric.value}}<small>{{metric.unit}}</small></strong><i><b :style="{width:metric.percent+'%',background:metric.color}"></b></i></div></div><p class="system-overview-uptime"><span>{{t('已启动','Uptime')}}</span><strong data-system-uptime>{{uptime}}</strong></p></Card></template>
<script setup lang="ts">
import WidgetPrimaryAction from './WidgetPrimaryAction.vue'
import {computed} from 'vue'
import {useSystemStore} from '../plugins/store'
import utils from '../utils'
import Card from '../pages/index/components/Card.vue'
import ComputerIcon from '../components/svg/computer.vue'
defineEmits<{(e:'details'):void}>()
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh,store=useSystemStore()
// Keep the audited original numeric conventions, including its documented
// zero-available-memory ||100 issue. A visual change is not a silent bug fix.
const metrics=computed(()=>{const s=store.systemStatus,cpu=s?.cpuUsage||0,temp=s?.cpuTemperature||0,mem=100-(s?.memAvailablePercentage||100);return [{id:'cpu',label:t('CPU使用率','CPU usage'),value:cpu,unit:'%',percent:Math.max(0,Math.min(100,cpu)),color:cpu<76?'#3b82f6':cpu<96?'#f59e0b':'#ef4444'},{id:'temperature',label:t('CPU温度','CPU temp'),value:temp,unit:'℃',percent:Math.max(0,Math.min(100,temp/1.5)),color:temp<=115?'#22c55e':'#f97316'},{id:'memory',label:t('内存使用率','Memory'),value:mem,unit:'%',percent:Math.max(0,Math.min(100,mem)),color:mem<76?'#8b5cf6':mem<96?'#fb923c':'#b91c1c'}]})
const uptime=computed(()=>utils.stampForm(store.systemStatus?.uptime))
function overview(){window.dispatchEvent(new CustomEvent('quickstart-business-destination',{detail:{href:'/cgi-bin/luci/admin/status/overview'}}))}
</script>
<style scoped>
.system-overview :deep(.icon path){fill:var(--c-text,var(--app-container_title-color))}
.system-overview{height:auto;min-height:148px;padding:14px 16px!important;font-family:Arial,"Microsoft YaHei",sans-serif;box-sizing:border-box}.icon{width:20px;height:20px}.system-overview-actions{display:flex;align-items:center;gap:6px}.system-overview-primary{font:12px Arial,"Microsoft YaHei",sans-serif!important;padding:7px 9px!important;color:var(--c-text);background:none;cursor:pointer}.system-overview-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:14px}.system-overview-metrics>div{min-width:0}.system-overview-metrics span{font-size:12px;line-height:1.5;color:var(--c-muted);display:block}.system-overview-metrics strong{display:block;font-size:24px;line-height:1.3;font-weight:500;font-variant-numeric:tabular-nums;margin:3px 0 8px;color:var(--c-text)}.system-overview-metrics small{font-size:12px;margin-left:3px}.system-overview-metrics i{display:block;height:3px;border-radius:4px;overflow:hidden;background:var(--c-soft)}.system-overview-metrics b{display:block;height:100%}.system-overview-uptime{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:12px;line-height:1.5;color:var(--c-muted);margin:12px 0 0!important}.system-overview-uptime strong{font-weight:400;color:var(--c-text);overflow-wrap:anywhere;text-align:right}@media(max-width:450px){.system-overview{padding:12px!important}.system-overview-metrics{gap:10px}.system-overview-metrics strong{font-size:22px}.system-overview-primary{padding:6px!important}}
.system-overview{padding:12px 14px!important;gap:0!important}.system-overview-metrics{margin-top:8px}.system-overview-metrics strong{font-size:22px;line-height:1.2;margin:2px 0 5px}.system-overview-uptime{margin-top:8px!important;line-height:1.3}
</style>
