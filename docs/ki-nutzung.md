# KI-Nutzungsprotokoll

Gemäß [ADR 0002](adr/0002-ki-einsatzleitlinie.md). Je Aufgabe ein Eintrag mit Bereich, Zweck und dem,
was geändert oder verworfen wurde. Keine Prompts.

| Datum | Aufgabe (Issue/PR) | Bereich | Wofür KI genutzt | Was ich geändert oder verworfen habe |
|---|---|---|---|---|
| 2026-11-10 | #32 Repo-Gerüst | Docs | Entwurf README und Ordnerstruktur | |
| 2026-11-10 | #34 Projektdefinition | Docs | Entwurf der Texte nach meinen Vorgaben und Interviews | |
| 2026-11-10 | #35 ADRs | Docs | Entwurf der ADR-Texte nach meinen Entscheidungen | |
| 2026-11-11 | #57 AGENTS.md | Docs | Entwurf der KI-Regeln nach ADR 0002 | |
| 2026-11-11 | PR #59 ADR 0003 Verweis | Docs | Fehler im Issue-Verweis gefunden und korrigiert | |
| 2026-11-11 | #37 Anforderungen | Docs | Übertragung von R1 bis R15, Entwurf der Beispielbelegung nach meinen Vorgaben | |
| 2026-11-11 | #39 Protokoll v1, ADR 0004 | Docs | Interviewfragen zu den Entwurfsentscheidungen, Entwurf von Spezifikation und ADR nach meinen Antworten | |
| 2026-11-11 | #40 ADR 0005 Rolle des Backends | Docs | Interviewfragen zu den Entscheidungen, Entwurf des ADR-Textes nach meinen Antworten | |
| 2026-11-11 | #16 Backend-Gerüst | Backend | Erzeugung des Gerüsts über Spring Initializr, Aufräumen der pom.xml, README | |
| 2026-11-11 | #17, #18 Profil-API und Persistenz | Backend | Umsetzung nach meinen Entscheidungen (JSON in einer Spalte, Name als Schlüssel, Strukturvalidierung, ProblemDetail, POST/PUT), Tests | |
| 2026-11-11 | AGENTS.md Dateikopf-Regel | Docs | Formulierung der Regel nach meiner Vorgabe | |
| 2026-11-11 | #2 Web-Gerüst | Web | Erzeugung des Gerüsts mit Vite, Einrichtung von Vitest, Platzhalterseite, README | |
| 2026-11-11 | #43 Hardware-Spike | Firmware | Testsketche, Auswertung der Messungen am Board, Ergebnisdokument | |
| 2026-11-15 | #21, #23, #24 Firmware-Gerüst, Tasten, HID | Firmware | Gerüst, Entprellen und Abspielen der HID-Schritte, Beispielbelegung nach docs/anforderungen.md | |
| 2026-11-16 | #26 Drehregler auslesen | Firmware | Quadratur-Dekoder (Zustandstabelle), Einbindung in die Hauptschleife, Debug-Ausgabe | |
| 2026-11-22 | #27 Profilwechsel in der Firmware | Firmware | Zwei fest eingebaute Profile, aktives Profil, Druck auf den Drehregler (GPIO 13, entprellt) schaltet um, nach meiner Entscheidung (Druck statt Drehen, R4) | |
| 2026-11-22 | #29 Protokoll-Handler (Firmware) | Firmware | Zeilenleser, Handler für die vier Befehle mit vollständiger Prüfung nach docs/protokoll-v1.md, Profil-Slots im RAM, ArduinoJson (von mir freigegeben) | |
| 2026-11-22 | #30 Profile im Flash speichern | Firmware | NVS-Ablage der Profiltexte, Laden und erneute Prüfung beim Start, Auslagern der Profilprüfung in profile_parser | |
| 2026-11-16 | #3 Profilmodell (Typen, Validierung) | Web | Zod-Schemas nach meinen Entscheidungen (diskriminierte Union, Zod, Grenzen als Parameter), Tests | |
| 2026-11-16 | #3 Zustandsverwaltung des Editors | Web | Reducer, Context und Tests nach meinen Entscheidungen (setKey/clearKey, dirty per Vergleich, ohne Validierung im Reducer, leeres Startprofil) | |
| 2026-11-16 | #7 Aktionsbibliothek (Struktur und Inhalte) | Web | Schema, Datei mit Beispielaktionen für drei Gruppen, Tests und Kurzbeschreibung nach meinen Entscheidungen (nur intent, Gruppen, Felder) | |
| 2026-11-16 | #4 Editor-Oberfläche | Web | Pad-Ansicht, Formular je Typ, Layouts als Daten (4/9 Tasten), Mantine-Einbindung und Tests nach meinen Entscheidungen | |
| 2026-11-17 | #8 Bibliotheksauswahl im Editor | Web | Auswahl mit Programmfilter und Suche (LibraryPicker), Einbau ins Tasten-Formular und Tests | |
| 2026-11-17 | #74 Schritte aus der Absicht (de-DE) | Web | Umrechnung (Tabellen, Kombination, Text, AltGr), Einbau im Formular und Tests nach meinen Entscheidungen (bei jeder Änderung, Fehlertext, AltGr-Zeichen) | |
| 2026-11-17 | #12 Protokoll-Client | Web | Client, Transport-Interface, Fehlerklasse und Tests nach meinen Entscheidungen (Exceptions, zeilenbasierter Transport) | |
| 2026-11-17 | #13 Mock des Geräts | Web | MockDevice als Transport mit Protokoll-Fehlercodes, Haken für Fehlerfälle und Tests | |
| 2026-11-17 | #14 Schreiben, Zurücklesen, Vergleichen | Web | writeProfile (Phasen, Prüfung, Vergleich), Hook und Statusanzeige mit Tests nach meinen Entscheidungen (Callback plus Exception, Anzeige ohne Anbindung) | |
| 2026-11-17 | #11 WebSerial-Verbindung und Statusanzeige | Web | SerialTransport mit Zeilen-Zerlegung, Verbindungszustand, Statusleiste und simulierter Port mit Tests nach meinen Entscheidungen (nur Verbindung und Status, kein Port-Filter) | |
| 2026-11-17 | #80 Schreiben-Button mit Slot-Auswahl | Web | WriteControls (Slot-Auswahl, Rückfrage bei anderem Profil im Slot, Anbindung an writeProfile und markSaved) mit Tests nach meinen Entscheidungen (Slot im Editor wählbar, Rückfrage bei anderem Profil, Laden ausgelagert) | |
| 2026-11-17 | #81 Prozess-Log KW 1 | Docs | Interviewfragen zum Wochenstand, Entwurf der Formulierungen nach meinen Antworten (Stunden, Probleme, Erkenntnisse) | |
| 2026-11-17 | #85 Profilname im Editor | Web | Eingabefeld mit Fehlerhinweis, profileNameError, Sperre des Schreiben-Buttons und Tests | |
| 2026-11-22 | #98 Prozess-Log Nachtrag KW 1 | Docs | Formulierungsvorschlag für Rückblick und Plan KW 2 nach meinen Antworten im Interview (Stunden bestätigt, Hardware gut, Review-Stapel als Engpass) | |
