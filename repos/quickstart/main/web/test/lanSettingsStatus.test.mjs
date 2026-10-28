import test from 'node:test'
import assert from 'node:assert/strict'
import { readDhcpSnapshot, readSpeedSnapshot } from '../src/pages/device/lanSettingsStatus.ts'

const settings = { enabled: false, poolStart: '', poolEnd: '', leaseTime: '12h', defaultTargetId: 'self' }
const speedLimit = { provider: 'eqos', providers: [{ id: 'eqos', installed: true, available: false }] }
const capability = { state: 'disabled' }
const speed = () => ({ success: 0, result: { speedLimit, capabilities: { items: { device_speed_limit: capability } } } })

test('DHCP summaries require a successful complete local snapshot; false and empty are legitimate values', () => {
    const result = { settings, editable: false }
    assert.equal(readDhcpSnapshot({ result }), result)
    for (const body of [undefined, {}, { success: 1, result }, { success: -1, result }, { error: 'failure', result }, { result: { ...result, error: { code: 'read_failed' } } }, { result: { ...result, settings: { enabled: true } } }, { result: { ...result, editable: 'true' } }]) assert.equal(readDhcpSnapshot(body), undefined)
})

test('speed observations accept unavailable providers and preserve the real capability reason', () => {
    assert.deepEqual(readSpeedSnapshot(speed()), { speedLimit, capability })
    const legacy = speed();legacy.result.capabilities = { speedLimit: capability }
    assert.deepEqual(readSpeedSnapshot(legacy), { speedLimit, capability })
})

test('HTTP-200 business failures, missing capabilities and malformed provider lists cannot become ready observations', () => {
    for (const body of [undefined, {}, { ...speed(), success: -1 }, { ...speed(), error: 'denied' }, { result: { speedLimit } }, { result: { speedLimit: { provider: 'eqos', providers: {} }, capabilities: speed().result.capabilities } }, { result: { speedLimit: { ...speedLimit, providers: [{ id: 'eqos', available: 'yes' }] }, capabilities: speed().result.capabilities } }]) assert.throws(() => readSpeedSnapshot(body), /invalid_service_snapshot/)
})
