/**
 * Wurzel der Anwendung: Mantine-Theme, Editor-Zustand, Verbindung zum Pad (#11), Schreiben (#80), Sicherung im Backend (#5) und die Editor-Oberfläche (#4).
 */
import { MantineProvider, Title } from '@mantine/core'
import { BackupPanel } from './backup/BackupPanel.tsx'
import { ConnectionBar } from './connection/ConnectionBar.tsx'
import { DeviceConnectionProvider } from './connection/DeviceConnection.tsx'
import { Editor } from './editor/Editor.tsx'
import { WriteControls } from './editor/WriteControls.tsx'
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
            <WriteControls />
            <Editor />
            <BackupPanel />
          </main>
        </ProfileProvider>
      </DeviceConnectionProvider>
    </MantineProvider>
  )
}

export default App
