/*
 * Zweck: Tests des Schreiben-Buttons im Editor (Issue #80).
 * Inhalt: Button nur bei Verbindung, Schreiben in den gewählten Slot, Rückfrage bei einem anderen Profil im Slot,
 *         kein Rückfragen beim gleichen Profilnamen, Abbrechen, Fehlermeldung und Editor danach "gespeichert".
 *         Gegenstelle ist der simulierte Port mit MockDevice.
 */
import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ConnectionBar } from '../connection/ConnectionBar.tsx'
import { DeviceConnectionProvider } from '../connection/DeviceConnection.tsx'
import { useProfileEditor } from '../model/editorContext.ts'
import { ProfileProvider } from '../model/ProfileContext.tsx'
import type { Profile } from '../model/profile.ts'
import { FakeSerial } from '../protocol/fakeSerial.ts'
import { MockDevice } from '../protocol/mockDevice.ts'
import { Editor } from './Editor.tsx'
import { WriteControls } from './WriteControls.tsx'

function Dirty() {
  const { dirty } = useProfileEditor()
  return <p>{dirty ? 'ungespeichert' : 'gespeichert'}</p>
}

async function setup(device = new MockDevice()) {
  const serial = new FakeSerial()
  serial.port.attach(device)
  render(
    <MantineProvider>
      <DeviceConnectionProvider serial={serial}>
        <ProfileProvider>
          <ConnectionBar />
          <WriteControls />
          <Editor />
          <Dirty />
        </ProfileProvider>
      </DeviceConnectionProvider>
    </MantineProvider>,
  )
  return { user: userEvent.setup(), device }
}

async function connect(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Mit Pad verbinden' }))
  await screen.findByText('Verbunden')
}

/** Gives key 1 an action, so the editor has unsaved changes. */
async function editKey(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Taste 1' }))
  await user.click(screen.getByText('Tastenkombination'))
  await user.type(screen.getByRole('textbox', { name: 'Tastenkombination' }), 'ctrl+z')
}

const other: Profile = { name: 'Büro', layout: 'de-DE', keys: [null, null, null, null] }

describe('WriteControls', () => {
  it('is hidden while not connected', async () => {
    await setup()
    expect(screen.queryByRole('button', { name: 'Auf das Pad schreiben' })).not.toBeInTheDocument()
  })

  it('writes to an empty slot, confirms it and marks the editor as saved', async () => {
    const { user, device } = await setup()
    await connect(user)
    await editKey(user)
    expect(screen.getByText('ungespeichert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Auf das Pad schreiben' }))

    expect(await screen.findByText(/beim Zurücklesen bestätigt/)).toBeInTheDocument()
    expect(screen.getByText('gespeichert')).toBeInTheDocument()
    expect(device.profiles[0].name).toBe('Neues Profil')
    expect(device.profiles[0].keys[0]).toMatchObject({ intent: { keys: 'ctrl+z' } })
  })

  it('writes to the slot that was chosen', async () => {
    const { user, device } = await setup()
    await connect(user)
    await editKey(user)

    await user.click(screen.getByRole('combobox', { name: 'Slot auf dem Pad' }))
    await user.click(await screen.findByRole('option', { name: 'Profil 2', hidden: true }))
    await user.click(screen.getByRole('button', { name: 'Auf das Pad schreiben' }))

    await screen.findByText(/beim Zurücklesen bestätigt/)
    expect(device.profiles[0].name).toBe('')
    expect(device.profiles[1].name).toBe('Neues Profil')
  })

  it('asks before replacing another profile and writes after confirmation', async () => {
    const device = new MockDevice()
    device.profiles[0] = other
    const { user } = await setup(device)
    await connect(user)
    await editKey(user)

    await user.click(screen.getByRole('button', { name: 'Auf das Pad schreiben' }))
    expect(await screen.findByText(/enthält „Büro“/)).toBeInTheDocument()
    expect(device.profiles[0]).toEqual(other)

    await user.click(screen.getByRole('button', { name: 'Überschreiben' }))
    await screen.findByText(/beim Zurücklesen bestätigt/)
    expect(device.profiles[0].name).toBe('Neues Profil')
  })

  it('leaves the slot alone if the user cancels', async () => {
    const device = new MockDevice()
    device.profiles[0] = other
    const { user } = await setup(device)
    await connect(user)

    await user.click(screen.getByRole('button', { name: 'Auf das Pad schreiben' }))
    await user.click(await screen.findByRole('button', { name: 'Abbrechen' }))

    expect(screen.queryByText('Slot ist belegt')).not.toBeInTheDocument()
    expect(device.profiles[0]).toEqual(other)
  })

  it('does not ask if the slot holds a profile with the same name', async () => {
    const device = new MockDevice()
    device.profiles[0] = { ...other, name: 'Neues Profil' }
    const { user } = await setup(device)
    await connect(user)
    await editKey(user)

    await user.click(screen.getByRole('button', { name: 'Auf das Pad schreiben' }))

    expect(await screen.findByText(/beim Zurücklesen bestätigt/)).toBeInTheDocument()
    expect(screen.queryByText('Slot ist belegt')).not.toBeInTheDocument()
  })

  it('reports a slot that cannot be checked and keeps the editor unsaved', async () => {
    const { user, device } = await setup()
    await connect(user)
    await editKey(user)
    // the slot check (profile.get) is the first request after connecting
    device.failNextWith('STORAGE_FAILED')
    await user.click(screen.getByRole('button', { name: 'Auf das Pad schreiben' }))

    expect(await screen.findByText(/Slot ließ sich nicht prüfen/)).toBeInTheDocument()
    expect(screen.getByText('ungespeichert')).toBeInTheDocument()
  })
})
