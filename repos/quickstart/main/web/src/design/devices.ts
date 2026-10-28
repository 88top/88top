import type { InventoryDevice } from '../pages/device/deviceInventory'
import type { DeviceScene } from '../pages/device/deviceScene'
import { demo } from './fixtures'
const examples: Array<[string,string,DeviceScene,string]> = [
  ['书房的 MacBook','Apple','computer','laptop'],['客厅电视','Xiaomi','tv','tv'],
  ['小林的手机','Apple','phone','phone'],['家庭 NAS','','storage','home-server'],
  ['','','computer','computer'],['孩子的平板','HUAWEI','tablet','tablet'],
  ['卧室音箱','Xiaomi','smart-home','smart-speaker'],['访客电脑','','computer','computer'],
]
export const profiles=new Map<string, any>()
export function inventory(): InventoryDevice[] {
  if(demo.scenario==='empty')return []
  const count=demo.scenario==='many'?128:8
  return Array.from({length:count},(_,i)=>{
    const [name,brand,category,icon]=examples[i%8]
    const mac=`02:00:00:00:${Math.floor(i/256).toString(16).padStart(2,'0')}:${(i%256+1).toString(16).padStart(2,'0')}`
    const online=i< (count===128?96:6)
    const id=`mac:${mac.toUpperCase()}`,profile=profiles.get(id)
    return {deviceId:id,mac,displayName:profile?.alias ?? (demo.scenario==='long-names'?'家庭工作室与影音中心的设备 Very long device name '+String(i+1)+' · '+name:(i<8?name:`家庭设备 ${i+1}`)),hostname:'',online,
      presenceState:i===7?'never_seen':online?'online':'offline',lastSeenAt:`2026-10-14T03:${String(59-i%60).padStart(2,'0')}:00Z`,
      vendor:brand,classification:{brand:profile?.brand ?? brand,manufacturer:brand,category:profile?.category || category,source:profile?.category||profile?.brand?'manual':i===4?'fallback':'manual',confidence:i===4?'low':'high'},
      icon:{mode:profile?.iconMode|| (i===0?'manual':'auto'),resolvedKey:profile?.iconKey||icon,assetKey:profile?.iconMode==='manual'?profile?.iconKey||icon:icon,label:category},identity:{kind:'mac',scope:'persistent'},
      addresses:{current:online?[{family:4,address:`192.168.30.${101+i}`,primary:true}]:[],historical:i===6?[{family:4,address:'192.168.30.107'}]:[]},
      connection:{kind:i===4?'unknown':i===1||i===3?'lan':'wifi'},
    }
  })
}
