// Design-only implementation of existing endpoint responses. Never real I/O.
const sourceList=[{identity:'preview-primary',name:'示例软件源 A',url:'https://packages.example.invalid/a'},{identity:'preview-secondary',name:'示例软件源 B',url:'https://packages.example.invalid/b'}]
let previous='',started=Date.now(),dnsSaved=false,source=sourceList[0],dnsProto='manual',dnsList=['192.168.30.1']
export function networkFixture(key:string,method:string,body:Record<string,any>,scenario:string,recovered:boolean){
 if(!['/u/network/status/','/network/port/list/','/guide/dns-config/','/guide/soft-source/','/guide/soft-source/list/'].includes(key))return
 if(previous!==scenario){previous=scenario;started=Date.now();dnsSaved=false;source=sourceList[0];dnsProto='manual';dnsList=['192.168.30.1']}
 const result=(data:unknown)=>({status:200,data:{result:data,success:0,previewOnly:true}})
 if(method==='GET'&&(!recovered&&(scenario==='network-error'||scenario==='ports-error'&&key==='/network/port/list/')))return {status:503,data:{error:'Synthetic network read failure',previewOnly:true}}
 if(key==='/guide/soft-source/list/'&&method==='GET')return result({softSourceList:sourceList})
 if(key==='/guide/soft-source/'&&method==='GET')return result({softSource:source})
 if(key==='/guide/dns-config/'&&method==='GET')return result({dnsProto,manualDnsIp:dnsList,interfaceName:'wan'})
 if(['/guide/dns-config/','/guide/soft-source/'].includes(key)&&method==='POST'){
  if(['network-write-error','network-source-write-error'].includes(scenario))return {status:409,data:{error:'Synthetic write rejection; no settings changed',previewOnly:true}}
  if(key==='/guide/dns-config/'){
   if(!['auto','manual'].includes(body.dnsProto)||body.interfaceName!=='wan'||body.dnsProto==='manual'&&(!Array.isArray(body.manualDnsIp)||!body.manualDnsIp.length))return {status:400,data:{error:'Invalid synthetic DNS configuration',previewOnly:true}}
   dnsProto=body.dnsProto;dnsList=dnsProto==='manual'?[...body.manualDnsIp]:['192.168.30.1'];dnsSaved=true
  }else{const match=sourceList.find(v=>v.identity===body.softSourceIdentity);if(!match)return {status:400,data:{error:'Unknown synthetic source',previewOnly:true}};source=match}
  return result({})
 }
 if(key==='/u/network/status/'&&method==='GET'){
  const states:Record<string,string>={'network-dns':'dnsFailed','network-dns-dhcp':'dnsFailed','network-source':'softSourceFailed','network-offline':'netFailed','network-detecting':'netDetecting','network-unknown':'unrecognized','network-write-error':'dnsFailed','network-source-write-error':'softSourceFailed'}
  const state=dnsSaved||scenario==='network-source'&&source.identity==='preview-secondary'?'netSuccess':states[scenario]||'netSuccess'
  const data:Record<string,unknown>={defaultInterface:'wan',networkInfo:state,proto:scenario==='network-dns-dhcp'?'dhcp':scenario==='network-pppoe'?'pppoe':'static',ipv4addr:'192.168.30.7',ipv6addr:'2001:db8:1234:5678:90ab:cdef:1234:5678',ipv4mask:24,gateway:'192.168.30.1',dnsList:scenario==='network-many'?Array.from({length:48},(_,i)=>'2001:db8::'+(i+1).toString(16)):dnsList,dnsProto,uptimeStamp:109000+Math.max(0,Math.floor((Date.now()-started)/1000))}
  // The existing backend status service may omit internetConnected. The primary
  // fixture intentionally omits it; only the declared state drives this widget.
  // Match the user's original screenshot for visual review only. The ordinary
  // fixture remains dual-stack so IPv6 privacy continues to be exercised.
  if(scenario==='network-reference'){delete data.ipv6addr;data.uptimeStamp=312357;data.dnsList=['192.168.30.1']}
  if(scenario==='network-no-address'){delete data.ipv4addr;delete data.ipv6addr;delete data.uptimeStamp;data.dnsList=[];delete data.dnsProto;data.defaultInterface='';data.proto=''}
  return result(data)
 }
 if(key==='/network/port/list/'&&method==='GET')return result({ports:scenario==='ports-empty'?[]:Array.from({length:scenario==='network-many'?128:3},(_,i)=>({name:'eth'+i,macAddress:`02:00:00:00:01:${i.toString(16).padStart(2,'0')}`,linkState:i===0||i%4===0?'UP':scenario==='network-many'&&i%3===0?'UNKNOWN':'DOWN',linkSpeed:i===0?'1000 Mbps':'',interfaceNames:i===0?['WAN','WAN6']:['LAN'],duplex:i===0?'full':'half',rx_packets:String(i===0?0:100+i),tx_packets:String(40+i)}))})
}
