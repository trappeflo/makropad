/*
 * Zweck: Umrechnung der Absicht einer Taste in HID-Schritte für das Layout de-DE (Issue #74).
 * Inhalt: Tabellen für Modifikatoren, Tastennamen und Zeichen der deutschen Tastatur, die Funktionen
 *         `comboToSteps` und `textToSteps` sowie `deriveSteps`, das `steps` einer Tastenaktion neu berechnet.
 *         Schritte = f(Absicht), siehe Protokoll v1. Fehler kommen als Text zurück, es wird nichts geworfen.
 */
import type { KeyAction, Step } from './profile.ts'

/** Result of converting an intent to steps: the steps or a message to show. */
export type StepsResult = { ok: true; steps: Step[] } | { ok: false; error: string }

/** HID modifier bits. `altgr` is the right Alt key, which a German layout uses for @ { } [ ] \ | ~ and €. */
const MODIFIERS: Record<string, number> = {
  ctrl: 0x01,
  shift: 0x02,
  alt: 0x04,
  win: 0x08,
  altgr: 0x40,
}
const SHIFT = MODIFIERS.shift
const ALTGR = MODIFIERS.altgr

const ENTER = 0x28

/** HID usage ids of the named keys. The letters follow the German layout (z and y are swapped). */
const KEY_NAMES: Record<string, number> = {
  enter: ENTER,
  esc: 0x29,
  backspace: 0x2a,
  tab: 0x2b,
  space: 0x2c,
  delete: 0x4c,
  home: 0x4a,
  pageup: 0x4b,
  end: 0x4d,
  pagedown: 0x4e,
  right: 0x4f,
  left: 0x50,
  down: 0x51,
  up: 0x52,
}

// a to x are at the same position as on a US keyboard, y and z are swapped
for (let i = 0; i < 26; i++) {
  const letter = String.fromCharCode(97 + i)
  KEY_NAMES[letter] = 0x04 + i
}
KEY_NAMES.z = 0x1c
KEY_NAMES.y = 0x1d
for (let i = 1; i <= 9; i++) KEY_NAMES[String(i)] = 0x1d + i
KEY_NAMES['0'] = 0x27
for (let i = 1; i <= 12; i++) KEY_NAMES[`f${i}`] = 0x3a + i - 1

/** Characters that need Shift or AltGr, mapped to modifier and HID usage id on a German keyboard. */
const CHARS: Record<string, { mod: number; key: number }> = {
  ' ': { mod: 0, key: 0x2c },
  ß: { mod: 0, key: 0x2d },
  '?': { mod: SHIFT, key: 0x2d },
  '\\': { mod: ALTGR, key: 0x2d },
  ü: { mod: 0, key: 0x2f },
  Ü: { mod: SHIFT, key: 0x2f },
  '+': { mod: 0, key: 0x30 },
  '*': { mod: SHIFT, key: 0x30 },
  '~': { mod: ALTGR, key: 0x30 },
  '#': { mod: 0, key: 0x32 },
  "'": { mod: SHIFT, key: 0x32 },
  ö: { mod: 0, key: 0x33 },
  Ö: { mod: SHIFT, key: 0x33 },
  ä: { mod: 0, key: 0x34 },
  Ä: { mod: SHIFT, key: 0x34 },
  ',': { mod: 0, key: 0x36 },
  ';': { mod: SHIFT, key: 0x36 },
  '.': { mod: 0, key: 0x37 },
  ':': { mod: SHIFT, key: 0x37 },
  '-': { mod: 0, key: 0x38 },
  _: { mod: SHIFT, key: 0x38 },
  '<': { mod: 0, key: 0x64 },
  '>': { mod: SHIFT, key: 0x64 },
  '|': { mod: ALTGR, key: 0x64 },
  '!': { mod: SHIFT, key: 0x1e },
  '"': { mod: SHIFT, key: 0x1f },
  '§': { mod: SHIFT, key: 0x20 },
  $: { mod: SHIFT, key: 0x21 },
  '%': { mod: SHIFT, key: 0x22 },
  '&': { mod: SHIFT, key: 0x23 },
  '/': { mod: SHIFT, key: 0x24 },
  '(': { mod: SHIFT, key: 0x25 },
  ')': { mod: SHIFT, key: 0x26 },
  '=': { mod: SHIFT, key: 0x27 },
  '²': { mod: ALTGR, key: 0x1f },
  '³': { mod: ALTGR, key: 0x20 },
  '{': { mod: ALTGR, key: 0x24 },
  '[': { mod: ALTGR, key: 0x25 },
  ']': { mod: ALTGR, key: 0x26 },
  '}': { mod: ALTGR, key: 0x27 },
  '@': { mod: ALTGR, key: 0x14 },
  '€': { mod: ALTGR, key: 0x08 },
}

function stepForChar(char: string): Step | undefined {
  const special = CHARS[char]
  if (special !== undefined) return special
  const lower = char.toLowerCase()
  const key = KEY_NAMES[lower]
  // Letters and digits only: other named keys (enter, tab, ...) are not characters of a text.
  if (key === undefined || !/^[a-z0-9]$/.test(lower)) return undefined
  return { mod: char !== lower ? SHIFT : 0, key }
}

/** Converts a combination like `ctrl+shift+p` into one step. */
export function comboToSteps(keys: string): StepsResult {
  const parts = keys.trim().toLowerCase().split('+')
  if (parts.some((part) => part === '')) return { ok: false, error: 'Tastenkombination ist leer oder unvollständig.' }

  const name = parts[parts.length - 1]
  const key = KEY_NAMES[name]
  if (key === undefined) return { ok: false, error: `Unbekannte Taste "${name}".` }

  let mod = 0
  for (const part of parts.slice(0, -1)) {
    const bit = MODIFIERS[part]
    if (bit === undefined) return { ok: false, error: `Unbekannter Modifikator "${part}".` }
    mod |= bit
  }
  return { ok: true, steps: [{ mod, key }] }
}

/** Converts a text into one step per character, optionally followed by Enter. */
export function textToSteps(text: string, enter: boolean): StepsResult {
  if (text === '') return { ok: false, error: 'Text ist leer.' }

  const steps: Step[] = []
  for (const char of text) {
    const step = stepForChar(char)
    if (step === undefined) return { ok: false, error: `Das Zeichen "${char}" lässt sich auf der deutschen Tastatur nicht tippen.` }
    steps.push(step)
  }
  if (enter) steps.push({ mod: 0, key: ENTER })
  return { ok: true, steps }
}

/** Result of converting the intent of a key action, macros have no intent to convert. */
export function stepsFor(action: KeyAction): StepsResult | null {
  if (action.type === 'combo') return comboToSteps(action.intent.keys)
  if (action.type === 'text') return textToSteps(action.intent.text, action.intent.enter)
  return null
}

/** Returns the action with `steps` recalculated from its intent. Without valid steps the list stays empty. */
export function deriveSteps(action: KeyAction): KeyAction {
  const result = stepsFor(action)
  if (result === null) return action
  return { ...action, steps: result.ok ? result.steps : [] }
}
