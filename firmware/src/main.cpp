/*
 * Zweck: Einstiegspunkt der Firmware (Issue #21): Tasten lesen, entprellen, Aktion senden.
 * Inhalt: setup() richtet Pins und USB ein, loop() fragt alle Tasten ab und spielt bei einem
 *         akzeptierten Tastendruck die Schritte der Taste ab. Drehregler (#26), Profilwechsel (#27),
 *         Protokoll-Handler (#29) und Flash (#30) folgen in eigenen Issues.
 */
#include <Arduino.h>

#include "actions.h"
#include "config.h"
#include "debouncer.h"

Debouncer debouncers[NUM_KEYS] = {Debouncer(DEBOUNCE_MS), Debouncer(DEBOUNCE_MS), Debouncer(DEBOUNCE_MS),
                                  Debouncer(DEBOUNCE_MS)};

void setup() {
#if MAKROPAD_DEBUG
  Serial.begin(115200);
#endif
  for (uint8_t i = 0; i < NUM_KEYS; i++) {
    pinMode(KEY_PINS[i], INPUT_PULLUP);  // key connects pin to GND, so LOW = pressed
  }
  initKeyboard();
}

void loop() {
  const uint32_t now = millis();
  for (uint8_t i = 0; i < NUM_KEYS; i++) {
    const bool raw = digitalRead(KEY_PINS[i]) == LOW;
    if (!debouncers[i].update(raw, now)) continue;
    if (!debouncers[i].pressed()) continue;  // only react to the press, not the release

#if MAKROPAD_DEBUG
    Serial.printf("T%u pressed\n", i + 1);
#endif
    const KeyAction& action = actionForKey(i);
    if (action.steps != nullptr) playSteps(action.steps, action.count);
  }
}
