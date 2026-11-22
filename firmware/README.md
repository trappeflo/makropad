# firmware

C++-Firmware für den ESP32-S3 (PlatformIO, Arduino-Framework): Tasten einlesen, entprellen und als
USB-Tastatur senden. Später kommen Drehregler, Profile, Protokoll-Handler und Flash dazu.

## Stand

| Issue | Inhalt | Stand |
|---|---|---|
| #21 | Gerüst mit PlatformIO | Build und Upload funktionieren |
| #23 | Tasten einlesen und entprellen | 4 Tasten, interner Pull-up, Entprellen in `src/debouncer.h` |
| #24 | USB-HID: Kombination und Text | Schritte (`mod`, `key`, `delay`) nach Protokoll v1, fest eingebaute Beispielbelegung |
| #26 | Drehregler auslesen | Drehrichtung in `src/encoder.h`, Ausgabe `ENC +1/-1` auf der seriellen Debug-Schnittstelle. Auf Hardware noch nicht getestet |
| #27 | Profilwechsel | Druck auf den Drehregler, zwei fest eingebaute Profile (PR offen) |
| #29 | Protokoll-Handler | `device.info`, `profile.get/set/activate` über die serielle Schnittstelle (`src/protocol.cpp`), Profile im RAM (PR offen, nicht am Board getestet). Nie beschriebene Slots spielen die eingebauten Beispielprofile |
| #30 | Flash | offen |

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/config.h` | Pins der Tasten (GPIO 1, 2, 4, 5), Entprellzeit, Pins und Rastung des Drehreglers |
| `src/encoder.h` | Drehrichtung eines Quadratur-Drehreglers per Zustandstabelle, ohne Arduino-Abhängigkeit |
| `src/debouncer.h` | Entprellen eines Eingangs, ohne Arduino-Abhängigkeit |
| `src/actions.h/.cpp` | Schritte als rohe HID-Codes, Abspielen über die USB-Tastatur, Beispielbelegung "Programmierung" |
| `src/main.cpp` | `setup()` und `loop()` |
| `spike/` | Wegwerf-Sketche des Hardware-Spikes (#43), nicht Teil der Firmware |

Die Firmware rechnet **keinen Text** um. Sie spielt nur rohe HID-Codes ab, die Web-App erzeugt sie für das
Layout `de-DE` (siehe [Protokoll v1](../docs/protokoll-v1.md) und [Hardware-Spike](../docs/hardware-spike.md)).

## Verdrahtung

Jede Taste liegt zwischen GPIO und GND, der interne Pull-up genügt (LOW = gedrückt).

| Taste | GPIO |
|---|---|
| T1 bis T4 | 1, 2, 4, 5 |
| Drehregler A / B | 11 / 12 (Taster auf 13 schaltet das Profil um) |

## Bauen und flashen

```
python -m platformio run -t upload
```

- Das Board hat 4 MB Flash. Die `platformio.ini` passt das Profil an.
- Die Firmware läuft im USB-OTG-Modus als Verbundgerät (Tastatur und serielle Schnittstelle).
  Neuflashen geht dann nur im Download-Modus: **BOOT halten und RESET drücken**, nach dem Flashen noch
  einmal **RESET**.
- Die Debug-Ausgabe (`T1 pressed` usw.) hängt am Build-Flag `MAKROPAD_DEBUG`. Mit dem Protokoll-Handler (#29)
  muss sie entfallen, weil das Pad nach Protokoll v1 nie von sich aus sendet.
- Achtung beim Testen: Eine Taste tippt echt in das Fenster mit Fokus. Vorher Notepad öffnen.
