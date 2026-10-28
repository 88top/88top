// Design-only library. Current sources and explicit saved references bound retention;
// search/paging never writes the homepage or starts network work.
import {reactive} from 'vue'
import {FAVORITE_LIMIT,homeApplicationSession,type HomeApplication} from './homeApplications'
export const LINK_LIMIT=64,PAGE_SIZE=48
export const linkIcons=['globe','folder','layers','network','shield','download','terminal','grid']
export const linkSession=reactive({entries:[] as HomeApplication[]})
let sequence=0
export type LinkDraft={id?:string;name:string;url:string;glyph:string;pin:boolean}
export function validateLink(draft:LinkDraft):string{
 const name=draft.name.trim(),url=draft.url.trim()
 if(!name||Array.from(name).length>64||/[\u0000-\u001f\u007f]/.test(name))return 'name'
 if(!url||url.length>2048||/[\u0000-\u0020\u007f\\]/.test(url))return 'url'
 try{const value=new URL(url);if(!['https:','http:'].includes(value.protocol)||!value.hostname||value.username||value.password)return 'url'}catch{return 'url'}
 if(!linkIcons.includes(draft.glyph))return 'icon'
 if(draft.id&&!linkSession.entries.some(a=>a.id===draft.id))return 'missing'
 if(!draft.id&&linkSession.entries.length>=LINK_LIMIT)return 'limit'
 if(draft.pin&&!homeApplicationSession.favorites.includes(draft.id||'')&&homeApplicationSession.favorites.length>=FAVORITE_LIMIT)return 'pins'
 return ''
}
export function sameAddress(url:string,entries:HomeApplication[],except=''){
 try{const target=new URL(url.trim()).href;return entries.find(a=>a.id!==except&&a.path&&(()=>{try{return new URL(a.path).href===target}catch{return false}})())}catch{return undefined}
}
export function saveLink(draft:LinkDraft){
 const error=validateLink(draft);if(error)return {error}
 // ':' cannot occur in a normalized package ID, so a link cannot shadow an app.
 const id=draft.id||'user-link:'+(++sequence),name=draft.name.trim()
 const entry:HomeApplication={id,zh:name,en:name,detail:'用户添加的链接',detailEn:'Custom link',glyph:draft.glyph,path:new URL(draft.url.trim()).href,kind:'link',tone:'teal'}
 const index=linkSession.entries.findIndex(a=>a.id===id)
 if(index<0)linkSession.entries.push(entry);else linkSession.entries[index]=entry
 if(draft.pin&&!homeApplicationSession.favorites.includes(id))homeApplicationSession.favorites.push(id)
 return {entry}
}
export function deleteLink(id:string){
 if(!linkSession.entries.some(a=>a.id===id))return
 linkSession.entries=linkSession.entries.filter(a=>a.id!==id)
 homeApplicationSession.favorites=homeApplicationSession.favorites.filter(saved=>saved!==id)
}
export function mergeLibrary(sources:HomeApplication[],pins:string[],resolve:(id:string)=>HomeApplication):HomeApplication[]{
 const map=new Map<string,HomeApplication>();for(const app of sources)if(!map.has(app.id))map.set(app.id,app)
 const ordered:HomeApplication[]=[];for(const id of pins){if(ordered.some(a=>a.id===id))continue;ordered.push(map.get(id)||resolve(id));map.delete(id)}
 return [...ordered,...map.values()]
}
export function queryLibrary(entries:HomeApplication[],search:string,category:string,page:number){
 const needle=search.trim().toLocaleLowerCase()
 const matches=entries.filter(a=>(category==='all'||(category==='tools'?a.kind==='tool'||a.kind==='builtin':category==='links'?a.kind==='link':a.kind==='app'))&&[a.zh,a.en,a.detail,a.detailEn,a.path].some(value=>value.toLocaleLowerCase().includes(needle)))
 const pages=Math.max(1,Math.ceil(matches.length/PAGE_SIZE)),current=Math.max(1,Math.min(pages,page))
 return {total:matches.length,pages,current,entries:matches.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE)}
}
