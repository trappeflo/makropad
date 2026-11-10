# Projektplan und Wochenplanung (Entwurf, 6 Wochen)

Stand: 10.11.2026. Alle Zahlen sind Schätzungen und werden in den Wochenreviews mit der Realität
abgeglichen. Soll-Plan hier, Ist-Werte im Prozess-Log.

## 1. Annahmen

- Zeitbudget: 2 Abende pro Woche à ca. 3 Stunden, also **ca. 6 Stunden pro Woche**
  (bei nur einem Abend sind es 3 Stunden, dann reicht der Plan nicht)
- Dauer: **6 Wochen**, Start Montag 16.11.2026, **Ende Sonntag 27.12.2026**
- Gesamtaufwand: ca. 25 bis 30 Stunden bei einem Budget von ca. 36. Der Rest ist Puffer, zusätzlich gilt die Kürzungsreihenfolge (Abschnitt 4)
- Keine Abgabefrist. Der Zieltermin ist selbst gesetzt, die letzte Woche fällt in die Weihnachtswoche
- KI-Unterstützung nach der Leitlinie vom 10.11. beschleunigt vor allem Firmware und Boilerplate

## 2. Umfang im Zeitrahmen (Minimal-Scope, Entscheidung vom 10.11.2026)

Kleiner, sauber getesteter und dokumentierter Durchstich. Schwerpunkt React und Spring Boot.

**Drin:**
- Web: Profil-Editor, Aktionsbibliothek (statische Liste), Verbinden per WebSerial, Profil aufs Pad schreiben
- Backend: Profil-API (REST) mit H2-Persistenz als Sicherung, Tests
- Firmware (KI-unterstützt): Tasten, Drehregler, USB-HID, Konfigurationskanal, Profile im Flash (Fallback RAM)
- Hardware: Breadboard mit 4 Tasten und Drehregler, zwei Profile (Programmierung, Büro/Meeting)
- Prozess schlank: Projektdefinition (1 bis 2 Seiten), PSP, 3 bis 4 ADRs, Backlog mit 17 Issues, Wochenreviews
- Tests, Code-Dokumentation, informelles Feedback von A und B, Demo-Video, Folien, Reflexion

**Raus (Ausblick):** Gehäuse, 9-Tasten-Layout, Versionierung, Nutzerkonten, Vorlagen, Lang- und
Doppeldruck, Lautstärke per Drehregler, Status-LED (Could), formaler Usability-Test, mehrere CI-Pipelines.

Geschätzter Aufwand: ca. 25 bis 30 Stunden, bei 6 Stunden pro Woche bleibt etwas Puffer.

## 3. Wochenplan (Soll)

| KW | Start | Meilenstein | Wochenziel | Issues | Ca. Std. |
|---|---|---|---|---|---|
| 1 | 16.11. | M1 | Projektdefinition, Vorgehensmodell, KI-Leitlinie, Repo mit Templates, Labels, Board | #1, #2, #3 | 5 |
| 2 | 23.11. | M2 | Anforderungen, Architektur, Protokoll v1, Wireframes, Hardware-Spike, minimale CI | #4 bis #8 | 6 |
| 3 | 30.11. | M2 | Backend-API mit Tests, Web-Editor mit Aktionsbibliothek | #9, #10 | 6 |
| 4 | 07.12. | M3 | Web-Verbindung gegen Mock, Prototyp, Firmware (Eingaben, HID, Konfigurationskanal, Flash) | #11 bis #14 | 6 |
| 5 | 14.12. | M4 | Integration, Doku, Feedback von A und B, Puffer für Firmware-Verzug | #15, #16 | 5 |
| 6 | 21.12. | M5 | Demo-Video, Folien, Reflexion, Probeaufnahme | #17 | 6 |

Meilensteine: M1 am 22.11., M2 am 06.12., M3 am 13.12., M4 am 20.12., M5 am 27.12.2026.

## 4. Kürzungsreihenfolge bei Verzug

Durchstich (Web, Backend, Pad mit zwei Profilen) und Aktionsbibliothek bleiben.

1. Profile im Flash auf "nur im RAM" reduzieren (Demo bleibt möglich)
2. Informelles Feedback streichen, nur in der Reflexion erwähnen
3. Minimale CI streichen (Tests lokal, Secret-Scan vor dem Push)
4. Backend-Sicherung auf Export und Import einer Datei reduzieren
5. Wireframes und C4 auf eine Seite zusammenfassen

Größtes Risiko: Firmware (WebSerial und HID gleichzeitig, Flash). Fallback: Demo mit Tastenkombination
und Profilwechsel am Pad, der Rest im Video mit Mock.

Jede Kürzung wird als Entscheidung im Prozess-Log mit Begründung festgehalten (Material für die Reflexion).

## 5. Wochenroutine (schlank)

- **Wochenstart (10 Min.):** Wochenziel festlegen, Issues nach "Ready" ziehen, WIP-Limit 2
- **Wochenende (10 Min.):** Wochenreview ins Prozess-Log, Stunden eintragen, eine Anpassung festlegen

## 6. Zeit-Log (Soll/Ist)

| KW | Soll (h) | Ist (h) | Ziel erreicht? | Abweichung / Grund |
|---|---|---|---|---|
| 1 | 5 | | | |
| 2 | 6 | | | |
| 3 | 6 | | | |
| 4 | 6 | | | |
| 5 | 5 | | | |
| 6 | 6 | | | |

## 7. Vorlage Wochenreview

```
### KW __ (Datum)
- Wochenziel:
- Erreicht? ja / teilweise / nein
- Stunden (Soll / Ist):
- Erledigte Issues:
- Probleme, Überraschungen:
- Was lief gut:
- Was ändere ich nächste Woche:
- Auswirkung auf Meilenstein / Plan:
```

## 8. Risiken für die Planung

- Firmware (WebSerial und HID gleichzeitig, Flash-Speicherung) ist schwer zu schätzen. Der Hardware-Spike in KW 2 senkt das Risiko.
- Bei 6 Stunden pro Woche ist ein ausgefallener Abend die halbe Wochenleistung. Der Puffer ist klein.
- Die letzte Woche fällt in die Weihnachtswoche. Bei Verzug verschiebt sich nur M5, alles andere sollte vorher stehen.
- Der Aufwand der Präsentation (Video, Probeaufnahme) wird leicht unterschätzt.
