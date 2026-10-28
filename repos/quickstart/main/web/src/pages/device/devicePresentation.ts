import type { DeviceListItem, InventoryAddress, InventoryDevice } from './deviceInventory'
import type { DeviceScene } from './deviceScene'
type Translate = (text: string) => string

// Shared by the real device center and the design-only home summary.
export const deviceCategoryLabel = (scene: DeviceScene, t: Translate): string => ({
    phone:t('手机'),computer:t('电脑'),tablet:t('平板'),tv:t('电视与影音'),network:t('网络设备'),
    'smart-home':t('智能家居'),camera:t('摄像头'),gaming:t('游戏设备'),storage:t('存储与服务器'),
    printer:t('打印机'),wearable:t('穿戴设备'),unknown:t('未知设备'),
}[scene])
export const deviceDisplayName = (device: DeviceListItem, t: Translate): string => {
    const name = device.displayName || device.hostname || ''
    if (name) return name
    if (device.brand) return `${device.brand} ${device.classification.source === 'fallback' ? t('设备') : deviceCategoryLabel(device.scene,t)}`
    return t('未命名设备')
}
export const devicePresenceLabel = (device: Pick<InventoryDevice,'presenceState'|'online'>, t: Translate): string =>
    device.presenceState === 'never_seen' ? t('尚未上线') : device.online ? t('在线') : t('离线')

// A compact home projection must not mistake primaryAddress's historical
// fallback for a current IP. Stable identity/navigation still uses deviceId.
export const deviceHomeAddress = (device: Pick<InventoryDevice,'addresses'|'mac'|'deviceId'>, t: Translate) => {
    const choose = (items: InventoryAddress[]) => items.find(a=>a.family===4&&a.primary)
        || items.find(a=>a.family===4) || items.find(a=>a.primary) || items[0]
    const compact = (value: string) => value.length>20 ? `${value.slice(0,6)}…${value.slice(-9)}` : value
    const current = choose(device.addresses.current)
    if(current) return {kind:'current' as const,text:compact(current.address),description:`${t('当前IP')}：${current.address}`}
    const historical = choose(device.addresses.historical)
    if(historical) return {kind:'historical' as const,text:`${t('历史')} ${compact(historical.address)}`,description:`${t('历史地址')}：${historical.address}`}
    if(device.mac) return {kind:'mac' as const,text:device.mac,description:`${t('MAC地址')}：${device.mac}`}
    return {kind:'identity' as const,text:`ID · ${device.deviceId.slice(-8)}`,description:`${t('地址待确认')} · ID：${device.deviceId}`}
}
