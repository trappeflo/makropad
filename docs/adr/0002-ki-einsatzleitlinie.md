# ADR 0002: KI-Einsatzleitlinie

Status: akzeptiert, Datum 2026-11-10

## Kontext

Der KI-Einsatz ist bei diesem Projekt erlaubt, vor allem für die C++-Firmware, und wird in der
Präsentation auf hoher Ebene offengelegt. Der Schwerpunkt der Arbeit (React, Spring Boot) soll
nachweislich eigene Leistung sein.

## Entscheidung

Prinzip: **KI darf Code erzeugen, Entscheidungen und Verständnis bleiben beim Autor.**

| Bereich | Rolle der KI | Regel |
|---|---|---|
| Firmware (C++) | Darf den Großteil des Codes liefern | Anforderungen vorgeben, reviewen, auf Hardware testen |
| Backend, Web-UI | Assistenz: Boilerplate, Tests, Refactoring, Erklärungen | Architektur, Datenmodell, Protokoll und Kernlogik selbst entwerfen |
| Konzept, Architektur, Anforderungen, ADRs, Reflexion | Nur Sparring und Feedback | Entscheidungen und Begründungen selbst formulieren |
| Folien und Vortrag | Nur Strukturfeedback | Formulierung und Vortrag selbst |

Gemeinsame Regeln:
- Kein Code in `main`, der nicht in eigenen Worten erklärt werden kann.
- Jeder Pull Request wird selbst reviewt (Checkliste).
- Keine persönlichen Daten, Zugangsdaten oder private Notizen in Prompts, Issues oder im Repo.
- Literaturangaben werden nie ungeprüft von der KI übernommen.

Belege der Eigenleistung:
- ADRs mit Alternativen, selbst geschriebene Issues, Akzeptanzkriterien und Wochenreviews
- Pull-Request-Historie mit Review-Korrekturen
- KI-Nutzungsprotokoll `docs/ki-nutzung.md`: je Aufgabe Bereich, Zweck, was geändert oder verworfen wurde (keine Prompts)
- `Co-Authored-By` in Commits mit wesentlicher KI-Beteiligung
- Selbst geschriebene oder reviewte Tests, Hardware-Nachweis, erklärte Code-Auszüge in der Präsentation

## Folgen

- Die KI-Nutzung ist nachvollziehbar und lässt sich in der Präsentation in einer Folie darstellen.
- Mehraufwand: ein kurzer Protokolleintrag pro Aufgabe und ein Feld im PR-Template.
