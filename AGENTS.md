# AGENTS.md: Regeln für KI-Assistenz in diesem Repo

Diese Datei gilt für jede KI-Session und jeden Anbieter (Claude, ChatGPT, Copilot, Gemini u. a.).
Lies sie vollständig, bevor du etwas änderst. Sie hat Vorrang vor allgemeinen Gewohnheiten.
Bei Konflikten gelten die ADRs in `docs/adr/`, vor allem [ADR 0002](docs/adr/0002-ki-einsatzleitlinie.md).

## 1. Projekt in Kürze

- **Was:** Makropad, ein USB-Tastenfeld mit Drehregler und Profilen. Konfiguration über eine
  Web-Anwendung, Sicherung der Profile über ein Backend. Details: [README](README.md),
  [Projektdefinition](docs/projektdefinition.md).
- **Kontext:** Prüfungsleistung (Projektpräsentation) im Modul "Projekt: Software Development". Es wird
  kein verkaufbares Produkt gebaut, sondern ein kleiner, sauber getesteter und dokumentierter Durchstich.
  Bewertet werden vor allem Projektdefinition, Prozess, Kreativität und Reflexion.
- **Schwerpunkt:** Web-Anwendung (React) und Backend (Spring Boot). Die Firmware ist minimal und darf
  überwiegend KI-erzeugt sein.
- **Zeitrahmen:** 6 Wochen, ca. 6 Stunden pro Woche. Plan, Wochenziele und Kürzungsreihenfolge:
  [docs/plan.md](docs/plan.md).

| Ordner | Inhalt | Technik |
|---|---|---|
| `web/` | Editor und Übertragung der Profile | React, Vite, Vitest, WebSerial |
| `backend/` | REST-API zur Sicherung der Profile | Spring Boot, H2, JUnit |
| `firmware/` | Firmware für das Pad | C++, ESP32-S3, PlatformIO (Arduino-Framework) |
| `docs/` | Projektdefinition, ADRs, Plan, Prozess-Log, KI-Protokoll | Markdown |

## 2. Scope: Was du nicht bauen sollst

Nicht im Scope sind: Gehäuse, 9-Tasten-Layout, Versionierung der Profile, Nutzerkonten, Vorlagen und
Teilen von Profilen, Smart-Home-Aktionen, macOS und Linux, Lang- und Doppeldruck, Lautstärke per
Drehregler. Eine Status-LED ist nur ein Could. Schlage keine Erweiterungen vor, die den Umfang
vergrößern. Wenn etwas fehlt oder unklar ist, frage nach, statt den Scope selbst zu erweitern.

Der Ziel-Browser ist Edge oder Chrome (WebSerial gibt es nur in Chromium-Browsern), das Ziel-System
Windows 11.

## 3. Arbeitsprozess

Vorgehen: Kanban mit einwöchigen Iterationen ([ADR 0001](docs/adr/0001-vorgehensmodell.md)), WIP-Limit 2.

1. **Jede Änderung hat ein Issue.** Gibt es keins, lege eines an (Vorlagen unter `.github/ISSUE_TEMPLATE/`).
   Stories (`type:story`) beschreiben Nutzen aus Nutzersicht, Tasks (`type:task`) sind kleine Aufgaben
   (höchstens ca. 1 Tag) und als Sub-Issue mit einer Story verknüpft. Weitere Typen: `type:spike`, `type:bug`.
   Labels: Bereich (`area:*`), Typ (`type:*`), Priorität (`prio:*`). Jedes Issue hat einen Meilenstein (M1 bis M5).
2. **Ein Branch pro Issue**, Namensschema `<bereich>/<issue-nr>-<kurzname>`, z. B. `web/12-profil-editor`,
   `docs/32-repo-geruest`.
3. **Nichts geht direkt auf `main`.** Jede Änderung läuft über einen Pull Request mit dem PR-Template.
   Der PR enthält `Closes #<Nr>`, das Feld "KI beteiligt?" ist ausgefüllt.
4. **Der Autor reviewt und merged selbst.** Als KI mergst du nie einen PR, auch nicht, wenn die CI grün ist.
5. **Definition of Done:** Code geschrieben, Tests grün, dokumentiert, PR gemergt, Issue geschlossen.
6. **Entscheidungen** mit Folgen für Architektur, Technik oder Vorgehen werden als ADR in `docs/adr/`
   festgehalten (Kontext, Optionen, Entscheidung, Folgen). Die Entscheidung trifft der Autor, du formulierst.
7. **Prozess-Log:** Wochenstand, Stunden und Abweichungen stehen in [docs/prozess-log.md](docs/prozess-log.md).
   Eintragen tut der Autor, du schlägst Formulierungen vor.

## 4. KI-Leitlinie (Kurzfassung, Details in ADR 0002)

