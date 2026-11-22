/*
 * Zweck: Simulierter serieller Port für Tests der Verbindung ohne Browser und Hardware (Issue #11).
 * Inhalt: FakeSerialPort und FakeSerial. Der Port kann an einen MockDevice (#13) angeschlossen werden, liefert
 *         Daten in beliebigen Stücken, bildet das Abziehen und einen Fehler beim Öffnen nach und merkt sich,
 *         was geschrieben wurde. Nur für Tests gedacht, die App importiert die Datei nicht.
 */
import type { MockDevice } from './mockDevice.ts'
import type { SerialLike, SerialPortLike, SerialReader, SerialWriter } from './serialTransport.ts'

/** Simulated serial port for tests: lines written by the app can be read, answers can be pushed. */
export class FakeSerialPort implements SerialPortLike {
  opened = false
  /** Everything the app wrote, as text. */
  written = ''
  openError: Error | null = null

  private queue: Uint8Array[] = []
  private waiting: ((result: { done: boolean; value?: Uint8Array }) => void) | null = null
  private failing: Error | null = null
  private ended = false

  /** Connects a simulated pad: it receives what is written and its answers come back as text. */
  attach(device: MockDevice): void {
    let pending = ''
    this.onWrite = (text) => {
      pending += text
      const lines = pending.split('\n')
      pending = lines.pop() ?? ''
      lines.forEach((line) => device.send(line))
    }
    device.onLine((line) => this.receive(`${line}\n`))
  }

  private onWrite: (text: string) => void = () => {}

  readonly readable = {
    getReader: (): SerialReader => ({
      read: () => this.read(),
      cancel: async () => {
        this.ended = true
        this.wake()
      },
      releaseLock: () => {},
    }),
  }

  readonly writable = {
    getWriter: (): SerialWriter => ({
      write: async (chunk) => {
        if (this.failing !== null) throw this.failing
        const text = new TextDecoder().decode(chunk)
        this.written += text
        this.onWrite(text)
      },
      releaseLock: () => {},
    }),
  }

  async open(): Promise<void> {
    if (this.openError !== null) throw this.openError
    this.opened = true
  }

  async close(): Promise<void> {
    this.opened = false
  }

  /** Data from the pad, in any chunking. */
  receive(text: string): void {
    this.queue.push(new TextEncoder().encode(text))
    this.wake()
  }

  /** The pad is unplugged: reading and writing fail. */
  unplug(): void {
    this.failing = new Error('The device has been lost.')
    this.ended = true
    this.wake()
  }

  private read(): Promise<{ done: boolean; value?: Uint8Array }> {
    const next = this.queue.shift()
    if (next !== undefined) return Promise.resolve({ done: false, value: next })
    if (this.failing !== null) return Promise.reject(this.failing)
    if (this.ended) return Promise.resolve({ done: true })
    return new Promise((resolve) => {
      this.waiting = resolve
    })
  }

  private wake(): void {
    const waiting = this.waiting
    if (waiting === null) return
    this.waiting = null
    void this.read().then(waiting, () => waiting({ done: true }))
  }
}

/** Simulated `navigator.serial` for tests. */
export class FakeSerial implements SerialLike {
  /** Set to make requestPort fail like a user who closes the dialog. */
  cancelled = false

  readonly port: FakeSerialPort

  constructor(port: FakeSerialPort = new FakeSerialPort()) {
    this.port = port
  }

  async requestPort(): Promise<SerialPortLike> {
    if (this.cancelled) throw new DOMException('No port selected by the user.', 'NotFoundError')
    return this.port
  }
}
