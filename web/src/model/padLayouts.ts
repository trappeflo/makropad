/*
 * Zweck: Beschreibt die Anordnung der Tasten und des Drehknopfs eines Pads als Daten (Issue #4).
 * Inhalt: Typ PadLayout, die vordefinierten Layouts mit 4 und 9 Tasten und layoutForKeyCount. Ein neues
 *         (auch asymmetrisches) Layout ist nur ein weiterer Eintrag, die Oberfläche bleibt unverändert.
 */

/** Position in a CSS grid, rows and columns start at 1. */
export interface GridCell {
  row: number
  col: number
  /** Number of columns the element spans, default 1. */
  colSpan?: number
}

export interface PadLayout {
  id: string
  /** Position of key `index` (index into `Profile.keys`). The array position equals the key index. */
  keys: GridCell[]
  encoder: GridCell
}

export const PAD_4: PadLayout = {
  id: 'pad-4',
  encoder: { row: 1, col: 1, colSpan: 2 },
  keys: [
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 3, col: 1 },
    { row: 3, col: 2 },
  ],
}

export const PAD_9: PadLayout = {
  id: 'pad-9',
  encoder: { row: 1, col: 1, colSpan: 3 },
  keys: Array.from({ length: 9 }, (_, i) => ({ row: 2 + Math.floor(i / 3), col: 1 + (i % 3) })),
}

export const PAD_LAYOUTS: PadLayout[] = [PAD_4, PAD_9]

/** Finds the predefined layout for a number of keys. Returns undefined if there is none. */
export function layoutForKeyCount(keyCount: number): PadLayout | undefined {
  return PAD_LAYOUTS.find((layout) => layout.keys.length === keyCount)
}
