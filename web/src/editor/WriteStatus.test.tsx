/*
 * Zweck: Tests der Anzeige beim Schreiben auf das Pad (Issue #14).
 * Inhalt: Darstellung der Zustände (leer, läuft, Erfolg, Fehler mit Einzelheiten) und das Zusammenspiel von
 *         Hook, Ablauf und MockDevice bis zur Anzeige.
 */
import { MantineProvider } from '@mantine/core'
import { act, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Profile } from '../model/profile.ts'
import { deriveSteps } from '../model/steps.ts'
import { ProtocolClient } from '../protocol/client.ts'
import { MockDevice } from '../protocol/mockDevice.ts'
import { WriteError } from '../protocol/writeProfile.ts'
import { useProfileWrite, type WriteState } from './useProfileWrite.ts'
import { WriteStatus } from './WriteStatus.tsx'

function show(state: WriteState) {
  return render(
    <MantineProvider>
      <WriteStatus state={state} />
    </MantineProvider>,
  )
}

const profile: Profile = {
  name: 'Programmierung',
  layout: 'de-DE',
  keys: [deriveSteps({ type: 'combo', label: 'Undo', intent: { keys: 'ctrl+z' }, steps: [] }), null, null, null],
}

describe('WriteStatus', () => {
  it('shows nothing while idle', () => {
    show({ status: 'idle' })
    expect(screen.queryByText(/Pad abfragen/)).not.toBeInTheDocument()
  })

  it('marks finished, running and open phases', () => {
    show({ status: 'running', phase: 'write' })
    expect(screen.getByText('✓ Profil prüfen')).toBeInTheDocument()
    expect(screen.getByText('… Auf das Pad schreiben')).toBeInTheDocument()
    expect(screen.getByText('○ Zurücklesen')).toBeInTheDocument()
  })

  it('confirms success', () => {
    show({ status: 'success' })
    expect(screen.getByText('✓ Vergleichen')).toBeInTheDocument()
    expect(screen.getByText(/beim Zurücklesen bestätigt/)).toBeInTheDocument()
  })

  it('shows the failed phase, a readable message and the details', () => {
    show({ status: 'error', error: new WriteError('compare', 'MISMATCH', 'x', ['name', 'keys[0]']) })
    expect(screen.getByText('✓ Zurücklesen')).toBeInTheDocument()
    expect(screen.getByText('✗ Vergleichen')).toBeInTheDocument()
    expect(screen.getByText('Das Pad hat etwas anderes gespeichert, als geschrieben wurde.')).toBeInTheDocument()
    expect(screen.getByText('keys[0]')).toBeInTheDocument()
  })
})

describe('useProfileWrite', () => {
  it('ends in success after writing to the mock', async () => {
    const device = new MockDevice()
    const { result } = renderHook(() => useProfileWrite())
    await act(() => result.current.write(new ProtocolClient(device), 0, profile))
    expect(result.current.state).toEqual({ status: 'success' })
    expect(device.profiles[0]).toEqual(profile)
  })

  it('ends in error with the phase if the pad refuses', async () => {
    const device = new MockDevice({ protocol: 2 })
    const { result } = renderHook(() => useProfileWrite())
    await act(() => result.current.write(new ProtocolClient(device), 0, profile))
    expect(result.current.state).toMatchObject({ status: 'error', error: { phase: 'info', code: 'UNSUPPORTED_VERSION' } })

    act(() => result.current.reset())
    expect(result.current.state).toEqual({ status: 'idle' })
  })
})
