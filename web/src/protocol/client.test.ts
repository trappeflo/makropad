/*
 * Zweck: Tests des Protokoll-Clients (Issue #12).
 * Inhalt: Anfrageformat, die vier Befehle, Fehlerantworten, Timeout, ungültige Antworten, Versionsprüfung und
 *         das Ignorieren fremder Zeilen. Als Gegenstelle dient ein kleiner Test-Transport, der Mock des
 *         Geräts (#13) kommt später dazu.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '../model/profile.ts'
import { ProtocolClient, ProtocolError } from './client.ts'
import type { Transport } from './transport.ts'

class TestTransport implements Transport {
  sent: Record<string, unknown>[] = []
  private listeners = new Set<(line: string) => void>()

  send(line: string): void {
    this.sent.push(JSON.parse(line))
  }

  onLine(listener: (line: string) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Delivers a line from the pad. */
  receive(line: string): void {
    this.listeners.forEach((l) => l(line))
  }

  reply(message: Record<string, unknown>): void {
    this.receive(JSON.stringify({ v: 1, ...message }))
  }
}

const info = {
  protocol: 1,
  firmware: '0.1.0',
  keys: 4,
  profiles: 2,
  activeProfile: 0,
  persistent: true,
  limits: { maxSteps: 32, maxMessageBytes: 4096 },
}

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

let transport: TestTransport
let client: ProtocolClient

beforeEach(() => {
  vi.useFakeTimers()
  transport = new TestTransport()
  client = new ProtocolClient(transport, { timeoutMs: 1000 })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ProtocolClient', () => {
  it('sends device.info with version and counting ids and returns the info', async () => {
    const first = client.deviceInfo()
    expect(transport.sent[0]).toEqual({ v: 1, id: 1, cmd: 'device.info' })
    transport.reply({ id: 1, ok: true, ...info })
    await expect(first).resolves.toEqual(info)

    const second = client.deviceInfo()
    expect(transport.sent[1]).toMatchObject({ id: 2 })
    transport.reply({ id: 2, ok: true, ...info })
    await second
  })

  it('reads a profile', async () => {
    const result = client.getProfile(0)
    expect(transport.sent[0]).toEqual({ v: 1, id: 1, cmd: 'profile.get', index: 0 })
    transport.reply({ id: 1, ok: true, profile })
    await expect(result).resolves.toEqual(profile)
  })

  it('accepts the empty profile of a slot that was never written', async () => {
    const empty = { name: '', layout: 'de-DE', keys: [null, null, null, null] }
    const result = client.getProfile(1)
    transport.reply({ id: 1, ok: true, profile: empty })
    await expect(result).resolves.toEqual(empty)
  })

  it('writes a profile', async () => {
    const result = client.setProfile(1, profile)
    expect(transport.sent[0]).toEqual({ v: 1, id: 1, cmd: 'profile.set', index: 1, profile })
    transport.reply({ id: 1, ok: true })
    await expect(result).resolves.toBeUndefined()
  })

  it('activates a profile and returns the reported index', async () => {
    const result = client.activateProfile(1)
    expect(transport.sent[0]).toEqual({ v: 1, id: 1, cmd: 'profile.activate', index: 1 })
    transport.reply({ id: 1, ok: true, activeProfile: 1 })
    await expect(result).resolves.toBe(1)
  })

  it('matches answers to requests by id, also out of order', async () => {
    const a = client.getProfile(0)
    const b = client.activateProfile(1)
    transport.reply({ id: 2, ok: true, activeProfile: 1 })
    transport.reply({ id: 1, ok: true, profile })
    await expect(a).resolves.toEqual(profile)
    await expect(b).resolves.toBe(1)
  })

  it('turns an error response into a ProtocolError with the code of the pad', async () => {
    const result = client.getProfile(5)
    transport.reply({ id: 1, ok: false, error: { code: 'OUT_OF_RANGE', message: 'index 5' } })
    await expect(result).rejects.toMatchObject({ name: 'ProtocolError', code: 'OUT_OF_RANGE', message: 'index 5' })
  })

  it('maps an unknown error code to UNKNOWN_ERROR', async () => {
    const result = client.getProfile(0)
    transport.reply({ id: 1, ok: false, error: { code: 'SOMETHING_NEW', message: 'x' } })
    await expect(result).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' })
  })

  it('fails with TIMEOUT if the pad does not answer, and ignores the late answer', async () => {
    const result = client.deviceInfo()
    const assertion = expect(result).rejects.toMatchObject({ code: 'TIMEOUT' })
    await vi.advanceTimersByTimeAsync(1000)
    await assertion

    expect(() => transport.reply({ id: 1, ok: true, ...info })).not.toThrow()
  })

  it('does not time out once the answer has arrived', async () => {
    const result = client.activateProfile(0)
    transport.reply({ id: 1, ok: true, activeProfile: 0 })
    await result
    await vi.advanceTimersByTimeAsync(5000)
  })

  it('rejects a response that does not match the protocol', async () => {
    const result = client.deviceInfo()
    transport.reply({ id: 1, ok: true, protocol: 1 })
    await expect(result).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('rejects a response with ok but no way to tell, as INVALID_RESPONSE', async () => {
    const result = client.setProfile(0, profile)
    transport.reply({ id: 1 })
    await expect(result).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('refuses a pad with another protocol version', async () => {
    const result = client.deviceInfo()
    transport.reply({ id: 1, ok: true, ...info, protocol: 2 })
    await expect(result).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
  })

  it('ignores broken lines and lines for unknown ids', async () => {
    const result = client.activateProfile(0)
    transport.receive('not json')
    transport.receive('{"hello":1}')
    transport.reply({ id: 99, ok: true, activeProfile: 1 })
    transport.reply({ id: 1, ok: true, activeProfile: 0 })
    await expect(result).resolves.toBe(0)
  })

  it('is a ProtocolError instance', async () => {
    const result = client.getProfile(0)
    transport.reply({ id: 1, ok: false, error: { code: 'BUSY', message: 'playing' } })
    await expect(result).rejects.toBeInstanceOf(ProtocolError)
  })
})
