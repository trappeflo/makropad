# Auswertung der Nutzerinterviews (Entwurf)

Stand: 10.11.2026. Grundlage: zwei Interviews (Persona A, Persona B), Rohnotizen lokal unter
`interviews/` (nicht versioniert). Dieses Dokument ist anonymisiert und kann später nach `docs/` im
Projekt-Repo wandern.

Methodische Grenze: n = 2, qualitative Erhebung. Die Ergebnisse geben Hinweise, keine
repräsentativen Aussagen. Die Priorisierung ist eine Selbsteinschätzung auf einer Skala von 1 bis 5.

## 1. Personas

**Persona A, Alltag / Smart Home**
- Nutzung: Schule, Uni, Notizen, Recherche, Shopping, Gaming. Programme: Notion, Word, KI-Chat, Browser, Video
- Geräte: MacBook und Windows-PC, häufiger Wechsel
- Schmerzpunkte: Copy/Paste, Sonderzeichen (@) beim Systemwechsel, Fensteraufteilung. Viele Shortcuts sind unbekannt und müssen gesucht werden
- Heutige Lösungen: Kurzbefehle (iOS), NFC-Tags, Sprachassistent, Tastenkombinationen
- Ziel: Shortcuts und Programme schnell erreichen, Profile je Aufgabe

**Persona B, Entwicklung / Programmierung**
- Nutzung: Uni, Programmieren, Serveradministration, Büroarbeit mit Videocalls, Gaming. Programme: Office-Suite, Code-Editor, SSH-Client, Browser, Spiele
- Geräte: primär Windows, Linux-Shell auf Servern
- Schmerzpunkte: Mute/Unmute und Bildschirmfreigabe in Videocalls, selten genutzte Shell-Befehle, viele Klicks in der Office-Suite ohne Hotkeys
- Heutige Lösungen: kleine Batch- und Shell-Skripte, früher ein Makro für Formulare
- Ziel: wenige, absolut verlässliche Tasten (Mute), Profile je Themenfeld (Arbeit, Uni, Gaming, teils je Spiel)

## 2. Ergebnis der Priorisierung

| Funktion | A | B | Ø | Einordnung |
|---|---|---|---|---|
| Tastenkombinationen senden | 5 | 5 | 5,0 | Must |
| Text oder Befehle einfügen | 5 | 4 | 4,5 | Must |
| Programme starten | 3 | 5 | 4,0 | Must (Makro-Variante, siehe 4) |
| Belegung im Browser bearbeiten | 4 | 4 | 4,0 | Must |
| Mehrere Profile mit Wechsel per Drehregler | 5 | 3 | 4,0 | Must |
| Status-LED für das aktive Profil | 4 | 3 | 3,5 | Should (in beiden Interviews unabhängig genannt) |
| Belegungen sichern, mehrere Rechner | 1 | 4 | 2,5 | Uneinig, siehe 3 |
| Langer Druck und Doppeldruck | 3 | 2 | 2,5 | Could |
| Smart-Home-Szenen und Webhooks | 2 | 2 | 2,0 | Außerhalb MVP, bestätigt |
| Lautstärke oder Scrollen per Drehregler | 1 | 2 | 1,5 | Could |
| Vorlagen für typische Profile | 1 | 1 | 1,0 | Entfällt (siehe 4) |

## 3. Wichtige Erkenntnisse

1. **Robustheit ist die zentrale Qualitätsanforderung.** Beide wollen sich darauf verlassen, dass
   Belegungen nicht verloren gehen und Tasten zuverlässig auslösen ("Mute 100 %").
2. **Das Pad muss ohne Hintergrundprogramm funktionieren.** Persona B wünscht ausdrücklich, dass
   die Belegung auf dem Gerät liegt. Das stützt die Architektur (Profile im Flash, Browser nur zur
   Konfiguration).
3. **Konfiguration nur am Rechner, nie am Gerät.** Browser ist akzeptiert, etwa eine Stunde für
   fortgeschrittene Konfiguration ist in Ordnung, die Ersteinrichtung soll schnell gehen.
4. **Backend: gemischtes Bild.** A lehnt Sync und Teilen ab, B bewertet Sichern und Nutzung auf
   mehreren Rechnern mit 4, wünscht aber zugleich Speicherung auf dem Gerät. Persona B sollte noch
   einmal gefragt werden, was genau gemeint war (Backup oder mehrere PCs).
   Konsequenz für das Konzept: Das Backend als Sicherung/Wiederherstellung begründen, nicht als
   Pflichtbestandteil der Gerätenutzung.
