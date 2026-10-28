import type {HomeApplication} from './homeApplications'
import {resolveAppEntryResult} from './appEntryClient'
export const fastnetSettings='/cgi-bin/luci/admin/services/fastnet'
// One catalogue owner establishes installed identity; entry.sh establishes readiness.
// Unknown is never converted into an installation offer.
export async function speedTestTarget(apps:HomeApplication[],status:string,currentURL:string,signal:AbortSignal,actions:{install:()=>Promise<boolean>;confirm:()=>boolean;resolve?:typeof resolveAppEntryResult}){
 const valid=()=>{if(signal.aborted)throw new DOMException('Aborted','AbortError')}
 valid();if(status!=='ready')throw new Error(status==='permission'?'permission':status==='timeout'?'timeout':'error')
 const app=apps.find(a=>a.id==='fastnet')
 if(app?.entryScript){const result=await (actions.resolve||resolveAppEntryResult)(app,currentURL,signal);valid();if(result.direct)return result.target}
 valid();if(app&&!actions.confirm())return null
 valid();const installed=await actions.install();valid();return installed?fastnetSettings:null
}
