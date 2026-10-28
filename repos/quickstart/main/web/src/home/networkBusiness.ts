// Read-only projections of existing Quickstart fields. No requests or writes.
export const networkModuleKeys={connection:'networkConnection',networkInterface:'networkInterface'} as const
export type NetworkSnapshot={networkInfo?:string;internetConnected?:boolean;defaultInterface?:string;proto?:string;ipv4addr?:string;ipv6addr?:string;dnsProto?:string;dnsList?:string[];uptimeStamp?:number;gateway?:string}
export type ConnectionState='netSuccess'|'dnsFailed'|'softSourceFailed'|'netFailed'|'netDetecting'|'unknown'|'loading'|'unavailable'
export function connectionState(data?:NetworkSnapshot,error=''):ConnectionState{
 if(error)return 'unavailable'
 if(!data)return 'loading'
 const value=data.networkInfo
 return ['netSuccess','dnsFailed','softSourceFailed','netFailed','netDetecting'].includes(value||'')?value as ConnectionState:'unknown'
}
export const connectionLabels:Record<ConnectionState,[string,string]>={netSuccess:['网络连接正常','Connection normal'],dnsFailed:['DNS错误','DNS error'],softSourceFailed:['软件源错误','Software source error'],netFailed:['未联网','Not connected'],netDetecting:['检测中…','Checking…'],unknown:['连接状态待确认','Connection unconfirmed'],loading:['正在读取连接','Loading connection'],unavailable:['连接信息暂不可用','Connection unavailable']}
export const protocolLabel=(proto?:string):[string,string]=>proto==='pppoe'?['拨号上网','PPPoE']:proto==='static'?['静态网络','Static']:proto==='dhcp'?['DHCP','DHCP']:[proto?.toUpperCase()||'—',proto?.toUpperCase()||'—']
export const dnsSource=(mode?:string):[string,string]=>mode==='manual'?['手动配置','Manual']:mode==='auto'?['自动获取','Automatic']:['来源待确认','Source unknown']
export function onlineSeconds(data?:NetworkSnapshot,elapsed=0){const seconds=data?.uptimeStamp;return typeof seconds==='number'&&Number.isFinite(seconds)&&seconds>=0?Math.floor(seconds)+Math.max(0,Math.floor(elapsed)):null}
export function onlineDuration(seconds:number|null,english=false){if(seconds===null)return '—';const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60);return english?`${days?days+'d ':''}${hours}h ${minutes}m`:`${days?days+'天 ':''}${hours}小时 ${minutes}分`}
export function portState(state?:string){return state==='UP'?'up':state==='DOWN'?'down':'unknown'}
export function portCounts(ports:Array<{linkState?:string}>){return {total:ports.length,up:ports.filter(p=>portState(p.linkState)==='up').length,down:ports.filter(p=>portState(p.linkState)==='down').length,unknown:ports.filter(p=>portState(p.linkState)==='unknown').length}}