Prinzip: **KI darf Code erzeugen, Entscheidungen und Verständnis bleiben beim Autor.**

| Bereich | Rolle der KI |
|---|---|
| Firmware (C++) | Darf den Großteil des Codes liefern. Autor gibt Anforderungen vor, reviewt und testet auf Hardware |
| Backend, Web-UI | Assistenz: Boilerplate, Tests, Refactoring, Erklärungen. Architektur, Datenmodell, Protokoll und Kernlogik entwirft der Autor selbst |
| Konzept, Architektur, Anforderungen, ADRs, Reflexion | Nur Sparring und Feedback, kein Ghostwriting. Entscheidungen und Begründungen formuliert der Autor |
| Folien und Vortrag | Nur Strukturfeedback |

Regeln für dich:
- Schreibe in Backend und Web nicht ungefragt Architektur oder Kernlogik. Mache Vorschläge, zeige Alternativen
  und lass den Autor entscheiden. Erkläre auf Nachfrage, wie dein Code funktioniert, damit der Autor ihn verstehen kann.
- Erzeuge keine ganzen Kapitel, Reflexionstexte oder ADR-Entscheidungen ohne Vorgabe des Autors.
- Erfinde keine Literaturangaben, Quellen, Messwerte oder Testergebnisse. Behaupte nie, etwas getestet zu haben,
  das du nicht ausgeführt hast. Melde Fehlschläge ehrlich.
- Halte dich an den Stil des vorhandenen Codes und der Doku. Keine neuen Abhängigkeiten ohne Rücksprache.

Nachweis der Eigenleistung:
- Trage jede KI-Beteiligung in [docs/ki-nutzung.md](docs/ki-nutzung.md) ein (Datum, Aufgabe, Bereich, Zweck).
  Die Spalte "Was ich geändert oder verworfen habe" füllt der Autor nach seinem Review.
- Commits mit wesentlicher KI-Beteiligung enthalten eine `Co-Authored-By`-Zeile für das genutzte Modell,
  zum Beispiel `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Keine Prompts ins Repo übernehmen.

## 5. Harte Grenzen (nie ohne ausdrückliche Anweisung)

- Kein Merge, kein Force-Push, kein Push auf `main`, keine Änderung der Repo-Sichtbarkeit oder
  Branch-Schutz-Einstellungen, kein Löschen von Repos, Branches mit offenen PRs oder Issues.
- Keine Historie umschreiben.
- Keine Inhalte nach außen senden (Issues, Kommentare, PRs), die der Autor nicht gesehen hat, wenn sie
  über das beauftragte Issue hinausgehen.

## 6. Datenschutz und Anonymisierung

Das Repo wird öffentlich. Es gelten die Regeln der Prüfungsleistung zur Anonymisierung.

- Keine Namen von Personen oder Organisationen (Betreuende, Interviewte, Arbeitgeber). Verwende Rollen und
  Personas ("Persona A", "Betreuende Lehrperson").
- Keine Zugangsdaten, Tokens, E-Mail-Adressen, lokalen Pfade oder privaten Notizen, weder im Code noch in Issues,
  Kommentaren, Commit-Nachrichten oder Prompts.
- Rohnotizen der Nutzerinterviews gehören nicht ins Repo, nur die anonymisierte Auswertung.
- Commits laufen mit der GitHub-noreply-Adresse des Autors.
- Bevor du etwas committest: Prüfe die Änderung auf die obigen Punkte.

## 7. Qualität

- Tests für Kernfunktionen: Vitest (Web), JUnit (Backend), Mock des Geräts für die Web-Anwendung.
  Kein automatisierter Hardware-Test.
- Code-Dokumentation: Javadoc und OpenAPI (Backend), TSDoc (Web), Kommentare zum Protokoll.
- Das Protokoll zwischen Web und Pad ist versioniert (Protokoll v1), Änderungen daran erst als ADR.
- Kleine, fokussierte Commits mit aussagekräftigen deutschen Nachrichten, ein Thema pro PR.

## 8. Sprache

Dokumentation, Issues, PRs und Commit-Nachrichten sind auf Deutsch. Code-Bezeichner und
Code-Kommentare sind auf Englisch.

## 9. Frische Session: so steigst du ein

1. Lies diese Datei, die [README](README.md), [docs/plan.md](docs/plan.md) und die ADRs in `docs/adr/`.
2. Schau in die offenen Issues des aktuellen Meilensteins und auf das Project Board
   (Spalten: Backlog, Ready, In Progress, Review, Done). Das aktuelle Wochenziel steht in `docs/prozess-log.md`.
3. Arbeite nur an Issues, die der Autor dir nennt. Frage nach, wenn mehrere in Frage kommen.
4. Halte am Ende fest, was du getan hast (Eintrag in `docs/ki-nutzung.md` vorschlagen, PR-Beschreibung) und
   was offen geblieben ist.
