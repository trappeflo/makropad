/*
 * Zweck: Tests der Umrechnung von Absicht in HID-Schritte (Issue #74).
 * Inhalt: Kombinationen, Text mit Umlauten, Umschalt- und AltGr-Zeichen, Fehlerfälle und deriveSteps.
 */
import { describe, expect, it } from 'vitest'
import { library } from '../library/library.ts'
import type { KeyAction } from './profile.ts'
import { comboToSteps, deriveSteps, textToSteps } from './steps.ts'

const CTRL = 0x01
const SHIFT = 0x02
const ALT = 0x04
const WIN = 0x08
const ALTGR = 0x40

describe('comboToSteps', () => {
  it('converts modifiers and key into one step', () => {
    expect(comboToSteps('ctrl+shift+p')).toEqual({ ok: true, steps: [{ mod: CTRL | SHIFT, key: 0x13 }] })
  })

  it('uses the German position of z and y', () => {
    expect(comboToSteps('ctrl+z')).toEqual({ ok: true, steps: [{ mod: CTRL, key: 0x1c }] })
    expect(comboToSteps('ctrl+y')).toEqual({ ok: true, steps: [{ mod: CTRL, key: 0x1d }] })
  })

  it('knows named keys and ignores case and spaces around', () => {
    expect(comboToSteps(' Alt+Tab ')).toEqual({ ok: true, steps: [{ mod: ALT, key: 0x2b }] })
    expect(comboToSteps('win+d')).toEqual({ ok: true, steps: [{ mod: WIN, key: 0x07 }] })
    expect(comboToSteps('f5')).toEqual({ ok: true, steps: [{ mod: 0, key: 0x3e }] })
  })

  it.each(['', 'ctrl+', '+p', 'ctrl++p'])('rejects the incomplete combination "%s"', (keys) => {
    expect(comboToSteps(keys).ok).toBe(false)
  })

  it('names an unknown key or modifier in the error', () => {
    expect(comboToSteps('ctrl+blub')).toEqual({ ok: false, error: 'Unbekannte Taste "blub".' })
    expect(comboToSteps('hyper+p')).toEqual({ ok: false, error: 'Unbekannter Modifikator "hyper".' })
  })
})

describe('textToSteps', () => {
  it('types lowercase letters and digits without modifier', () => {
    expect(textToSteps('a1', false)).toEqual({
      ok: true,
      steps: [
        { mod: 0, key: 0x04 },
        { mod: 0, key: 0x1e },
      ],
    })
  })

  it('uses Shift for capitals and the German z and y', () => {
    expect(textToSteps('Zy', false)).toEqual({
      ok: true,
      steps: [
        { mod: SHIFT, key: 0x1c },
        { mod: 0, key: 0x1d },
      ],
    })
  })

  it('types the hyphen as the key next to the period (not as ß)', () => {
    expect(textToSteps('git-', false)).toMatchObject({ ok: true, steps: expect.arrayContaining([{ mod: 0, key: 0x38 }]) })
  })

  it('handles umlauts, Shift characters and AltGr characters', () => {
    expect(textToSteps('äß?@{', false)).toEqual({
      ok: true,
      steps: [
        { mod: 0, key: 0x34 },
        { mod: 0, key: 0x2d },
        { mod: SHIFT, key: 0x2d },
        { mod: ALTGR, key: 0x14 },
        { mod: ALTGR, key: 0x24 },
      ],
    })
  })

  it('appends Enter on request', () => {
    expect(textToSteps('a', true)).toEqual({
      ok: true,
      steps: [
        { mod: 0, key: 0x04 },
        { mod: 0, key: 0x28 },
      ],
    })
  })

  it('rejects empty text and characters without a key', () => {
    expect(textToSteps('', false).ok).toBe(false)
    expect(textToSteps('a😀', false)).toEqual({
      ok: false,
      error: 'Das Zeichen "😀" lässt sich auf der deutschen Tastatur nicht tippen.',
    })
  })
})

describe('deriveSteps', () => {
  it('recalculates steps from the intent', () => {
    const action: KeyAction = { type: 'combo', label: 'Undo', intent: { keys: 'ctrl+z' }, steps: [] }
    expect(deriveSteps(action).steps).toEqual([{ mod: CTRL, key: 0x1c }])
  })

  it('leaves steps empty if the intent cannot be converted', () => {
    const action: KeyAction = { type: 'combo', label: 'x', intent: { keys: 'ctrl+' }, steps: [{ mod: 0, key: 4 }] }
    expect(deriveSteps(action).steps).toEqual([])
  })

  it('does not touch macros', () => {
    const macro: KeyAction = { type: 'macro', label: 'm', intent: {}, steps: [{ delay: 10 }] }
    expect(deriveSteps(macro)).toBe(macro)
  })
})

describe('library', () => {
  it('can convert every action of the bundled library', () => {
    for (const group of library.groups) {
      for (const entry of group.actions) {
        const action: KeyAction = { ...entry, steps: [] }
        expect(deriveSteps(action).steps.length, `${group.name}: ${entry.label}`).toBeGreaterThan(0)
      }
    }
  })
})
