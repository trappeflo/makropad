/*
 * Zweck: REST-Client für die Sicherung der Profile im Backend (Issue #5, ADR 0005).
 * Inhalt: BackupClient mit list, get, create, update und remove, dazu BackupError mit Fehlerart. Der Name des
 *         Profils ist der Schlüssel in der Adresse. Antworten werden mit dem Profil-Schema geprüft. Fehler des
 *         Backends (Problem Details, RFC 9457) werden in eine Fehlerart und einen Text übersetzt, ein
 *         nicht erreichbares Backend ist eine eigene Fehlerart.
 */
import { z } from 'zod'
import { profileSchema, type Profile } from '../model/profile.ts'

/** Kind of failure when talking to the backend, the UI picks its message from it. */
export type BackupErrorKind =
  /** No answer: the backend is not running, the address is wrong or the network is down. */
  | 'UNREACHABLE'
  | 'NOT_FOUND'
  /** The name is already taken (create only). */
  | 'CONFLICT'
  /** The backend rejected the profile, `details` lists the broken rules. */
  | 'INVALID'
  | 'SERVER_ERROR'
  /** The backend answered, but not in the expected format. */
  | 'INVALID_RESPONSE'

/** Failure of a backend call. `kind` tells what went wrong, `message` is ready to show. */
export class BackupError extends Error {
  readonly kind: BackupErrorKind
  /** One line per broken rule for INVALID, otherwise empty. */
  readonly details: string[]

  constructor(kind: BackupErrorKind, message: string, details: string[] = []) {
    super(message)
    this.name = 'BackupError'
    this.kind = kind
    this.details = details
  }
}

/** Where the backend runs. Overridable at build time with VITE_BACKEND_URL. */
export const DEFAULT_BACKEND_URL = 'http://localhost:8080'

const problemSchema = z.object({
  detail: z.string().optional(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
})

/** REST client for the profile backup (`/profiles`). The profile name is the key. */
export class BackupClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(
    baseUrl: string = import.meta.env.VITE_BACKEND_URL ?? DEFAULT_BACKEND_URL,
    fetchFn: typeof fetch = (...args) => fetch(...args),
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.fetchFn = fetchFn
  }

  /** All backed up profiles, sorted by name. */
  async list(): Promise<Profile[]> {
    return this.parse(z.array(profileSchema), await this.request('GET', '/profiles'))
  }

  /** @throws BackupError NOT_FOUND if there is no profile with this name */
  async get(name: string): Promise<Profile> {
    return this.parse(profileSchema, await this.request('GET', `/profiles/${encodeURIComponent(name)}`))
  }

  /** @throws BackupError CONFLICT if the name is taken, INVALID if the backend rejects the profile */
  async create(profile: Profile): Promise<Profile> {
    return this.parse(profileSchema, await this.request('POST', '/profiles', profile))
  }

  /** Replaces the profile stored under `name`. @throws BackupError NOT_FOUND, INVALID */
  async update(name: string, profile: Profile): Promise<Profile> {
    return this.parse(profileSchema, await this.request('PUT', `/profiles/${encodeURIComponent(name)}`, profile))
  }

  /** @throws BackupError NOT_FOUND if there is no profile with this name */
  async remove(name: string): Promise<void> {
    await this.request('DELETE', `/profiles/${encodeURIComponent(name)}`)
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    let response: Response
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new BackupError('UNREACHABLE', 'The backend does not answer.')
    }
    if (!response.ok) throw await this.toError(response)
    if (response.status === 204) return undefined
    try {
      return await response.json()
    } catch {
      throw new BackupError('INVALID_RESPONSE', 'The backend answered with something that is not JSON.')
    }
  }

  private async toError(response: Response): Promise<BackupError> {
    const problem = problemSchema.safeParse(await response.json().catch(() => null))
    const detail = problem.success ? problem.data.detail : undefined
    const status = response.status
    if (status === 404) return new BackupError('NOT_FOUND', detail ?? 'Not found.')
    if (status === 409) return new BackupError('CONFLICT', detail ?? 'The name is already taken.')
    if (status === 400) {
      const rules = problem.success ? (problem.data.errors ?? []).map((e) => `${e.field}: ${e.message}`) : []
      return new BackupError('INVALID', detail ?? 'The backend rejected the profile.', rules)
    }
    return new BackupError('SERVER_ERROR', detail ?? `The backend answered with status ${status}.`)
  }

  private parse<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data)
    if (!result.success) throw new BackupError('INVALID_RESPONSE', 'The backend answered with an unexpected format.')
    return result.data
  }
}
