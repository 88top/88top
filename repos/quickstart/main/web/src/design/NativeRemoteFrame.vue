<template><section class="native-remote-frame" :data-native-remote-frame="stage"><h3>DDNSTO · {{english?'Design simulation':'设计模拟'}}</h3><p>{{english?'The original wizard embeds www.kooldns.cn here.':'原向导在此嵌入 www.kooldns.cn 授权／绑定页面。'}}</p><p>{{english?'Use a synthetic callback to review the following steps. No account or external request is used.':'使用合成回调预览后续步骤，不使用真实账号，不发出外部请求。'}}</p><button type="button" @click="simulate">{{stage==='auth'?(english?'Simulate authorization':'模拟授权'):(english?'Simulate domain binding':'模拟绑定域名')}}</button></section></template>
<script setup lang="ts">
const props=defineProps<{stage:'auth'|'bind'}>(),english=window.vue_lang==='en'
function simulate(){window.dispatchEvent(new MessageEvent('message',{origin:location.origin,data:props.stage==='auth'?{auth:'ddnsto',sign:'preview-sign',token:'preview-token'}:{auth:'ddnsto',url:'https://preview-ddnsto.example.invalid'}}))}
</script>
<style scoped>
.native-remote-frame{font:14px/1.7 Arial,"Microsoft YaHei",sans-serif;padding:16px;text-align:left;border:1px dashed #abc;border-radius:8px;color:#333}.native-remote-frame h3{font-size:16px;margin:0 0 12px}.native-remote-frame button{padding:8px 12px;border:1px solid #abc;border-radius:6px;cursor:pointer}
</style>
