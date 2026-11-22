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

Web-Anwendung (Editor, Aktionsbibliothek, Schreiben und Laden über WebSerial, Sicherung im Backend), Backend
(Profil-API mit OpenAPI) und Firmware (Tasten, Drehregler, Profilwechsel, Protokoll-Handler, Ablage im Flash)
sind umgesetzt. Offen sind vor allem die Integration auf der Hardware, Architektur-Diagramme, Teststrategie
und die Abgabeunterlagen. Planung und Fortschritt stehen in den [Issues](../../issues) und
[Meilensteinen](../../milestones).

## Code-Dokumentation

| Bereich | Wo | Wie |
|---|---|---|
| Backend | OpenAPI und Swagger UI unter `/swagger-ui.html`, Javadoc | [backend/README.md](backend/README.md) |
| Web | TSDoc an den exportierten Funktionen, Typen und Komponenten, Kurzbeschreibung der Bibliothek | [web/README.md](web/README.md) |
| Protokoll | Spezifikation; Firmware-Handler und Web-Client verweisen im Dateikopf darauf | [docs/protokoll-v1.md](docs/protokoll-v1.md) |
| Firmware | Dateikopf je Datei, Kommentare an den Schnittstellen | [firmware/README.md](firmware/README.md) |

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
