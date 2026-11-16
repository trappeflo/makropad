/*
 * Zweck: Tests der Editor-Oberfläche (Issue #4).
 * Inhalt: Raster aus der Tastenzahl, Auswahl einer Taste, Belegen mit Label und Typ, Drehknopf ohne Formular.
 */
import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ProfileProvider } from '../model/ProfileContext.tsx'
import { Editor } from './Editor.tsx'

function setup() {
  render(
    <MantineProvider>
      <ProfileProvider>
        <Editor />
      </ProfileProvider>
    </MantineProvider>,
  )
  return userEvent.setup()
}

describe('Editor', () => {
  it('shows four keys and the encoder for the default profile', () => {
    setup()
    expect(screen.getAllByRole('button', { name: /^Taste \d$/ })).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Drehknopf' })).toBeInTheDocument()
  })

  it('asks to select a key first', () => {
    setup()
    expect(screen.getByText('Wähle eine Taste, um sie zu belegen.')).toBeInTheDocument()
  })

  it('assigns a text action to the selected key and shows its label on the pad', async () => {
    const user = setup()

    await user.click(screen.getByRole('button', { name: 'Taste 2' }))
    await user.click(screen.getByText('Text'))
    await user.type(screen.getByLabelText('Name'), 'Status')
    await user.type(screen.getByRole('textbox', { name: 'Text' }), 'git status')

    expect(screen.getByRole('button', { name: 'Taste 2' })).toHaveTextContent('Status')
    expect(screen.getByRole('textbox', { name: 'Text' })).toHaveValue('git status')
  })

  it('clears a key again with "Nicht belegt"', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Taste 1' }))
    await user.click(screen.getByText('Tastenkombination'))
    await user.type(screen.getByLabelText('Name'), 'Undo')
    await user.click(screen.getByText('Nicht belegt'))

    expect(screen.getByRole('button', { name: 'Taste 1' })).toHaveTextContent('unbelegt')
  })

  it('shows only a hint for the encoder', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Drehknopf' }))
    expect(screen.getByText(/nichts zu belegen/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
  })
})
