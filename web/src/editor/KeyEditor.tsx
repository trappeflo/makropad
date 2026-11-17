/*
 * Zweck: Formular zum Belegen der gewählten Taste (Issue #4).
 * Inhalt: Komponente KeyEditor. Typ (nicht belegt, Tastenkombination, Text), Label und die zum Typ passenden
 *         Felder. Darüber wählt der LibraryPicker eine Aktion aus der Bibliothek (#8). Änderungen gehen als
 *         setKey/clearKey an den Reducer, bei jeder Änderung werden die Schritte neu berechnet (#74) und ein
 *         Fehler der Umrechnung wird angezeigt.
 */
import { Alert, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core'
import type { KeyAction } from '../model/profile.ts'
import type { EditorAction } from '../model/profileReducer.ts'
import { deriveSteps, stepsFor } from '../model/steps.ts'
import { LibraryPicker } from './LibraryPicker.tsx'

type ActionType = 'none' | KeyAction['type']

interface KeyEditorProps {
  index: number
  action: KeyAction | null
  dispatch: (action: EditorAction) => void
}

function emptyAction(type: 'combo' | 'text', label: string): KeyAction {
  return type === 'combo'
    ? { type, label, intent: { keys: '' }, steps: [] }
    : { type, label, intent: { text: '', enter: false }, steps: [] }
}

export function KeyEditor({ index, action, dispatch }: KeyEditorProps) {
  const current: ActionType = action === null ? 'none' : action.type

  /** Every change goes through here, so `steps` always match the intent. */
  function set(next: KeyAction) {
    dispatch({ type: 'setKey', index, action: deriveSteps(next) })
  }

  function changeType(type: string) {
    if (type === 'none') dispatch({ type: 'clearKey', index })
    else if (type === 'combo' || type === 'text') set(emptyAction(type, action?.label ?? ''))
  }

  const result = action === null ? null : stepsFor(action)
  const intentIsEmpty =
    action?.type === 'combo' ? action.intent.keys === '' : action?.type === 'text' && action.intent.text === ''

  return (
    <Stack>
      <Text fw={600}>Taste {index + 1}</Text>

      <LibraryPicker onPick={set} />

      <SegmentedControl
        aria-label="Art der Belegung"
        value={current}
        onChange={changeType}
        data={[
          { value: 'none', label: 'Nicht belegt' },
          { value: 'combo', label: 'Tastenkombination' },
          { value: 'text', label: 'Text' },
        ]}
      />

      {action?.type === 'macro' && <Alert color="gray">Makros lassen sich hier noch nicht bearbeiten.</Alert>}

      {action !== null && action.type !== 'macro' && (
        <>
          <TextInput
            label="Name"
            value={action.label}
            onChange={(e) => set({ ...action, label: e.currentTarget.value })}
          />

          {action.type === 'combo' && (
            <TextInput
              label="Tastenkombination"
              description="z. B. ctrl+shift+p"
              value={action.intent.keys}
              onChange={(e) => set({ ...action, intent: { keys: e.currentTarget.value } })}
            />
          )}

          {action.type === 'text' && (
            <>
              <TextInput
                label="Text"
                value={action.intent.text}
                onChange={(e) => set({ ...action, intent: { ...action.intent, text: e.currentTarget.value } })}
              />
              <Switch
                label="Enter danach"
                checked={action.intent.enter}
                onChange={(e) => set({ ...action, intent: { ...action.intent, enter: e.currentTarget.checked } })}
              />
            </>
          )}

          {result?.ok === false && !intentIsEmpty && <Alert color="red">{result.error}</Alert>}
          {result?.ok === true && (
            <Text size="sm" c="dimmed">
              {result.steps.length} {result.steps.length === 1 ? 'Schritt' : 'Schritte'} für das Pad
            </Text>
          )}
        </>
      )}
    </Stack>
  )
}
