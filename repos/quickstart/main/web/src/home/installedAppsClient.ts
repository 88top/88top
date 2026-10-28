import {normalizeInstalled} from './launcherMetadata'

// The software center owns installed app metadata. This GET never executes its
// configured/entrysh or package-management actions; missing entries stay disabled.
export const installedAppsPath='/cgi-bin/luci/admin/store/installed'
export async function readInstalledApplications(signal:AbortSignal,request:typeof fetch=fetch){
 const response=await request(installedAppsPath,{method:'GET',credentials:'same-origin',cache:'no-store',signal})
 if(!response.ok)throw new Error([401,403].includes(response.status)?'permission':'error')
 return normalizeInstalled(await response.json())
}
