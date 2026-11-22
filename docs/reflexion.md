# Reflexion

**Entwurf, Zwischenstand (Issue #50).** Grundlage sind die Antworten des Autors im Interview vom 22.11.2026.
Es steht nur, was der Autor gesagt hat oder was im Repo belegt ist. Mit `[offen]` sind Stellen markiert, die
der Autor selbst füllt oder bestätigt. Die Formulierungen sind ein Vorschlag und vom Autor zu überarbeiten.
Stand der Projektzeit: KW 2 läuft, die Stunden sind noch nicht ausgewertet.

## 1. Zielerreichung

Maßstab sind die Ziele Z1 bis Z8 der [Projektdefinition](projektdefinition.md).

| Ziel | Stand laut Repo (Software) | Test am Pad | Einschätzung |
|---|---|---|---|
| Z1 Tasten senden Kombination oder Text | Firmware und Abspielen der Schritte umgesetzt | ausstehend (#20, #45) | `[offen]` |
| Z2 Zwei Profile, Wechsel per Drehregler | Wechsel per Druck auf den Drehregler umgesetzt (#27) | ausstehend (#25) | `[offen]` |
| Z3 Belegung ohne Neuflashen | Schreiben, Zurücklesen und Vergleichen, gegen den Mock getestet | ausstehend (#45) | `[offen]` |
| Z4 Belegung bleibt erhalten | Ablage im Flash umgesetzt (#30) | ausstehend (#28) | `[offen]` |
| Z5 Sichern und Wiederherstellen | Backend-API und Anbindung im Web gemergt, 52 Backend-Tests | nicht nötig | `[offen]` |
| Z6 Aktionsbibliothek (mindestens 3 Gruppen) | vorhanden und getestet | nicht nötig | `[offen]` |
| Z7 Qualität nachweisbar | 169 Web- und 52 Backend-Tests, Code dokumentiert, Teststrategie als Entwurf | nicht nötig | `[offen]` |
| Z8 Prozess nachvollziehbar | Issues, Pull Requests, Prozess-Log, KI-Nutzungsprotokoll | nicht nötig | `[offen]` |

Aussage des Autors: Mehr Themen als gedacht hängen von der Hardware ab. Deshalb müssen Planung und Lötarbeiten
bald abgeschlossen werden, damit die Ziele Z1 bis Z4 am Pad geprüft werden können. Bis dahin sind sie nur
softwareseitig umgesetzt, nicht belegt.

## 2. Soll und Ist

| Bereich | Soll | Ist |
|---|---|---|
| Stunden KW 1 | 5 h | ca. 15 h (geschätzt), siehe [Prozess-Log](prozess-log.md) |
| Stunden KW 2 bis 6 | laut Plan | `[offen]`, KW 2 läuft noch |
| Hardware | Prototyp laut Plan später | mehrere Iterationen im 3D-Druck, Löten dauert länger als gedacht, da der Autor darin noch wenig geübt ist |
| Umsetzungszeit | `[offen]` | höher als geplant (vom Autor bestätigt, Größe `[offen]`) |
| Funktionen | Wechsel per Drehregler (Z2), LED für das aktive Profil (R8) | Wechsel per Druck auf den Drehregler (R4), LED nur Could, Profilfarbe als ADR 0006 |

Als Abweichung nennt der Autor die Umsetzungszeit sowie Änderungen bei LED und Profilwechsel. Die genaue
Reihenfolge und die Gründe für den Profilwechsel per Druck stehen in den Anforderungen und im KI-Nutzungsprotokoll,
`[offen]`: der Autor ergänzt, warum Druck statt Drehen.

## 3. Lessons Learned

- **Hardware früher planen.** Aussage des Autors. Mehrere Iterationen im 3D-Druck und eine längere Lötzeit haben
  den Zeitplan belastet, weil viele Aufgaben auf funktionierende Hardware warten.
- **Review und Klärung der Anforderungen kosten viel Zeit.** Aussage des Autors: Hätte er den Code durchgehend
  selbst geschrieben, wäre dieser Aufwand vermutlich geringer ausgefallen. Vom Autor bestätigt. `[offen]`: ob sich der
  Aufwand am Ende trotzdem gelohnt hat.
- **Überraschungen.** `[offen]`, dem Autor fiel dazu bisher nichts ein.
- **Beste Entscheidung bisher.** `[offen]`, dem Autor fiel dazu bisher nichts ein. Kandidaten aus dem Repo, die der
  Autor bewerten kann: Mock des Geräts, ADRs vor der Umsetzung, Hardware-Spike.

## 4. Einsatz von KI

Rahmen ist [ADR 0002](adr/0002-ki-einsatzleitlinie.md), die Einträge stehen im [Nutzungsprotokoll](ki-nutzung.md).

- **Wo hat KI Zeit gespart oder gekostet?** Siehe Lessons Learned: Zeit ging vor allem in Review und die Klärung der
  Anforderungen. `[offen]`: wo genau KI Zeit gespart hat.
- **Eigene Entscheidungen gegen oder nach Vorschlägen der KI.** Belegt im Verlauf der Sitzung vom 11.11.2026
  (`[offen]`: der Autor wählt aus und ergänzt, was er geändert oder verworfen hat):
  - Eine Gerätekennung für die Sicherung wurde erwogen und auf Wunsch des Autors verworfen (ADR 0005).
  - Ein Betrieb des Backends auf dem eigenen Server in Docker wurde überlegt und zurückgestellt, alles bleibt lokal.
  - Das Schließen von Issue #33 wurde abgelehnt, stattdessen wurde die Priorität gesenkt.
  - Die Regel zum Dateikopf in `AGENTS.md` geht auf eine Vorgabe des Autors zurück.
