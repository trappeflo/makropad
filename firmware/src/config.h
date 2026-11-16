/*
 * Zweck: Hardware-Konfiguration des Makropads an einer Stelle.
 * Inhalt: Anzahl und GPIO-Pins der Tasten, Entprellzeit, Pins und Rastung des Drehreglers. Die Belegung entspricht der Verdrahtung
 *         des Prototyps (Direktverdrahtung, Taste zwischen GPIO und GND, interner Pull-up).
 */
#pragma once

#include <Arduino.h>

constexpr uint8_t NUM_KEYS = 4;

// GPIO of key 1..4. GPIO 3 is a strapping pin and stays unused. GPIO 0 (BOOT) is untouched.
constexpr uint8_t KEY_PINS[NUM_KEYS] = {1, 2, 4, 5};

// A level change must stay stable this long before it counts as a press or release.
constexpr uint32_t DEBOUNCE_MS = 10;

// Rotary encoder (channels A and B to GND, internal pull-up). Pins as documented in firmware/README.md.
// Swap the two pins if the direction is reversed. The encoder push button (GPIO 13) is not used yet.
constexpr uint8_t ENCODER_PIN_A = 11;
constexpr uint8_t ENCODER_PIN_B = 12;

// Quadrature steps per detent: 4 for most encoders, 2 for some cheap ones.
constexpr int8_t ENCODER_STEPS_PER_DETENT = 4;
