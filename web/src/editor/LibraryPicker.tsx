/*
 * Zweck: Auswahl einer Aktion aus der Aktionsbibliothek (Issue #8).
 * Inhalt: Komponente LibraryPicker. Filter nach Programm, Suche über die Aktionen und Zuweisung an die Taste.
 *         Die Auswahl übernimmt Typ, Name und Absicht in die Taste. Die Schritte für das Pad bleiben leer,
 *         sie werden später aus der Absicht berechnet.
 */
import { Select, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { library, type LibraryAction } from '../library/library.ts'
import type { KeyAction } from '../model/profile.ts'

interface LibraryPickerProps {
  /** Called with the chosen library action, already converted to a key action. */
  onPick: (action: KeyAction) => void
}

/** Option values are `<group index>:<action index>`, because labels are only unique within a group. */
function toValue(group: number, action: number): string {
  return `${group}:${action}`
}

function findAction(value: string): LibraryAction | undefined {
  const [group, action] = value.split(':').map(Number)
  return library.groups[group]?.actions[action]
}

function toKeyAction(entry: LibraryAction): KeyAction {
  return entry.type === 'combo'
    ? { type: 'combo', label: entry.label, intent: entry.intent, steps: [] }
    : { type: 'text', label: entry.label, intent: entry.intent, steps: [] }
}

export function LibraryPicker({ onPick }: LibraryPickerProps) {
  const [program, setProgram] = useState<string | null>(null)
  const [picked, setPicked] = useState<LibraryAction | null>(null)

  const groups = library.groups
    .map((group, g) => ({
      group: group.name,
      items: group.actions.map((entry, a) => ({ value: toValue(g, a), label: entry.label })),
    }))
    .filter((group) => program === null || group.group === program)

  function pick(value: string | null) {
    const entry = value === null ? undefined : findAction(value)
    if (entry === undefined) return
    setPicked(entry)
    onPick(toKeyAction(entry))
  }

  return (
    <Stack gap="xs">
      <Select
        label="Programm"
        placeholder="Alle Programme"
        data={library.groups.map((group) => group.name)}
        value={program}
        onChange={setProgram}
        clearable
      />
      <Select
        label="Aus der Bibliothek wählen"
        placeholder="Aktion suchen"
        data={groups}
        value={null}
        onChange={pick}
        searchable
        nothingFoundMessage="Keine passende Aktion"
      />
      {picked !== null && (
        <Text size="sm" c="dimmed">
          {picked.description}
          {picked.note !== undefined && ` (${picked.note})`}
        </Text>
      )}
    </Stack>
  )
}
