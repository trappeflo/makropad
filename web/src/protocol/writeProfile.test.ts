/*
 * Zweck: Tests des Schreibablaufs (Issue #14).
 * Inhalt: Erfolgsfall mit Phasenfolge, Prüfung vor dem Senden, Fehler des Pads je Phase, Abweichung beim
 *         Zurücklesen und diffProfiles. Gegenstelle ist der MockDevice (#13).
 */
import { describe, expect, it } from 'vitest'
import type { Profile } from '../model/profile.ts'
import { deriveSteps } from '../model/steps.ts'
import { ProtocolClient } from './client.ts'
import { MockDevice } from './mockDevice.ts'
import type { Transport } from './transport.ts'
import { diffProfiles, writeProfile, type WritePhase } from './writeProfile.ts'

const undo = deriveSteps({ type: 'combo', label: 'Undo', intent: { keys: 'ctrl+z' }, steps: [] })

const profile: Profile = { name: 'Programmierung', layout: 'de-DE', keys: [undo, null, null, null] }

function setup(device = new MockDevice()) {
  return { device, client: new ProtocolClient(device, { timeoutMs: 200 }) }
}

/** Passes everything through, but lets a test change what the pad answers. */
function tamper(device: MockDevice, change: (answer: Record<string, unknown>) => void): Transport {
  return {
    send: (line) => device.send(line),
    onLine: (listener) =>
      device.onLine((line) => {
        const answer = JSON.parse(line)
        change(answer)
        listener(JSON.stringify(answer))
      }),
  }
}

describe('writeProfile', () => {
  it('runs all phases in order and stores the profile', async () => {
    const { device, client } = setup()
    const phases: WritePhase[] = []
    await writeProfile(client, 1, profile, (p) => phases.push(p))
    expect(phases).toEqual(['info', 'validate', 'write', 'readback', 'compare'])
    expect(device.profiles[1]).toEqual(profile)
  })

  it('does not send anything to the pad if the profile is invalid', async () => {
    const { device, client } = setup()
    const bad: Profile = { ...profile, keys: [{ ...undo, steps: [{ mod: 0, key: 4 }] }, null, null, null] }
    const error = await writeProfile(client, 0, bad).catch((e) => e)
    expect(error).toMatchObject({ phase: 'validate', code: 'INVALID_PROFILE' })
    expect(error.details).toEqual(['keys[0].steps: do not match the intent'])
    expect(device.received).toHaveLength(1) // only device.info
  })

  it('reports the wrong number of keys and steps beyond the limit', async () => {
    const { client } = setup(new MockDevice({ maxSteps: 1 }))
    const text = deriveSteps({ type: 'text', label: 't', intent: { text: 'ab', enter: false }, steps: [] })
    const error = await writeProfile(client, 0, { ...profile, keys: [text, null] }).catch((e) => e)
    expect(error.code).toBe('INVALID_PROFILE')
    expect(error.details.join('\n')).toContain('expected 4 keys')
  })

  it('reports an intent that cannot be converted', async () => {
    const { client } = setup()
    const broken: Profile['keys'][number] = { type: 'combo', label: 'x', intent: { keys: 'ctrl+blub' }, steps: [{ mod: 0, key: 4 }] }
    const error = await writeProfile(client, 0, { ...profile, keys: [broken, null, null, null] }).catch((e) => e)
    expect(error.details).toContain('keys[0].intent: Unbekannte Taste "blub".')
  })

  it('rejects a slot that does not exist before writing', async () => {
    const { device, client } = setup()
    await expect(writeProfile(client, 5, profile)).rejects.toMatchObject({ phase: 'validate', code: 'OUT_OF_RANGE' })
    expect(device.received).toHaveLength(1)
  })

  it('fails in the info phase for another protocol version', async () => {
    const { client } = setup(new MockDevice({ protocol: 2 }))
    await expect(writeProfile(client, 0, profile)).rejects.toMatchObject({ phase: 'info', code: 'UNSUPPORTED_VERSION' })
  })

  it('names the write phase when the pad cannot store the profile', async () => {
    const device = new MockDevice()
    // the first answer is device.info, the second one belongs to the write
    let answers = 0
    const failing = tamper(device, (a) => {
      if (++answers === 2) Object.assign(a, { ok: false, error: { code: 'STORAGE_FAILED', message: 'flash full' } })
    })
    await expect(writeProfile(new ProtocolClient(failing, { timeoutMs: 200 }), 0, profile)).rejects.toMatchObject({
      phase: 'write',
      code: 'STORAGE_FAILED',
    })
  })

  it('names the readback phase when the pad stops answering after the write', async () => {
    const device = new MockDevice()
    const mute: Transport = {
      send: (line) => {
        if (JSON.parse(line).cmd === 'profile.get') device.setUnresponsive(true)
        device.send(line)
      },
      onLine: (listener) => device.onLine(listener),
    }
    await expect(writeProfile(new ProtocolClient(mute, { timeoutMs: 50 }), 0, profile)).rejects.toMatchObject({
      phase: 'readback',
      code: 'TIMEOUT',
    })
  })

  it('finds a difference in what the pad returns', async () => {
    const { device } = setup()
    const changed = tamper(device, (answer) => {
      const returned = answer.profile as Profile | undefined
      if (returned !== undefined) returned.name = 'Anders'
    })
    const error = await writeProfile(new ProtocolClient(changed, { timeoutMs: 200 }), 0, profile).catch((e) => e)
    expect(error).toMatchObject({ phase: 'compare', code: 'MISMATCH', details: ['name'] })
  })
})

describe('diffProfiles', () => {
  it('is empty for equal profiles, also if the field order differs', () => {
    const reordered = JSON.parse(JSON.stringify({ keys: profile.keys, layout: profile.layout, name: profile.name }))
    expect(diffProfiles(profile, reordered)).toEqual([])
  })

  it('lists name, layout and the keys that differ', () => {
    const other: Profile = {
      name: 'x',
      layout: 'de-DE',
      keys: [{ ...undo, label: 'Zurück' }, null, null, null],
    }
    expect(diffProfiles(profile, other)).toEqual(['name', 'keys[0]'])
  })

  it('reports a different number of keys once', () => {
    expect(diffProfiles(profile, { ...profile, keys: [null] })).toEqual(['keys (4 sent, 1 returned)'])
  })
})
