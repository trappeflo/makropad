# backend

Spring-Boot-Anwendung mit REST-API zur Sicherung und Wiederherstellung der Profile (H2-Datenbank).
Das Backend ist nicht an der Kommunikation mit dem Pad beteiligt. Rolle und Grenzen:
[ADR 0005](../docs/adr/0005-rolle-des-backends.md).

## Technik

Java 21, Spring Boot, Maven (Wrapper `mvnw`, keine Maven-Installation nötig), H2 als Datei.

## Bauen, testen, starten

Im Ordner `backend/`:

```
./mvnw test           # Tests
./mvnw spring-boot:run   # Anwendung starten (Port 8080)
```

Unter Windows in PowerShell `.\mvnw.cmd` statt `./mvnw`.

## API

Das Profil hat das Format aus [Protokoll v1](../docs/protokoll-v1.md), Abschnitt 4. Der Name ist der Schlüssel.
Das Backend prüft die Struktur, Grenzen des Pads (`device.info`) kennt es nicht.

| Methode und Pfad | Wirkung | Antworten |
|---|---|---|
| `GET /profiles` | Alle Profile, nach Name sortiert | 200 |
| `GET /profiles/{name}` | Ein Profil | 200, 404 |
| `POST /profiles` | Neues Profil anlegen | 201 mit `Location`, 400, 409 (Name vergeben) |
| `PUT /profiles/{name}` | Vorhandenes Profil ersetzen, Name im Profil muss dem Pfad entsprechen | 200, 400, 404 |
| `DELETE /profiles/{name}` | Profil löschen | 204, 404 |

Fehler kommen als Problem Details (RFC 9457, `application/problem+json`). Bei ungültigen Profilen listet
`errors` jede verletzte Regel mit Feldpfad.

Namen dürfen Buchstaben, Ziffern, Leerzeichen, `-` und `_` enthalten (max. 64 Zeichen).

## CORS

Die Web-App läuft auf einem anderen Port (Entwicklungsserver `http://localhost:5173`) und braucht deshalb eine
Freigabe, sonst blockiert der Browser die Antworten. Erlaubt ist nur die Herkunft aus
`makropad.cors.allowed-origins` in `application.properties`, nie jede. Mehrere Herkünfte werden durch Komma
getrennt. Läuft die Web-App unter einer anderen Adresse, muss sie dort eingetragen werden.

## Daten

Die Datenbank liegt als Datei in `backend/data/` (per `.gitignore` ausgeschlossen) und überlebt einen Neustart.
Ein Profil ist eine Zeile mit Name, JSON und Zeitstempel. Das Schema legt Hibernate selbst an.
Das Backend hat keine Anmeldung und ist für den lokalen Betrieb gedacht (ADR 0005).

## Stand

Profil-API mit Persistenz (#17, #18). CORS für die Web-App (#5). Die OpenAPI-Beschreibung (#19) folgt.
