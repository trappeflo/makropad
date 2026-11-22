/*
 * Zweck: Stellt den Editor-Zustand per React-Context bereit (Issue #3).
 * Inhalt: ProfileProvider mit useReducer (profileReducer) und dem abgeleiteten dirty-Wert.
 *         Der Hook useProfileEditor steht in editorContext.ts.
 */
import { useMemo, useReducer, type ReactNode } from 'react'
import { EditorContext } from './editorContext.ts'
import { createInitialState, isDirty, profileReducer } from './profileReducer.ts'

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(profileReducer, undefined, () => createInitialState())
  const value = useMemo(() => ({ state, dispatch, dirty: isDirty(state) }), [state])
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
