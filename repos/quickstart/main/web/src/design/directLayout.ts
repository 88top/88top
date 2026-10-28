// Finite design-only placement commands shared by pointer, click and keyboard.
import {clone,makeRow,visibleIds,layoutIssue,compactIds,type OrderedRow} from './orderedLayout'
import {widget,type WidgetId} from './rowLayout'
export type MoveSource={kind:'card'|'module';id:WidgetId}|{kind:'row';id:string}
export type MoveTarget={kind:'slot';row:string;column:number;slot:number}|{kind:'edge';before:string|null}
export const targetKey=(target:MoveTarget)=>target.kind==='slot'?`slot:${target.row}:${target.column}:${target.slot}`:`edge:${target.before||'end'}`
export function targets(rows:OrderedRow[]):MoveTarget[]{return rows.flatMap(row=>[
 {kind:'edge',before:row.id} as MoveTarget,
 ...row.columns.flatMap((column,ci)=>column.cards.map((_,si)=>({kind:'slot',row:row.id,column:ci,slot:si} as MoveTarget))),
]).concat([{kind:'edge',before:null}])}
export function placement(rows:OrderedRow[],source:MoveSource,target:MoveTarget):{rows:OrderedRow[];issue:string;changed:boolean}{
 const next=clone(rows),fail=(issue:string)=>({rows,issue,changed:false})
 if(target.kind==='edge'&&target.before&&!next.some(r=>r.id===target.before))return fail('target')
 if(source.kind==='row'){
  if(target.kind!=='edge')return fail('row-target')
  const from=next.findIndex(r=>r.id===source.id);if(from<0)return fail('target')
  if(target.before!==source.id){const [row]=next.splice(from,1),to=target.before?next.findIndex(r=>r.id===target.before):next.length;next.splice(to,0,row)}
 }else{
  let origin:{row:OrderedRow;column:number;slot:number}|undefined
  for(const row of next)row.columns.forEach((c,ci)=>c.cards.forEach((id,si)=>{if(id===source.id)origin={row,column:ci,slot:si}}))
  if(source.kind==='module'&&origin)return fail('duplicate')
  if(source.kind==='card'&&!origin)return fail('target')
  if(target.kind==='slot'){
   const row=next.find(r=>r.id===target.row),column=row?.columns[target.column]
   if(!column||target.slot<0||target.slot>=column.cards.length)return fail('target')
   const existing=column.cards[target.slot]
   if(source.kind==='module'&&existing)return fail('occupied')
   if(origin)origin.row.columns[origin.column].cards[origin.slot]=existing
   column.cards[target.slot]=source.id
  }else{
   if(origin)origin.row.columns[origin.column].cards[origin.slot]=null
   let serial=1;while(next.some(r=>r.id==='direct-row-'+serial))serial++
   const row=makeRow([source.id],'single',Math.max(240,widget(source.id).singleHeight),'direct-row-'+serial)
   next.splice(target.before?next.findIndex(r=>r.id===target.before):next.length,0,row)
  }
 }
 if(next.some(row=>row.columns.some(c=>c.cards.length===2&&c.cards.some(id=>id&&!compactIds.includes(id)))))return fail('compact')
 const issue=layoutIssue(next);if(issue)return fail(issue)
 return {rows:next,issue:'',changed:JSON.stringify(rows)!==JSON.stringify(next)}
}
