"""Zweck: Rauchtest der Firmware am echten Board (Issues #29, #30, #31, #45).
Inhalt: Schickt Anfragen nach docs/protokoll-v1.md über die serielle Schnittstelle und prüft die Antworten:
        device.info, Schreiben und Zurücklesen eines Profils, Aktivieren, Fehlerfälle. Nebenbei kann man
        Tasten am Pad drücken, um zu sehen, dass HID und serieller Kanal parallel laufen (#31).
Aufruf: python firmware/tools/smoke_test.py COM4   (Port im Geräte-Manager nachsehen, ohne `python -I`)
Hinweis: Das Skript überschreibt Slot 1 (Index 1) des Pads mit einem Testprofil.
"""
import json
import sys
import time

import serial  # pyserial

TEST_PROFILE = {
    "name": "Rauchtest",
    "layout": "de-DE",
    "keys": [
        {
            "type": "combo",
            "label": "Befehlspalette",
            "intent": {"keys": "ctrl+shift+p"},
            "steps": [{"mod": 3, "key": 19}],
        },
        {
            "type": "text",
            "label": "ab",
            "intent": {"text": "ab", "enter": False},
            "steps": [{"mod": 0, "key": 4}, {"delay": 50}, {"mod": 0, "key": 5}],
        },
        None,
        None,
    ],
}

failures = 0
next_id = 0


def request(port, cmd, **fields):
    """Send one request and return the parsed answer line."""
    global next_id
    next_id += 1
    message = {"v": 1, "id": next_id, "cmd": cmd, **fields}
    port.write((json.dumps(message, separators=(",", ":")) + "\n").encode())
    line = port.readline().decode(errors="replace").strip()
    if not line:
        return {"ok": False, "error": {"code": "TIMEOUT", "message": "no answer"}}
    return json.loads(line)


def check(name, condition, detail=""):
    global failures
    print(("OK    " if condition else "FEHLER"), name, detail if not condition else "")
    if not condition:
        failures += 1


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    with serial.Serial(sys.argv[1], 115200, timeout=2) as port:
        time.sleep(0.5)
        port.reset_input_buffer()

        info = request(port, "device.info")
        check("device.info antwortet", info.get("ok") is True, info)
        check("Protokoll 1", info.get("protocol") == 1, info)
        print("      Firmware", info.get("firmware"), "| persistent:", info.get("persistent"),
              "| aktives Profil:", info.get("activeProfile"))

        answer = request(port, "profile.set", index=1, profile=TEST_PROFILE)
        check("profile.set", answer.get("ok") is True, answer)
        answer = request(port, "profile.get", index=1)
        check("profile.get liefert dasselbe Profil", answer.get("profile") == TEST_PROFILE, answer)

        answer = request(port, "profile.activate", index=1)
        check("profile.activate", answer.get("activeProfile") == 1, answer)
        print("      Jetzt T1 und T2 am Pad drücken: Befehlspalette und 'ab' im Editor erwartet.")
        print("      Dabei weitere Anfragen senden, um den parallelen Betrieb zu prüfen (#31):")
        for i in range(10):
            answer = request(port, "device.info")
            check(f"device.info während des Tastendrucks ({i + 1}/10)", answer.get("ok") is True, answer)
            time.sleep(0.5)
        request(port, "profile.activate", index=0)

        check("Index außerhalb", request(port, "profile.get", index=9).get("error", {}).get("code") == "OUT_OF_RANGE")
        check("Unbekannter Befehl", request(port, "gibt.es.nicht").get("error", {}).get("code") == "UNKNOWN_CMD")
        too_few = {**TEST_PROFILE, "keys": [None]}
        check("Falsche Tastenzahl", request(port, "profile.set", index=1, profile=too_few)
              .get("error", {}).get("code") == "OUT_OF_RANGE")
        port.write(b"das ist kein json\n")
        broken = json.loads(port.readline().decode() or "{}")
        check("Kaputte Zeile", broken.get("error", {}).get("code") == "BAD_REQUEST", broken)
        still = request(port, "profile.get", index=1)
        check("Altes Profil nach Fehlern unverändert", still.get("profile") == TEST_PROFILE, still)

    print("\nErgebnis:", "alles in Ordnung" if failures == 0 else f"{failures} Fehler")
    print("Für #30: Pad abziehen, wieder anstecken, `profile.get` für Index 1 muss das Testprofil liefern.")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
