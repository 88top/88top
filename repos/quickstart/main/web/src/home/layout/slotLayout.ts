// One finite command model for real slots and compact overview. No business writes.
import {capability} from './moduleCapability'
import {definition,formCapability} from './widgetPresentation'
import {sizingIssue} from './rowSizing'
import {clone,makeRow,templates,visibleIds,type OrderedRow,type Template} from './orderedLayout'
import type {WidgetId} from './rowLayout'
export type Slot={row:string;column:number;slot:number}
export type LayoutResult={rows:OrderedRow[];issue:string;changed:boolean;hidden:WidgetId[];requiredHeight?:number;problemRow?:string;candidateRows?:OrderedRow[];requiresAdaptation?:boolean}
export const slotId=(s:Slot)=>`${s.row}:${s.column}:${s.slot}`
export function originOf(rows:OrderedRow[],id:WidgetId):Slot|undefined{
  for(const r of rows)for(let ci=0;ci<r.columns.length;ci++){const si=r.columns[ci].cards.indexOf(id);if(si>=0)return {row:r.id,column:ci,slot:si}}
}
export function at(rows:OrderedRow[],s:Slot){return rows.find(r=>r.id===s.row)?.columns[s.column]?.cards[s.slot]}
export function requiredHeight(row:OrderedRow){
  return Math.ceil(Math.max(0,...row.columns.flatMap(c=>c.cards.map((id,i)=>{
    if(!id)return 0;const stacked=c.cards.length===2,minimum=stacked?capability(id).compactHeight:capability(id).minHeight
    return stacked?minimum/((i===0?c.split:100-c.split)/100)+18:minimum
  }))))
}
export function validate(rows:OrderedRow[]):{issue:string;row?:string;requiredHeight?:number}{
  const ids=visibleIds(rows);if(new Set(ids).size!==ids.length)return {issue:'duplicate'}
  for(const row of rows){
    const sizeIssue=sizingIssue(row);if(sizeIssue)return {issue:sizeIssue,row:row.id}
    const template=templates.find(t=>t.id===row.template)
    if(!template||row.columns.length!==template.slots.length||row.columns.some((c,i)=>c.cards.length!==template.slots[i]||c.weight<=0||c.split<=0||c.split>=100)||Math.abs(row.columns.reduce((n,c)=>n+c.weight,0)-100)>.01)return {issue:'structure',row:row.id}
    if(row.columns.some(c=>c.cards.length===2&&c.cards.some(id=>id&&!definition(id).forms.some(form=>formCapability(id,form).stacked))))return {issue:'compact',row:row.id}
    const minimum=requiredHeight(row);if(!row.heightMode&&row.height<minimum)return {issue:'height:'+minimum,row:row.id,requiredHeight:minimum}
  }
  return {issue:''}
}
function result(before:OrderedRow[],next:OrderedRow[],hidden:WidgetId[]=[]):LayoutResult{
  const problem=validate(next)
  if(problem.issue)return {rows:before,candidateRows:next,issue:problem.issue,changed:false,hidden,requiredHeight:problem.requiredHeight,problemRow:problem.row}
  return {rows:next,issue:'',changed:JSON.stringify(before)!==JSON.stringify(next),hidden}
}
export function assignSlot(rows:OrderedRow[],target:Slot,id:WidgetId|null):LayoutResult{
  const next=clone(rows),column=next.find(r=>r.id===target.row)?.columns[target.column]
  if(!column||target.slot<0||target.slot>=column.cards.length)return {rows,issue:'target',changed:false,hidden:[]}
  const old=column.cards[target.slot];if(old===id)return result(rows,next)
  if(id){const source=originOf(next,id);if(source)next.find(r=>r.id===source.row)!.columns[source.column].cards[source.slot]=null}
  column.cards[target.slot]=id
  return result(rows,next,old?[old]:[])
}
export function reshape(rows:OrderedRow[],rowId:string,template:Template,keep?:WidgetId[],height?:number):LayoutResult{
  const next=clone(rows),index=next.findIndex(r=>r.id===rowId),old=next[index]
  if(!old)return {rows,issue:'target',changed:false,hidden:[]}
  const ids=visibleIds([old]),capacity=templates.find(t=>t.id===template)!.slots.reduce((a,b)=>a+b,0)
  if(ids.length>capacity&&!keep)return {rows,issue:'choose-retained',changed:false,hidden:[]}
  const selected=keep||ids
  if(selected.length>capacity||new Set(selected).size!==selected.length||selected.some(id=>!ids.includes(id)))return {rows,issue:'retained',changed:false,hidden:[]}
  if(!keep&&((old.template==='left-big'&&template==='right-big')||(old.template==='right-big'&&template==='left-big'))){old.template=template;old.columns.reverse();if(height)old.height=height;return result(rows,next)}
  const replacement=makeRow(selected,template==='right-big'?'left-big':template,height||old.height,old.id)
  if(old.minHeight!==undefined)replacement.minHeight=old.minHeight
  if(template==='right-big'){replacement.template=template;replacement.columns.reverse()}
  next[index]=replacement
  return result(rows,next,ids.filter(id=>!selected.includes(id)))
}
export function changeSize(rows:OrderedRow[],rowId:string,update:{height?:number;weights?:number[];column?:number;split?:number}):LayoutResult{
  const next=clone(rows),row=next.find(r=>r.id===rowId)
  if(!row)return {rows,issue:'target',changed:false,hidden:[]}
  if(update.height!==undefined)row.height=update.height
  if(update.weights){if(update.weights.length!==row.columns.length)return {rows,issue:'structure',changed:false,hidden:[]};row.columns.forEach((c,i)=>c.weight=update.weights![i])}
  if(update.column!==undefined&&update.split!==undefined){if(!row.columns[update.column])return {rows,issue:'target',changed:false,hidden:[]};row.columns[update.column].split=update.split}
  return result(rows,next)
}
export function moveRowTo(rows:OrderedRow[],id:string,before:string|null):LayoutResult{
  const next=clone(rows),from=next.findIndex(r=>r.id===id)
  if(from<0||(before&&!next.some(r=>r.id===before)))return {rows,issue:'target',changed:false,hidden:[]}
  if(id!==before){const [row]=next.splice(from,1);next.splice(before?next.findIndex(r=>r.id===before):next.length,0,row)}
  return result(rows,next)
}
export function moveToNewRow(rows:OrderedRow[],id:WidgetId,before:string|null):LayoutResult{
  const next=clone(rows)
  if(before&&!next.some(r=>r.id===before))return {rows,issue:'target',changed:false,hidden:[]}
  const source=originOf(next,id);if(source)next.find(r=>r.id===source.row)!.columns[source.column].cards[source.slot]=null
  let serial=1;while(next.some(r=>r.id==='slot-row-'+serial))serial++
  const row=makeRow([id],'single',Math.max(280,capability(id).minHeight),'slot-row-'+serial)
  next.splice(before?next.findIndex(r=>r.id===before):next.length,0,row)
  return result(rows,next)
}
export function insertBeside(rows:OrderedRow[],id:WidgetId,rowId:string,index:number):LayoutResult{
  const next=clone(rows),row=next.find(r=>r.id===rowId)
  if(!row||!['single','pair'].includes(row.template))return {rows,issue:'capacity',changed:false,hidden:[]}
  const source=originOf(next,id)
  if(source?.row===rowId)return {rows,issue:'same-row',changed:false,hidden:[]}
  if(source)next.find(r=>r.id===source.row)!.columns[source.column].cards[source.slot]=null
  row.columns.splice(index,0,{cards:[id],weight:1,split:50});row.template=row.columns.length===2?'pair':'triple'
  row.columns.forEach((c,i)=>c.weight=row.columns.length===2?50:[34,33,33][i])
  return result(rows,next)
}
export type Normalized=LayoutResult&{problems:Array<{row:string;issue:string;requiredHeight?:number}>}
export function normalize(rows:OrderedRow[],accept:(id:WidgetId,row:OrderedRow)=>boolean=()=>true,validator:typeof validate=validate):Normalized{
  const next=clone(rows).filter(r=>visibleIds([r]).length),problems:Normalized['problems']=[]
  next.forEach((row,index)=>{
    const ids=visibleIds([row]),hasEmpty=row.columns.some(c=>c.cards.some(id=>!id))
    if(!hasEmpty)return
    const stacked=row.columns.some(c=>c.cards.length===2)
    if(stacked&&!(ids.length===1&&row.columns.some(c=>c.cards.length===1&&c.cards[0]))){problems.push({row:row.id,issue:'incomplete-stack'});return}
    const template=ids.length===1?'single':'pair',replacement=makeRow(ids,template,row.height,row.id);replacement.heightMode=row.heightMode;if(row.minHeight!==undefined)replacement.minHeight=row.minHeight
    if(template==='pair')replacement.columns.forEach(c=>c.weight=50)
    if(ids.some(id=>!accept(id,replacement))){problems.push({row:row.id,issue:'hard-spec'});return}
    next[index]=replacement
  })
  const problem=validator(next);if(problem.issue)problems.push({row:problem.row||'',issue:problem.issue,requiredHeight:problem.requiredHeight})
  return problems.length?{rows:next,issue:problems[0].issue,changed:false,hidden:[],problems,problemRow:problems[0].row,requiredHeight:problems[0].requiredHeight}:{rows:next,issue:'',hidden:[],changed:JSON.stringify(rows)!==JSON.stringify(next),problems}
}
