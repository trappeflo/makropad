/*
 * Zweck: Auslöser für das Schreiben des Profils auf das Pad (Issue #80).
 * Inhalt: Komponente WriteControls. Slot-Auswahl aus device.info und der Button "Auf das Pad schreiben", nur bei
 *         bestehender Verbindung. Vor dem Schreiben wird der Slot gelesen: enthält er ein anderes Profil (anderer
 *         Name), fragt die Komponente nach. Danach läuft writeProfile (#14), WriteStatus zeigt den Verlauf, und
 *         nach Erfolg gilt das Profil im Editor als gespeichert.
 */
import { Alert, Button, Group, Select, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { useDeviceConnection } from '../connection/deviceConnectionContext.ts'
import { useProfileEditor } from '../model/editorContext.ts'
import { useProfileWrite } from './useProfileWrite.ts'
import { WriteStatus } from './WriteStatus.tsx'

export function WriteControls() {
  const { state: connection, client } = useDeviceConnection()
  const { state, dispatch } = useProfileEditor()
  const { state: writeState, write, reset } = useProfileWrite()
  const [slot, setSlot] = useState('0')
  /** Name of the profile that would be overwritten, while the user is being asked. */
  const [confirming, setConfirming] = useState<string | null>(null)
  const [checkFailed, setCheckFailed] = useState(false)

  if (connection.status !== 'connected' || client === null) return null

  const slots = Array.from({ length: connection.info.profiles }, (_, i) => ({
    value: String(i),
    label: `Profil ${i + 1}`,
  }))
  const busy = writeState.status === 'running'

  async function run() {
    if (client === null) return
    setConfirming(null)
    if (await write(client, Number(slot), state.profile)) dispatch({ type: 'markSaved' })
  }

  async function start() {
    if (client === null) return
    reset()
    setCheckFailed(false)
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
            setConfirming(null)
          }}
          allowDeselect={false}
          disabled={busy}
          w={160}
        />
        <Button onClick={start} loading={busy} disabled={confirming !== null}>
          Auf das Pad schreiben
        </Button>
      </Group>

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

      {checkFailed && (
        <Alert color="red">Der Slot ließ sich nicht prüfen. Ist das Pad noch verbunden?</Alert>
      )}

      <WriteStatus state={writeState} />
    </Stack>
  )
}
