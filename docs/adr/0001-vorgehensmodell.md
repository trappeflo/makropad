# ADR 0001: Vorgehensmodell

Status: akzeptiert, Datum 2026-11-10

## Kontext

Einzelprojekt mit ca. 6 Stunden pro Woche über 6 Wochen, ohne externe Frist. Die Anforderungen
(Konzept, Architektur, Tests, Dokumentation) sind weitgehend bekannt, der Aufwand der Firmware ist
unsicher. Der Prozess soll nachvollziehbar sein (Issues, Pull Requests, Reviews).

## Optionen

1. **Scrum:** Rollen, Planning, Daily, Review, Retro. Für eine Einzelperson fast nur Zeremonie, die Rollen fallen zusammen.
2. **Wasserfall:** Klare Phasen, aber Rückmeldung (z. B. Hardware-Verhalten) kommt zu spät.
3. **Reines Kanban:** Leichtgewichtig, aber ohne festen Rhythmus, bei fehlender Frist droht Versanden.
4. **Kanban mit einwöchigen Iterationen (gewählt):** Fluss mit WIP-Limit, dazu ein Wochenziel und ein kurzer Review.

## Entscheidung

Kanban mit einwöchigen Iterationen. Konzept und Architektur entstehen vorab (M1 und M2),
die Umsetzung läuft iterativ. Board-Spalten: Backlog, Ready, In Progress, Review, Done. WIP-Limit 2.
Wochenstart (ca. 10 Min.): Wochenziel festlegen. Wochenende (ca. 10 Min.): Review mit Soll-Ist der Stunden
und einer Anpassung, festgehalten im Prozess-Log.

**Definition of Done:** Code geschrieben, Tests grün, dokumentiert, PR gemergt, Issue geschlossen.

## Folgen

- Der Rhythmus gibt Struktur, ohne Scrum-Overhead.
- Die Wochenreviews liefern Material für Fortschrittsbericht und Reflexion.
- Hardware-Risiken werden früh durch einen Spike geklärt.
- Nachteil: Ohne Team entfällt der Nutzen von Teamabstimmung, der Selbstreview muss diszipliniert erfolgen.
