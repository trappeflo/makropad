/*
 * Zweck: Tests der Sicherungs-Oberfläche (Issue #5).
 * Inhalt: Liste, Sichern (neu und bei vergebenem Namen mit Rückfrage), Laden (mit Rückfrage bei ungespeicherten
 *         Änderungen), Löschen mit Rückfrage, gesperrter Button bei ungültigem Namen, nicht erreichbares Backend
 *         und Ablehnung durch das Backend. Die Gegenstelle ist ein simuliertes Backend mit den Regeln des echten.
 */
import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useProfileEditor } from '../model/editorContext.ts'
import { ProfileProvider } from '../model/ProfileContext.tsx'
import type { Profile } from '../model/profile.ts'
import { Editor } from '../editor/Editor.tsx'
import { BackupClient } from './backupClient.ts'
import { BackupPanel } from './BackupPanel.tsx'

const STORED: Profile = {
  name: 'Programmierung',
  layout: 'de-DE',
  keys: [{ type: 'combo', label: 'Kopieren', intent: { keys: 'ctrl+c' }, steps: [{ mod: 1, key: 6 }] }, null, null, null],
}

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** A backend in memory that follows the rules of the real one. */
function fakeBackend(initial: Profile[] = []) {
  const stored = new Map(initial.map((p) => [p.name, p]))
  const calls: string[] = []
  let down = false
  let reject: string[] | null = null

  const fetchFn = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (down) throw new TypeError('Failed to fetch')
    const method = init?.method ?? 'GET'
    const name = decodeURIComponent(String(url).replace(/^.*\/profiles\/?/, ''))
    calls.push(`${method} ${name}`.trim())
    const body = init?.body === undefined ? undefined : (JSON.parse(init.body as string) as Profile)
    if (method === 'GET' && name === '') return json(200, [...stored.values()].sort((a, b) => a.name.localeCompare(b.name)))
    if (method === 'GET') return stored.has(name) ? json(200, stored.get(name)) : json(404, { detail: 'nicht gefunden' })
    if (method === 'POST' && body !== undefined) {
      if (reject !== null) return json(400, { detail: 'Profil ist ungültig', errors: reject.map((m) => ({ field: 'keys', message: m })) })
      if (stored.has(body.name)) return json(409, { detail: 'Name vergeben' })
      stored.set(body.name, body)
      return json(201, body)
    }
    if (method === 'PUT' && body !== undefined) {
      if (!stored.has(name)) return json(404, { detail: 'nicht gefunden' })
      stored.set(name, body)
      return json(200, body)
    }
    if (method === 'DELETE') {
      if (!stored.has(name)) return json(404, { detail: 'nicht gefunden' })
      stored.delete(name)
      return new Response(null, { status: 204 })
    }
    return json(500)
  }

  return {
    client: new BackupClient('http://backend', fetchFn as typeof fetch),
    stored,
    calls,
    goDown: () => {
      down = true
    },
    rejectWith: (messages: string[]) => {
      reject = messages
    },
  }
}

function Dirty() {
  const { state, dirty } = useProfileEditor()
  return (
    <p>
      {state.profile.name}: {dirty ? 'ungespeichert' : 'gespeichert'}
    </p>
  )
}

function setup(backend = fakeBackend()) {
  render(
    <MantineProvider>
      <ProfileProvider>
        <Editor />
        <BackupPanel client={backend.client} />
        <Dirty />
      </ProfileProvider>
    </MantineProvider>,
  )
  return { user: userEvent.setup(), backend }
}

async function rename(user: ReturnType<typeof userEvent.setup>, name: string) {
  const field = screen.getByRole('textbox', { name: 'Profilname' })
  await user.clear(field)
  await user.type(field, name)
}

