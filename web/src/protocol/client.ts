/*
 * Zweck: Protokoll-Client der Web-App nach Protokoll v1 (Issue #12, docs/protokoll-v1.md).
 * Inhalt: Klasse ProtocolClient mit deviceInfo, getProfile, setProfile und activateProfile, dazu ProtocolError
 *         und die Schemas der Antworten. Der Client zählt die ID hoch, ordnet Antworten ihrer Anfrage zu,
 *         prüft sie mit Zod und meldet jeden Fehler als ProtocolError. Schreiben, Zurücklesen und Vergleichen
 *         (#14) baut darauf auf, die Verbindung kommt über das Interface Transport.
 */
import { z } from 'zod'
import { profileSchema, type Profile } from '../model/profile.ts'
import type { Transport } from './transport.ts'

/** Protocol version this client speaks (docs/protokoll-v1.md). */
export const PROTOCOL_VERSION = 1

/**
 * Default time to wait for a response in milliseconds.
 * Placeholder: the real value is still to be measured (Protokoll v1, open points).
 */
export const DEFAULT_TIMEOUT_MS = 2000

/** Error codes of the pad (section 5 of the protocol) plus the codes the client adds itself. */
export type ProtocolErrorCode =
  | 'BAD_REQUEST'
  | 'UNKNOWN_CMD'
  | 'UNSUPPORTED_VERSION'
  | 'OUT_OF_RANGE'
  | 'TOO_LARGE'
  | 'STORAGE_FAILED'
  | 'BUSY'
  /** No response within the timeout. */
  | 'TIMEOUT'
  /** The response does not match the protocol. */
  | 'INVALID_RESPONSE'
  /** The pad sent an error code this client does not know. */
  | 'UNKNOWN_ERROR'

const PAD_CODES: readonly string[] = [
  'BAD_REQUEST',
  'UNKNOWN_CMD',
  'UNSUPPORTED_VERSION',
  'OUT_OF_RANGE',
  'TOO_LARGE',
  'STORAGE_FAILED',
  'BUSY',
]

/** Failure of a protocol call, either reported by the pad or detected by the client. */
export class ProtocolError extends Error {
  readonly code: ProtocolErrorCode

  constructor(code: ProtocolErrorCode, message: string) {
    super(message)
    this.name = 'ProtocolError'
    this.code = code
  }
}

const envelopeSchema = z.object({ v: z.literal(PROTOCOL_VERSION), id: z.number().int() })

const failureSchema = envelopeSchema.extend({
  ok: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
})

const successSchema = envelopeSchema.extend({ ok: z.literal(true) })

/** Answer of `device.info`: firmware, protocol version and limits of the pad. */
export const deviceInfoSchema = z.object({
  protocol: z.number().int(),
  firmware: z.string(),
  keys: z.number().int().min(1),
  profiles: z.number().int().min(1),
  activeProfile: z.number().int().min(0),
  persistent: z.boolean(),
  limits: z.object({
    maxSteps: z.number().int().min(1),
    maxMessageBytes: z.number().int().min(1),
  }),
})

export type DeviceInfo = z.infer<typeof deviceInfoSchema>

/** A slot that was never written is returned with an empty name, so the name check is relaxed for reading. */
const padProfileSchema = profileSchema.extend({ name: z.union([z.literal(''), profileSchema.shape.name]) })

/** Options of `ProtocolClient`. */
export interface ProtocolClientOptions {
  /** Time to wait for a response. Defaults to {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number
}

interface Pending {
  resolve: (message: Record<string, unknown>) => void
  reject: (error: ProtocolError) => void
}

/** Speaks protocol v1 over a `Transport`: one request at a time, answers matched by id. */
export class ProtocolClient {
  private readonly transport: Transport
  private readonly timeoutMs: number
  private readonly pending = new Map<number, Pending>()
  private nextId = 1
  private readonly unsubscribe: () => void

  constructor(transport: Transport, options: ProtocolClientOptions = {}) {
    this.transport = transport
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.unsubscribe = transport.onLine((line) => this.handleLine(line))
  }

  /** Stops listening. Requests that are still waiting fail with a timeout. */
  close(): void {
    this.unsubscribe()
  }

  /** Asks for version, limits and the active profile. Fails if the pad speaks another protocol version. */
  async deviceInfo(): Promise<DeviceInfo> {
    const message = await this.request('device.info')
    const info = parse(deviceInfoSchema, message, 'device.info')
    if (info.protocol !== PROTOCOL_VERSION) {
      throw new ProtocolError(
        'UNSUPPORTED_VERSION',
        `The pad speaks protocol ${info.protocol}, this app speaks protocol ${PROTOCOL_VERSION}.`,
      )
    }
    return info
  }

  /** Reads the profile of a slot. A slot that was never written has an empty name and no key actions. */
  async getProfile(index: number): Promise<Profile> {
    const message = await this.request('profile.get', { index })
    return parse(z.object({ profile: padProfileSchema }), message, 'profile.get').profile
  }

  /** Writes a profile to a slot. The pad saves it atomically. */
  async setProfile(index: number, profile: Profile): Promise<void> {
    await this.request('profile.set', { index, profile })
  }

  /** Switches the active profile and returns the index the pad reports. */
  async activateProfile(index: number): Promise<number> {
    const message = await this.request('profile.activate', { index })
    return parse(z.object({ activeProfile: z.number().int() }), message, 'profile.activate').activeProfile
  }

  private request(cmd: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new ProtocolError('TIMEOUT', `No response to ${cmd} within ${this.timeoutMs} ms.`))
      }, this.timeoutMs)

      this.pending.set(id, {
        resolve: (message) => {
          clearTimeout(timer)
          resolve(message)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
      })
      this.transport.send(JSON.stringify({ v: PROTOCOL_VERSION, id, cmd, ...params }))
    })
  }

  private handleLine(line: string): void {
    let message: unknown
    try {
      message = JSON.parse(line)
    } catch {
      return // not a message of this protocol, the pad drops broken lines as well
    }

    const envelope = envelopeSchema.safeParse(message)
    if (!envelope.success) return
    const pending = this.pending.get(envelope.data.id)
    if (pending === undefined) return // late answer to a request that already timed out
    this.pending.delete(envelope.data.id)

    const failure = failureSchema.safeParse(message)
    if (failure.success) {
      const { code, message: text } = failure.data.error
      pending.reject(new ProtocolError(PAD_CODES.includes(code) ? (code as ProtocolErrorCode) : 'UNKNOWN_ERROR', text))
      return
    }
    if (!successSchema.safeParse(message).success) {
      pending.reject(new ProtocolError('INVALID_RESPONSE', 'The response has neither ok:true nor an error.'))
      return
    }
    pending.resolve(message as Record<string, unknown>)
  }
}

function parse<T>(schema: z.ZodType<T>, message: unknown, cmd: string): T {
  const result = schema.safeParse(message)
  if (!result.success) {
    throw new ProtocolError('INVALID_RESPONSE', `Unexpected response to ${cmd}: ${result.error.issues[0]?.message}`)
  }
  return result.data
}
