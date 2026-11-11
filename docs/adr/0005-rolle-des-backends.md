# ADR 0005: Rolle des Backends

Status: akzeptiert, Datum 2026-11-11

## Kontext

Das Pad speichert seine Belegung selbst und arbeitet ohne Browser und ohne Hintergrundprogramm
(Anforderungen R5, R6). Die Nutzerinterviews zeigen ein gemischtes Bild zum Backend: Persona A lehnt Sync und
Teilen ab, Persona B bewertet Sichern und Nutzung auf mehreren Rechnern mit 4, wünscht aber zugleich die
Speicherung auf dem Gerät. Robustheit ist für beide die zentrale Qualitätsanforderung: Belegungen dürfen nicht
verloren gehen. Anforderung R9 (Sicherung und Wiederherstellung) ist Should, Ziel Z5 verlangt eine
Backend-API mit Tests.

## Optionen

1. **Backend als Sicherungsschicht (gewählt):** Ein lokal betriebenes Spring-Boot-Backend mit H2 hält eine
   Kopie der Profile. Das Pad bleibt für den Betrieb maßgeblich, das Backend ist nicht erforderlich, um das Pad
   zu konfigurieren oder zu benutzen.
2. **Export und Import einer JSON-Datei, ohne Backend:** Die Web-App lädt Profile als Datei herunter und liest
   sie wieder ein. Kein Server nötig, einfach und robust, aber ohne Ablage nach Gerät und ohne
   Backend-Komponente. Ist zugleich der Rückfall aus der Kürzungsreihenfolge des Plans.
3. **Speicherung im Browser (localStorage):** Keine Server-Komponente, aber an einen Browser und einen Rechner
   gebunden, leicht versehentlich zu löschen, und bei mehreren Rechnern hilft es nicht.

## Entscheidung

Das Backend ist eine **Sicherungsschicht**. Dazu gelten diese Festlegungen:

- **Maßgeblich ist das Pad** für den Betrieb. Das Backend hält eine Kopie. Wiederherstellen überschreibt das
  Pad nur auf ausdrückliche Aktion der Nutzerin, es gibt keinen automatischen Abgleich.
- **Sichern und Wiederherstellen laufen auf Knopfdruck** in der Web-App. Die Web-App funktioniert bei
  nicht erreichbarem Backend uneingeschränkt, nur diese beiden Aktionen sind dann nicht verfügbar.
- **Ein gemeinsamer Bestand, lokal betrieben:** Das Backend hat keine Anmeldung und keine Zuordnung zu
  Nutzern oder Geräten, sondern einen einzigen Bestand an Profilen. Nutzerkonten gibt es nicht. Eine
  Gerätekennung (je Pad sichern) wurde erwogen und verworfen, weil sie ein zusätzliches Feld im Protokoll
  und Firmware-Aufwand bedeutet hätte.

Begründung:
- Das Backend ist kein Pflichtbestandteil der Gerätenutzung, was zu den Aussagen beider Personas passt.
- Die Sicherung dient der Robustheit, der zentralen Qualitätsanforderung.
- Der Schwerpunkt der Arbeit liegt auf Web-Anwendung und Backend (Projektdefinition), das Backend liefert
  Profil-API, Persistenz und Tests als nachweisbaren Teil.

## Folgen

- Das Protokoll v1 bleibt unverändert, `device.info` braucht keine Kennung.
- Das Backend hat keine Anmeldung und ist für den lokalen Betrieb gedacht, nicht für öffentliches Hosting.
  Diese Grenze wird in der API-Dokumentation genannt.
- Ohne Nutzerkonten, Versionierung und Teilen von Profilen (nicht im Scope) bleibt die API klein: Profile
  lesen, speichern und löschen.
- Hängen mehrere Pads am selben Backend, teilen sie sich den Bestand. Profile sind darin über Namen
  unterscheidbar. Eine Trennung je Gerät wäre ein späterer Ausbau und eine Protokolländerung.
- Bei Verzug ist der Rückfall Export und Import einer Datei (Plan, Kürzungsreihenfolge Punkt 4). Die
  Dateiform entspricht dem Profilformat aus dem Protokoll v1, damit beide Wege dasselbe Format nutzen.
- Nutzung auf mehreren Rechnern ist nur über Wiederherstellen aus dem Backend möglich. Persona B wollte noch
  einmal gefragt werden, ob Backup oder mehrere Rechner gemeint waren (offener Punkt der Interview-Auswertung).
