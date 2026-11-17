/*
 * Zweck: Oberfläche zum Sichern und Wiederherstellen von Profilen im Backend (Issue #5, ADR 0005).
 * Inhalt: Komponente BackupPanel. Button "Sichern" (zuerst POST, bei vergebenem Namen Rückfrage und dann PUT),
 *         Liste der gesicherten Profile mit "Laden" und "Löschen". Laden mit ungespeicherten Änderungen und
 *         Löschen fragen vorher nach. Fehler werden auf Deutsch erklärt. Die Komponente braucht kein Pad und
 *         bleibt bei nicht erreichbarem Backend benutzbar, nur die Aktionen melden dann den Fehler.
 */
import { Alert, Button, Card, Group, List, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useProfileEditor } from '../model/editorContext.ts'
import { profileNameError, type Profile } from '../model/profile.ts'
import { BackupClient, BackupError } from './backupClient.ts'

/** One client for the app. Tests pass their own through the `client` prop. */
const defaultClient = new BackupClient()

/** What the user has to confirm before it happens. */
type Pending =
  | { kind: 'overwrite' }
  | { kind: 'load'; profile: Profile }
  | { kind: 'delete'; name: string }

interface Problem {
  message: string
  details: string[]
}

function describe(error: unknown): Problem {
  if (!(error instanceof BackupError)) return { message: 'Unerwarteter Fehler.', details: [] }
  switch (error.kind) {
    case 'UNREACHABLE':
      return { message: 'Das Backend ist nicht erreichbar. Läuft es auf diesem Rechner?', details: [] }
    case 'NOT_FOUND':
      return { message: 'Das Profil gibt es im Backend nicht (mehr).', details: [] }
    case 'CONFLICT':
      return { message: 'Der Name ist im Backend schon vergeben.', details: [] }
    case 'INVALID':
      return { message: 'Das Backend lehnt das Profil ab.', details: error.details }
    case 'SERVER_ERROR':
      return { message: 'Das Backend meldet einen Fehler.', details: [] }
    case 'INVALID_RESPONSE':
      return { message: 'Die Antwort des Backends ist unbrauchbar.', details: [] }
  }
}

