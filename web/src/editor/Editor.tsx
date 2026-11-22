/*
 * Zweck: Editor-Oberfläche für Profile und Tasten (Issue #4), links das Pad, rechts das Formular.
 * Inhalt: Komponente Editor. Hält die Auswahl, liest das Profil aus dem Editor-Context und wählt das
 *         Layout passend zur Tastenzahl. Über dem Pad steht das Eingabefeld für den Profilnamen (#85), das einen
 *         ungültigen Namen anzeigt, daneben der Knopf "Neues Profil" (#1, mit Rückfrage bei ungespeicherten
 *         Änderungen). Für den Drehknopf zeigt sie nur einen Hinweis, belegbar ist er nicht.
 */
import { Alert, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { useState } from 'react'
import { useProfileEditor } from '../model/editorContext.ts'
import { layoutForKeyCount } from '../model/padLayouts.ts'
import { profileNameError } from '../model/profile.ts'
import { createEmptyProfile } from '../model/profileReducer.ts'
import { KeyEditor } from './KeyEditor.tsx'
import { PadView, type Selection } from './PadView.tsx'

/** The editor page: pad view, key form, write controls and backup card. */
export function Editor() {
  const { state, dispatch, dirty } = useProfileEditor()
  const [selection, setSelection] = useState<Selection | null>(null)
  const [confirmNew, setConfirmNew] = useState(false)
  const { profile } = state

  const layout = layoutForKeyCount(profile.keys.length)
  if (layout === undefined) {
    return <Alert color="red">Für {profile.keys.length} Tasten gibt es kein Layout.</Alert>
  }

  /** Replace the edited profile by an empty one with the same number of keys. */
  function startNew() {
    dispatch({ type: 'load', profile: createEmptyProfile(profile.keys.length) })
    setSelection(null)
    setConfirmNew(false)
  }

  return (
    <Stack>
      <Group align="flex-start" gap="sm">
        <TextInput
          label="Profilname"
          value={profile.name}
          onChange={(e) => dispatch({ type: 'rename', name: e.currentTarget.value })}
          error={profileNameError(profile.name)}
          maw={320}
        />
        <Button variant="default" mt={25} onClick={() => (dirty ? setConfirmNew(true) : startNew())}>
          Neues Profil
        </Button>
      </Group>

      {confirmNew && (
        <Alert color="yellow" title="Ungespeicherte Änderungen" maw={480}>
          <Stack gap="xs">
            <Text size="sm">Das Profil „{profile.name}“ hat Änderungen, die nicht gespeichert sind. Sie gehen verloren.</Text>
            <Group>
              <Button color="red" size="xs" onClick={startNew}>
                Trotzdem neu anlegen
              </Button>
              <Button variant="default" size="xs" onClick={() => setConfirmNew(false)}>
                Abbrechen
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      <Group align="flex-start" gap="xl" wrap="wrap">
        <PadView profile={profile} layout={layout} selection={selection} onSelect={setSelection} />

        <Stack style={{ flex: 1, minWidth: '16rem' }}>
          {selection === null && <Alert color="gray">Wähle eine Taste, um sie zu belegen.</Alert>}
          {selection?.kind === 'encoder' && (
            <Alert color="gray">Der Drehknopf wechselt das Profil. Dafür gibt es nichts zu belegen.</Alert>
          )}
          {selection?.kind === 'key' && (
            <KeyEditor
              key={selection.index}
              index={selection.index}
              action={profile.keys[selection.index] ?? null}
              dispatch={dispatch}
            />
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
