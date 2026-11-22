/*
 * Zweck: Einstiegspunkt der Firmware (Issue #21): Tasten lesen, entprellen, Aktion senden.
 * Inhalt: setup() richtet Pins und USB ein, loop() fragt alle Tasten ab und spielt bei einem
 *         akzeptierten Tastendruck die Schritte der Taste ab. Der Drehregler (#26) wird abgefragt und
 *         die Drehrichtung ausgegeben. Ein Druck auf den Drehregler schaltet das Profil um (#27).
 *         Protokoll-Handler (#29) und Flash (#30) folgen in eigenen Issues.
 */
#include <Arduino.h>

#include "actions.h"
#include "config.h"
#include "debouncer.h"
#include "encoder.h"

Debouncer debouncers[NUM_KEYS] = {Debouncer(DEBOUNCE_MS), Debouncer(DEBOUNCE_MS), Debouncer(DEBOUNCE_MS),
                                  Debouncer(DEBOUNCE_MS)};

QuadratureDecoder encoder(ENCODER_STEPS_PER_DETENT);
Debouncer encoderButton(DEBOUNCE_MS);

void setup() {
#if MAKROPAD_DEBUG
  Serial.begin(115200);
#endif
  for (uint8_t i = 0; i < NUM_KEYS; i++) {
    pinMode(KEY_PINS[i], INPUT_PULLUP);  // key connects pin to GND, so LOW = pressed
  }
  pinMode(ENCODER_PIN_A, INPUT_PULLUP);
  pinMode(ENCODER_PIN_B, INPUT_PULLUP);
  pinMode(ENCODER_PIN_BUTTON, INPUT_PULLUP);
  initKeyboard();
}

void loop() {
  const uint32_t now = millis();

  const int8_t turn = encoder.update(digitalRead(ENCODER_PIN_A) == HIGH, digitalRead(ENCODER_PIN_B) == HIGH);
  if (turn != 0) {
#if MAKROPAD_DEBUG
    Serial.printf("ENC %+d\n", turn);
#endif
    // Turning is not assigned in the MVP (R12 is only a Could).
  }

  // Press on the encoder switches to the next profile (R4).
  if (encoderButton.update(digitalRead(ENCODER_PIN_BUTTON) == LOW, now) && encoderButton.pressed()) {
    const uint8_t profile = nextProfile();
#if MAKROPAD_DEBUG
    Serial.printf("Profile %u\n", profile + 1);
#else
    (void)profile;
#endif
  }

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
