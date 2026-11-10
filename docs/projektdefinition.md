# Projektdefinition: Makropad mit Web-Konfiguration

Stand: 2026-11-10. Anonymisiert.

## 1. Problem

Wer häufig zwischen Aufgaben und Umgebungen wechselt (Studium, Arbeit, Videocalls, Freizeit), wiederholt
täglich dieselben Handgriffe: Kopieren und Einfügen, Videocall stummschalten, neuen Browsertab öffnen,
Programme starten, Texte wie die eigene E-Mail-Adresse eingeben. Viele Tastenkombinationen sind
unbekannt oder werden nur selten genutzt und müssen jedes Mal nachgeschlagen werden. Vorhandene
Lösungen (Skripte, herstellerspezifische Tools, Kurzbefehle) sind meist an ein System gebunden oder
erfordern Software, die im Hintergrund läuft.

Belegt durch zwei Nutzerinterviews (Persona A und B, 10.11.2026, siehe [Auswertung der Nutzerinterviews](auswertung-nutzerinterviews.md)).

## 2. Lösungsidee

Ein kleines USB-Tastenfeld (Makropad) mit Drehregler. Es meldet sich dem Rechner als Tastatur und
sendet beim Tastendruck eine hinterlegte Tastenkombination oder einen Text. Mehrere **Profile**
(z. B. Programmierung, Büro/Meeting) lassen sich per Drehregler wechseln. Die Belegung wird in einer
**Web-Anwendung** im Browser bearbeitet und auf das Pad geschrieben. Das Pad speichert sie selbst und
arbeitet danach ohne Browser und ohne Hintergrundprogramm. Ein **Backend** sichert die Profile.
Eine **Aktionsbibliothek** bietet typische Shortcuts pro Programm zur Auswahl, damit man sie nicht
suchen muss.

## 3. Nutzer und Nutzen

| Persona | Kontext | Nutzen |
|---|---|---|
| A (Alltag) | Studium, Notizen, Recherche, wechselnde Geräte | Shortcuts schnell erreichen, Profile je Aufgabe, weniger Suchen |
| B (Entwicklung) | Programmieren, Server, Videocalls, Büro | Verlässliche Tasten (z. B. Mute), wenige Handgriffe, Belegung im Gerät |

## 4. Ziele (messbar)

| ID | Ziel | Messkriterium |
|---|---|---|
| Z1 | Das Pad sendet bei Tastendruck die hinterlegte Tastenkombination oder den Text | Funktion mit 4 Tasten an einem Windows-11-Rechner demonstriert |
| Z2 | Zwei Profile, Wechsel per Drehregler | Profile Programmierung und Büro/Meeting wechselbar |
| Z3 | Belegung per Web-Anwendung ohne Neuflashen | Profil bearbeiten, aufs Pad schreiben, zurücklesen und vergleichen |
| Z4 | Belegung bleibt auf dem Pad erhalten | Nach Trennen und Neuverbinden unverändert (Fallback: nur im RAM) |
| Z5 | Profile werden gesichert und wiederhergestellt | Backend-API mit Tests |
| Z6 | Shortcuts sind auswählbar statt suchbar | Aktionsbibliothek mit typischen Aktionen für mindestens 3 Programmgruppen |
| Z7 | Qualität nachweisbar | Kernlogik von Backend, Web-App und Protokoll automatisiert getestet, Code dokumentiert |
| Z8 | Prozess nachvollziehbar | Änderungen über Issues und Pull Requests, Wochenreviews im Prozess-Log |

## 5. Scope und Abgrenzung

**Im Scope:** Web-Editor, Backend-Profil-API mit H2, minimale Firmware, Breadboard-Prototyp mit
4 Tasten und Drehregler, zwei Profile, Windows 11 mit Chromium-Browser (Edge oder Chrome).

**Nicht im Scope (Ausblick):** Gehäuse und Endaufbau, 9-Tasten-Layout, Versionierung, Nutzerkonten,
Vorlagen und Teilen von Profilen, Smart-Home-Aktionen, macOS und Linux, formaler Usability-Test,
Lang- und Doppeldruck, Lautstärke per Drehregler. Eine Status-LED ist nur ein Could.

## 6. Stakeholder

