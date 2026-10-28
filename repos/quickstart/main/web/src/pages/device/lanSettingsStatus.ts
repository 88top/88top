import type { LanDhcpSettingsResult } from './lanDhcpSettings'

const object = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const envelopeOK = (value: any) => object(value) && !value.error && (value.success === undefined || value.success === 0)

// A missing snapshot must never turn the editor's initial values into facts.
export const readDhcpSnapshot = (body: unknown): LanDhcpSettingsResult | undefined => {
    if (!envelopeOK(body)) return
    const result = (body as any).result
    if (!object(result) || result.error || typeof result.editable !== 'boolean') return
    const settings = result.settings
    if (!object(settings) || typeof settings.enabled !== 'boolean' ||
        !['poolStart', 'poolEnd', 'leaseTime', 'defaultTargetId'].every(key => typeof settings[key] === 'string')) return
    return result as unknown as LanDhcpSettingsResult
}

export const readSpeedSnapshot = (body: unknown) => {
    if (!envelopeOK(body)) throw new Error('invalid_service_snapshot')
    const result = (body as any).result
    const speed = result?.speedLimit
    const capability = result?.capabilities?.items?.device_speed_limit ?? result?.capabilities?.speedLimit
    if (!object(result) || !object(speed) || typeof speed.provider !== 'string' || !Array.isArray(speed.providers) ||
        !speed.providers.every((provider: any) => object(provider) && typeof provider.id === 'string' &&
            typeof provider.available === 'boolean' && typeof provider.installed === 'boolean') ||
        !object(capability) || !['available', 'disabled', 'not_installed', 'unsupported', 'error'].includes(capability.state)) {
        throw new Error('invalid_service_snapshot')
    }
    return { speedLimit: speed, capability }
}
