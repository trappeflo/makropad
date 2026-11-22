# Integrationstest: Web, Pad und Backend

Manueller Durchlauf über die ganze Kette (Issue #45): Web-Anwendung im Browser, Pad per USB, Backend lokal.
Die automatischen Tests decken die Teile einzeln ab (Mock des Geräts, JUnit). Hier wird geprüft, ob sie auf
der echten Hardware zusammenspielen. Die Spalten "Ergebnis" und "Bemerkung" werden beim Durchlauf ausgefüllt,
bis dahin ist dies die Vorlage, kein Ergebnis.

Bezug: [Anforderungen](anforderungen.md) (R1 bis R10), [Protokoll v1](protokoll-v1.md),
[ADR 0005](adr/0005-rolle-des-backends.md).

## Vorbereitung

| Schritt | Befehl oder Handlung |
|---|---|
| Firmware aufspielen | `python -m platformio run -t upload` im Ordner `firmware/` (siehe [Firmware-README](../firmware/README.md)) |
| Backend starten | im Ordner `backend/`: `.\mvnw.cmd spring-boot:run` (Port 8080) |
| Web-Anwendung starten | im Ordner `web/`: `npm run dev`, dann `http://localhost:5173` in Edge oder Chrome |
| Zieltext vorbereiten | Notepad öffnen und fokussieren, damit Tastendrücke dort landen |

Durchlauf-Daten (beim Test ausfüllen): Datum, Firmware-Stand (Commit), Browser und Version, Board.

## Durchlauf

| Nr. | Schritt | Erwartung | Anforderung | Ergebnis | Bemerkung |
|---|---|---|---|---|---|
| 1 | Pad per USB anstecken | Windows erkennt Tastatur und seriellen Anschluss | R13 | | |
| 2 | In der Web-Anwendung "Verbinden", Port wählen | Status "verbunden", Pad meldet Protokoll v1 und Grenzen | R6 | | |
| 3 | Profil im Editor belegen: T1 Kombination, T2 Text, T3 Tastenfolge, T4 Kombination | Eingaben ohne Fehlermeldung, Schreiben-Button aktiv | R1, R2, R3, R10 | | |
| 4 | Profil in Slot 1 schreiben | Phasen laufen durch, am Ende "geschrieben und geprüft" | R7 | | |
| 5 | Tasten T1 bis T4 am Pad drücken | Jede Taste löst die geschriebene Aktion in Notepad aus | R1, R2, R3 | | |
| 6 | Zweites Profil in Slot 2 schreiben, Drehregler drücken, Tasten drücken | Profilwechsel, Tasten tun das Verhalten von Profil 2 | R4 | | |
| 7 | Browser schließen, Pad abziehen und wieder anstecken, Tasten drücken | Belegung ist noch da, kein Programm im Hintergrund nötig | R5 | | |
| 8 | Browser öffnen, verbinden, "Vom Pad laden" | Editor zeigt das Profil aus dem Pad | R6, R7 | | |
| 9 | Profil im Editor ändern, Schreiben unterbrechen (Pad abziehen während des Schreibens) | Fehler ist sichtbar, kein stiller Erfolg | R7 | | |
| 10 | "Sichern" im Backend | Profil gesichert, bei vergebenem Namen Rückfrage | R9 | | |
| 11 | Backend beenden, Editor und Schreiben weiter benutzen | Alles außer Sichern und Laden geht weiter, Hinweis "Backend nicht erreichbar" | R9, ADR 0005 | | |
| 12 | Backend neu starten, Profil aus der Sicherung laden und aufs Pad schreiben | Profil kommt zurück und lässt sich schreiben | R9 | | |
| 13 | Tasten drücken und gleichzeitig Profil schreiben | Beides läuft, keine Zeichen gehen verloren | #31 | | |

## Auswertung

Nach dem Durchlauf eintragen: Anzahl bestanden und fehlgeschlagen, je Fehlschlag ein Issue mit Verweis auf die
Nummer. Offene Punkte, die den Plan betreffen, gehören ins [Prozess-Log](prozess-log.md).
