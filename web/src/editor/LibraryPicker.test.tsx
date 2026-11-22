/*
 * Zweck: Tests der Bibliotheksauswahl im Editor (Issue #8).
 * Inhalt: Zuweisen einer Aktion an die gewählte Taste, Filter nach Programm, Suche und Hinweistext.
 */
import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { library } from '../library/library.ts'
import { ProfileProvider } from '../model/ProfileContext.tsx'
import { Editor } from './Editor.tsx'

async function setupWithKeySelected() {
  render(
    <MantineProvider>
      <ProfileProvider>
        <Editor />
      </ProfileProvider>
    </MantineProvider>,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Taste 1' }))
  return user
}

const firstGroup = library.groups[0]
const firstAction = firstGroup.actions[0]

describe('LibraryPicker', () => {
  it('assigns a library action to the selected key', async () => {
    const user = await setupWithKeySelected()

    await user.click(screen.getByRole('combobox', { name: 'Aus der Bibliothek wählen' }))
    await user.click(await screen.findByRole('option', { name: firstAction.label, hidden: true }))

    expect(screen.getByRole('button', { name: 'Taste 1' })).toHaveTextContent(firstAction.label)
    expect(screen.getByLabelText('Name')).toHaveValue(firstAction.label)
    expect(screen.getByText(new RegExp(firstAction.description))).toBeInTheDocument()
  })

  it('lists only the actions of the chosen program', async () => {
    const user = await setupWithKeySelected()
    const other = library.groups[1]

    await user.click(screen.getByRole('combobox', { name: 'Programm' }))
    await user.click(await screen.findByRole('option', { name: other.name, hidden: true }))
    await user.click(screen.getByRole('combobox', { name: 'Aus der Bibliothek wählen' }))

    expect(await screen.findByRole('option', { name: other.actions[0].label, hidden: true })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: firstAction.label, hidden: true })).not.toBeInTheDocument()
  })

  it('finds an action by typing part of its name', async () => {
    const user = await setupWithKeySelected()

    await user.type(screen.getByRole('combobox', { name: 'Aus der Bibliothek wählen' }), firstAction.label.slice(0, 4))

    expect(await screen.findByRole('option', { name: firstAction.label, hidden: true })).toBeInTheDocument()
  })

  it('says so when nothing matches', async () => {
    const user = await setupWithKeySelected()

    await user.type(screen.getByRole('combobox', { name: 'Aus der Bibliothek wählen' }), 'zzzzzz')

    expect(await screen.findByText('Keine passende Aktion')).toBeInTheDocument()
  })
})
