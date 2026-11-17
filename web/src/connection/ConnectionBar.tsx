/*
 * Zweck: Statusleiste und Schalter für die Verbindung zum Pad (Issue #11).
 * Inhalt: Komponente ConnectionBar. Zeigt den Zustand der Verbindung mit Verbinden und Trennen, bei fehlender
 *         WebSerial-Unterstützung einen Hinweis auf Edge oder Chrome und bei einem Fehler oder einer
 *         abgerissenen Verbindung die Meldung.
 */
import { Alert, Badge, Button, Group, Stack, Text } from '@mantine/core'
import { useDeviceConnection } from './deviceConnectionContext.ts'

export function ConnectionBar() {
  const { state, connect, disconnect } = useDeviceConnection()

  if (state.status === 'unsupported') {
    return (
      <Alert color="red" title="Verbindung nicht möglich">
        Dieser Browser unterstützt WebSerial nicht. Bitte Edge oder Chrome verwenden. Das Profil lässt sich auch ohne
        Pad bearbeiten.
      </Alert>
    )
  }

  return (
    <Stack gap="xs" aria-label="Verbindung zum Pad">
      <Group>
        {state.status === 'connected' ? (
          <>
            <Badge color="green">Verbunden</Badge>
            <Text size="sm">
              Firmware {state.info.firmware}, {state.info.keys} Tasten, {state.info.profiles} Profile
            </Text>
            <Button variant="default" onClick={disconnect}>
              Trennen
            </Button>
          </>
        ) : (
          <>
            <Badge color="gray">{state.status === 'connecting' ? 'Verbinde …' : 'Nicht verbunden'}</Badge>
            <Button onClick={connect} loading={state.status === 'connecting'}>
              Mit Pad verbinden
            </Button>
          </>
        )}
      </Group>

      {state.status === 'error' && <Alert color="red">{state.message}</Alert>}
      {state.status === 'disconnected' && state.notice !== undefined && <Alert color="yellow">{state.notice}</Alert>}
    </Stack>
  )
}
