// Design-only application catalogue: synthetic examples, never installation evidence.
import { reactive } from 'vue'
export type HomeApplication={id:string;zh:string;en:string;detail:string;detailEn:string;glyph:string;path:string;kind:'app'|'builtin'|'tool'|'link';tone:string;tool?:'lan'|'terminal'|'firmware'|'dns'|'source'|'sandbox'|'logs'|'maintenance'}
export const homeApplications:HomeApplication[]=[
  {id:'files',zh:'文件管理',en:'Files',detail:'磁盘与文件',detailEn:'Disks & files',glyph:'folder',path:'/nas',kind:'builtin',tone:'blue'},
  {id:'docker',zh:'Docker',en:'Docker',detail:'容器管理',detailEn:'Containers',glyph:'layers',path:'/docker',kind:'app',tone:'blue'},
  {id:'qbittorrent',zh:'qBittorrent',en:'qBittorrent',detail:'下载管理',detailEn:'Downloads',glyph:'download',path:'/download',kind:'app',tone:'teal'},
  {id:'ddnsto',zh:'DDNSTO',en:'DDNSTO',detail:'远程访问',detailEn:'Remote access',glyph:'globe',path:'/ddns',kind:'app',tone:'violet'},
  {id:'linkease',zh:'易有云',en:'LinkEase',detail:'文件与远程',detailEn:'Files & remote access',glyph:'folder',path:'/storage',kind:'app',tone:'teal'},
  {id:'fastnet',zh:'网络测速',en:'Speed test',detail:'FastNet',detailEn:'FastNet',glyph:'activity',path:'/networkSpeedTest',kind:'app',tone:'blue'},
  {id:'oaf',zh:'家长控制',en:'Parental controls',detail:'应用过滤',detailEn:'App filtering',glyph:'shield',path:'/parental',kind:'app',tone:'violet'},
  {id:'devices',zh:'局域网设备',en:'LAN devices',detail:'设备与策略',detailEn:'Devices & policies',glyph:'devices',path:'/devicemanagement',kind:'builtin',tone:'blue'},
  {id:'network',zh:'网络向导',en:'Network setup',detail:'网络配置',detailEn:'Network configuration',glyph:'network',path:'/network',kind:'builtin',tone:'teal'},
]
export const systemTools:HomeApplication[]=[
 {id:'tool-lan',zh:'内网配置',en:'LAN settings',detail:'地址与DHCP',detailEn:'Address & DHCP',glyph:'network',path:'',kind:'tool',tone:'blue',tool:'lan'},
 {id:'tool-terminal',zh:'终端',en:'Terminal',detail:'命令行',detailEn:'Command line',glyph:'terminal',path:'',kind:'tool',tone:'teal',tool:'terminal'},
 {id:'tool-firmware',zh:'固件更新',en:'Firmware update',detail:'升级与自动检查',detailEn:'Update & auto-check',glyph:'download',path:'/cgi-bin/luci/admin/system/ota',kind:'tool',tone:'violet',tool:'firmware'},
 {id:'tool-dns',zh:'DNS配置',en:'DNS settings',detail:'网络解析',detailEn:'Name resolution',glyph:'globe',path:'',kind:'tool',tone:'teal',tool:'dns'},
 {id:'tool-source',zh:'软件源配置',en:'Software sources',detail:'软件包镜像',detailEn:'Package mirrors',glyph:'layers',path:'',kind:'tool',tone:'violet',tool:'source'},
 {id:'tool-sandbox',zh:'开启沙箱',en:'Enable sandbox',detail:'隔离实验环境',detailEn:'Experiment environment',glyph:'shield',path:'',kind:'tool',tone:'blue',tool:'sandbox'},
 {id:'tool-logs',zh:'日志查看',en:'System logs',detail:'系统日志',detailEn:'System events',glyph:'folder',path:'/cgi-bin/luci/admin/status/logs',kind:'tool',tone:'teal',tool:'logs'},
 {id:'tool-maintenance',zh:'系统维护',en:'Maintenance',detail:'系统维护工具',detailEn:'System maintenance',glyph:'tune',path:'/cgi-bin/luci/admin/store/pages/maintance',kind:'tool',tone:'blue',tool:'maintenance'},
]
export const FAVORITE_LIMIT=24
export const applicationDefaults=systemTools.map(a=>a.id)
export const legacyFavorites=['files','docker','qbittorrent','ddnsto','linkease','fastnet']
export const sampleApplications:HomeApplication[]=Array.from({length:24},(_,i)=>({id:'example-'+i,zh:'示例应用 '+(i+1),en:'Sample app '+(i+1),detail:'设计示例',detailEn:'Design sample',glyph:'grid',path:'/app-example/'+i,kind:'app',tone:['blue','teal','violet'][i%3]}))
// Memory only: route navigation retains choices; refreshing restores the proposal.
const favoriteSample=new URLSearchParams(location.search).get('favorites')
const params=new URLSearchParams(location.search)
const sample=params.get('legacy-favorites')==='1'||Number(favoriteSample)<=6?legacyFavorites:[...applicationDefaults,...homeApplications.map(a=>a.id),...sampleApplications.map(a=>a.id)]
export const homeApplicationSession=reactive({favorites:favoriteSample===null?[...applicationDefaults]:sample.slice(0,Math.max(0,Math.min(FAVORITE_LIMIT,Number(favoriteSample)||0)))})
