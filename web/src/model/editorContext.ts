/*
 * Zweck: Context-Objekt und Hook des Profil-Editors (Issue #3).
 * Inhalt: ProfileEditor (Zustand, dispatch, dirty), EditorContext und der Hook useProfileEditor.
 *         Getrennt vom Provider, damit die Komponentendatei nur Komponenten exportiert.
 */
import { createContext, useContext } from 'react'
import type { EditorAction, EditorState } from './profileReducer.ts'

export interface ProfileEditor {
  state: EditorState
  dispatch: (action: EditorAction) => void
  dirty: boolean
}

export const EditorContext = createContext<ProfileEditor | null>(null)

export function useProfileEditor(): ProfileEditor {
  const ctx = useContext(EditorContext)
  if (ctx === null) throw new Error('useProfileEditor must be used inside a ProfileProvider')
  return ctx
}