describe('BackupPanel', () => {
  it('lists the backed up profiles', async () => {
    setup(fakeBackend([STORED]))
    expect(await screen.findByText('Programmierung')).toBeInTheDocument()
  })

  it('says so when nothing is backed up', async () => {
    setup()
    expect(await screen.findByText('Noch nichts gesichert.')).toBeInTheDocument()
  })

  it('backs up the profile, lists it and marks the editor as saved', async () => {
    const { user, backend } = setup()
    await screen.findByText('Noch nichts gesichert.')
    await rename(user, 'Neu')
    expect(screen.getByText('Neu: ungespeichert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Profil sichern' }))

    expect(await screen.findByText('„Neu“ ist gesichert.')).toBeInTheDocument()
    expect(backend.stored.has('Neu')).toBe(true)
    expect(await screen.findByRole('list', { name: 'Gesicherte Profile' })).toHaveTextContent('Neu')
    expect(screen.getByText('Neu: gespeichert')).toBeInTheDocument()
  })

  it('asks before replacing a backup with the same name, then replaces it', async () => {
    const { user, backend } = setup(fakeBackend([{ ...STORED, name: 'Neues Profil' }]))
    await screen.findByText('Neues Profil', { selector: 'p' })

    await user.click(screen.getByRole('button', { name: 'Profil sichern' }))
    expect(await screen.findByText('Name ist vergeben')).toBeInTheDocument()
    expect(backend.calls).not.toContain('PUT Neues Profil')

    await user.click(screen.getByRole('button', { name: 'Überschreiben' }))
    expect(await screen.findByText('„Neues Profil“ ist gesichert.')).toBeInTheDocument()
    expect(backend.calls).toContain('PUT Neues Profil')
    expect(backend.stored.get('Neues Profil')?.keys[0]).toBeNull()
  })

  it('leaves the backup alone when the user cancels the overwrite', async () => {
    const { user, backend } = setup(fakeBackend([{ ...STORED, name: 'Neues Profil' }]))
    await screen.findByText('Neues Profil', { selector: 'p' })
    await user.click(screen.getByRole('button', { name: 'Profil sichern' }))
    await user.click(await screen.findByRole('button', { name: 'Abbrechen' }))

    expect(screen.queryByText('Name ist vergeben')).not.toBeInTheDocument()
    expect(backend.stored.get('Neues Profil')?.keys[0]).not.toBeNull()
  })

  it('blocks backing up under an invalid name', async () => {
    const { user } = setup()
    await screen.findByText('Noch nichts gesichert.')
    await rename(user, 'a/b')
    expect(screen.getByRole('button', { name: 'Profil sichern' })).toBeDisabled()
    expect(screen.getByText(/Profilname ungültig/)).toBeInTheDocument()
  })

  it('loads a backup into a clean editor without asking', async () => {
    const { user } = setup(fakeBackend([STORED]))
    await user.click(await screen.findByRole('button', { name: 'Programmierung laden' }))
    expect(screen.getByText('Programmierung: gespeichert')).toBeInTheDocument()
    expect(screen.getByText('„Programmierung“ ist geladen.')).toBeInTheDocument()
  })

  it('asks before loading over unsaved changes', async () => {
    const { user } = setup(fakeBackend([STORED]))
    await screen.findByText('Programmierung')
    await rename(user, 'Entwurf')

    await user.click(screen.getByRole('button', { name: 'Programmierung laden' }))
    expect(screen.getByText('Ungespeicherte Änderungen')).toBeInTheDocument()
    expect(screen.getByText('Entwurf: ungespeichert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Trotzdem laden' }))
    expect(screen.getByText('Programmierung: gespeichert')).toBeInTheDocument()
  })

  it('keeps the unsaved changes when the user cancels loading', async () => {
    const { user } = setup(fakeBackend([STORED]))
    await screen.findByText('Programmierung')
    await rename(user, 'Entwurf')
    await user.click(screen.getByRole('button', { name: 'Programmierung laden' }))
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.getByText('Entwurf: ungespeichert')).toBeInTheDocument()
  })

  it('deletes a backup only after confirmation', async () => {
    const { user, backend } = setup(fakeBackend([STORED]))
    await user.click(await screen.findByRole('button', { name: 'Programmierung löschen' }))
    expect(backend.stored.has('Programmierung')).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(await screen.findByText('„Programmierung“ ist gelöscht.')).toBeInTheDocument()
    expect(backend.stored.has('Programmierung')).toBe(false)
    expect(await screen.findByText('Noch nichts gesichert.')).toBeInTheDocument()
  })

  it('explains an unreachable backend and stays usable', async () => {
    const backend = fakeBackend()
    backend.goDown()
    const { user } = setup(backend)
    expect(await screen.findByText(/Das Backend ist nicht erreichbar/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Profil sichern' }))
    expect(await screen.findAllByText(/Das Backend ist nicht erreichbar/)).not.toHaveLength(0)
    expect(screen.getByRole('textbox', { name: 'Profilname' })).toBeEnabled()
  })

  it('shows the rules the backend rejects a profile for', async () => {
    const backend = fakeBackend()
    backend.rejectWith(['darf nicht leer sein'])
    const { user } = setup(backend)
    await screen.findByText('Noch nichts gesichert.')
    await user.click(screen.getByRole('button', { name: 'Profil sichern' }))
    expect(await screen.findByText('Das Backend lehnt das Profil ab.')).toBeInTheDocument()
    expect(screen.getByText('keys: darf nicht leer sein')).toBeInTheDocument()
  })
})
