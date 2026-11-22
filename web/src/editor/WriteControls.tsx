/*
 * Zweck: Auslöser für das Schreiben des Profils auf das Pad (Issue #80) und für das Laden eines Slots (Issue #83).
 * Inhalt: Komponente WriteControls. Slot-Auswahl aus device.info und die Buttons "Auf das Pad schreiben" und
 *         "Vom Pad laden" (gemeinsame Slot-Auswahl, ein leerer Slot wird gemeldet und lässt den Editor unverändert,
 *         bei ungespeicherten Änderungen wird vor dem Ersetzen gefragt), nur bei
 *         bestehender Verbindung. Vor dem Schreiben wird der Slot gelesen: enthält er ein anderes Profil (anderer
 *         Name), fragt die Komponente nach. Bei ungültigem Profilnamen ist der Button gesperrt (#85). Danach läuft writeProfile (#14), WriteStatus zeigt den Verlauf, und
 *         nach Erfolg gilt das Profil im Editor als gespeichert.
 */
import { Alert, Button, Group, Select, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { useDeviceConnection } from '../connection/deviceConnectionContext.ts'
import { useProfileEditor } from '../model/editorContext.ts'
import { profileNameError, type Profile } from '../model/profile.ts'
import { useProfileWrite } from './useProfileWrite.ts'
import { WriteStatus } from './WriteStatus.tsx'

export function WriteControls() {
  const { state: connection, client } = useDeviceConnection()
  const { state, dispatch, dirty } = useProfileEditor()
  const { state: writeState, write, reset } = useProfileWrite()
  const [slot, setSlot] = useState('0')
  /** Name of the profile that would be overwritten, while the user is being asked. */
  const [confirming, setConfirming] = useState<string | null>(null)
  const [checkFailed, setCheckFailed] = useState(false)
  /** Profile read from the pad that waits for the user to accept losing the unsaved changes. */
  const [replacing, setReplacing] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadResult, setLoadResult] = useState<{ color: 'green' | 'blue' | 'red'; text: string } | null>(null)

  if (connection.status !== 'connected' || client === null) return null

  const slots = Array.from({ length: connection.info.profiles }, (_, i) => ({
    value: String(i),
    label: `Profil ${i + 1}`,
  }))
  const busy = writeState.status === 'running'
  const nameError = profileNameError(state.profile.name)

  async function run() {
    if (client === null) return
    setConfirming(null)
    if (await write(client, Number(slot), state.profile)) dispatch({ type: 'markSaved' })
  }

  function clearMessages() {
    reset()
    setCheckFailed(false)
    setConfirming(null)
    setReplacing(null)
    setLoadResult(null)
  }

  function take(profile: Profile) {
    dispatch({ type: 'load', profile })
    setReplacing(null)
    setLoadResult({ color: 'green', text: `„${profile.name}“ aus Profil ${Number(slot) + 1} ist geladen.` })
  }

  async function startLoad() {
    if (client === null) return
    clearMessages()
    setLoading(true)
    try {
      const profile = await client.getProfile(Number(slot))
      if (profile.name === '') {
        setLoadResult({ color: 'blue', text: `Profil ${Number(slot) + 1} ist leer, es gibt nichts zu laden.` })
      } else if (dirty) {
        setReplacing(profile)
      } else {
        take(profile)
      }
    } catch {
      setLoadResult({ color: 'red', text: 'Das Profil ließ sich nicht lesen. Ist das Pad noch verbunden?' })
    }
    setLoading(false)
  }

  async function start() {
    if (client === null) return
    clearMessages()
    try {
      // slot = profile: another name in the slot means another profile, which the user should not lose unasked
      const existing = await client.getProfile(Number(slot))
      if (existing.name !== '' && existing.name !== state.profile.name) {
        setConfirming(existing.name)
        return
      }
    } catch {
      setCheckFailed(true)
      return
    }
    await run()
  }

  return (
    <Stack gap="xs">
      <Group align="flex-end">
        <Select
          label="Slot auf dem Pad"
          data={slots}
          value={slot}
          onChange={(value) => {
            setSlot(value ?? '0')
            clearMessages()
          }}
          allowDeselect={false}
          disabled={busy || loading}
          w={160}
        />
        <Button
          onClick={start}
          loading={busy}
          disabled={confirming !== null || replacing !== null || loading || nameError !== null}
        >
          Auf das Pad schreiben
        </Button>
        <Button
          variant="default"
          onClick={startLoad}
          loading={loading}
          disabled={confirming !== null || replacing !== null || busy}
        >
          Vom Pad laden
        </Button>
      </Group>

      {nameError !== null && <Text size="sm" c="red">Profilname ungültig: {nameError}</Text>}

      {confirming !== null && (
        <Alert color="yellow" title="Slot ist belegt">
          <Stack gap="xs">
            <Text size="sm">
              Profil {Number(slot) + 1} enthält „{confirming}“. Es wird durch „{state.profile.name}“ ersetzt.
            </Text>
            <Group>
              <Button color="red" size="xs" onClick={run}>
                Überschreiben
              </Button>
              <Button variant="default" size="xs" onClick={() => setConfirming(null)}>
                Abbrechen
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {replacing !== null && (
        <Alert color="yellow" title="Ungespeicherte Änderungen">
          <Stack gap="xs">
            <Text size="sm">
              Das Profil „{state.profile.name}“ im Editor hat Änderungen, die nicht gespeichert sind. Sie gehen verloren,
              wenn „{replacing.name}“ aus Profil {Number(slot) + 1} geladen wird.
            </Text>
            <Group>
              <Button color="red" size="xs" onClick={() => take(replacing)}>
                Trotzdem laden
              </Button>
              <Button variant="default" size="xs" onClick={() => setReplacing(null)}>
                Abbrechen
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {loadResult !== null && <Alert color={loadResult.color}>{loadResult.text}</Alert>}

      {checkFailed && (
        <Alert color="red">Der Slot ließ sich nicht prüfen. Ist das Pad noch verbunden?</Alert>
      )}

      <WriteStatus state={writeState} />
    </Stack>
  )
}
