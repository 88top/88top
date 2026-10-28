import type {HomeApplication} from './homeApplications'
export const LINK_LIMIT=64,PAGE_SIZE=48
export const linkIcons=['globe','folder','layers','network','shield','download','terminal','grid']
export type LinkDraft={id?:string;name:string;url:string;glyph:string;pin:boolean}
export function sameAddress(url:string,entries:HomeApplication[],except=''){
 try{const target=new URL(url.trim()).href;return entries.find(a=>a.id!==except&&a.path&&(()=>{try{return new URL(a.path).href===target}catch{return false}})())}catch{return undefined}
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
