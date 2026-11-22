/*
 * Zweck: Zustand des Profil-Editors als reiner Reducer (Issue #3).
 * Inhalt: EditorState (aktuelles und zuletzt gespeichertes Profil), Aktionen setKey, clearKey, rename,
 *         load und markSaved, dazu isDirty und createEmptyProfile. Der Reducer validiert nicht,
 *         damit der Editor Zwischenzustände halten kann. Validiert wird getrennt mit validateProfile.
 */
import { DEFAULT_LIMITS, type KeyAction, type Profile } from './profile.ts'

export interface EditorState {
  /** Profile as currently edited. */
  profile: Profile
  /** Profile as last loaded from or written to the pad or backend. */
  saved: Profile
}

export type EditorAction =
  | { type: 'setKey'; index: number; action: KeyAction }
  | { type: 'clearKey'; index: number }
  | { type: 'rename'; name: string }
  /** Replace the edited profile with one from the pad or backend. The editor is clean afterwards. */
  | { type: 'load'; profile: Profile }
  /** The current profile was written successfully. The editor is clean afterwards. */
  | { type: 'markSaved' }

export function createEmptyProfile(keyCount: number = DEFAULT_LIMITS.keys): Profile {
  return { name: 'Neues Profil', layout: 'de-DE', keys: Array.from({ length: keyCount }, () => null) }
}

export function createInitialState(profile: Profile = createEmptyProfile()): EditorState {
  return { profile, saved: profile }
}

function withKey(profile: Profile, index: number, value: KeyAction | null): Profile {
  return { ...profile, keys: profile.keys.map((key, i) => (i === index ? value : key)) }
}

function inRange(profile: Profile, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < profile.keys.length
}

export function profileReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'setKey':
      if (!inRange(state.profile, action.index)) return state
      return { ...state, profile: withKey(state.profile, action.index, action.action) }
    case 'clearKey':
      if (!inRange(state.profile, action.index)) return state
      return { ...state, profile: withKey(state.profile, action.index, null) }
    case 'rename':
      return { ...state, profile: { ...state.profile, name: action.name } }
    case 'load':
      return { profile: action.profile, saved: action.profile }
    case 'markSaved':
      return { ...state, saved: state.profile }
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

/** True if the edited profile differs from the saved one. Changing something back makes it clean again. */
export function isDirty(state: EditorState): boolean {
  return !deepEqual(state.profile, state.saved)
}
