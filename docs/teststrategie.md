# Teststrategie

Entwurf (Issue #42), aus dem vorhandenen Bestand zusammengestellt. Die Gewichtung und die Abgrenzung
(Abschnitt 3) sind vom Autor zu prüfen und zu übernehmen oder zu ändern. Bezug: Ziel Z7 der
[Projektdefinition](projektdefinition.md), Risiko R7 (KI-Code wird nicht verstanden oder ist fehlerhaft).

## 1. Ziel

Was kaputtgehen darf, ohne dass es auffällt, ist gering: Eine Belegung, die falsch geschrieben wird oder
verloren geht, ist für beide Personas der schlimmste Fall (Robustheit). Deshalb wird die **Kernlogik**
automatisiert getestet, die Hardware per Rauchtest und einem dokumentierten manuellen Durchlauf.

## 2. Ebenen und Werkzeuge

| Ebene | Was wird getestet | Werkzeug | Wo |
|---|---|---|---|
| Web, Modell und Logik | Profil-Schema und Validierung, Reducer, Umrechnung von Absicht in HID-Schritte (de-DE), Aktionsbibliothek | Vitest | `web/src/model`, `web/src/library` |
| Web, Protokoll | Protokoll-Client (Format, Befehle, Fehlerantworten, Timeout, Versionsprüfung), Zeilen-Transport, Schreiben, Zurücklesen und Vergleichen | Vitest mit Mock des Geräts (`MockDevice`) und simuliertem Port (`FakeSerial`) | `web/src/protocol` |
| Web, Oberfläche | Editor, Bibliotheksauswahl, Schreiben-Button, Verbindungsanzeige, Sicherung | Vitest mit Testing Library | `web/src/editor`, `connection`, `backup` |
| Backend | Profil-API (Statuscodes, Fehlerformat), Validierung, Persistenz in H2, CORS, OpenAPI-Beschreibung | JUnit und Spring-Boot-Test | `backend/src/test` |
| Firmware und Gesamtkette | Befehle des Protokolls am echten Board, Fehlerfälle, HID und serieller Kanal gleichzeitig | Rauchtest-Skript (`firmware/tools/smoke_test.py`) | `firmware/tools` |
| Gesamtsystem | Web, Pad und Backend zusammen | manueller Durchlauf mit Protokoll | [Integrationstest](integrationstest.md) |

Die Zahlen ändern sich mit jedem PR. Beim Stand dieses Entwurfs laufen 169 Web-Tests und 52 Backend-Tests
ohne Fehler.

## 3. Abgrenzung

- **Kein automatisierter Hardware-Test.** Das Protokoll wird in der Web-App gegen `MockDevice` getestet, die
  Firmware nur am echten Board (Rauchtest und Durchlauf). Der Mock soll die Fehlercodes des Protokolls
  nachbilden (Protokoll v1, Abschnitt 5), er ersetzt den Hardware-Test aber nicht.
- **Kein Test der reinen Darstellung.** Geprüft werden Verhalten und Texte, nicht das Aussehen.
- **Kein formaler Usability-Test.** Rückmeldung zur Bedienung kommt aus dem informellen Feedback der Personas A
  und B (außerhalb dieses Dokuments).
- **Keine Last- und Sicherheitstests.** Das Backend ist für den lokalen Betrieb gedacht (ADR 0005).

## 4. Vorgehen

- Tests entstehen mit der Funktion im selben PR. Eine Funktion gilt erst als fertig, wenn ihre Tests grün sind
  (Definition of Done).
- Fehler im Pad-Betrieb bekommen zuerst einen Test (im Mock nachstellbar) oder einen Schritt im
  Rauchtest, dann die Korrektur.
- KI-erzeugter Code wird nicht ungelesen übernommen. Tests und Selbstreview sind die Absicherung gegen
  Risiko R7.

## 5. Automatisierung

Die CI ([ci.yml](../.github/workflows/ci.yml)) läuft bei jedem Pull Request und bei Pushes auf `main`:
Web (Lint, Build, Tests), Backend (`./mvnw verify`) und ein Secret-Scan. Die Firmware wird dort nicht gebaut.
Der Autor reviewt und merged selbst, auch bei grüner CI.

## 6. Bekannte Lücken

- Die Firmware hat keine automatischen Tests. Fehler dort fallen erst im Rauchtest oder beim Durchlauf auf.
- Der Zeitwert für das Timeout bei der Antwort des Pads ist nicht gemessen (Protokoll v1, offene Punkte).
- Der echte Port im Browser (WebSerial) wird nur über die Simulation getestet.
