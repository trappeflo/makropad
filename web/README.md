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

## Backend für die Sicherung

Die Karte "Sicherung" spricht das Backend an (`backend/`, Port 8080, siehe [Backend-README](../backend/README.md)).
Ohne laufendes Backend bleibt der Rest der App benutzbar, nur Sichern und Laden melden dann, dass das Backend
nicht erreichbar ist. Die Adresse lässt sich beim Start überschreiben, Standard ist `http://localhost:8080`:

```
VITE_BACKEND_URL=http://localhost:8080 npm run dev
```

Das Backend erlaubt den Zugriff nur von der Herkunft der Web-App (CORS), siehe dort.

## Hinweis zu Windows

Schlägt `npm test` mit `Cannot read properties of undefined (reading 'config')` fehl, ist im Arbeitsverzeichnis
oft der Laufwerksbuchstabe klein geschrieben (`c:\...`). Vitest lädt sich dann doppelt. Abhilfe: das Terminal
im Verzeichnis mit großem Laufwerksbuchstaben (`C:\...`) öffnen, zum Beispiel in PowerShell mit `cd C:\...`.

## Stand

Profilmodell (#3), Editor (#4), Aktionsbibliothek (#8), Verbindung und Schreiben aufs Pad (#11, #12, #14, #80),
Sicherung im Backend (#5), Profil vom Pad laden (#83).
