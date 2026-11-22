/*
 * Zweck: Tests der Pad-Layouts (Issue #4).
 * Inhalt: Auswahl nach Tastenzahl, 4er- und 9er-Raster und eindeutige Positionen im Raster.
 */
import { describe, expect, it } from 'vitest'
import { PAD_LAYOUTS, layoutForKeyCount } from './padLayouts.ts'

describe('padLayouts', () => {
  it('finds layouts for 4 and 9 keys', () => {
    expect(layoutForKeyCount(4)?.keys).toHaveLength(4)
    expect(layoutForKeyCount(9)?.keys).toHaveLength(9)
  })

  it('has no layout for other key counts', () => {
    expect(layoutForKeyCount(5)).toBeUndefined()
  })

  it('places every element in its own cell', () => {
    for (const layout of PAD_LAYOUTS) {
      const cells = [...layout.keys, layout.encoder].flatMap((c) =>
        Array.from({ length: c.colSpan ?? 1 }, (_, i) => `${c.row}/${c.col + i}`),
      )
      expect(new Set(cells).size).toBe(cells.length)
    }
  })
})
