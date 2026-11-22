/*
 * Zweck: Ablauf "Profil auf das Pad schreiben, zurücklesen und vergleichen" (Issue #14, Protokoll v1 Abschnitt 6,
 *        Anforderung R7).
 * Inhalt: Funktion writeProfile mit den Phasen info, validate, write, readback und compare, die Fehlerklasse
 *         WriteError (Phase, Code, Einzelheiten) und diffProfiles. Jeder Fehler bricht den Ablauf ab. Die Phase
 *         wird über einen Callback gemeldet, damit die Oberfläche den Fortschritt anzeigen kann.
 */
import { validateProfile, type Profile } from '../model/profile.ts'
import { stepsFor } from '../model/steps.ts'
import { ProtocolError, type ProtocolClient, type ProtocolErrorCode } from './client.ts'

/** The phases in the order they run. */
export const WRITE_PHASES = ['info', 'validate', 'write', 'readback', 'compare'] as const
/** Phase of a write, reported to the progress callback. */
export type WritePhase = (typeof WRITE_PHASES)[number]

export type WriteErrorCode =
  | ProtocolErrorCode
  /** The profile does not fit the pad or the protocol, nothing was sent. */
  | 'INVALID_PROFILE'
  /** The pad returned something different from what was written. */
  | 'MISMATCH'

export class WriteError extends Error {
  readonly phase: WritePhase
  readonly code: WriteErrorCode
  /** One line per problem, e.g. the faulty paths of an invalid profile or the differing parts of a mismatch. */
  readonly details: string[]

  constructor(phase: WritePhase, code: WriteErrorCode, message: string, details: string[] = []) {
    super(message)
    this.name = 'WriteError'
    this.phase = phase
    this.code = code
    this.details = details
  }
}

/** JSON with sorted keys, so the order of fields does not matter when comparing. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1))
    return `{${entries.map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Lists the parts in which two profiles differ, empty if they are equal. */
export function diffProfiles(sent: Profile, received: Profile): string[] {
  const differences: string[] = []
  if (sent.name !== received.name) differences.push('name')
  if (sent.layout !== received.layout) differences.push('layout')
  if (sent.keys.length !== received.keys.length) {
    differences.push(`keys (${sent.keys.length} sent, ${received.keys.length} returned)`)
    return differences
  }
  sent.keys.forEach((key, i) => {
    if (canonical(key) !== canonical(received.keys[i])) differences.push(`keys[${i}]`)
  })
  return differences
}

/** Wraps an error of the client, so the caller knows in which phase it happened. */
async function inPhase<T>(phase: WritePhase, work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof ProtocolError) throw new WriteError(phase, error.code, error.message)
    throw error
  }
}

/**
 * Writes a profile to a slot and checks the result by reading it back.
 * @param onProgress called with each phase when it starts
 * @throws WriteError at the first problem, with the phase in which it happened
 */
export async function writeProfile(
  client: ProtocolClient,
  index: number,
  profile: Profile,
  onProgress: (phase: WritePhase) => void = () => {},
): Promise<void> {
  onProgress('info')
  const info = await inPhase('info', () => client.deviceInfo())

  onProgress('validate')
  if (!Number.isInteger(index) || index < 0 || index >= info.profiles) {
    throw new WriteError('validate', 'OUT_OF_RANGE', `The pad has ${info.profiles} profile slots, slot ${index} does not exist.`)
  }
  const problems = validateProfile(profile, { keys: info.keys, maxSteps: info.limits.maxSteps }).map(
    (e) => `${e.path}: ${e.message}`,
  )
  // steps = f(intent): the pad plays the steps, so they must not drift from what the user meant
  profile.keys.forEach((key, i) => {
    if (key === null) return
    const expected = stepsFor(key)
    if (expected === null) return // macros have no intent to compare against
    if (!expected.ok) problems.push(`keys[${i}].intent: ${expected.error}`)
    else if (canonical(expected.steps) !== canonical(key.steps)) problems.push(`keys[${i}].steps: do not match the intent`)
  })
  if (problems.length > 0) {
    throw new WriteError('validate', 'INVALID_PROFILE', 'The profile cannot be written to the pad.', problems)
  }

  onProgress('write')
  await inPhase('write', () => client.setProfile(index, profile))

  onProgress('readback')
  const received = await inPhase('readback', () => client.getProfile(index))

  onProgress('compare')
  const differences = diffProfiles(profile, received)
  if (differences.length > 0) {
    throw new WriteError('compare', 'MISMATCH', 'The pad returned a different profile than was written.', differences)
  }
}
