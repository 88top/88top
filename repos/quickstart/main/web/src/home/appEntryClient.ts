import type {HomeApplication} from './homeApplications'

function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('error');return value as Record<string,unknown>}
function localPath(value:unknown){return typeof value==='string'&&/^\/(?!\/)/.test(value)&&value.length<=2048&&!/[\u0000-\u0020\u007f\\]/.test(value)?value:''}
function port(value:string){const number=Number(value);if(!/^[0-9]{1,5}$/.test(value)||number<1||number>65535)throw new Error('error');return number}
export function appWebTarget(status:Record<string,unknown>,currentURL:string){
 const web=status.web;if(typeof web!=='string'||!web||web.length>2048||/[\u0000-\u0020\u007f\\]/.test(web))throw new Error('error')
 const base=new URL(currentURL);let target:URL
 const shorthand=web.match(/^:([0-9]{1,5})(\/.*)?$/)
 if(shorthand){
  if(status.protocol!=='http'&&status.protocol!=='https')throw new Error('error')
  const number=port(shorthand[1]);if(status.port!==undefined&&Number(status.port)!==number)throw new Error('error')
  target=new URL(base.origin);target.protocol=status.protocol+':';target.port=String(number)
  const suffix=new URL(shorthand[2]||'/',target.origin);if(suffix.origin!==target.origin)throw new Error('error');target=suffix
 }else if(localPath(web))target=new URL(web,base.origin)
 else{if(!/^https?:\/\//.test(web))throw new Error('error');target=new URL(web)}
 if(!['http:','https:'].includes(target.protocol)||target.username||target.password)throw new Error('error')
 if(target.hostname!==base.hostname&&(/^(localhost|0\.0\.0\.0|127\.)/.test(target.hostname)||['[::1]','[::]'].includes(target.hostname)))throw new Error('error')
 return target.href
}
export function appEntryResult(app:HomeApplication,data:unknown,currentURL:string){
 const envelope=record(data)
 // LuCI's empty Lua table is serialized as [] or {} across JSON implementations.
 const errors=envelope.errors
 const noErrors=!!errors&&typeof errors==='object'&&Object.keys(errors).length===0
 if(envelope.code!==200||!Array.isArray(envelope.status)||!noErrors||envelope.status.length!==1)throw new Error('error')
 const status=record(envelope.status[0]);if(status.app!==app.id||typeof status.running!=='boolean')throw new Error('error')
 if(status.running===true&&status.deployed!==false&&status.web)return {target:appWebTarget(status,currentURL),direct:true}
 const fallback=localPath(app.path)||localPath(status.href);if(!fallback)throw new Error('no-entry');return {target:fallback,direct:false}
}
export function entryTarget(app:HomeApplication,data:unknown,currentURL:string){return appEntryResult(app,data,currentURL).target}
export async function resolveAppEntryResult(app:HomeApplication,currentURL:string,signal:AbortSignal,request:typeof fetch=fetch){
 if(app.kind!=='app'||!/^[a-zA-Z0-9][a-zA-Z0-9_.+-]{0,127}$/.test(app.id))throw new Error('error')
 if(!app.entryScript){const path=localPath(app.path);if(!path)throw new Error('no-entry');return {target:path,direct:false}}
 const options={credentials:'same-origin' as const,cache:'no-store' as const,signal}
 const read=async(response:Response)=>{if(!response.ok)throw new Error([401,403].includes(response.status)?'permission':'error');return record(await response.json())}
 const token=await read(await request('/cgi-bin/luci/admin/store/token',{...options,method:'GET'}))
 if(typeof token.token!=='string'||!token.token||token.token.length>256||/[\u0000-\u0020]/.test(token.token))throw new Error('error')
 const hostname=new URL(currentURL).hostname
 const body=new URLSearchParams({token:token.token,package:app.id,hostname,update:'1'})
 const response=await request('/cgi-bin/luci/admin/store/entrysh',{...options,method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body})
 return appEntryResult(app,await read(response),currentURL)
}
export async function resolveAppEntry(app:HomeApplication,currentURL:string,signal:AbortSignal,request:typeof fetch=fetch){return (await resolveAppEntryResult(app,currentURL,signal,request)).target}
