<template>
 <div class="presentation-settings">
  <p class="direct-panel-note">{{t('选择形态与排布，页面同步预览；采用前不会改变草稿。','Preview a form and layout. Your draft changes only when adopted.')}}</p>
  <div class="presentation-forms" aria-label="展示形态"><button v-for="form in forms" :key="form" :aria-pressed="value.mode===form" :data-presentation-form="form" @click="update({mode:form})"><span class="presentation-mini" :class="form"><i></i><i></i><i></i></span>{{label(form)}}</button></div>
  <section v-if="id==='applications'&&value.mode!=='strip'" class="presentation-options"><h3>{{t('图标排布','Icon layout')}}</h3><div><button v-for="n in rowOptions" :key="n" :aria-pressed="value.iconRows===n" :data-icon-rows="n" @click="update({iconRows:n})">{{[t('自动','Auto'),t('单行','One row'),t('双行','Two rows'),t('三行','Three rows')][n]}}</button></div><p>{{t('条目较少时采用均衡排布，超过容量的常用项仍在全部面板。','Fewer items stay balanced. Items beyond capacity remain in All.')}}</p></section>
 </div>
</template>
<script setup lang="ts">
import {definition,type WidgetPreference} from './widgetPresentation'
import {computed} from 'vue'
import type {WidgetId} from './rowLayout'
const props=defineProps<{id:WidgetId;value:WidgetPreference}>(),emit=defineEmits<{(e:'update',value:WidgetPreference):void}>()
const forms=computed<Array<WidgetPreference['mode']>>(()=>['auto',...definition(props.id).forms]),rowOptions:Array<WidgetPreference['iconRows']>=[0,1,2,3]
const english=window.vue_lang==='en',t=(zh:string,en:string)=>english?en:zh
const label=(form:string)=>props.id==='system'&&form==='standard'?t('完整信息','Complete information'):props.id==='system'&&form==='summary'?t('紧凑概览','Compact overview'):({auto:t('自动推荐','Automatic'),standard:t('标准','Standard'),summary:t('摘要','Summary'),grid:t('图标网格','Icon grid'),strip:t('启动条','Launch strip')}[form]||form)
function update(change:Partial<WidgetPreference>){emit('update',{...props.value,...change,ruleVersion:2})}
</script>
