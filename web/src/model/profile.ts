/*
 * Zweck: Datentypen und Validierung eines Profils im Format von Protokoll v1 (Issue #3).
 * Inhalt: Zod-Schemas für Schritt, Tastenaktion (diskriminierte Union nach `type`) und Profil.
 *         Die TypeScript-Typen werden aus den Schemas abgeleitet. `validateProfile` liefert eine
 *         Fehlerliste mit Pfad und Text. Grenzen des Pads kommen als Parameter (device.info).
 */
import { z } from 'zod'

/** Limits of a device as reported by `device.info`. Defaults apply while no pad is connected. */
export interface DeviceLimits {
  keys: number
  maxSteps: number
}

export const DEFAULT_LIMITS: DeviceLimits = { keys: 4, maxSteps: 32 }

/** Press and release a key with modifiers (HID modifier bitmask and HID usage id). */
const keyStepSchema = z.object({
  mod: z.number().int().min(0).max(255),
  key: z.number().int().min(0).max(255),
})

/** Pause in milliseconds. */
const delayStepSchema = z.object({
  delay: z.number().int().min(0).max(10_000),
})

export const stepSchema = z.union([keyStepSchema, delayStepSchema])

const baseKey = {
  label: z.string().max(64),
  steps: z.array(stepSchema).min(1),
}

/** Intent of a key combination, e.g. `ctrl+shift+p`. */
export const comboIntentSchema = z.object({ keys: z.string().min(1) })

/** Intent of a text action, optionally followed by Enter. */
export const textIntentSchema = z.object({ text: z.string().min(1), enter: z.boolean() })

/** Action of one key. `intent` is what the user meant, `steps` is what the pad plays. */
export const keyActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('combo'),
    ...baseKey,
    intent: comboIntentSchema,
  }),
  z.object({
    type: z.literal('text'),
    ...baseKey,
    intent: textIntentSchema,
  }),
  z.object({
    type: z.literal('macro'),
    ...baseKey,
    // The protocol does not define an intent for macros yet, so any object is accepted for now.
    intent: z.looseObject({}),
  }),
])

export const profileSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[\p{L}\p{N} _-]+$/u, 'only letters, digits, space, - and _'),
  layout: z.literal('de-DE'),
  keys: z.array(keyActionSchema.nullable()),
})

export type Step = z.infer<typeof stepSchema>
export type KeyAction = z.infer<typeof keyActionSchema>
export type Profile = z.infer<typeof profileSchema>

export interface ValidationError {
  /** Path to the faulty field, e.g. `keys[2].steps`. */
  path: string
  message: string
}

function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path.reduce<string>((acc, part) => {
    if (typeof part === 'number') return `${acc}[${part}]`
    return acc === '' ? String(part) : `${acc}.${String(part)}`
  }, '')
}

/**
 * Checks a profile against the structure and the device limits.
 * @returns an empty list if the profile is valid
 */
export function validateProfile(input: unknown, limits: DeviceLimits = DEFAULT_LIMITS): ValidationError[] {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return parsed.error.issues.map((i) => ({ path: formatPath(i.path), message: i.message }))
  }

  const errors: ValidationError[] = []
  const { keys } = parsed.data
  if (keys.length !== limits.keys) {
    errors.push({ path: 'keys', message: `expected ${limits.keys} keys, got ${keys.length}` })
  }
  keys.forEach((key, i) => {
    if (key !== null && key.steps.length > limits.maxSteps) {
      errors.push({
        path: `keys[${i}].steps`,
        message: `at most ${limits.maxSteps} steps allowed, got ${key.steps.length}`,
      })
    }
  })
  return errors
}
