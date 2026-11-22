/*
 * Zweck: Tests des Schreiben-Buttons (Issue #80) und des Buttons "Vom Pad laden" (Issue #83) im Editor.
 * Inhalt: Button nur bei Verbindung, Schreiben in den gewählten Slot, Rückfrage bei einem anderen Profil im Slot,
 *         kein Rückfragen beim gleichen Profilnamen, Abbrechen, Fehlermeldung und Editor danach "gespeichert".
 *         Laden: Übernahme eines Slots in den Editor, leerer Slot, Rückfrage bei ungespeicherten Änderungen, Fehler.
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

  it('blocks the button while the profile name is invalid', async () => {
    const { user, device } = await setup()
    await connect(user)

    await user.clear(screen.getByRole('textbox', { name: 'Profilname' }))
    expect(screen.getByRole('button', { name: 'Auf das Pad schreiben' })).toBeDisabled()
    expect(screen.getByText(/Profilname ungültig/)).toBeInTheDocument()
    expect(device.received).toHaveLength(1) // only the device.info from connecting
  })

  it('writes the profile under the new name', async () => {
    const { user, device } = await setup()
    await connect(user)
    await editKey(user)

    const field = screen.getByRole('textbox', { name: 'Profilname' })
    await user.clear(field)
    await user.type(field, 'Büro')
    await user.click(screen.getByRole('button', { name: 'Auf das Pad schreiben' }))

    await screen.findByText(/beim Zurücklesen bestätigt/)
    expect(device.profiles[0].name).toBe('Büro')
  })

  describe('Vom Pad laden', () => {
    const nameField = () => screen.getByRole('textbox', { name: 'Profilname' })

    it('takes the profile of the slot into a clean editor without asking', async () => {
      const device = new MockDevice()
      device.profiles[0] = other
      const { user } = await setup(device)
      await connect(user)

      await user.click(screen.getByRole('button', { name: 'Vom Pad laden' }))

      expect(await screen.findByText('„Büro“ aus Profil 1 ist geladen.')).toBeInTheDocument()
      expect(nameField()).toHaveValue('Büro')
      expect(screen.getByText('gespeichert')).toBeInTheDocument()
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument()
    })

    it('reads the slot that was chosen', async () => {
      const device = new MockDevice()
      device.profiles[1] = other
      const { user } = await setup(device)
      await connect(user)

      await user.click(screen.getByRole('combobox', { name: 'Slot auf dem Pad' }))
      await user.click(await screen.findByRole('option', { name: 'Profil 2', hidden: true }))
      await user.click(screen.getByRole('button', { name: 'Vom Pad laden' }))

      expect(await screen.findByText('„Büro“ aus Profil 2 ist geladen.')).toBeInTheDocument()
      expect(nameField()).toHaveValue('Büro')
    })

    it('says so for an empty slot and leaves the editor alone', async () => {
      const { user } = await setup()
      await connect(user)
      await editKey(user)

      await user.click(screen.getByRole('button', { name: 'Vom Pad laden' }))

      expect(await screen.findByText('Profil 1 ist leer, es gibt nichts zu laden.')).toBeInTheDocument()
      expect(nameField()).toHaveValue('Neues Profil')
      expect(screen.getByText('ungespeichert')).toBeInTheDocument()
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument()
    })

    it('asks before replacing unsaved changes and loads after confirmation', async () => {
      const device = new MockDevice()
      device.profiles[0] = other
      const { user } = await setup(device)
      await connect(user)
      await editKey(user)

      await user.click(screen.getByRole('button', { name: 'Vom Pad laden' }))
      expect(await screen.findByText('Ungespeicherte Änderungen')).toBeInTheDocument()
      expect(nameField()).toHaveValue('Neues Profil')

      await user.click(screen.getByRole('button', { name: 'Trotzdem laden' }))
      expect(nameField()).toHaveValue('Büro')
      expect(screen.getByText('gespeichert')).toBeInTheDocument()
    })

    it('keeps the unsaved changes if the user cancels', async () => {
      const device = new MockDevice()
      device.profiles[0] = other
      const { user } = await setup(device)
      await connect(user)
      await editKey(user)

      await user.click(screen.getByRole('button', { name: 'Vom Pad laden' }))
      await user.click(await screen.findByRole('button', { name: 'Abbrechen' }))

      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument()
      expect(nameField()).toHaveValue('Neues Profil')
      expect(screen.getByText('ungespeichert')).toBeInTheDocument()
    })

    it('does not write anything to the pad', async () => {
      const device = new MockDevice()
      device.profiles[0] = other
      const { user } = await setup(device)
      await connect(user)

      await user.click(screen.getByRole('button', { name: 'Vom Pad laden' }))
      await screen.findByText('„Büro“ aus Profil 1 ist geladen.')

      expect(device.received.map((line) => JSON.parse(line).cmd)).toEqual(['device.info', 'profile.get'])
    })

    it('reports a slot that cannot be read and leaves the editor alone', async () => {
      const { user, device } = await setup()
      await connect(user)
      await editKey(user)
      device.failNextWith('STORAGE_FAILED')

      await user.click(screen.getByRole('button', { name: 'Vom Pad laden' }))

      expect(await screen.findByText(/Das Profil ließ sich nicht lesen/)).toBeInTheDocument()
      expect(screen.getByText('ungespeichert')).toBeInTheDocument()
    })
  })
})
