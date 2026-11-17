/**
 * Wurzel der Anwendung: Mantine-Theme, Editor-Zustand, Verbindung zum Pad (#11) und die Editor-Oberfläche (#4).
 */
import { MantineProvider, Title } from '@mantine/core'
import { ConnectionBar } from './connection/ConnectionBar.tsx'
import { DeviceConnectionProvider } from './connection/DeviceConnection.tsx'
import { Editor } from './editor/Editor.tsx'
import { ProfileProvider } from './model/ProfileContext.tsx'

function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <DeviceConnectionProvider>
        <ProfileProvider>
          <main>
            <Title order={1}>Makropad</Title>
            <p>Editor für die Belegung des Makropads.</p>
            <ConnectionBar />
            <Editor />
          </main>
        </ProfileProvider>
      </DeviceConnectionProvider>
    </MantineProvider>
  )
}

export default App
