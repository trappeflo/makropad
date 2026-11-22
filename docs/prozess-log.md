# Prozess-Log

Laufendes Log mit Wochenreviews, Entscheidungen und Abweichungen. Grundlage für Fortschrittsbericht
und Reflexion. Soll-Werte stehen im [Plan](plan.md).

## Zeit-Log (Soll/Ist)

| KW | Soll (h) | Ist (h) | Ziel erreicht? | Abweichung / Grund |
|---|---|---|---|---|
| 1 | 5 | ca. 15 (geschätzt) | ja, übererfüllt | Software und Doku ca. 7–8 h, Prototyp ca. 3–4 h, Gehäuse ca. 4 h (außerhalb des Plans). Setup schneller als geplant, Web und Firmware-Gerüst vorgezogen, Hardware vorgezogen (Plan: KW 4) |
| 2 | 6 | | | |
| 3 | 6 | | | |
| 4 | 6 | | | |
| 5 | 5 | | | |
| 6 | 6 | | | |

## Vorlage Wochenreview

```
### KW __ (Datum)
- Wochenziel:
- Erreicht? ja / teilweise / nein
- Stunden (Soll / Ist):
- Erledigte Issues:
- Probleme, Überraschungen:
- Was lief gut:
- Was ändere ich nächste Woche:
- Auswirkung auf Meilenstein / Plan:
```

## Wochenreviews

(neueste oben)

### KW 1 (16.11.2026)
- Wochenziel: Projektdefinition, Vorgehensmodell, KI-Leitlinie, Repo mit Templates, Labels, Board
- Erreicht? ja, übererfüllt
- Stunden (Soll / Ist): 5 / ca. 15 (Stand 22.11., Schätzung bestätigt). Aufteilung: Software und Doku ca. 7–8 h, Prototyp (Löten) ca. 3–4 h, Gehäuse (3D-Modell, Druck) ca. 4 h. Das Gehäuse liegt außerhalb des Plans (Ausblick) und wird getrennt ausgewiesen
- Erledigte Issues: Setup und Definition (M1), dazu vorgezogen: Hardware-Spike (#43), Firmware-Gerüst mit Tasten und HID (#21, #23, #24), Web-Editor mit Profilmodell, Bibliothek, Protokoll-Client und Mock (#3, #4, #7, #8, #12, #13, #74)
- Probleme, Überraschungen: Das Setup ging schneller als geschätzt, deshalb wurden Web, Firmware und Hardware vorgezogen. Beim 3D-Modell waren mehrere Anpassungen nötig, ein Zyklus aus Anpassen und Drucken dauert über 2 h. Löten ist für den Autor neu, der Aufwand dafür ist schwer einzuschätzen. Hardware-Stolpersteine (Flash-Größe, OTG-Modus, Bindestrich) stehen im Vault. Der Spike zur Onboard-LED hat den Scope leicht erweitert (Status-LED, bisher nur Could)
- Was lief gut: Git-Workflow mit Issue, Branch und PR je Änderung. Jeder PR und jede Codeänderung wurde gelesen. Der Hardware-Fortschritt (Löten, Pin-Tests, Board läuft) verlief wie geplant
- Was nicht gut lief: In PRs wurden die Checkboxen der Zusammenfassung teils nicht aktualisiert. Viel Code zu verstehen und zu behalten ist schwer (Material für die Reflexion). Der Stapel KI-erzeugter PRs, vor allem in der Firmware, ist viel zu reviewen, der Review-Aufwand wird zum Engpass
- Was ändere ich nächste Woche: Hardware fertigstellen (Tasten 3 und 4, Drehregler) und erst den Firmware-Stapel reviewen und am Board testen, bevor neuer Code entsteht. Danach Architektur (#38) und Teststrategie (#42) schreiben. Das Gehäuse soll nicht weiter wachsen
- Auswirkung auf Meilenstein / Plan: Web und Firmware vor Plan, Bau des Pads vorgezogen. Das Gesamtbudget (ca. 36 h) ist durch die Mehrstunden knapp: bei 15 h in KW 1 bleiben ca. 21 h für KW 2 bis 6
- Risiko R1 (Firmware): Einschätzung unverändert, HID und serielle Schnittstelle laufen im Spike zusammen
