/*
 * Zweck: Zustand des Schreibvorgangs für die Oberfläche (Issue #14).
 * Inhalt: Typ WriteState (idle, running, success, error) und der Hook useProfileWrite. Er führt writeProfile aus,
 *         hält die aktuelle Phase und macht aus einem Fehler einen WriteError, damit die Anzeige ihn darstellen kann.
 */
import { useCallback, useState } from 'react'
import type { Profile } from '../model/profile.ts'
import type { ProtocolClient } from '../protocol/client.ts'
import { WriteError, writeProfile, type WritePhase } from '../protocol/writeProfile.ts'

/** State of a write: nothing yet, running (with phase), done or failed. */
export type WriteState =
  | { status: 'idle' }
  | { status: 'running'; phase: WritePhase }
  | { status: 'success' }
  | { status: 'error'; error: WriteError }

/** Runs `writeProfile` and keeps its state for the UI. */
export function useProfileWrite() {
  const [state, setState] = useState<WriteState>({ status: 'idle' })

  /** @returns true if the profile was written and confirmed by reading it back */
  const write = useCallback(async (client: ProtocolClient, index: number, profile: Profile): Promise<boolean> => {
    setState({ status: 'running', phase: 'info' })
    try {
      await writeProfile(client, index, profile, (phase) => setState({ status: 'running', phase }))
      setState({ status: 'success' })
      return true
    } catch (error) {
      // Anything that is not a WriteError is a bug, it is shown like a failure of the current phase.
      const failure =
        error instanceof WriteError
          ? error
          : new WriteError('write', 'INVALID_RESPONSE', error instanceof Error ? error.message : String(error))
      setState({ status: 'error', error: failure })
      return false
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, write, reset }
}
