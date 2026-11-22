/*
 * Zweck: Tests der Verbindung zum Pad und ihrer Anzeige (Issue #11).
 * Inhalt: Hinweis ohne WebSerial, Verbinden und Trennen, Abbruch im Auswahldialog, ein Gerät das nicht antwortet,
 *         Fehler beim Öffnen und Abziehen des Pads. Gegenstelle ist der simulierte Port mit MockDevice.
 */
import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FakeSerial } from '../protocol/fakeSerial.ts'
import { MockDevice } from '../protocol/mockDevice.ts'
import { ConnectionBar } from './ConnectionBar.tsx'
import { DeviceConnectionProvider } from './DeviceConnection.tsx'

function setup(serial: FakeSerial | undefined, device: MockDevice | null = new MockDevice({ firmware: '0.1.0' }), timeoutMs?: number) {
  if (serial !== undefined && device !== null) serial.port.attach(device)
  render(
    <MantineProvider>
      <DeviceConnectionProvider serial={serial} timeoutMs={timeoutMs}>
        <ConnectionBar />
      </DeviceConnectionProvider>
    </MantineProvider>,
  )
  return userEvent.setup()
}

describe('ConnectionBar', () => {
  it('explains that the browser has no WebSerial', () => {
    // the provider falls back to navigator.serial, which jsdom does not have
    setup(undefined)
    expect(screen.getByText(/unterstützt WebSerial nicht/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mit Pad verbinden' })).not.toBeInTheDocument()
  })

  it('connects, shows the device info and disconnects again', async () => {
    const serial = new FakeSerial()
    const user = setup(serial)
    expect(screen.getByText('Nicht verbunden')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mit Pad verbinden' }))
    expect(await screen.findByText('Verbunden')).toBeInTheDocument()
    expect(screen.getByText('Firmware 0.1.0, 4 Tasten, 2 Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Trennen' }))
    expect(await screen.findByText('Nicht verbunden')).toBeInTheDocument()
    expect(serial.port.opened).toBe(false)
  })

  it('stays quiet if the user closes the port dialog', async () => {
    const serial = new FakeSerial()
    serial.cancelled = true
    const user = setup(serial)
    await user.click(screen.getByRole('button', { name: 'Mit Pad verbinden' }))
    expect(screen.getByText('Nicht verbunden')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reports a port that cannot be opened', async () => {
    const serial = new FakeSerial()
    serial.port.openError = new Error('busy')
    const user = setup(serial)
    await user.click(screen.getByRole('button', { name: 'Mit Pad verbinden' }))
    expect(await screen.findByText(/lässt sich nicht öffnen/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mit Pad verbinden' })).toBeInTheDocument()
  })

  it('rejects a device that does not answer like a pad', async () => {
    const serial = new FakeSerial()
    const device = new MockDevice()
    device.corruptNextAnswer()
    const user = setup(serial, device, 100)
    await user.click(screen.getByRole('button', { name: 'Mit Pad verbinden' }))
    expect(await screen.findByText(/antwortet nicht wie ein Makropad/)).toBeInTheDocument()
    expect(serial.port.opened).toBe(false)
  })

  it('notices when the pad is unplugged', async () => {
    const serial = new FakeSerial()
    const user = setup(serial)
    await user.click(screen.getByRole('button', { name: 'Mit Pad verbinden' }))
    await screen.findByText('Verbunden')

    serial.port.unplug()
    expect(await screen.findByText('Die Verbindung zum Pad wurde getrennt.')).toBeInTheDocument()
    expect(screen.getByText('Nicht verbunden')).toBeInTheDocument()
  })
})
