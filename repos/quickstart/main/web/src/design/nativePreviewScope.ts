import {inject,type InjectionKey} from 'vue'
export type NativePreviewScope={id:string;preview:boolean;compact:boolean;surface:()=>HTMLElement|null;data:()=>Record<string,any>;errors:()=>Record<string,string>;details:()=>void}
export const nativePreviewScope:InjectionKey<NativePreviewScope>=Symbol('quickstart-native-preview')
// Only two native homepage readers are projected. Shared snapshots, wizard
// readers and complete detail surfaces always retain the original full data.
export function useNativeReadScope(){const scope=inject(nativePreviewScope,undefined);return async(read:Promise<any>,channel:string)=>{
 const response=await read,result=response.data?.result
 if(!scope?.preview||!result)return response
 let projected=result
 if(channel==='disks')projected={...result,disks:(result.disks||[]).slice(0,3)}
 if(channel==='raid'){const physical=scope.errors().disks?0:(scope.data().disks?.disks?.length||0);projected={...result,disks:(result.disks||[]).slice(0,Math.max(0,3-physical))}}
 if(channel==='sharing')projected={...result,sambas:(result.sambas||[]).slice(0,2)}
 return {...response,data:{...response.data,result:projected}}
}}
