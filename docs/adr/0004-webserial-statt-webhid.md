# ADR 0004: WebSerial statt WebHID für die Verbindung zum Pad

Status: Entwurf, Datum 2026-11-11

## Kontext

Die Web-Anwendung muss ohne Hintergrundprogramm und ohne Treiberinstallation mit dem Pad sprechen
(Anforderungen R5 und R6, Windows 11 mit Edge oder Chrome). Das Pad meldet sich außerdem als
USB-Tastatur (HID) und sendet damit die hinterlegten Tasten. Der Konfigurationskanal muss deshalb
**gleichzeitig** zum Tastaturbetrieb funktionieren (Issue #31, Risiko R1).

## Optionen

1. **WebSerial über eine USB-CDC-Schnittstelle (gewählt):** Das Pad bietet neben der Tastatur eine virtuelle
   serielle Schnittstelle. Der Browser spricht sie direkt an. Textbasierte Nachrichten sind leicht zu
   debuggen. Nur Chromium-Browser, Zugriff erst nach Auswahl des Ports durch die Nutzerin.
2. **WebHID mit eigener Vendor-Schnittstelle:** Der Browser spricht eine zusätzliche, herstellerdefinierte
   HID-Schnittstelle an. Kein Treiber nötig, aber Daten müssen in festen Reports übertragen werden.
   Nachrichten wie Profile brauchen eine eigene Fragmentierung. Ebenfalls nur Chromium-Browser.
   Die normale Tastatur-Schnittstelle selbst ist für WebHID gesperrt.
3. **WebUSB:** Direkter Zugriff auf USB-Endpunkte. Unter Windows braucht das Gerät dafür in der Regel einen
   passenden Treiber oder Deskriptoren, die zusätzlichen Aufwand in der Firmware bedeuten. Nur Chromium-Browser.
4. **Desktop-Hilfsprogramm als Brücke:** Browserunabhängig, aber widerspricht der Anforderung "kein Programm im
   Hintergrund" (R5) und bringt Installation und Pflege einer weiteren Komponente.

(Die technischen Angaben zu WebHID und WebUSB sind aus dem Kenntnisstand des Entwurfs und müssen im
Hardware-Spike #43 geprüft werden.)

## Entscheidung

WebSerial über USB-CDC. Das Protokoll ist textbasiert (JSON pro Zeile) und in
[Protokoll v1](../protokoll-v1.md) beschrieben.

Begründung (TODO: in eigenen Worten bestätigen oder ersetzen):
- Textnachrichten sind im Terminal lesbar und in Tests und Mock einfach nachzubilden.
- Kein Treiber und kein Hintergrundprogramm nötig.
- Die ESP32-S3-Firmware (ADR 0003) kann Tastatur und serielle Schnittstelle über USB gleichzeitig anbieten.
  Das wird im Spike #43 und in Issue #31 geprüft.

## Folgen

- Die Web-Anwendung läuft nur in Chromium-Browsern (Risiko R2). Safari und Firefox sind im Scope nicht
  unterstützt. Die UI zeigt dort eine Fehlermeldung.
- Die Nutzerin wählt den Port bei der ersten Verbindung selbst aus. Das ist eine Browser-Vorgabe und lässt sich
  nicht automatisieren.
- Das Protokoll muss selbst für Robustheit sorgen: Zeilenende als Rahmen, IDs, Fehlercodes und Zurücklesen
  nach dem Schreiben (R7).
- Wenn USB-HID und USB-CDC gleichzeitig nicht stabil laufen, ist Option 2 (WebHID) der Rückfall. Dann
  ändert sich der Transport, die Nachrichten bleiben gleich und müssen nur fragmentiert werden.
