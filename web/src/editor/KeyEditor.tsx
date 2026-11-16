/*
 * Zweck: Formular zum Belegen der gewählten Taste (Issue #4).
 * Inhalt: Komponente KeyEditor. Typ (nicht belegt, Tastenkombination, Text), Label und die zum Typ passenden
 *         Felder. Änderungen gehen als setKey/clearKey an den Reducer. Die Schritte für das Pad werden hier
 *         nicht aus der Eingabe abgeleitet, das folgt mit der Aktionsbibliothek (#7, #8).
 */
import { Alert, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core'
import type { KeyAction } from '../model/profile.ts'
import type { EditorAction } from '../model/profileReducer.ts'

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

  function changeType(type: string) {
    if (type === 'none') dispatch({ type: 'clearKey', index })
    else if (type === 'combo' || type === 'text') dispatch({ type: 'setKey', index, action: emptyAction(type, action?.label ?? '') })
  }

  return (
    <Stack>
      <Text fw={600}>Taste {index + 1}</Text>

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
            onChange={(e) => dispatch({ type: 'setKey', index, action: { ...action, label: e.currentTarget.value } })}
          />

          {action.type === 'combo' && (
            <TextInput
              label="Tastenkombination"
              description="z. B. ctrl+shift+p"
              value={action.intent.keys}
              onChange={(e) =>
                dispatch({ type: 'setKey', index, action: { ...action, intent: { keys: e.currentTarget.value } } })
              }
            />
          )}

          {action.type === 'text' && (
            <>
              <TextInput
                label="Text"
                value={action.intent.text}
                onChange={(e) =>
                  dispatch({
                    type: 'setKey',
                    index,
                    action: { ...action, intent: { ...action.intent, text: e.currentTarget.value } },
                  })
                }
              />
              <Switch
                label="Enter danach"
                checked={action.intent.enter}
                onChange={(e) =>
                  dispatch({
                    type: 'setKey',
                    index,
                    action: { ...action, intent: { ...action.intent, enter: e.currentTarget.checked } },
                  })
                }
              />
            </>
          )}

          <Alert color="gray">
            Die Schritte für das Pad werden mit der Aktionsbibliothek (#7, #8) aus dieser Eingabe erzeugt.
          </Alert>
        </>
      )}
    </Stack>
  )
}
