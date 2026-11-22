/*
 * Zweck: Tests des WebSerial-Transports (Issue #11).
 * Inhalt: LineSplitter (Stücke, Zeilenenden, Müll), Senden mit Zeilenumbruch, Empfang ganzer Zeilen, Ende der
 *         Verbindung beim Abziehen und beim Schließen sowie das Zusammenspiel mit ProtocolClient und MockDevice.
 */
import { describe, expect, it, vi } from 'vitest'
import { ProtocolClient } from './client.ts'
import { FakeSerialPort } from './fakeSerial.ts'
import { MockDevice } from './mockDevice.ts'
import { LineSplitter, SerialTransport } from './serialTransport.ts'

describe('LineSplitter', () => {
  it('returns complete lines and keeps the rest', () => {
    const splitter = new LineSplitter()
    expect(splitter.push('{"a":1}\n{"b"')).toEqual(['{"a":1}'])
    expect(splitter.push(':2}\n')).toEqual(['{"b":2}'])
  })

  it('handles several lines in one chunk, CRLF and empty lines', () => {
    expect(new LineSplitter().push('one\r\n\ntwo\n')).toEqual(['one', 'two'])
  })

  it('drops a line that never ends instead of growing forever', () => {
    const splitter = new LineSplitter()
    expect(splitter.push('x'.repeat(70000))).toEqual([])
    expect(splitter.push('ok\n')).toEqual(['ok'])
  })
})

describe('SerialTransport', () => {
  it('opens the port, sends lines with a newline and reports incoming lines', async () => {
    const port = new FakeSerialPort()
    const transport = await SerialTransport.open(port)
    const lines: string[] = []
    transport.onLine((line) => lines.push(line))

    transport.send('{"v":1}')
    port.receive('{"ok":')
    port.receive('true}\n')

    await vi.waitFor(() => expect(lines).toEqual(['{"ok":true}']))
    expect(port.opened).toBe(true)
    expect(port.written).toBe('{"v":1}\n')
  })

  it('reports the end of the connection once when the pad is unplugged', async () => {
    const port = new FakeSerialPort()
    const transport = await SerialTransport.open(port)
    const closed = vi.fn()
    transport.onClose(closed)

    port.unplug()
    await vi.waitFor(() => expect(closed).toHaveBeenCalledTimes(1))
    await transport.close()
    expect(closed).toHaveBeenCalledTimes(1)
  })

  it('closes the port on close() and reports it', async () => {
    const port = new FakeSerialPort()
    const transport = await SerialTransport.open(port)
    const closed = vi.fn()
    transport.onClose(closed)

    await transport.close()
    expect(port.opened).toBe(false)
    expect(closed).toHaveBeenCalledTimes(1)
  })

  it('carries the protocol: client and mock device over a simulated port', async () => {
    const port = new FakeSerialPort()
    port.attach(new MockDevice({ firmware: '9.9.9' }))
    const transport = await SerialTransport.open(port)
    const info = await new ProtocolClient(transport).deviceInfo()
    expect(info.firmware).toBe('9.9.9')
    await transport.close()
  })
})
