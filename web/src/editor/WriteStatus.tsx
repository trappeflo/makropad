/*
 * Zweck: Anzeige von Fortschritt und Ergebnis beim Schreiben auf das Pad (Issue #14, Anforderung R7).
 * Inhalt: Komponente WriteStatus. Zeigt die Phasen des Ablaufs mit Zustand (offen, läuft, fertig, Fehler) und bei
 *         einem Fehler eine verständliche Meldung samt Einzelheiten. Sie bekommt nur den WriteState, die
 *         Anbindung an Button und Verbindung folgt mit der WebSerial-Verbindung (#11).
 */
import { Alert, List, Stack, Text } from '@mantine/core'
import { WRITE_PHASES, type WriteError, type WritePhase } from '../protocol/writeProfile.ts'
import type { WriteState } from './useProfileWrite.ts'

const PHASE_LABELS: Record<WritePhase, string> = {
  info: 'Pad abfragen',
  validate: 'Profil prüfen',
  write: 'Auf das Pad schreiben',
  readback: 'Zurücklesen',
  compare: 'Vergleichen',
}

const ERROR_TEXTS: Record<string, string> = {
  TIMEOUT: 'Das Pad antwortet nicht. Ist es noch verbunden?',
  UNSUPPORTED_VERSION: 'Das Pad spricht eine andere Protokollversion als die App.',
  OUT_OF_RANGE: 'Das Profil passt nicht zum Pad (Slot oder Tastenzahl).',
  TOO_LARGE: 'Das Profil ist für das Pad zu groß.',
  STORAGE_FAILED: 'Das Pad konnte das Profil nicht speichern. Das alte Profil ist unverändert.',
  BUSY: 'Das Pad ist gerade beschäftigt. Bitte später noch einmal versuchen.',
  BAD_REQUEST: 'Das Pad hat die Anfrage nicht verstanden.',
  UNKNOWN_CMD: 'Das Pad kennt den Befehl nicht. Passt die Firmware zur App?',
  INVALID_RESPONSE: 'Das Pad hat unerwartet geantwortet.',
  UNKNOWN_ERROR: 'Das Pad meldet einen unbekannten Fehler.',
  INVALID_PROFILE: 'Das Profil kann nicht auf das Pad geschrieben werden.',
  MISMATCH: 'Das Pad hat etwas anderes gespeichert, als geschrieben wurde.',
}

function describe(error: WriteError): string {
  return ERROR_TEXTS[error.code] ?? error.message
}

type PhaseState = 'pending' | 'running' | 'done' | 'failed'

function phaseState(state: WriteState, phase: WritePhase): PhaseState {
  const order = WRITE_PHASES.indexOf(phase)
  if (state.status === 'success') return 'done'
  if (state.status === 'running') {
    const current = WRITE_PHASES.indexOf(state.phase)
    return order < current ? 'done' : order === current ? 'running' : 'pending'
  }
  if (state.status === 'error') {
    const failed = WRITE_PHASES.indexOf(state.error.phase)
    return order < failed ? 'done' : order === failed ? 'failed' : 'pending'
  }
  return 'pending'
}

const MARKS: Record<PhaseState, string> = { pending: '○', running: '…', done: '✓', failed: '✗' }

export function WriteStatus({ state }: { state: WriteState }) {
  if (state.status === 'idle') return null

  return (
    <Stack gap="xs" aria-live="polite">
      <List listStyleType="none" spacing={2}>
        {WRITE_PHASES.map((phase) => {
          const s = phaseState(state, phase)
          return (
            <List.Item key={phase}>
              <Text span c={s === 'failed' ? 'red' : s === 'pending' ? 'dimmed' : undefined}>
                {MARKS[s]} {PHASE_LABELS[phase]}
              </Text>
            </List.Item>
          )
        })}
      </List>

      {state.status === 'success' && (
        <Alert color="green">Das Profil steht auf dem Pad und wurde beim Zurücklesen bestätigt.</Alert>
      )}

      {state.status === 'error' && (
        <Alert color="red" title={describe(state.error)}>
          {state.error.details.length > 0 && (
            <List size="sm">
              {state.error.details.map((detail) => (
                <List.Item key={detail}>{detail}</List.Item>
              ))}
            </List>
          )}
        </Alert>
      )}
    </Stack>
  )
}
