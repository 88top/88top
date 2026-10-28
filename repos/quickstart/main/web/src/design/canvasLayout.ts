// Design-only composition. Large original chart is a fixed visual anchor.
export type CanvasVariant='canvas'|'sidebar'|'stage'
export type CanvasModuleKey='connection'|'tools'|'devices'|'system'|'storage'|'sharing'|'docker'|'downloads'|'remote'
export type CanvasLayoutItem={id:CanvasModuleKey;enabled:boolean;span:number}
export const canvasModules:Array<{id:CanvasModuleKey;zh:string;en:string;glyph:string;fixed?:boolean}>= [
  {id:'connection',zh:'网络连接',en:'Connection',glyph:'network',fixed:true},
  {id:'tools',zh:'配置工具',en:'Configuration',glyph:'tune',fixed:true},
  {id:'devices',zh:'设备列表',en:'LAN devices',glyph:'devices'},
  {id:'system',zh:'系统状态',en:'System health',glyph:'chip'},
  {id:'storage',zh:'磁盘信息',en:'Disks',glyph:'disk'},
  {id:'sharing',zh:'存储服务',en:'Storage services',glyph:'folder'},
  {id:'docker',zh:'Docker',en:'Docker',glyph:'layers'},
  {id:'downloads',zh:'下载服务',en:'Downloads',glyph:'download'},
  {id:'remote',zh:'远程域名',en:'Remote access',glyph:'globe'},
]
export const canvasVariants:Array<{id:CanvasVariant;zh:string;en:string}>= [
  {id:'canvas',zh:'紧凑概览＋应用',en:'Overview + apps'},
  {id:'sidebar',zh:'右侧工具台',en:'Tools panel'},
  {id:'stage',zh:'底部操作台',en:'Command dock'},
]
const orders:Record<CanvasVariant,Array<[CanvasModuleKey,number]>>={
  canvas:[['connection',4],['tools',4],['devices',8],['system',4],['storage',8],['sharing',4],['docker',4],['downloads',4],['remote',4]],
  sidebar:[['connection',12],['tools',4],['devices',12],['storage',8],['system',4],['sharing',4],['docker',4],['remote',4],['downloads',12]],
  stage:[['connection',4],['tools',4],['devices',12],['storage',8],['sharing',4],['docker',4],['downloads',4],['remote',4],['system',12]],
}
export const canvasPreset=(variant:CanvasVariant):CanvasLayoutItem[]=>orders[variant].map(([id,span])=>({id,span,enabled:variant!=='canvas'||!['docker','downloads','remote'].includes(id)}))
export const canvasSession=new Map<CanvasVariant,CanvasLayoutItem[]>()
export const quickEntrances=[
  {zh:'网络向导',en:'Network setup',glyph:'network',path:'/network'},
  {zh:'设备管理',en:'Devices',glyph:'devices',path:'/devicemanagement'},
  {zh:'网络测速',en:'Speed test',glyph:'activity',path:'/networkSpeedTest'},
  {zh:'家长控制',en:'Parental controls',glyph:'shield',path:'/parental'},
  {zh:'应用商店',en:'App store',glyph:'grid',path:'/applications'},
]
export const configurationTools=[
  {zh:'内网配置',en:'LAN setup',glyph:'network',path:'/lan'},
  {zh:'终端',en:'Terminal',glyph:'terminal',path:'/terminal'},
  {zh:'固件更新',en:'Firmware',glyph:'download',path:'/update'},
  {zh:'DNS配置',en:'DNS settings',glyph:'globe',path:'/dns'},
  {zh:'软件源配置',en:'Package sources',glyph:'layers',path:'/sources'},
  {zh:'沙箱管理',en:'Sandbox',glyph:'shield',path:'/sandbox'},
  {zh:'日志查看',en:'Logs',glyph:'folder',path:'/logs'},
  {zh:'系统维护',en:'Maintenance',glyph:'tune',path:'/maintenance'},
]
