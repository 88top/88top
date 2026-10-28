import {homeApplications,sampleApplications} from './homeApplications'
import {installedSample} from './launcherMetadata'
export function launcherFixture(key:string,method:string,body:Record<string,any>,scenario:string){
 const result=(data:unknown)=>({status:200,data:{result:data,success:0,previewOnly:true}})
 if(key==='/app/install-list/'&&method==='GET'){
  if(scenario==='apps-error'||scenario==='apps-permission')return {status:scenario==='apps-permission'?403:503,data:{error:'Synthetic catalogue unavailable'}}
  const apps=[...homeApplications.filter(a=>a.kind==='app'&&!(scenario==='apps-uninstalled'&&a.id==='docker')),...(['apps-many','apps-overflow-uninstalled'].includes(scenario)?sampleApplications.filter(a=>!(scenario==='apps-overflow-uninstalled'&&a.id==='example-6')):[])].map(installedSample)
  if(scenario==='apps-duplicates')apps.push({...apps[0]},{name:'tool-lan',title:'Conflicting app',entry:'/invalid'})
  if(scenario==='apps-no-entry')apps[0].entry=''
  if(scenario==='apps-120'){const extra=Array.from({length:96},(_,i)=>({name:'library-'+i,title:'应用 '+(i+1),title_en:'Library app '+(i+1),entry:'/app-example/library-'+i}));apps.push(...sampleApplications.slice(0,7).map(installedSample),...extra)}
  if(scenario==='apps-35')apps.push(...sampleApplications.slice(0,18).map(installedSample))
  return {status:200,data:scenario==='apps-empty'?[]:apps}
 }
 if(key==='/nas/sandbox/'&&method==='GET')return result({status:scenario==='sandbox-running'?'running':scenario==='sandbox-unsupported'?'unsupport':'stopped'})
 if(key==='/guide/lan/'&&method==='GET')return result({lanIp:'192.168.30.244',netMask:'255.255.255.0',enableDhcp:false,dhcpStart:'192.168.30.100',dhcpEnd:'192.168.30.200'})
 if(key==='/nas/sandbox/disks/'&&method==='GET')return result({disks:[],sandboxSize:'0 B'})
 if(key==='/system/auto-check-update/'&&method==='POST')return typeof body.enable==='boolean'?result({}):{status:400,data:{error:'Invalid enable'}}
 // Original reboot/address-change workflows must not probe actual hosts here.
 if(method==='POST'&&['/guide/lan/','/nas/sandbox/','/u/nas/sandbox/commit/','/nas/sandbox/reset/','/nas/sandbox/exit/','/system/reboot/'].includes(key))return {status:409,data:{error:'设计预览：地址切换／沙箱重启未执行。原表单与校验保留。',previewOnly:true}}
}
