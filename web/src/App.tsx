/**
 * Wurzel der Anwendung: Mantine-Theme, Editor-Zustand und die Editor-Oberfläche (#4).
 * Die Verbindung zum Pad (#11) folgt später.
 */
import { MantineProvider, Title } from '@mantine/core'
import { Editor } from './editor/Editor.tsx'
import { ProfileProvider } from './model/ProfileContext.tsx'

function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <ProfileProvider>
        <main>
          <Title order={1}>Makropad</Title>
          <p>Editor für die Belegung des Makropads.</p>
          <Editor />
        </main>
      </ProfileProvider>
    </MantineProvider>
  )
}

export default App
