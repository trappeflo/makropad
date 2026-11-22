/*
 * Zweck: Simuliertes Pad für Tests der Web-App ohne Hardware (Issue #13, Protokoll v1).
 * Inhalt: Klasse MockDevice als Transport. Sie beantwortet device.info, profile.get, profile.set und
 *         profile.activate wie die Firmware und prüft Version, Index, Tastenzahl und Grenzen mit den
 *         Fehlercodes des Protokolls. Für Fehlerfälle gibt es Haken: ausbleibende Antwort, ein erzwungener
 *         Fehler und eine kaputte Antwort. Der Zustand (Profile, aktives Profil, Anfragen) ist einsehbar.
 */
import { profileSchema, type Profile } from '../model/profile.ts'
import type { Transport } from './transport.ts'

/** Options of `MockDevice`, including hooks to provoke error cases. */
export interface MockDeviceOptions {
  protocol?: number
  firmware?: string
  keys?: number
  profiles?: number
  persistent?: boolean
  maxSteps?: number
  maxMessageBytes?: number
}

class RequestError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/** Simulated pad as a `Transport` that answers like the firmware (including the protocol error codes). */
export class MockDevice implements Transport {
  /** Profile slots as the pad stores them. A slot that was never written is empty. */
  readonly profiles: Profile[]
  activeProfile = 0
  /** Every line the pad received, in order. */
  readonly received: string[] = []

  private readonly options: Required<MockDeviceOptions>
  private readonly listeners = new Set<(line: string) => void>()
  private silent = false
  private forcedError: { code: string; message: string } | null = null
  private corruptNext = false

  constructor(options: MockDeviceOptions = {}) {
    this.options = {
      protocol: 1,
      firmware: '0.0.0-mock',
      keys: 4,
      profiles: 2,
      persistent: true,
      maxSteps: 32,
      maxMessageBytes: 4096,
      ...options,
    }
    this.profiles = Array.from({ length: this.options.profiles }, () => this.emptyProfile())
  }

  send(line: string): void {
    this.received.push(line)
    if (this.silent) return
    const reply = this.corruptNext ? '{"v":1,"id":' : this.answer(line)
    this.corruptNext = false
    // The real pad answers after the request has left, so deliver the answer asynchronously.
    queueMicrotask(() => this.listeners.forEach((listener) => listener(reply)))
  }

  onLine(listener: (line: string) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** The pad stops answering, so the client runs into its timeout. */
  setUnresponsive(silent: boolean): void {
    this.silent = silent
  }

  /** The next request is answered with an error response, whatever it asked for. */
  failNextWith(code: string, message = 'forced by mock'): void {
    this.forcedError = { code, message }
  }

  /** The next answer is cut off in the middle, like a broken line. */
  corruptNextAnswer(): void {
    this.corruptNext = true
  }

  private emptyProfile(): Profile {
    return { name: '', layout: 'de-DE', keys: Array.from({ length: this.options.keys }, () => null) }
  }

  private answer(line: string): string {
    let id = 0
    try {
      if (new TextEncoder().encode(line).length > this.options.maxMessageBytes) {
        throw new RequestError('TOO_LARGE', 'message too large')
      }
      const message = parseObject(line)
      if (typeof message.id === 'number') id = message.id
      if (message.v !== 1) throw new RequestError('UNSUPPORTED_VERSION', `v ${String(message.v)}`)
      if (!Number.isInteger(message.id)) throw new RequestError('BAD_REQUEST', 'id missing')
      if (typeof message.cmd !== 'string') throw new RequestError('BAD_REQUEST', 'cmd missing')

      if (this.forcedError !== null) {
        const { code, message: text } = this.forcedError
        this.forcedError = null
        throw new RequestError(code, text)
      }
      return JSON.stringify({ v: 1, id, ok: true, ...this.handle(message.cmd, message) })
    } catch (error) {
      if (!(error instanceof RequestError)) throw error
      return JSON.stringify({ v: 1, id, ok: false, error: { code: error.code, message: error.message } })
    }
  }

  private handle(cmd: string, message: Record<string, unknown>): Record<string, unknown> {
    switch (cmd) {
      case 'device.info':
        return {
          protocol: this.options.protocol,
          firmware: this.options.firmware,
          keys: this.options.keys,
          profiles: this.options.profiles,
          activeProfile: this.activeProfile,
          persistent: this.options.persistent,
          limits: { maxSteps: this.options.maxSteps, maxMessageBytes: this.options.maxMessageBytes },
        }
      case 'profile.get':
        return { profile: this.profiles[this.slot(message.index)] }
      case 'profile.set': {
        const index = this.slot(message.index)
        // Check everything first, so a failed write leaves the old profile untouched.
        const profile = this.checkProfile(message.profile)
        this.profiles[index] = profile
        return {}
      }
      case 'profile.activate':
        this.activeProfile = this.slot(message.index)
        return { activeProfile: this.activeProfile }
      default:
        throw new RequestError('UNKNOWN_CMD', cmd)
    }
  }

  private slot(index: unknown): number {
    if (typeof index !== 'number' || !Number.isInteger(index)) throw new RequestError('BAD_REQUEST', 'index missing')
    if (index < 0 || index >= this.options.profiles) throw new RequestError('OUT_OF_RANGE', `index ${index}`)
    return index
  }

  private checkProfile(input: unknown): Profile {
    const parsed = profileSchema.safeParse(input)
    if (!parsed.success) throw new RequestError('BAD_REQUEST', 'profile does not match the protocol')
    const profile = parsed.data
    if (profile.keys.length !== this.options.keys) {
      throw new RequestError('OUT_OF_RANGE', `expected ${this.options.keys} keys, got ${profile.keys.length}`)
    }
    for (const key of profile.keys) {
      if (key !== null && key.steps.length > this.options.maxSteps) {
        throw new RequestError('TOO_LARGE', `at most ${this.options.maxSteps} steps per key`)
      }
    }
    // Stored as received: the pad keeps the intent unchanged and never evaluates it.
    return JSON.parse(JSON.stringify(input)) as Profile
  }
}

function parseObject(line: string): Record<string, unknown> {
  let value: unknown
  try {
    value = JSON.parse(line)
  } catch {
    throw new RequestError('BAD_REQUEST', 'not valid JSON')
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RequestError('BAD_REQUEST', 'not an object')
  }
  return value as Record<string, unknown>
}
