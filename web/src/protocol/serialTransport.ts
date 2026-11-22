/*
 * Zweck: Transport über WebSerial zum Pad (Issue #11, ADR 0004).
 * Inhalt: Minimale Typen für die Web-Serial-API (die DOM-Typen enthalten sie nicht), LineSplitter zum Zerlegen
 *         des Byte-Stroms in Zeilen und SerialTransport. Der Transport liest in einer Schleife, meldet ganze Zeilen
 *         und erkennt das Ende der Verbindung (Abziehen des Pads, Fehler, Schließen).
 */
import type { Transport } from './transport.ts'

/** The part of a Web Serial reader that `SerialTransport` uses. */
export interface SerialReader {
  read(): Promise<{ done: boolean; value?: Uint8Array }>
  cancel(): Promise<void>
  releaseLock(): void
}

/** The part of a Web Serial writer that `SerialTransport` uses. */
export interface SerialWriter {
  write(chunk: Uint8Array): Promise<void>
  releaseLock(): void
}

/** The part of a Web Serial port this app uses. */
export interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readonly readable: { getReader(): SerialReader } | null
  readonly writable: { getWriter(): SerialWriter } | null
}

/** The part of `navigator.serial` this app uses. */
export interface SerialLike {
  requestPort(): Promise<SerialPortLike>
}

/** Returns `navigator.serial`, or undefined in browsers without Web Serial (Firefox, Safari). */
export function getSerial(): SerialLike | undefined {
  return (globalThis.navigator as { serial?: SerialLike } | undefined)?.serial
}

/** A line longer than this without a newline is garbage, it is dropped so the buffer cannot grow without limit. */
const MAX_LINE_CHARS = 65536

/** Cuts a stream of text into lines. Incomplete lines stay in the buffer until their newline arrives. */
export class LineSplitter {
  private buffer = ''

  push(text: string): string[] {
    this.buffer += text
    const parts = this.buffer.split('\n')
    this.buffer = parts.pop() ?? ''
    if (this.buffer.length > MAX_LINE_CHARS) this.buffer = ''
    return parts.map((line) => line.replace(/\r$/, '')).filter((line) => line !== '')
  }
}

/** Line-based `Transport` over a Web Serial port. */
export class SerialTransport implements Transport {
  private readonly lineListeners = new Set<(line: string) => void>()
  private readonly closeListeners = new Set<() => void>()
  private readonly reader: SerialReader
  private readonly writer: SerialWriter
  private readonly encoder = new TextEncoder()
  private readonly port: SerialPortLike

  private constructor(port: SerialPortLike) {
    this.port = port
    if (port.readable === null || port.writable === null) throw new Error('The serial port is not open.')
    this.reader = port.readable.getReader()
    this.writer = port.writable.getWriter()
    void this.readLoop()
  }

  /** Opens the port and starts reading. */
  static async open(port: SerialPortLike, baudRate = 115200): Promise<SerialTransport> {
    await port.open({ baudRate })
    return new SerialTransport(port)
  }

  send(line: string): void {
    this.writer.write(this.encoder.encode(`${line}\n`)).catch(() => this.finish())
  }

  onLine(listener: (line: string) => void): () => void {
    this.lineListeners.add(listener)
    return () => this.lineListeners.delete(listener)
  }

  /** Called once when the connection ends, whether the pad was unplugged, writing failed or {@link close} ran. */
  onClose(listener: () => void): () => void {
    this.closeListeners.add(listener)
    return () => this.closeListeners.delete(listener)
  }

  /** Stops reading, releases the port and closes it. Never throws. */
  async close(): Promise<void> {
    await this.reader.cancel().catch(() => {})
    this.reader.releaseLock()
    this.writer.releaseLock()
    await this.port.close().catch(() => {})
    this.finish()
  }

  private async readLoop(): Promise<void> {
    const decoder = new TextDecoder()
    const splitter = new LineSplitter()
    try {
      for (;;) {
        const { done, value } = await this.reader.read()
        if (done) break
        if (value === undefined) continue
        for (const line of splitter.push(decoder.decode(value, { stream: true }))) {
          this.lineListeners.forEach((listener) => listener(line))
        }
      }
    } catch {
      // reading fails when the device disappears, treated like the end of the stream
    }
    this.finish()
  }

  private finish(): void {
    // The listeners are removed before they run, so the close is reported only once.
    const listeners = [...this.closeListeners]
    this.closeListeners.clear()
    listeners.forEach((listener) => listener())
  }
}
