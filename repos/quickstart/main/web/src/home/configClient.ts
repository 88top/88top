import {configValue,HomeConfigError,MAX_CONFIG_BYTES,type ConfigDomain,type ConfigValue} from './configContract'

export type ConfigSnapshot={version:string;state:'missing'|'saved'|'backup'|'damaged'|'future';value?:ConfigValue;recoveryVersion?:string}
export type HomeTransport=(url:string,options:RequestInit)=>Promise<Response>
const versionPattern=/^[a-f0-9]{32}:[1-9][0-9]{0,19}$/
const equal=(a:unknown,b:unknown):boolean=>{
 if(a===b)return true
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false
 const keys=Object.keys(a as object),other=Object.keys(b as object)
 return keys.length===other.length&&keys.every(key=>Object.prototype.hasOwnProperty.call(b,key)&&equal((a as any)[key],(b as any)[key]))
}

export const configValuesEqual=equal

// No dependency on the legacy request layer: new endpoints validate HTTP,
// business envelope and structure. Timeout reconciliation performs only GET.
export function createHomeConfigClient(transport:HomeTransport=fetch,timeoutMs=8000){
 async function exchange(domain:ConfigDomain,method:'GET'|'POST',body?:unknown,action=''):Promise<ConfigSnapshot>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs)
  try{
   const response=await transport('/cgi-bin/luci/istore/home/v1/'+domain+'/'+action,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined})
   if(!response.ok){throw new HomeConfigError(response.status===409?'conflict':response.status===401||response.status===403?'forbidden':response.status===404&&method==='GET'?'unsupported':response.status===422?'invalid':response.status===423?'readonly':'unavailable')}
   const text=await response.text();if(new TextEncoder().encode(text).length>MAX_CONFIG_BYTES+4096)throw new HomeConfigError('invalid')
   let envelope:any;try{envelope=JSON.parse(text)}catch{throw new HomeConfigError('invalid')}
   if(envelope?.success!==0||envelope?.error)throw new HomeConfigError(envelope?.success===-1001?'forbidden':'unavailable')
   const value=envelope.result
   if(!value||!['missing','saved','backup','damaged','future'].includes(value.state))throw new HomeConfigError('invalid')
   const needsValue=['saved','backup'].includes(value.state)
   if(needsValue&&(!versionPattern.test(value.version)||!value.value)||value.state==='missing'&&(value.version!=='missing'||value.value!==undefined)||['future','damaged'].includes(value.state)&&value.value!==undefined)throw new HomeConfigError('invalid')
   return {state:value.state,version:value.version||'',value:needsValue?configValue(domain,value.value):undefined,recoveryVersion:typeof value.recoveryVersion==='string'&&/^[a-f0-9]{64}$/.test(value.recoveryVersion)?value.recoveryVersion:undefined}
  }catch(error){if(error instanceof HomeConfigError)throw error;throw new HomeConfigError('unavailable')}
  finally{clearTimeout(timer)}
 }
 return {
  read:(domain:ConfigDomain)=>exchange(domain,'GET'),
  async recover(domain:ConfigDomain,expectedRecovery:string,defaults=false){
   if(!/^[a-f0-9]{64}$/.test(expectedRecovery))throw new HomeConfigError('invalid')
   try{return await exchange(domain,'POST',{expectedRecovery},defaults?'reset-damaged/':'restore/')}catch(error){
    if(error instanceof HomeConfigError&&error.code!=='unavailable')throw error
    throw new HomeConfigError('uncertain')
   }
  },
  async save(domain:ConfigDomain,expectedVersion:string,input:ConfigValue):Promise<ConfigSnapshot>{
   const value=configValue(domain,input)
   if(expectedVersion!=='missing'&&!versionPattern.test(expectedVersion))throw new HomeConfigError('invalid')
   try{
    const saved=await exchange(domain,'POST',{expectedVersion,value})
    if(saved.state!=='saved'||!equal(saved.value,value))throw new HomeConfigError('uncertain')
    return saved
   }catch(error){
    if(error instanceof HomeConfigError&&!['unavailable','uncertain'].includes(error.code))throw error
    // HTTP/transport failure may occur after a committed rename. Confirm the
    // outcome; never repeat POST or upload a cache to try to "repair" it.
    try{const current=await exchange(domain,'GET');if(current.state==='saved'&&equal(current.value,value))return current}catch{}
    throw new HomeConfigError('uncertain')
   }
  },
 }
}
