# Anforderungen und Profilbelegung

Stand: 2026-11-11. Grundlage: [Auswertung der Nutzerinterviews](auswertung-nutzerinterviews.md)
(Persona A, Persona B) und [Projektdefinition](projektdefinition.md).

## 1. Anforderungen

Übernommen aus Abschnitt 4 der Auswertung. Die Spalte "MVP" zeigt, ob die Anforderung im Scope der
Projektdefinition liegt (Abschnitt 5 dort).

| ID | Anforderung | Quelle | Prio | MVP |
|---|---|---|---|---|
| R1 | Tasten senden Tastenkombinationen | A, B | Must | ja (Z1) |
| R2 | Tasten fügen Texte oder Befehlsfolgen ein (z. B. Mailadresse, Shell-Befehle) | A, B | Must | ja (Z1) |
| R3 | Programme und Websites starten per Makro (Tastenfolge) | A, B | Must | ja, als Tastenfolge |
| R4 | Mehrere Profile, Wechsel per Druck auf den Drehregler | A, B | Must | ja (Z2) |
| R5 | Belegungen liegen im Flash des Pads, kein Programm im Hintergrund nötig | B | Must | ja (Z4, Fallback RAM) |
| R6 | Konfiguration im Browser, nie am Gerät | A, B | Must | ja (Z3) |
| R7 | Schreiben auf das Pad wird zurückgelesen und verglichen, Fehler sind sichtbar | A, B (Robustheit) | Must | ja (Z3) |
| R8 | Aktives Profil per LED erkennbar | A, B | Should | Could: Onboard-LED des Boards nutzen, falls vorhanden (Klärung im Hardware-Spike #43) |
| R9 | Sicherung und Wiederherstellung der Profile (Backend, Export) | A, B | Should | ja (Z5) |
| R10 | Aktionsbibliothek mit typischen Shortcuts pro Programm | A, B (Entdeckbarkeit) | Should (Hypothese) | ja (Z6) |
| R11 | Langer Druck und Doppeldruck als zusätzliche Belegung | A, B | Could | nein |
| R12 | Lautstärke oder Scrollen per Drehregler als wählbare Aktion | A, B | Could | nein |
| R13 | Kompaktes Gehäuse, ein einziges Kabel | A | Should | Kabel ja (USB). Gehäuse wird nebenbei gebaut, nicht im Plan getrackt, aber für die Präsentation relevant |
| R14 | Erste Einrichtung in wenigen Minuten | B | Should | offen |
| R15 | Vorlagen für ganze Profile, Smart-Home-Aktionen | A, B | entfällt | nein |

## 2. Profilbelegung

Beispielbelegung (Entwurf), keine endgültige Festlegung. Sie soll die Interview-Rückmeldungen
abbilden und jede Aktionsart mindestens einmal zeigen. Ziel-System Windows 11.

Hardware im MVP: 4 Tasten (T1 bis T4) und ein Drehregler. Ein **Druck auf den Drehregler** wechselt zum
nächsten Profil (bei zwei Profilen also hin und her). Das Drehen ist im MVP nicht belegt (R12 ist Could).
Das aktive Profil wird, falls das Board eine Onboard-LED hat, über diese angezeigt (R8, Could).
Das Endgerät soll später 9 Tasten haben. Das ist Ausblick und nicht im MVP-Scope, die Belegung ist
aber nicht auf 4 Tasten festgeschrieben.

Aktionsarten: **Kombination** (Tastenkombination), **Text** (Zeichenfolge, optional mit Enter),
**Makro** (Tastenfolge aus mehreren Schritten).

### Profil 1: Programmierung

| Taste | Aktion | Art | Herkunft |
|---|---|---|---|
| T1 | Befehlspalette im Editor: Strg+Umschalt+P | Kombination | Eigenbedarf |
| T2 | `git status` eingeben, dann Enter | Text | Persona B (selten genutzte Shell-Befehle, R2) |
| T3 | Terminal starten: Windows-Taste, `terminal`, Enter | Makro | Persona B (Programme starten, R3) |
| T4 | Rückgängig: Strg+Z | Kombination | Persona A (Copy/Paste/Undo) |

### Profil 2: Büro/Meeting

| Taste | Aktion | Art | Herkunft |
|---|---|---|---|
| T1 | Mikrofon stumm/laut in Teams: Strg+Umschalt+M | Kombination | Persona B (Mute) |
| T2 | Bildschirmfreigabe in Teams: Strg+Umschalt+E | Kombination | Persona B (Freigabe) |
| T3 | Mailadresse einfügen (Platzhalter `max.muster@example.com`) | Text | Persona A (@ und Mailadresse, R2) |
| T4 | Fensterwechsel: Alt+Tab | Kombination | Persona A (Fensterwechsel) |

Hinweise:
- Die Teams-Kürzel sind noch nicht geprüft. Außerdem wirken sie nur, wenn Teams den Fokus hat, es sei denn,
  ein globales Kürzel ist in Teams eingestellt. Das gehört in den Mute-Spike (Risiko R5 der Projektdefinition).
- Die Mailadresse ist im Repo ein Platzhalter. Die echte Adresse kommt nie ins Repo.
- Tastenkürzel hängen von Tastaturlayout und Programmversion ab und sind im Editor frei änderbar.

## 3. Offene Punkte

- R14: Ist "Einrichtung in wenigen Minuten" ein Ziel im MVP, und wie wird es geprüft?
- Hat das Board eine Onboard-LED, und ist sie einfarbig oder RGB? Bei einer einfarbigen LED wäre das Profil
  nur über Blinkmuster erkennbar. Klärung im Hardware-Spike (#43).
- Profilwechsel: Bleibt es bei einem Druck für "nächstes Profil", oder braucht ein späteres Gerät mit mehr
  als zwei Profilen eine zweite Wechselart (z. B. Drehen)?
