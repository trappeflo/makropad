/*
 * Zweck: Test des Profil-Contexts (Issue #3).
 * Inhalt: Provider und Hook liefern Zustand und dirty-Wert, der Hook außerhalb des Providers wirft.
 */
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useProfileEditor } from './editorContext.ts'
import { ProfileProvider } from './ProfileContext.tsx'

const wrapper = ({ children }: { children: ReactNode }) => <ProfileProvider>{children}</ProfileProvider>

describe('useProfileEditor', () => {
  it('updates state and dirty via dispatch', () => {
    const { result } = renderHook(() => useProfileEditor(), { wrapper })
    expect(result.current.dirty).toBe(false)

    act(() => result.current.dispatch({ type: 'rename', name: 'Büro' }))

    expect(result.current.state.profile.name).toBe('Büro')
    expect(result.current.dirty).toBe(true)
  })

  it('throws outside of a provider', () => {
    expect(() => renderHook(() => useProfileEditor())).toThrow('ProfileProvider')
  })
})
