import {computed,onMounted,reactive,ref} from 'vue'
import {createHomeConfigClient,configValuesEqual,type ConfigSnapshot} from './configClient'
import {HomeConfigError,type ConfigDomain,type ConfigValue,type LayoutConfig,type LauncherConfig} from './configContract'
import {defaultLayout,defaultLauncher} from './defaults'

export const configErrorText=(error:unknown)=>{
 const en=window.vue_lang==='en',code=error instanceof HomeConfigError?error.code:'unavailable'
 if(code==='unsupported')return en?'This backend does not support homepage configuration. Showing defaults; saving is unavailable.':'当前后端不支持首页配置，暂用默认内容，无法保存。'
 const labels:Record<string,[string,string]>={conflict:['另一窗口已保存。草稿仍保留；请先取消编辑并重新读取，再合并修改。','Another window saved. Keep your draft, then cancel and reload before merging.'],forbidden:['登录已失效或没有权限，请重新登录。','Session expired or access denied. Sign in again.'],future:['配置来自更新版本，当前页面只读。','Configuration requires a newer version. This page is read only.'],readonly:['配置需要恢复，当前禁止覆盖。','Configuration needs recovery; overwriting is disabled.'],uncertain:['保存结果尚未确认，草稿已保留。请重试读取，勿重复提交。','Save outcome is unconfirmed. Draft retained. Reload to confirm before submitting again.'],invalid:['配置结构不兼容，未保存。','Configuration is incompatible and was not saved.'],unavailable:['暂时无法读取路由器配置，正在临时展示内置首页。','Router configuration is unavailable. Showing built-in defaults temporarily.']}
 return labels[code][en?1:0]
}
export function useHomeConfig(){
 const client=createHomeConfigClient(),layout=ref(defaultLayout()),launcher=ref(defaultLauncher())
 const state=reactive<Record<ConfigDomain,{loading:boolean;saving:boolean;snapshot?:ConfigSnapshot;error:string;uncertain:boolean}>>({layout:{loading:true,saving:false,error:'',uncertain:false},launcher:{loading:true,saving:false,error:'',uncertain:false}})
 const base:Partial<Record<ConfigDomain,string>>={},pending:Partial<Record<ConfigDomain,ConfigValue>>={}
 function accept(domain:ConfigDomain,snapshot:ConfigSnapshot){
  state[domain].snapshot=snapshot
  if(snapshot.value){if(domain==='layout')layout.value=snapshot.value as LayoutConfig;else launcher.value=snapshot.value as LauncherConfig}
 }
 async function read(domain:ConfigDomain){const s=state[domain];if(s.saving)return;s.loading=true;s.error='';try{const snapshot=await client.read(domain);accept(domain,snapshot);if(pending[domain]&&snapshot.state==='saved'&&configValuesEqual(pending[domain],snapshot.value)){base[domain]=snapshot.version;delete pending[domain]}s.uncertain=false}catch(error){s.error=configErrorText(error)}finally{s.loading=false}}
 function editable(domain:ConfigDomain){const s=state[domain];return !s.loading&&!s.saving&&!s.error&&!s.uncertain&&s.snapshot?.state==='saved'}
 function begin(domain:ConfigDomain){if(!editable(domain))return false;base[domain]=state[domain].snapshot!.version;return true}
 async function save(domain:ConfigDomain,value:ConfigValue){
  const s=state[domain],version=base[domain]
  if(!version||!editable(domain))throw new Error(s.error||configErrorText(new HomeConfigError('readonly')))
  if(s.snapshot?.version===version&&configValuesEqual(s.snapshot.value,value)){delete pending[domain];return}
  s.saving=true
  try{accept(domain,await client.save(domain,version,value));base[domain]=s.snapshot!.version;s.error='';delete pending[domain]}
  catch(error){if(error instanceof HomeConfigError&&error.code==='uncertain'){s.uncertain=true;pending[domain]=JSON.parse(JSON.stringify(value))}s.error=configErrorText(error);throw new Error(configErrorText(error))}
  finally{s.saving=false}
 }
 onMounted(()=>{void read('layout');void read('launcher')})
 async function recover(domain:ConfigDomain){const s=state[domain];if(!s.snapshot?.recoveryVersion||!['backup','damaged'].includes(s.snapshot.state)||s.loading||s.saving)return;s.saving=true;try{accept(domain,await client.recover(domain,s.snapshot.recoveryVersion,s.snapshot.state==='damaged'));s.error='';s.uncertain=false}catch(error){s.error=configErrorText(error)}finally{s.saving=false}}
 return {layout,launcher,state,begin,save,recover,read,editable,layoutEditable:computed(()=>editable('layout')),launcherEditable:computed(()=>editable('launcher'))}
}
