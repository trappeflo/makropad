# Aktionsbibliothek

Statische Sammlung typischer Aktionen für die Tasten (Anforderung R10, Issue #7). Sie ist eine JSON-Datei ohne
Backend. Die Auswahl in der Oberfläche folgt in #8.

## Aufbau von `actions.json`

```
groups[]            Programmgruppen (Name eindeutig)
  name              z. B. "Browser"
  actions[]         Aktionen der Gruppe (Name eindeutig innerhalb der Gruppe)
    type            "combo" oder "text"
    label           Vorschlag für den Namen der Taste
    description     Erklärung für die Auswahl
    note            optional: Hinweis, z. B. gilt nur in einem Programm
    intent          bei "combo": { keys }, bei "text": { text, enter }
```

Ein Eintrag enthält nur die **Absicht** (`intent`), keine `steps`. Die Schritte für das Pad entstehen später aus
der Absicht (Schritte = f(Absicht), siehe [Protokoll v1](../../../docs/protokoll-v1.md)).

## Schreibweise der Tastenkombinationen

In `intent.keys` stehen die Tasten klein und mit `+` verbunden, z. B. `ctrl+shift+p`. Modifikatoren: `ctrl`,
`shift`, `alt`, `win`. Weitere Namen wie `f5`, `left` oder `tab` sind Tastennamen. Die Umrechnung in HID-Codes
legt fest, welche Namen erlaubt sind. Die Kürzel sind Standardkürzel für Windows und die genannten Programme
und noch nicht im Einzelnen in den Programmen geprüft.

Das Schema und die Prüfung stehen in `library.ts`, die Tests in `library.test.ts`.
