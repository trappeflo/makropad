/*
 * Zweck: Tests für den Reducer des Profil-Editors (Issue #3).
 * Inhalt: Tasten setzen und leeren, Umbenennen, Laden, dirty-Erkennung und Ignorieren ungültiger Indizes.
 */
import { describe, expect, it } from 'vitest'
import type { KeyAction } from './profile.ts'
import { createEmptyProfile, createInitialState, isDirty, profileReducer } from './profileReducer.ts'

const undo: KeyAction = { type: 'combo', label: 'Rückgängig', intent: { keys: 'ctrl+z' }, steps: [{ mod: 1, key: 29 }] }

describe('profileReducer', () => {
  it('starts with an empty clean profile', () => {
    const state = createInitialState()
    expect(state.profile.keys).toEqual([null, null, null, null])
    expect(isDirty(state)).toBe(false)
  })

  it('sets a key and marks the editor dirty', () => {
    const state = profileReducer(createInitialState(), { type: 'setKey', index: 3, action: undo })
    expect(state.profile.keys[3]).toEqual(undo)
    expect(isDirty(state)).toBe(true)
  })

  it('does not mutate the previous state', () => {
    const before = createInitialState()
    profileReducer(before, { type: 'setKey', index: 0, action: undo })
    expect(before.profile.keys[0]).toBeNull()
  })

  it('is clean again after undoing a change', () => {
    let state = profileReducer(createInitialState(), { type: 'setKey', index: 0, action: undo })
    state = profileReducer(state, { type: 'clearKey', index: 0 })
    expect(isDirty(state)).toBe(false)
  })

  it('renames the profile', () => {
    const state = profileReducer(createInitialState(), { type: 'rename', name: 'Büro' })
    expect(state.profile.name).toBe('Büro')
    expect(isDirty(state)).toBe(true)
  })

  it('ignores out-of-range indices', () => {
    const state = createInitialState()
    expect(profileReducer(state, { type: 'setKey', index: 4, action: undo })).toBe(state)
    expect(profileReducer(state, { type: 'clearKey', index: -1 })).toBe(state)
  })

  it('load replaces the profile and is clean', () => {
    const loaded = { ...createEmptyProfile(), name: 'Vom Pad' }
    const edited = profileReducer(createInitialState(), { type: 'rename', name: 'x' })
    const state = profileReducer(edited, { type: 'load', profile: loaded })
    expect(state.profile).toBe(loaded)
    expect(isDirty(state)).toBe(false)
  })

  it('markSaved makes the current profile the saved one', () => {
    let state = profileReducer(createInitialState(), { type: 'rename', name: 'Büro' })
    state = profileReducer(state, { type: 'markSaved' })
    expect(isDirty(state)).toBe(false)
    expect(state.saved.name).toBe('Büro')
  })
})
