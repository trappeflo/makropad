# web

React-Anwendung zum Bearbeiten der Profile und zum Übertragen auf das Pad (WebSerial, nur
Chromium-Browser wie Edge oder Chrome).

## Technik

React, TypeScript, Vite, Vitest mit Testing Library (jsdom), Lint mit oxlint. Voraussetzung ist Node.js
in einer aktuellen LTS-Version (mindestens 22.12).

## Befehle

Im Ordner `web/`:

```
npm install        # Abhängigkeiten installieren (einmalig)
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # Tests einmal ausführen
npm run test:watch # Tests bei jeder Änderung
npm run build      # Typprüfung und Produktionsbuild
npm run lint       # Lint
```

## Hinweis zu Windows

Schlägt `npm test` mit `Cannot read properties of undefined (reading 'config')` fehl, ist im Arbeitsverzeichnis
oft der Laufwerksbuchstabe klein geschrieben (`c:\...`). Vitest lädt sich dann doppelt. Abhilfe: das Terminal
im Verzeichnis mit großem Laufwerksbuchstaben (`C:\...`) öffnen, zum Beispiel in PowerShell mit `cd C:\...`.

## Stand

Gerüst mit Platzhalterseite und Test-Setup. Profilmodell (#3), Editor (#4), Backend-Anbindung (#5)
und WebSerial (#11) folgen.
