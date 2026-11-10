# ADR 0003: Firmware-Toolchain

Status: akzeptiert, Datum 2026-11-10

## Kontext

Die Firmware für den ESP32-S3 (C++) ist nachrangig und entsteht KI-unterstützt. Gewünscht sind ein
reproduzierbarer Build, Integration in VS Code und die Möglichkeit, den Build in der CI zu prüfen.

## Optionen

1. **Arduino IDE:** Einfacher Einstieg, aber wenig reproduzierbar und schlecht für CI.
2. **Arduino-CLI:** Skriptbar und CI-fähig, Projektkonfiguration ist weniger deklarativ.
3. **PlatformIO (gewählt):** Deklarative `platformio.ini`, feste Versionen von Board und Bibliotheken, VS-Code-Integration, CLI für die CI.
4. **ESP-IDF:** Maximale Kontrolle, für den Umfang des Projekts zu aufwändig.

## Entscheidung

PlatformIO mit dem Arduino-Framework für den ESP32-S3.

## Folgen

- Reproduzierbarer Build über `platformio.ini`, Build-Prüfung in der CI möglich.
- Einarbeitung in PlatformIO nötig, im Zeitplan Teil des Hardware-Spikes (Issue #8).
- Nachteil: Zusätzliche Abhängigkeit gegenüber der Arduino IDE. Bei Problemen mit USB-HID und
  seriellem Kanal gleichzeitig ist ein Wechsel auf ESP-IDF denkbar, aber nicht eingeplant.
