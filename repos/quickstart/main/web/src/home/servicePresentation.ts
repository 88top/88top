// Interpret only facts supplied by the existing APIs. A configured address
// does not prove service health or Internet reachability.
export type ServiceState = 'running' | 'stopped' | 'notInstalled' | 'unknown' | 'configured' | 'disabled' | 'notConfigured'
export const serviceState = (status?: string): ServiceState =>
 status === 'running' ? 'running' : status === 'stopped' ? 'stopped' : status === 'not installed' ? 'notInstalled' : 'unknown'
export const domainState = (address?: string): ServiceState =>
 address === 'Stopped' ? 'stopped' : address === 'Disabled' ? 'disabled' : address?.trim() ? 'configured' : 'notConfigured'
const labels: Record<ServiceState, [string, string]> = {
 running:['运行中','Running'], stopped:['未运行','Stopped'], notInstalled:['未安装','Not installed'], unknown:['状态未知','Unknown'],
 configured:['已配置','Configured'], disabled:['未启用','Disabled'], notConfigured:['未配置','Not configured'],
}
export const stateLabel = (state: ServiceState, english: boolean) => labels[state][english ? 1 : 0]
export function downloadDescription(status: string | undefined, english: boolean) {
 const descriptions = {
  stopped:['服务尚未启动，可在下载管理中配置。','The service is stopped. Configure it in Download management.'],
  notInstalled:['尚未安装此服务，可在下载管理中配置。','This service is not installed. Configure it in Download management.'],
  unknown:['尚未取得此服务的状态，可在下载管理中查看。','The service status is unknown. Check Download management.'],
 }
 const state=serviceState(status)
 return state==='running'?'':descriptions[state as keyof typeof descriptions][english ? 1 : 0]
}
