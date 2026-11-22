/*
 * Zweck: Tests des simulierten Pads (Issue #13).
 * Inhalt: Das Zusammenspiel von ProtocolClient und MockDevice für alle Befehle, die Fehlercodes des Protokolls
 *         bei Rohanfragen und die Haken für Fehlerfälle (keine Antwort, erzwungener Fehler, kaputte Antwort).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '../model/profile.ts'
import { ProtocolClient } from './client.ts'
import { MockDevice } from './mockDevice.ts'

const profile: Profile = {
  name: 'Programmierung',
  layout: 'de-DE',
  keys: [
    { type: 'combo', label: 'Undo', intent: { keys: 'ctrl+z' }, steps: [{ mod: 1, key: 0x1c }] },
    null,
    null,
    null,
  ],
}

/** Sends a raw line and returns the parsed answer. */
async function raw(device: MockDevice, line: string): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const off = device.onLine((answer) => {
      off()
      resolve(JSON.parse(answer))
    })
    device.send(line)
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('MockDevice with ProtocolClient', () => {
  it('reports its configuration in device.info', async () => {
    const device = new MockDevice({ keys: 9, firmware: '1.2.3', maxSteps: 16 })
    const info = await new ProtocolClient(device).deviceInfo()
    expect(info).toMatchObject({ protocol: 1, firmware: '1.2.3', keys: 9, profiles: 2, activeProfile: 0 })
    expect(info.limits.maxSteps).toBe(16)
  })

  it('returns empty profiles for slots that were never written', async () => {
    const result = await new ProtocolClient(new MockDevice()).getProfile(1)
    expect(result).toEqual({ name: '', layout: 'de-DE', keys: [null, null, null, null] })
  })

  it('stores a written profile and returns it unchanged', async () => {
    const device = new MockDevice()
    const client = new ProtocolClient(device)
    await client.setProfile(0, profile)
    await expect(client.getProfile(0)).resolves.toEqual(profile)
    expect(device.profiles[0]).toEqual(profile)
  })

  it('switches the active profile', async () => {
    const device = new MockDevice()
    await expect(new ProtocolClient(device).activateProfile(1)).resolves.toBe(1)
    expect(device.activeProfile).toBe(1)
  })

  it('rejects an index out of range and keeps the state', async () => {
    const device = new MockDevice()
    const client = new ProtocolClient(device)
    await expect(client.getProfile(2)).rejects.toMatchObject({ code: 'OUT_OF_RANGE' })
    await expect(client.activateProfile(-1)).rejects.toMatchObject({ code: 'OUT_OF_RANGE' })
    expect(device.activeProfile).toBe(0)
  })

  it('rejects a profile with the wrong number of keys', async () => {
    const client = new ProtocolClient(new MockDevice())
    await expect(client.setProfile(0, { ...profile, keys: [null] })).rejects.toMatchObject({ code: 'OUT_OF_RANGE' })
  })

  it('rejects too many steps and leaves the old profile untouched', async () => {
    const device = new MockDevice({ maxSteps: 2 })
    const client = new ProtocolClient(device)
    await client.setProfile(0, profile)

    const steps = [
      { mod: 0, key: 4 },
      { mod: 0, key: 5 },
      { mod: 0, key: 6 },
    ]
    const tooLong: Profile = { ...profile, name: 'Zu lang', keys: [{ type: 'text', label: 't', intent: { text: 'abc', enter: false }, steps }, null, null, null] }
    await expect(client.setProfile(0, tooLong)).rejects.toMatchObject({ code: 'TOO_LARGE' })
    expect(device.profiles[0]).toEqual(profile)
  })

  it('times out when the pad is unresponsive', async () => {
    vi.useFakeTimers()
    const device = new MockDevice()
    device.setUnresponsive(true)
    const result = new ProtocolClient(device, { timeoutMs: 500 }).deviceInfo()
    const assertion = expect(result).rejects.toMatchObject({ code: 'TIMEOUT' })
    await vi.advanceTimersByTimeAsync(500)
    await assertion
  })

  it('answers the next request with a forced error, then works again', async () => {
    const device = new MockDevice()
    const client = new ProtocolClient(device)
    device.failNextWith('STORAGE_FAILED', 'flash full')
    await expect(client.setProfile(0, profile)).rejects.toMatchObject({ code: 'STORAGE_FAILED', message: 'flash full' })
    expect(device.profiles[0].name).toBe('')
    await expect(client.setProfile(0, profile)).resolves.toBeUndefined()
  })

  it('cuts off the next answer, which the client then lets time out', async () => {
    vi.useFakeTimers()
    const device = new MockDevice()
    device.corruptNextAnswer()
    const result = new ProtocolClient(device, { timeoutMs: 500 }).deviceInfo()
    const assertion = expect(result).rejects.toMatchObject({ code: 'TIMEOUT' })
    await vi.advanceTimersByTimeAsync(500)
    await assertion
  })

  it('lets a test simulate a pad with another protocol version', async () => {
    const device = new MockDevice({ protocol: 2 })
    await expect(new ProtocolClient(device).deviceInfo()).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
  })

  it('records the lines it received', async () => {
    const device = new MockDevice()
    await new ProtocolClient(device).deviceInfo()
    expect(device.received).toEqual(['{"v":1,"id":1,"cmd":"device.info"}'])
  })
})

describe('MockDevice error codes for raw requests', () => {
  it.each([
    ['not json', 'BAD_REQUEST', 0],
    ['[1]', 'BAD_REQUEST', 0],
    ['{"v":1,"id":3}', 'BAD_REQUEST', 3],
    ['{"v":1,"id":4,"cmd":"profile.get"}', 'BAD_REQUEST', 4],
    ['{"v":1,"id":5,"cmd":"dance"}', 'UNKNOWN_CMD', 5],
    ['{"v":2,"id":6,"cmd":"device.info"}', 'UNSUPPORTED_VERSION', 6],
    ['{"v":1,"id":7,"cmd":"profile.set","index":0,"profile":{"name":""}}', 'BAD_REQUEST', 7],
  ])('answers %s with %s', async (line, code, id) => {
    const answer = await raw(new MockDevice(), line)
    expect(answer).toMatchObject({ v: 1, id, ok: false, error: { code } })
  })

  it('refuses a message larger than maxMessageBytes', async () => {
    const device = new MockDevice({ maxMessageBytes: 50 })
    const answer = await raw(device, JSON.stringify({ v: 1, id: 1, cmd: 'device.info', pad: 'x'.repeat(60) }))
    expect(answer).toMatchObject({ ok: false, error: { code: 'TOO_LARGE' } })
  })
})
