/*
 * Zweck: Layout-Ansicht des Pads (Issue #4): zeigt Tasten und Drehknopf als Raster und meldet die Auswahl.
 * Inhalt: Komponente PadView und der Typ Selection. Die Anordnung kommt aus einem PadLayout, die
 *         Beschriftung aus dem Profil. Unbelegte Tasten sind sichtbar, die gewählte ist hervorgehoben.
 */
import { Button, Text } from '@mantine/core'
import type { PadLayout } from '../model/padLayouts.ts'
import type { Profile } from '../model/profile.ts'

export type Selection = { kind: 'key'; index: number } | { kind: 'encoder' }

interface PadViewProps {
  profile: Profile
  layout: PadLayout
  selection: Selection | null
  onSelect: (selection: Selection) => void
}

export function PadView({ profile, layout, selection, onSelect }: PadViewProps) {
  const columns = Math.max(...layout.keys.map((c) => c.col + (c.colSpan ?? 1) - 1))

  return (
    <div
      role="group"
      aria-label="Pad"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 6rem)`, gap: '0.75rem' }}
    >
      <Button
        aria-label="Drehknopf"
        aria-pressed={selection?.kind === 'encoder'}
        variant={selection?.kind === 'encoder' ? 'filled' : 'default'}
        radius="xl"
        style={{ gridRow: layout.encoder.row, gridColumn: `${layout.encoder.col} / span ${layout.encoder.colSpan ?? 1}` }}
        onClick={() => onSelect({ kind: 'encoder' })}
      >
        Drehknopf
      </Button>

      {layout.keys.map((cell, index) => {
        const action = profile.keys[index] ?? null
        const selected = selection?.kind === 'key' && selection.index === index
        return (
          <Button
            key={index}
            aria-label={`Taste ${index + 1}`}
            aria-pressed={selected}
            variant={selected ? 'filled' : 'default'}
            h="5rem"
            style={{ gridRow: cell.row, gridColumn: `${cell.col} / span ${cell.colSpan ?? 1}` }}
            onClick={() => onSelect({ kind: 'key', index })}
          >
            <span>
              <Text size="xs" c="dimmed" component="span" display="block">
                T{index + 1}
              </Text>
              <Text size="sm" component="span" display="block" truncate>
                {action?.label || (action === null ? 'unbelegt' : '(ohne Name)')}
              </Text>
            </span>
          </Button>
        )
      })}
    </div>
  )
}
