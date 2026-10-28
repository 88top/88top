// Input adapters share the product slot model; no implicit swapping.
import {assignSlot,insertBeside,moveToNewRow,originOf} from './slotLayout'
import type {OrderedRow} from './orderedLayout'
import type {WidgetId} from './rowLayout'
export type MoveSource={kind:'card'|'module';id:WidgetId}
export type MoveTarget={kind:'slot';row:string;column:number;slot:number}|{kind:'edge';before:string|null}|{kind:'beside';row:string;index:number}
export const targetKey=(t:MoveTarget)=>t.kind==='slot'?`slot:${t.row}:${t.column}:${t.slot}`:t.kind==='beside'?`beside:${t.row}:${t.index}`:`edge:${t.before||'end'}`
export function targets(rows:OrderedRow[]):MoveTarget[]{return rows.flatMap(row=>[
 {kind:'edge',before:row.id} as MoveTarget,
 ...row.columns.flatMap((c,ci)=>c.cards.map((_,si)=>({kind:'slot',row:row.id,column:ci,slot:si} as MoveTarget))),
 ...Array.from({length:row.columns.length+1},(_,index)=>({kind:'beside',row:row.id,index} as MoveTarget)),
]).concat([{kind:'edge',before:null}])}
export function placement(rows:OrderedRow[],source:MoveSource,target:MoveTarget){
 const fail=(issue:string)=>({rows,issue,changed:false,hidden:[]})
 if(source.kind==='card'&&!originOf(rows,source.id))return fail('target')
 return target.kind==='slot'?assignSlot(rows,target,source.id):target.kind==='beside'?insertBeside(rows,source.id,target.row,target.index):moveToNewRow(rows,source.id,target.before)
}