5. **Shortcuts sind schwer zu entdecken.** Beide nennen das (A: "oft nicht bekannt, muss gegoogelt
   werden", B: "viele Klicks, wenn man keine Hotkeys kennt"). Vorlagen für ganze Profile werden
   dennoch abgelehnt. Hypothese: Eine **Aktionsbibliothek** (Auswahl typischer Shortcuts pro
   Programm in der Web-UI, statt fertiger Profile) löst das Problem besser. Im Usability-Test prüfen.
6. **Profile folgen den Lebensbereichen** (Arbeit, Uni, Gaming, teils pro Spiel). Profilwechsel
   passiert häufig.
7. **Design:** kompakt und mit möglichst wenig Kabeln (A).
8. **Beide wollen am Usability-Test teilnehmen.**

## 4. Abgeleitete Anforderungen (Entwurf)

| ID | Anforderung | Quelle | Prio |
|---|---|---|---|
| R1 | Tasten senden Tastenkombinationen | A, B | Must |
| R2 | Tasten fügen Texte oder Befehlsfolgen ein (z. B. Mailadresse, Shell-Befehle) | A, B | Must |
| R3 | Programme und Websites starten per Makro (Tastenfolge) | A, B | Must |
| R4 | Mehrere Profile, Wechsel per Drehregler | A, B | Must |
| R5 | Belegungen liegen im Flash des Pads, kein Programm im Hintergrund nötig | B | Must |
| R6 | Konfiguration im Browser, nie am Gerät | A, B | Must |
| R7 | Schreiben auf das Pad wird zurückgelesen und verglichen, Fehler sind sichtbar | A, B (Robustheit) | Must |
| R8 | Aktives Profil per LED erkennbar | A, B | Should |
| R9 | Sicherung und Wiederherstellung der Profile (Backend, Export) | A, B | Should |
| R10 | Aktionsbibliothek mit typischen Shortcuts pro Programm | A, B (Entdeckbarkeit) | Should (Hypothese) |
| R11 | Langer Druck und Doppeldruck als zusätzliche Belegung | A, B | Could |
| R12 | Lautstärke oder Scrollen per Drehregler als wählbare Aktion | A, B | Could |
| R13 | Kompaktes Gehäuse, ein einziges Kabel | A | Should |
| R14 | Erste Einrichtung in wenigen Minuten | B | Should |
| R15 | Vorlagen für ganze Profile, Smart-Home-Aktionen | A, B | Entfällt oder nach MVP |

## 5. Risiken und Prüfpunkte aus den Interviews

- **Browser:** Persona A nutzt auf dem Mac Safari. WebSerial gibt es nur in Chromium-Browsern.
  Konfiguration und Usability-Test also auf dem Windows-PC mit Edge oder Chrome planen.
- **Mute-Taste:** Das Pad kennt den Mute-Zustand der Videocall-Software nicht. Eine Taste kann
  daher nur umschalten, nicht den Zustand anzeigen. "100 % verlassen" gelingt nur, wenn der
  Shortcut der Software zuverlässig global funktioniert. Als Spike prüfen (Fokus, globale
  Tastenkürzel). Gehört in die Risikoanalyse.
- **Programm starten per Tastatur** (z. B. Windows-Taste, Name tippen, Enter) hängt von der
  Systemsuche ab und ist zeitabhängig. Verzögerungen und Fehlschläge in die Teststrategie aufnehmen.
- **Systemübergreifende Sonderzeichen** (@ auf macOS): macOS ist nicht im MVP, die
  OS-abhängigen Profile bleiben aber begründetes Ziel.
- **Umfang:** Nur zwei Interviews. In der Reflexion als Einschränkung nennen.

## 6. Folgen für Backlog und Konzept

| Backlog | Änderung |
|---|---|
| S2.1 Anforderungen | Aus Abschnitt 4 übernehmen |
| S2.2 Profilbelegung | Interviews nennen Teams-Mute, neuer Browsertab oder -fenster, Mailprogramm, Mailadresse einfügen, Copy/Paste/Undo, Fensterwechsel. 3D-Druck kam in keinem Interview vor, also der Eigenbedarf. Entscheidung offen: Zweites MVP-Profil aus den Interviews ableiten (z. B. "Büro/Meeting") oder 3D-Druck belassen |
| S4.6 Vorlagen (Web), S5.5 Vorlagen teilen (Backend) | Streichen. Ersatz: Aktionsbibliothek (neue Story, Should) |
| S5.3, S5.4 Backend | Neu begründen als Sicherung/Wiederherstellung |
| S7.2 Eingaben | Lang- und Doppeldruck auf Could herabstufen |
| Neu | Spike "Globaler Mute-Shortcut in Videocall-Software" (E6/E7) |
| Neu | Usability-Test auf Windows mit Chromium-Browser planen (S8.4) |
| E1 Risiken | Risiken aus Abschnitt 5 aufnehmen |

## 7. Offene Fragen

- Rückfrage Persona B: Backup oder mehrere Rechner gemeint (Priorität 4)?
- Dauer der Interviews fehlt in den Metadaten (optional nachtragen).
- Entschieden am 10.11.2026: Zweites MVP-Profil "Büro/Meeting" (interviewbasiert), Vorlagen entfallen,
  Aktionsbibliothek kommt neu in den Backlog (siehe `kontext.md`, `backlog-entwurf.md`).
