// User intent only. Intrinsic DOM sizes remain derived and never enter history.
export const ROW_SPACE_LIMIT=1600
export const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(Math.max(min,max),value))
export type NaturalSize={height:number;columns:number[][]}
export function splitSpace(height:number,minima:number[],share?:number){
 const available=Math.max(0,height-18),min=minima[0]||0,max=Math.max(min,available-(minima[1]||0))
 const upper=clamp(available*(share??50)/100,min,max)
 return {upper,lower:Math.max(minima[1]||0,available-upper),min,max,available}
}
export function sizingIssue(row:{minHeight?:number;columns:Array<{cards:unknown[];upperShare?:number}>}){
 if(row.minHeight!==undefined&&(!Number.isFinite(row.minHeight)||row.minHeight<1||row.minHeight>ROW_SPACE_LIMIT))return 'row-space'
 if(row.columns.some(c=>c.upperShare!==undefined&&(c.cards.length!==2||!Number.isFinite(c.upperShare)||c.upperShare<=0||c.upperShare>=100)))return 'stack-share'
 return ''
}
