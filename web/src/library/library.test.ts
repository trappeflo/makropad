/*
 * Zweck: Tests der Aktionsbibliothek (Issue #7).
 * Inhalt: Die Datei actions.json passt zum Schema, enthält mindestens drei Gruppen, Namen sind eindeutig und
 *         das Schema weist kaputte Einträge ab.
 */
import { describe, expect, it } from 'vitest'
import { library, librarySchema } from './library.ts'

describe('library', () => {
  it('has at least three groups with actions', () => {
    expect(library.groups.length).toBeGreaterThanOrEqual(3)
    for (const group of library.groups) expect(group.actions.length).toBeGreaterThan(0)
  })

  it('has unique group names and unique labels within a group', () => {
    const names = library.groups.map((g) => g.name)
    expect(new Set(names).size).toBe(names.length)
    for (const group of library.groups) {
      const labels = group.actions.map((a) => a.label)
      expect(new Set(labels).size, group.name).toBe(labels.length)
    }
  })

  it('writes key combinations in lower case without spaces', () => {
    for (const group of library.groups) {
      for (const action of group.actions) {
        if (action.type === 'combo') expect(action.intent.keys).toMatch(/^[a-z0-9]+(\+[a-z0-9]+)*$/)
      }
    }
  })

  it('rejects an action whose intent does not match its type', () => {
    const bad = { groups: [{ name: 'X', actions: [{ type: 'combo', label: 'a', description: 'b', intent: { text: 'x', enter: false } }] }] }
    expect(librarySchema.safeParse(bad).success).toBe(false)
  })

  it('rejects an empty group', () => {
    expect(librarySchema.safeParse({ groups: [{ name: 'X', actions: [] }] }).success).toBe(false)
  })
})
