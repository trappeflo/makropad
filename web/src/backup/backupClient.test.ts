/*
 * Zweck: Tests des REST-Clients für die Sicherung (Issue #5).
 * Inhalt: Adressen, Methoden und Körper der Aufrufe, Kodierung des Namens in der Adresse, Antworten, Fehlerarten
 *         (nicht erreichbar, 404, 409, 400 mit Regeln, 5xx, kaputte Antwort). Die Gegenstelle ist ein
 *         simuliertes fetch.
 */
import { describe, expect, it, vi } from 'vitest'
import type { Profile } from '../model/profile.ts'
import { BackupClient, BackupError } from './backupClient.ts'

const PROFILE: Profile = {
  name: 'Büro 1',
  layout: 'de-DE',
  keys: [{ type: 'combo', label: 'Kopieren', intent: { keys: 'ctrl+c' }, steps: [{ mod: 1, key: 6 }] }, null],
}

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function clientAnswering(response: Response | Error) {
  const fetchFn = vi.fn(async (_url: string, _init: RequestInit) => {
    if (response instanceof Error) throw response
    return response
  })
  return { client: new BackupClient('http://backend:8080/', fetchFn as unknown as typeof fetch), fetchFn }
}

async function failure(promise: Promise<unknown>): Promise<BackupError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(BackupError)
  return error as BackupError
}

describe('BackupClient', () => {
  it('lists profiles', async () => {
    const { client, fetchFn } = clientAnswering(json(200, [PROFILE]))
    expect(await client.list()).toEqual([PROFILE])
    expect(fetchFn).toHaveBeenCalledWith('http://backend:8080/profiles', expect.objectContaining({ method: 'GET' }))
  })

  it('encodes the name in the address', async () => {
    const { client, fetchFn } = clientAnswering(json(200, PROFILE))
    await client.get('Büro 1')
    expect(fetchFn.mock.calls[0]?.[0]).toBe('http://backend:8080/profiles/B%C3%BCro%201')
  })

  it('creates with POST and a JSON body', async () => {
    const { client, fetchFn } = clientAnswering(json(201, PROFILE))
    expect(await client.create(PROFILE)).toEqual(PROFILE)
    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe('http://backend:8080/profiles')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(PROFILE)
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('updates with PUT under the old name', async () => {
    const { client, fetchFn } = clientAnswering(json(200, PROFILE))
    await client.update('Büro 1', PROFILE)
    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe('http://backend:8080/profiles/B%C3%BCro%201')
    expect(init.method).toBe('PUT')
  })

  it('removes with DELETE and accepts 204', async () => {
    const { client, fetchFn } = clientAnswering(new Response(null, { status: 204 }))
    await expect(client.remove('Büro 1')).resolves.toBeUndefined()
    expect(fetchFn.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' })
  })

  it('reports an unreachable backend', async () => {
    const { client } = clientAnswering(new TypeError('Failed to fetch'))
    expect((await failure(client.list())).kind).toBe('UNREACHABLE')
  })

  it('maps 404 to NOT_FOUND', async () => {
    const { client } = clientAnswering(json(404, { detail: 'Profil nicht gefunden' }))
    const error = await failure(client.get('x'))
    expect(error.kind).toBe('NOT_FOUND')
    expect(error.message).toBe('Profil nicht gefunden')
  })

  it('maps 409 to CONFLICT', async () => {
    const { client } = clientAnswering(json(409, { detail: 'Name vergeben' }))
    expect((await failure(client.create(PROFILE))).kind).toBe('CONFLICT')
  })

  it('maps 400 to INVALID and lists the broken rules', async () => {
    const { client } = clientAnswering(
      json(400, { detail: 'Profil ist ungültig', errors: [{ field: 'keys[0].steps', message: 'darf nicht leer sein' }] }),
    )
    const error = await failure(client.create(PROFILE))
    expect(error.kind).toBe('INVALID')
    expect(error.details).toEqual(['keys[0].steps: darf nicht leer sein'])
  })

  it('maps 500 to SERVER_ERROR even without a JSON body', async () => {
    const { client } = clientAnswering(new Response('boom', { status: 500 }))
    expect((await failure(client.list())).kind).toBe('SERVER_ERROR')
  })

  it('rejects an answer that is not a profile', async () => {
    const { client } = clientAnswering(json(200, { name: 'x' }))
    expect((await failure(client.get('x'))).kind).toBe('INVALID_RESPONSE')
  })

  it('rejects an answer that is not JSON', async () => {
    const { client } = clientAnswering(new Response('<html>', { status: 200 }))
    expect((await failure(client.list())).kind).toBe('INVALID_RESPONSE')
  })
})
