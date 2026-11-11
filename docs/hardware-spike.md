# Ergebnis Hardware-Spike (#43)

Stand: 2026-11-11. Zweck: Das Board prüfen und das Firmware-Risiko R1 (USB-Tastatur und serielle Schnittstelle
gleichzeitig) früh klären. Die Testsketche liegen in [firmware/spike/](../firmware/spike/). Sie sind
Wegwerfcode und nicht die spätere Firmware (#21).

## Kurzfassung

| Frage | Ergebnis |
|---|---|
| Welches Board? | ESP32-S3 Mini, Chip ESP32-S3FH4R2: 4 MB Flash, 2 MB PSRAM, 2 Kerne, 240 MHz, native USB |
| Onboard-LED? | **RGB-LED an GPIO 48**, per `neopixelWrite()` ansteuerbar (rot, grün, blau gesehen) |
| Tastatur und serielle Schnittstelle gleichzeitig? | **Ja** im USB-OTG-Modus (TinyUSB): Windows zeigt ein Verbundgerät mit Tastatur (HID) und serieller Schnittstelle |
| Text als Tastatur senden? | Ja, aber **nur mit rohen Tastencodes für das deutsche Layout**. `keyboard.print()` sendet US-Codes |
| Tasten und Drehregler einlesbar? | **Noch nicht geprüft**, es war nichts angeschlossen |

## Ablauf und Beobachtungen

1. **Board:** Ohne Firmware meldet sich der Chip als "USB JTAG/serial debug unit" mit einer seriellen
   Schnittstelle. Das ist der feste USB-Serial/JTAG-Modus, er bietet keine Tastatur. Das Auslesen mit esptool
   ergab 4 MB Flash. Das PlatformIO-Profil `esp32-s3-devkitc-1` geht von 8 MB aus und wird mit
   `board_upload.flash_size = 4MB` und der Partitionstabelle `default.csv` angepasst.
2. **LED (Test `led_serial`):** Die Serielle funktioniert im Serial/JTAG-Modus. Die RGB-LED an GPIO 48 zeigte
   nacheinander rot, grün, blau. Das passt zu Anforderung R8 (aktives Profil per LED, jedes Profil eine Farbe).
3. **Verbundgerät (Test `hid_cdc`):** Mit `ARDUINO_USB_MODE=0` (USB-OTG) und `ARDUINO_USB_CDC_ON_BOOT=1` meldet
   sich das Board als Verbundgerät mit "USB-Eingabegerät" (HID) und "Serielles USB-Gerät". Auf `ping` kam
   `pong`, auf einen unbekannten Befehl die Hilfe. Der COM-Port wechselt dabei (Serial/JTAG-Modus und
   Verbundmodus bekommen verschiedene Ports).
4. **Tastaturlayout:** Der Text `makropad-test` mit `keyboard.print()` erschien als `makropadßtest`. Die
   Bibliothek sendet US-Tastencodes, der Rechner deutet sie nach dem deutschen Layout. Mit rohen
   HID-Codes (`pressRaw`) und dem Code `0x38` für den Bindestrich erschien `makropad-test` korrekt.
5. **Flashen im Verbundmodus:** PlatformIO kann das Board dort nicht automatisch in den Download-Modus
   schalten ("No serial data received"). Nötig ist **BOOT gedrückt halten und RESET drücken**. Nach dem
   Flashen blieb das Board im Download-Modus, ein zusätzliches **RESET** startete die neue Firmware.

## Folgen für das Konzept

- **Protokoll v1, Aktionsmodell:** Die Beobachtung zum Layout stützt die Entscheidung, dass die Firmware nur
  rohe Schritte (`mod`, `key` als HID-Codes) abspielt und die Web-App Text in Schritte für `de-DE` umrechnet.
  `print()` darf in der Firmware nicht für Text-Aktionen verwendet werden.
- **Modifikatoren:** Zeichen wie `@` brauchen AltGr (rechtes Alt). Die HID-Modifier-Bitmaske muss es
  abbilden. Die Web-App muss das beim Umrechnen berücksichtigen.
- **Entwicklungsablauf:** Neuflashen im Verbundmodus braucht den Download-Modus per Hand. Als Verbesserung
  käme ein serieller Befehl in Frage, der das Board in den Bootloader startet (zu klären in #29 oder #21).
- **Flash:** Das Board hat 4 MB, die Standardpartitionierung lässt rund 1,2 MB für das Programm. Für den
  Umfang des Projekts reicht das, Profile im Flash (#30) brauchen eine eigene Partition oder Preferences.

## Alternative zum Umrechnen in der Web-App

Das Arduino-Framework enthält fertige Layout-Tabellen (`KeyboardLayout_de_DE` und weitere), über die die
Firmware Text selbst übersetzen könnte. Das würde die Umrechnung in die Firmware verlagern. Die Entscheidung
für die Web-App (Protokoll v1) bleibt bestehen, die Alternative ist hier nur festgehalten.

## Noch offen

- **Tasten und Drehregler einlesen** (zweites Akzeptanzkriterium von #43): Pins festlegen und Test-Sketch,
  sobald Taster und Drehregler am Breadboard angeschlossen sind.
- **WebSerial im Browser:** Die serielle Schnittstelle wurde nur mit einem Python-Skript geprüft, nicht mit
  Edge oder Chrome. Das ist der eigentliche Zielweg und noch zu testen (ADR 0004).
- **Antwortzeit und Timeout:** Noch nicht sauber gemessen. Der Wert für den Timeout im Protokoll v1 steht
  weiter aus.
- **Speichern im Flash:** Nicht Teil dieses Spikes, siehe #30.