export function BackupPanel({ client = defaultClient }: { client?: BackupClient }) {
  const { state, dispatch, dirty } = useProfileEditor()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  /** Loads the list for the "Aktualisieren" button. A failure replaces the list by the explanation. */
  async function refresh() {
    setProblem(null)
    try {
      setProfiles(await client.list())
    } catch (error) {
      setProfiles(null)
      setProblem(describe(error))
    }
  }

  // First load. The effect only reacts to the answer, it does not set state on its own.
  useEffect(() => {
    let active = true
    client.list().then(
      (list) => active && setProfiles(list),
      (error: unknown) => active && setProblem(describe(error)),
    )
    return () => {
      active = false
    }
  }, [client])

  /**
   * Runs one action. The list is reloaded before the result is shown, so a reload cannot wipe the message.
   * The action returns the success message, or null if it only opened a question.
   */
  async function perform(action: () => Promise<string | null>) {
    setBusy(true)
    setPending(null)
    setNotice(null)
    setProblem(null)
    let result: { notice: string | null } | { problem: Problem }
    try {
      result = { notice: await action() }
    } catch (error) {
      result = { problem: describe(error) }
    }
    try {
      setProfiles(await client.list())
    } catch (error) {
      setProfiles(null)
      if ('notice' in result) result = { problem: describe(error) }
    }
    if ('notice' in result) setNotice(result.notice)
    else setProblem(result.problem)
    setBusy(false)
  }

  const profile = state.profile
  const nameError = profileNameError(profile.name)

  async function save(overwrite: boolean) {
    await perform(async () => {
      if (overwrite) {
        await client.update(profile.name, profile)
      } else {
        try {
          await client.create(profile)
        } catch (error) {
          if (error instanceof BackupError && error.kind === 'CONFLICT') {
            setPending({ kind: 'overwrite' })
            return null
          }
          throw error
        }
      }
      dispatch({ type: 'markSaved' })
      return `„${profile.name}“ ist gesichert.`
    })
  }

  function load(chosen: Profile) {
    dispatch({ type: 'load', profile: chosen })
    setPending(null)
    setNotice(`„${chosen.name}“ ist geladen.`)
    setProblem(null)
  }

  return (
    <Card withBorder aria-label="Sicherung">
      <Stack gap="sm">
        <Title order={2} size="h4">
          Sicherung
        </Title>

        <Group>
          <Button onClick={() => save(false)} loading={busy} disabled={pending !== null || nameError !== null}>
            Profil sichern
          </Button>
          <Button variant="default" onClick={refresh} disabled={busy}>
            Aktualisieren
          </Button>
        </Group>
        {nameError !== null && (
          <Text size="sm" c="red">
            Profilname ungültig: {nameError}
          </Text>
        )}

        {pending?.kind === 'overwrite' && (
          <Alert color="yellow" title="Name ist vergeben">
            <Stack gap="xs">
              <Text size="sm">Im Backend gibt es schon ein Profil „{profile.name}“. Es wird ersetzt.</Text>
              <Group>
                <Button color="red" size="xs" onClick={() => save(true)}>
                  Überschreiben
                </Button>
                <Button variant="default" size="xs" onClick={() => setPending(null)}>
                  Abbrechen
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}

        {pending?.kind === 'load' && (
          <Alert color="yellow" title="Ungespeicherte Änderungen">
            <Stack gap="xs">
              <Text size="sm">
                Das Profil „{profile.name}“ hat Änderungen, die nicht gesichert sind. Sie gehen beim Laden verloren.
              </Text>
              <Group>
                <Button color="red" size="xs" onClick={() => load(pending.profile)}>
                  Trotzdem laden
                </Button>
                <Button variant="default" size="xs" onClick={() => setPending(null)}>
                  Abbrechen
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}

        {pending?.kind === 'delete' && (
          <Alert color="yellow" title="Sicherung löschen?">
            <Stack gap="xs">
              <Text size="sm">„{pending.name}“ wird aus dem Backend gelöscht. Das lässt sich nicht rückgängig machen.</Text>
              <Group>
                <Button
                  color="red"
                  size="xs"
                  onClick={() => perform(async () => {
                    await client.remove(pending.name)
                    return `„${pending.name}“ ist gelöscht.`
                  })}
                >
                  Löschen
                </Button>
                <Button variant="default" size="xs" onClick={() => setPending(null)}>
                  Abbrechen
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}

        {notice !== null && <Alert color="green">{notice}</Alert>}

        {problem !== null && (
          <Alert color="red" title={problem.message}>
            {problem.details.length > 0 && (
              <List size="sm">
                {problem.details.map((detail) => (
                  <List.Item key={detail}>{detail}</List.Item>
                ))}
              </List>
            )}
          </Alert>
        )}

        {profiles !== null &&
          (profiles.length === 0 ? (
            <Text size="sm" c="dimmed">
              Noch nichts gesichert.
            </Text>
          ) : (
            <Stack gap="xs" component="ul" m={0} p={0} style={{ listStyle: 'none' }} aria-label="Gesicherte Profile">
              {profiles.map((saved) => (
                <Group key={saved.name} component="li" justify="space-between">
                  <Text>{saved.name}</Text>
                  <Group gap="xs">
                    <Button
                      variant="default"
                      size="xs"
                      aria-label={`${saved.name} laden`}
                      disabled={busy}
                      onClick={() => (dirty ? setPending({ kind: 'load', profile: saved }) : load(saved))}
                    >
                      Laden
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      aria-label={`${saved.name} löschen`}
                      disabled={busy}
                      onClick={() => setPending({ kind: 'delete', name: saved.name })}
                    >
                      Löschen
                    </Button>
                  </Group>
                </Group>
              ))}
            </Stack>
          ))}
      </Stack>
    </Card>
  )
}
