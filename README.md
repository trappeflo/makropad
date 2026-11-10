# Makropad

Ein USB-Tastenfeld (Makropad) mit Drehregler und mehreren Profilen, konfiguriert über eine Web-Anwendung.
Das Pad meldet sich dem Rechner als Tastatur und sendet beim Tastendruck eine hinterlegte
Tastenkombination oder einen Text. Die Belegung wird im Browser bearbeitet, auf das Pad geschrieben und
dort gespeichert, danach arbeitet das Pad ohne Browser und ohne Hintergrundprogramm.

Dieses Projekt entsteht als Prüfungsleistung im Modul "Projekt: Software Development". Der Schwerpunkt
liegt auf der Software (Web-Anwendung und Backend), die Firmware ist bewusst minimal gehalten.

## Bestandteile

| Ordner | Inhalt | Technik |
|---|---|---|
| [web/](web/) | Web-Anwendung zum Bearbeiten und Übertragen der Profile | React, WebSerial |
| [backend/](backend/) | Sicherung und Wiederherstellung der Profile (REST-API) | Spring Boot, H2 |
| [firmware/](firmware/) | Firmware für das Pad | C++, ESP32-S3, PlatformIO |
| [docs/](docs/) | Projektdefinition, Architektur, Entscheidungen (ADRs), Prozess-Log | Markdown |

## Stand

Das Projekt befindet sich in der Anfangsphase (Meilenstein M1: Setup und Definition).
Planung und Fortschritt stehen in den [Issues](../../issues) und [Meilensteinen](../../milestones).

## Vorgehen

Kanban mit einwöchigen Iterationen. Änderungen laufen über Issues und Pull Requests, nichts geht
direkt auf `main`. Entscheidungen werden als ADRs in `docs/adr/` festgehalten.

## Einsatz von KI

KI-Unterstützung ist bei diesem Projekt erlaubt und wird offengelegt. Die Firmware entsteht überwiegend
KI-unterstützt, bei Web-Anwendung und Backend dient KI als Assistenz. Konzept, Architektur,
Entscheidungen und Reflexion sind eigene Leistung. Details stehen in der Leitlinie
(`docs/adr/0002-ki-einsatzleitlinie.md`) und im Nutzungsprotokoll (`docs/ki-nutzung.md`).

## Lizenz

[MIT](LICENSE)
