// The footer launcher survives responsive row reconstruction. Cards request its
// editor; drafts are not owned by a disposable layout slot.
type OpenBrowser=(edit:boolean,network?:Record<string,any>)=>void
let host:OpenBrowser|undefined
export function registerLauncherBrowser(next:OpenBrowser){host=next;return ()=>{if(host===next)host=undefined}}
export function requestLauncherBrowser(edit:boolean,network?:Record<string,any>){if(!host)return false;host(edit,network);return true}
