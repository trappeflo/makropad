# Protokoll v1 (Entwurf)

Stand: 2026-11-11. Schnittstelle zwischen Web-Anwendung und Pad über den seriellen Kanal
(WebSerial, siehe [ADR 0004](adr/0004-webserial-statt-webhid.md)). Grundlage für den Protokoll-Client (#12),
den Mock des Geräts (#13) und den Handler in der Firmware (#29).

## 1. Grundregeln

- **Kodierung:** Eine Nachricht ist ein JSON-Objekt in UTF-8, abgeschlossen durch einen Zeilenumbruch (`\n`).
  Innerhalb einer Nachricht kommt kein Zeilenumbruch vor.
- **Ablauf:** Nur die Web-App sendet Anfragen. Das Pad antwortet auf jede Anfrage genau einmal mit
  derselben `id`. Das Pad sendet nie von sich aus.
- **Version:** Jede Nachricht trägt `"v": 1`. Zusätzlich liefert `device.info` die unterstützte Version, die
  Web-App bricht bei Abweichung mit einer klaren Meldung ab.
- **IDs:** `id` ist eine ganze Zahl, die die Web-App je Anfrage hochzählt.
- **Prüfung:** Nach dem Schreiben liest die Web-App das Profil zurück und vergleicht es (Anforderung R7).
- **Speichern:** `profile.set` speichert sofort und atomar. Bei einem Fehler bleibt das alte Profil unverändert.

## 2. Nachrichtenformate

Anfrage:

```json
{"v":1,"id":7,"cmd":"profile.get","index":0}
```

Erfolgsantwort:

```json
{"v":1,"id":7,"ok":true, ... }
```

Fehlerantwort:

```json
{"v":1,"id":7,"ok":false,"error":{"code":"OUT_OF_RANGE","message":"index 5"}}
```

## 3. Befehle

### `device.info`

Anfrage: `{"v":1,"id":1,"cmd":"device.info"}`

Antwort:

```json
{"v":1,"id":1,"ok":true,
 "protocol":1,"firmware":"0.1.0",
 "keys":4,"profiles":2,"activeProfile":0,
 "persistent":true,
 "limits":{"maxSteps":32,"maxMessageBytes":4096}}
```

| Feld | Bedeutung |
|---|---|
| `protocol` | Vom Pad unterstützte Protokollversion |
| `firmware` | Firmware-Version (Text) |
| `keys` | Anzahl Tasten (MVP: 4, später 9) |
| `profiles` | Anzahl Profil-Slots (MVP: 2) |
| `activeProfile` | Index des aktuell aktiven Profils |
| `persistent` | `true` = Profile im Flash, `false` = nur im RAM (Fallback) |
| `limits` | Grenzen für Schritte je Taste und Nachrichtengröße in Bytes |

### `profile.get`

Anfrage: `{"v":1,"id":2,"cmd":"profile.get","index":0}`

Antwort: `{"v":1,"id":2,"ok":true,"profile":{ ... }}` mit einem Profil nach Abschnitt 4.
Ein nie beschriebener Slot liefert ein leeres Profil (`name` leer, alle Tasten `null`).

### `profile.set`

Anfrage: `{"v":1,"id":3,"cmd":"profile.set","index":0,"profile":{ ... }}`

Antwort: `{"v":1,"id":3,"ok":true}`

Das Pad prüft das Profil vollständig, bevor es etwas speichert (Index, Tastenzahl, Grenzen).

### `profile.activate`

Anfrage: `{"v":1,"id":4,"cmd":"profile.activate","index":1}`

Antwort: `{"v":1,"id":4,"ok":true,"activeProfile":1}`

Schaltet das aktive Profil um, wie ein Druck auf den Drehregler. Das aktive Profil wird nicht dauerhaft
gespeichert, nach dem Einstecken ist wieder Profil 0 aktiv. (Annahme, siehe offene Punkte.)

## 4. Profil

```json
{
  "name": "Programmierung",
  "layout": "de-DE",
  "keys": [
    {
      "type": "combo",
      "label": "Befehlspalette",
      "intent": {"keys": "ctrl+shift+p"},
      "steps": [{"mod": 3, "key": 19}]
    },
    {
      "type": "text",
      "label": "git status",
      "intent": {"text": "git status", "enter": true},
      "steps": [{"mod": 0, "key": 10}, "..."]
    },
    null,
    null
  ]
}
```

- `keys` hat genau so viele Einträge wie `keys` in `device.info`. Eine unbelegte Taste ist `null`.
- `layout`: im MVP immer `"de-DE"`. Die Web-App rechnet Text für dieses Layout in Schritte um.
- `type`: `combo`, `text` oder `macro`. Nur für die Anzeige in der UI.
- `label`: frei wählbarer Name der Taste.
- `intent`: die Absicht aus Sicht der Nutzerin. Das Pad speichert sie und liefert sie beim Lesen unverändert
  zurück, **wertet sie aber nie aus**.
- `steps`: **maßgeblich** für das Pad. Die Web-App leitet sie immer aus `intent` ab und prüft nach dem
  Zurücklesen, dass beides zusammenpasst (Schritte = f(Absicht)).

### Schritte

| Schritt | Bedeutung |
|---|---|
| `{"mod": <Zahl>, "key": <Zahl>}` | Taste mit Modifikatoren drücken und loslassen. `mod` ist die HID-Modifier-Bitmaske, `key` die HID-Usage-ID. |
| `{"delay": <ms>}` | Pause in Millisekunden |

Schritte werden der Reihe nach abgespielt. Mehr als `limits.maxSteps` Schritte je Taste sind ein Fehler.

## 5. Fehlercodes

| Code | Bedeutung |
|---|---|
| `BAD_REQUEST` | Nachricht ist kein gültiges JSON oder es fehlen Felder |
| `UNKNOWN_CMD` | Unbekannter Befehl |
| `UNSUPPORTED_VERSION` | `v` wird vom Pad nicht unterstützt |
| `OUT_OF_RANGE` | Profilindex oder Tastenzahl außerhalb der Grenzen |
| `TOO_LARGE` | Nachricht oder Schrittzahl überschreitet `limits` |
| `STORAGE_FAILED` | Speichern fehlgeschlagen, altes Profil ist unverändert |
| `BUSY` | Pad kann gerade nicht antworten (z. B. spielt eine Aktion ab) |

Die Web-App zeigt je Code eine verständliche Meldung. Bleibt eine Antwort aus, gilt ein Timeout
(Wert aus dem Hardware-Spike #43). Das Pad verwirft unvollständige Zeilen beim nächsten Zeilenumbruch.

## 6. Ablauf Schreiben und Prüfen

1. `device.info` abfragen, Version und Grenzen prüfen
2. Profil in der Web-App prüfen (Tastenzahl, Schrittzahl, Schritte = f(Absicht))
3. `profile.set`
4. `profile.get` für denselben Index
5. Zurückgelesenes Profil mit dem gesendeten vergleichen. Abweichung wird in der UI als Fehler angezeigt (R7).

## 7. Offene Punkte

- Schritte kennen nur "drücken und loslassen". Reicht das für Makros (z. B. Taste gedrückt halten)?
- HID-Codes im Protokoll (Vorschlag) oder lesbare Tastennamen? Codes halten die Firmware klein, Namen sind
  leichter zu debuggen.
- Wird `activeProfile` dauerhaft gespeichert? Entwurf: nein.
- Timeout-Wert und Grenzen (`maxSteps`, `maxMessageBytes`) sind Platzhalter und werden im Spike #43 gemessen.
- Übertragungsgeschwindigkeit: bei USB-CDC ohne Bedeutung, bei einem Wechsel auf UART nachtragen.
