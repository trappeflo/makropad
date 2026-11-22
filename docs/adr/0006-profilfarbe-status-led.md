# ADR 0006: Profilfarbe für die Status-LED

Status: vorgeschlagen (Entwurf, Begründung noch vom Autor zu bestätigen), Datum 2026-11-17

## Kontext

Das Pad hat eine Onboard-RGB-LED an GPIO 48 (Hardware-Spike #43, `docs/hardware-spike.md`). Das Gehäuse wird
aus transparentem Material gedruckt, damit die LED sichtbar ist. Anforderung R8 ("aktives Profil per LED
erkennbar") ist in `docs/anforderungen.md` als Could geführt, die Wireframes (#41) zeigen aber eine
LED-Farbe je Profil im Editor ("Profil edit: Name und Farbe").

Das Protokoll v1 (Entwurf) kennt kein Farbfeld. Laut `AGENTS.md` bekommen Änderungen am Protokoll zuerst einen
ADR. Außerdem prüft das Backend Profile strukturell (`Profile.java`) und der Editor validiert mit Zod
(`profile.ts`), beide müssen ein neues Feld kennen.

## Optionen

1. **Keine Farbe, nur feste Anzeige:** Die LED zeigt eine feste Farbe oder blinkt nach Profilnummer. Kein
   Eingriff in Protokoll und Modell, aber das Wireframe und die Wiedererkennung pro Profil entfallen.
2. **Feste Farbtabelle in der Firmware nach Slot-Index:** Profil 1 ist immer Farbe A, Profil 2 Farbe B. Das
   Protokoll bleibt unverändert, die Farbe ist aber nicht wählbar und gehört nicht zum Profil.
3. **Optionales Feld `color` im Profil (vorgeschlagen):** Eine Farbe als Hex-Wert (z. B. `"#00AA88"`), die der
   Editor setzt, das Pad speichert und beim Profilwechsel auf die LED legt. Fehlt das Feld, gilt eine
   Standardfarbe. Alte Profile bleiben gültig.

## Entscheidung

Option 3: Das Profil bekommt ein **optionales** Feld `color` (Hex-Wert `#RRGGBB`). Die Firmware setzt die LED
beim Profilwechsel (#27) auf diese Farbe. Ohne `color` leuchtet eine Standardfarbe.

Begründung (Entwurf, vom Autor zu bestätigen oder zu ersetzen):
- Das Gehäuse ist transparent, die LED soll genutzt werden. Das Wireframe sieht die Farbe pro Profil bereits vor.
- Die Farbe gehört zum Profil und nicht zum Slot, damit sie mit Sichern und Wiederherstellen (ADR 0005)
  erhalten bleibt.
- Weil das Feld optional ist, bleiben bestehende Profile und Tests gültig, und der Mehraufwand ist klein
  (Modell, Formularfeld, wenige Zeilen in der Firmware).

## Folgen

- **Protokoll:** Abschnitt 4 (Profil) bekommt das optionale Feld `color`. Es ist eine rückwärtskompatible
  Ergänzung des Entwurfs, die Version `v` bleibt 1. Das Pad speichert und liefert den Wert beim Lesen
  unverändert zurück.
- **Web:** `profileSchema` und der Editor brauchen das Feld und eine Eingabe (Farbwähler). Der Vergleich nach
  dem Zurücklesen (R7) schließt es ein.
- **Backend:** `Profile.java` kennt `color` noch nicht. Ob unbekannte Felder abgelehnt oder stillschweigend
  verworfen werden, ist zu prüfen. Im zweiten Fall ginge die Farbe bei Sichern und Wiederherstellen verloren.
  Das Feld muss dort ergänzt und getestet werden.
- **Firmware:** Das Setzen der LED hängt an der Profilumschaltung (#27). Der Speicherbedarf je Profil wächst
  um wenige Bytes.
- **Scope:** Die LED war bisher ein Could (`AGENTS.md` Abschnitt 2, Projektdefinition Abschnitt 5, R8). Mit
  dieser Entscheidung ist sie ein bewusst aufgenommener Bestandteil, die genannten Dokumente müssen angepasst
  werden. Der Umfang bleibt klein, fällt aber in die Kürzungsreihenfolge des Plans, falls die Zeit knapp wird
  (Rückfall: feste Farbtabelle nach Option 2).
- **Offen:** Farbwahl im Editor als freier Farbwähler oder feste Palette, und ob die Farbe im Pad auch ohne
  aktive Verbindung gilt (ja, sie wird mit dem Profil gespeichert).
