/*
 * Zweck: Tests für Profilmodell und Validierung (Issue #3).
 * Inhalt: gültige Profile, Strukturfehler, Grenzen des Geräts und Pfadangaben der Fehler.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_LIMITS, validateProfile, type KeyAction, type Profile } from './profile.ts'

const combo: KeyAction = {
  type: 'combo',
  label: 'Befehlspalette',
  intent: { keys: 'ctrl+shift+p' },
  steps: [{ mod: 3, key: 19 }],
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return { name: 'Programmierung', layout: 'de-DE', keys: [combo, null, null, null], ...overrides }
}

describe('validateProfile', () => {
  it('accepts a valid profile', () => {
    expect(validateProfile(profile())).toEqual([])
  })

  it('accepts text actions and delay steps', () => {
    const text: KeyAction = {
      type: 'text',
      label: 'git status',
      intent: { text: 'git status', enter: true },
      steps: [{ mod: 0, key: 10 }, { delay: 50 }],
    }
    expect(validateProfile(profile({ keys: [text, null, null, null] }))).toEqual([])
  })

  it('rejects an empty name and forbidden characters', () => {
    expect(validateProfile(profile({ name: '' })).every((e) => e.path === 'name')).toBe(true)
    expect(validateProfile(profile({ name: '' }))).not.toEqual([])
    expect(validateProfile(profile({ name: 'a/b' })).map((e) => e.path)).toEqual(['name'])
  })

  it('rejects a layout other than de-DE', () => {
    expect(validateProfile({ ...profile(), layout: 'en-US' }).map((e) => e.path)).toEqual(['layout'])
  })

  it('rejects an intent that does not match the type', () => {
    const bad = { ...combo, intent: { text: 'x', enter: false } }
    const errors = validateProfile({ ...profile(), keys: [bad, null, null, null] })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].path).toContain('keys[0]')
  })

  it('rejects out-of-range HID values and empty steps', () => {
    const bad = { ...combo, steps: [{ mod: 300, key: 19 }] }
    expect(validateProfile({ ...profile(), keys: [bad, null, null, null] }).length).toBeGreaterThan(0)
    const empty = { ...combo, steps: [] }
    expect(validateProfile({ ...profile(), keys: [empty, null, null, null] }).length).toBeGreaterThan(0)
  })

  it('rejects a wrong number of keys', () => {
    const errors = validateProfile(profile({ keys: [null, null] }))
    expect(errors).toEqual([{ path: 'keys', message: 'expected 4 keys, got 2' }])
  })

  it('rejects too many steps for the device', () => {
    const many = { ...combo, steps: Array.from({ length: 33 }, () => ({ mod: 0, key: 4 })) }
    const errors = validateProfile(profile({ keys: [many, null, null, null] }), DEFAULT_LIMITS)
    expect(errors.map((e) => e.path)).toEqual(['keys[0].steps'])
  })

  it('uses the limits of the connected device', () => {
    const nine = Array.from({ length: 9 }, () => null)
    expect(validateProfile(profile({ keys: nine }), { keys: 9, maxSteps: 32 })).toEqual([])
  })

  it('rejects input that is not an object', () => {
    expect(validateProfile(null).length).toBeGreaterThan(0)
  })
})
