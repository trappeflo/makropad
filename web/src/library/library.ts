/*
 * Zweck: Typen, Schema und Zugriff für die Aktionsbibliothek (Issue #7).
 * Inhalt: Zod-Schema für Bibliothek, Programmgruppe und Eintrag, die abgeleiteten Typen und das Laden der
 *         statischen Datei actions.json. Ein Eintrag enthält nur die Absicht (`intent`), die Schritte für das
 *         Pad werden später daraus berechnet (Schritte = f(Absicht), Protokoll v1).
 */
import { z } from 'zod'
import { comboIntentSchema, textIntentSchema } from '../model/profile.ts'
import actions from './actions.json'

const base = {
  label: z.string().min(1).max(64),
  description: z.string().min(1),
  /** Optional remark, e.g. that a shortcut only works in one program. */
  note: z.string().min(1).optional(),
}

/** One ready-made action: a key combination or a text, described by intent (not by HID steps). */
export const libraryActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('combo'), ...base, intent: comboIntentSchema }),
  z.object({ type: z.literal('text'), ...base, intent: textIntentSchema }),
])

/** Actions of one program or topic. */
export const libraryGroupSchema = z.object({
  /** Program or topic the actions belong to, e.g. "Browser". */
  name: z.string().min(1),
  actions: z.array(libraryActionSchema).min(1),
})

/** The whole action library, at least one group. */
export const librarySchema = z.object({
  groups: z.array(libraryGroupSchema).min(1),
})

export type LibraryAction = z.infer<typeof libraryActionSchema>
export type LibraryGroup = z.infer<typeof libraryGroupSchema>
export type Library = z.infer<typeof librarySchema>

/** The bundled library. Parsing at load time fails loudly if the data file is malformed. */
export const library: Library = librarySchema.parse(actions)