| Stakeholder | Rolle | Interesse / Einfluss |
|---|---|---|
| Projektautor | Konzeption, Umsetzung, Dokumentation | Lernziele, Bewertung, hoher Einfluss |
| Betreuende Lehrperson | Freigabe, Bewertung | Erfüllung der Aufgabenstellung, hoher Einfluss |
| Persona A, Persona B | Interviewte, spätere Testnutzer | Nutzen und Bedienbarkeit, mittlerer Einfluss (Anforderungen) |
| Nutzende Fachwelt (Ausblick) | Mögliche Weiterverwendung | gering |

## 7. Risiken

| ID | Risiko | Wahrsch. | Auswirkung | Gegenmaßnahme |
|---|---|---|---|---|
| R1 | Firmware (HID und serieller Kanal gleichzeitig, Flash) dauert länger als geplant | mittel | hoch | Früher Hardware-Spike, Fallback RAM statt Flash, Kürzungsreihenfolge im Plan |
| R2 | WebSerial nur in Chromium-Browsern | hoch | mittel | Ziel-Browser Edge/Chrome festlegen, Fehlermeldung in der UI, Demo als Video |
| R3 | Zeitbudget (ca. 6 h pro Woche) reicht nicht | mittel | hoch | Minimal-Scope, wöchentliches Soll-Ist, Kürzungsreihenfolge |
| R4 | Hardware-Probleme (Pinbelegung, Entprellen, defekte Teile) | mittel | mittel | Mehrere Boards vorhanden, Spike vorab |
| R5 | Mute-Zustand des Videocalls ist für das Pad nicht lesbar | hoch | niedrig | Nur umschalten, in der Reflexion benennen |
| R6 | Geheimnisse oder persönliche Daten gelangen in das öffentliche Repo | niedrig | hoch | Secret-Scan, `.gitignore`, Regeln zur Anonymisierung |
| R7 | KI-Code wird nicht verstanden oder ist fehlerhaft | mittel | mittel | KI-Leitlinie (ADR 0002), Selbstreview, Tests, Hardware-Test |
| R8 | Nur zwei Interviews, geringe Aussagekraft | hoch | niedrig | Einschränkung in der Reflexion nennen, informelles Feedback |

## 8. Ressourcen und Kosten

- **Zeit:** ca. 25 bis 30 Stunden Aufwand bei einem Budget von rund 36 Stunden (6 Wochen)
- **Hardware:** bereits vorhanden (ESP32-S3-Boards, Taster, Drehregler, Breadboard, Kabel). Zusätzliche Kosten: TODO (Preise aus dem Bestand eintragen, falls ausgewiesen werden soll)
- **Software:** React, Spring Boot, H2, PlatformIO, GitHub (öffentlich), alle kostenlos
- **KI-Unterstützung:** nach ADR 0002, auf hoher Ebene in der Präsentation offengelegt

## 9. Projektstrukturplan

```
Makropad
├─ 1 Projektmanagement
│  ├─ 1.1 Projektdefinition, Plan, Risiken
│  ├─ 1.2 Repo, Board, Templates, minimale CI
│  └─ 1.3 Vorgehensmodell, KI-Leitlinie, Wochenreviews
├─ 2 Konzept
│  ├─ 2.1 Anforderungen (Interviews)
│  ├─ 2.2 Architektur (C4) und Protokoll
│  └─ 2.3 Wireframes, Teststrategie
├─ 3 Umsetzung Software
│  ├─ 3.1 Backend (Profil-API, H2)
│  └─ 3.2 Web-App (Editor, Aktionsbibliothek, WebSerial)
├─ 4 Umsetzung Hardware und Firmware
│  ├─ 4.1 Breadboard-Prototyp
│  └─ 4.2 Firmware (Eingaben, HID, Konfigurationskanal, Flash)
├─ 5 Qualität
│  ├─ 5.1 Tests
│  └─ 5.2 Code-Dokumentation, Integration, Feedback
└─ 6 Präsentation
   ├─ 6.1 Demo-Video
   └─ 6.2 Folien, Reflexion, Probeaufnahme
```

## 10. Meilensteine

M1 Setup und Definition (22.11.), M2 Konzept und Durchstich (06.12.), M3 Firmware und Hardware (13.12.),
M4 MVP (20.12.), M5 Präsentation (27.12.2026). Details in [plan.md](plan.md).

## 11. Vorgehensmodell

Kanban mit einwöchigen Iterationen, siehe ADR 0001.
