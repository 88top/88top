<template>
 <form class="launchpad-link-form" @submit.prevent="save" data-link-form>
  <p class="link-intro">{{t('把常用的服务或网站收进来。仅保存在本次设计预览，刷新后恢复。','Keep a service or website here. Preview changes reset on reload.')}}</p>
  <label>{{t('名称','Name')}}<input ref="nameInput" v-model="draft.name" maxlength="64" required autocomplete="off" data-link-name :placeholder="t('例如：家庭 NAS','For example: Home NAS')"/></label>
  <label>{{t('地址','Address')}}<input v-model="draft.url" maxlength="2048" required autocomplete="off" inputmode="url" data-link-url placeholder="https://"/><small>{{t('支持 HTTP / HTTPS，正式环境在新标签页打开。','HTTP / HTTPS. Opens in a new tab in the real product.')}}</small></label>
  <fieldset><legend>{{t('图标','Icon')}}</legend><div class="link-icon-options"><button type="button" v-for="icon in linkIcons" :key="icon" @click="draft.glyph=icon" :aria-pressed="draft.glyph===icon" :aria-label="t('图标：','Icon: ')+icon"><StudioGlyph :name="icon"/></button></div></fieldset>
  <label v-if="!initial" class="link-pin"><input v-model="draft.pin" type="checkbox" :disabled="homeApplicationSession.favorites.length>=24" data-link-pin/>{{t('同时固定到首页','Also pin to homepage')}}<small>{{homeApplicationSession.favorites.length}} / 24</small></label>
  <p v-if="!initial&&homeApplicationSession.favorites.length>=24" class="link-intro">{{t('首页已满，仍可添加到全部入口。','Homepage full. You can still add this link to All.')}}</p>
  <p v-if="duplicate" class="link-notice" data-link-duplicate>{{t('已有相同地址：','An entry already uses this address: ')}}{{t(duplicate.zh,duplicate.en)}}{{t('。可取消后使用原入口，也可保留为独立链接。','. Cancel to reuse it, or save a separate link.')}}</p>
  <p v-if="error" role="alert" class="link-error" data-link-error>{{errorText}}</p>
  <div v-if="confirming" class="link-delete-confirm" role="alert" data-link-delete-confirm><p>{{t('删除此链接？如已固定，也会从首页移除；不会卸载应用或关闭服务。','Delete this link and its homepage pin? Apps and services are unaffected.')}}</p><button type="button" @click="remove" data-link-confirm-delete>{{t('确认删除','Confirm delete')}}</button><button type="button" @click="confirming=false">{{t('保留','Keep')}}</button></div>
  <footer><button v-if="initial&&!confirming" type="button" class="link-delete" @click="confirming=true" data-link-delete>{{t('删除链接','Delete link')}}</button><span></span><button type="button" @click="$emit('cancel')">{{t('取消','Cancel')}}</button><button type="submit" class="link-save" data-link-save>{{t('保存链接','Save link')}}</button></footer>
 </form>
</template>
<script setup lang="ts">
import {computed,nextTick,onMounted,reactive,ref} from 'vue'
import StudioGlyph from './StudioGlyph.vue'
import {homeApplicationSession,type HomeApplication} from './homeApplications'
import {linkIcons,saveLink,deleteLink,sameAddress,type LinkDraft} from './launcherLibrary'
const props=defineProps<{initial?:HomeApplication;entries:HomeApplication[]}>(),emit=defineEmits<{(e:'cancel'):void;(e:'saved',message:string,id?:string):void}>()
const t=(zh:string,en:string)=>window.vue_lang==='en'?en:zh
const draft=reactive<LinkDraft>({id:props.initial?.id,name:props.initial?.zh||'',url:props.initial?.path||'',glyph:props.initial?.glyph||'globe',pin:false})
const error=ref(''),confirming=ref(false),nameInput=ref<HTMLInputElement|null>(null)
const duplicate=computed(()=>sameAddress(draft.url,props.entries,draft.id))
const errorText=computed(()=>({name:t('请输入1～64字名称。','Enter a name of 1–64 characters.'),url:t('请输入有效HTTP(S)地址，不含空白或登录凭据。','Use a valid HTTP(S) address without whitespace or credentials.'),icon:t('请选择内置图标。','Choose a built-in icon.'),limit:t('已达到64条链接上限，请先删除不再使用的链接。','64-link limit reached. Remove an unused link first.'),pins:t('首页已固定24项，请取消同时固定或先移除一项。','Homepage has 24 pins. Uncheck pin or remove one first.'),missing:t('链接已不存在，请返回重试。','This link no longer exists. Return and retry.')} as Record<string,string>)[error.value])
function save(){const result=saveLink(draft);if(result.error){error.value=result.error;return}emit('saved',t('链接已保存','Link saved'),result.entry!.id)}
function remove(){if(props.initial)deleteLink(props.initial.id);emit('saved',t('链接已删除','Link deleted'))}
onMounted(async()=>{await nextTick();nameInput.value?.focus()})
</script>
<style scoped>
.launchpad-link-form{max-width:640px;margin:0 auto;font-size:14px}.link-intro{color:var(--c-muted);line-height:1.8;margin:0 0 22px}.launchpad-link-form>label:not(.link-pin){display:flex;flex-direction:column;gap:9px;margin:20px 0;font-weight:600}.launchpad-link-form input:not([type=checkbox]){box-sizing:border-box;width:100%;min-width:0;border:1px solid var(--c-line);background:var(--c-soft);color:var(--c-text);border-radius:10px;min-height:46px;padding:10px 13px;font:400 14px Arial,"Microsoft YaHei",sans-serif}.launchpad-link-form small{font-size:12px;color:var(--c-muted);font-weight:400;line-height:1.7}.launchpad-link-form fieldset{border:0;padding:0;margin:24px 0}.launchpad-link-form legend{font-weight:600;margin-bottom:12px}.link-icon-options{display:flex;gap:8px;flex-wrap:wrap}.launchpad-link-form button{font:inherit;border:1px solid var(--c-line);color:var(--c-text);background:var(--c-soft);border-radius:9px;min-height:44px;padding:9px 14px;cursor:pointer}.link-icon-options button{width:48px;height:48px;padding:12px}.link-icon-options svg{width:22px;height:22px}.link-icon-options [aria-pressed=true]{border-color:var(--c-accent);color:var(--c-accent)}.link-pin{display:flex;align-items:center;gap:10px;min-height:44px;flex-wrap:wrap}.link-pin input{width:18px;height:18px}.link-pin small{margin-left:auto}.link-notice,.link-error,.link-delete-confirm{padding:12px 14px;background:var(--c-soft);border-radius:10px;font-size:13px;line-height:1.8;overflow-wrap:anywhere}.link-error,.link-delete{color:var(--c-warning)!important}.link-delete-confirm button{margin:5px 8px 0 0}.launchpad-link-form footer{display:flex;gap:8px;flex-wrap:wrap;margin-top:28px;padding:18px 0;border-top:1px solid var(--c-line)}.launchpad-link-form footer span{flex:1}.launchpad-link-form .link-save{background:var(--c-accent);border-color:var(--c-accent);color:white}.launchpad-link-form :focus-visible{outline:2px solid var(--c-accent);outline-offset:3px}
</style>
