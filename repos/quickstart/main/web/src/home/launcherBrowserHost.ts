// The independent launcher host survives responsive row reconstruction. Cards request its
// editor; drafts are not owned by a disposable layout slot.
type OpenBrowser=(edit:boolean,network?:Record<string,any>)=>void
import type {HomeApplication} from './homeApplications'
import {reactive} from 'vue'
export type ActivationSource='home'|'browser'|'traffic'
export const launcherActivation=reactive<{app:HomeApplication|null;status:string;source:ActivationSource}>({app:null,status:'idle',source:'home'})
let host:OpenBrowser|undefined
let activate:((app:HomeApplication,source:ActivationSource)=>void)|undefined
let cancel:(()=>void)|undefined
export function registerLauncherBrowser(next:OpenBrowser,launch?:(app:HomeApplication,source:ActivationSource)=>void,abort?:()=>void){host=next;activate=launch;cancel=abort;return ()=>{if(host===next){cancel?.();host=undefined;activate=undefined;cancel=undefined}}}
export function requestLauncherBrowser(edit:boolean,network?:Record<string,any>){if(!host)return false;host(edit,network);return true}
export function requestLauncherApp(app:HomeApplication,source:ActivationSource='home'){if(!activate)return false;activate(app,source);return true}
export function cancelLauncherApp(){cancel?.()}
