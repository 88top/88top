import {homeApplications,systemTools,type HomeApplication} from './homeApplications'
// Existing backend AppInstalled fields, normalized once at the catalogue seam.
// Runtime state is deliberately absent: an installed package need not be running.
export type InstalledMetadata={name?:string;title?:string;title_en?:string;description?:string;description_en?:string;entry?:string}
export function normalizeInstalled(data:unknown):HomeApplication[]{
 if(!Array.isArray(data))throw new Error('error')
 const reserved=new Set([...systemTools,...homeApplications.filter(a=>a.kind==='builtin')].map(a=>a.id)),seen=new Set<string>(),result:HomeApplication[]=[]
 for(const row of data){
  if(!row||typeof row!=='object'||typeof row.name!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_.+-]{0,127}$/.test(row.name)||reserved.has(row.name)||seen.has(row.name))continue
  seen.add(row.name);const known=homeApplications.find(a=>a.id===row.name),text=(value:unknown,fallback:string)=>typeof value==='string'&&value.trim()?value.slice(0,256):fallback
  const entry=typeof row.entry==='string'&&/^\/(?!\/)/.test(row.entry)&&!/[\u0000-\u001f\\]/.test(row.entry)?row.entry:''
  result.push({id:row.name,zh:text(row.title,row.name),en:text(row.title_en,row.name),detail:text(row.description,''),detailEn:text(row.description_en,''),path:entry,kind:'app',glyph:known?.glyph||'grid',tone:known?.tone||'blue'})
 }
 return result
}
export function installedSample(app:HomeApplication):InstalledMetadata{return {name:app.id,title:app.zh,title_en:app.en,description:app.detail,description_en:app.detailEn,entry:app.path}}
