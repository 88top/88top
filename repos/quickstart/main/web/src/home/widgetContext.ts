import {inject,watch,type InjectionKey} from 'vue'

export type HomeData = {
 network?:NetworkStatus; ports?:{ports:NetworkPort[]}; traffic?:{items:NetworkStatisticsModel[];slots?:number};
 disks?:NasDiskStatus; raid?:{disks:Disksinfo[]}; sharing?:NasServiceStatus;
 docker?:GuideDockerStatus; download?:GuideDownloadServiceStatus; remote?:GuideDdns;
 system?:SystemStatus; version?:SystemVersion;
 [key:string]:any;
}
export type WidgetContext={data:HomeData;bounded:()=>boolean;details:()=>void;invalidate:()=>void}
export const widgetContext:InjectionKey<WidgetContext>=Symbol('quickstart-home-widget')
// Snapshot subscriptions belong to the component lifetime. Business forms keep
// their original request paths; only the overview readers consume this owner.
export function useHomeSnapshot<K extends keyof HomeData>(channel:K,apply:(value:NonNullable<HomeData[K]>)=>void){
 const context=inject(widgetContext,undefined)
 if(context)watch(()=>({value:context.data[channel],physical:channel==='raid'?context.data.disks:undefined,bounded:context.bounded()}),snapshot=>{if(snapshot.value)apply(snapshot.value)},{immediate:true})
 return !!context
}
export function useHomeProjection(){return inject(widgetContext,undefined)}
