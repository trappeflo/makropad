/*
 * Zweck: Hardware-Konfiguration des Makropads an einer Stelle.
 * Inhalt: Anzahl und GPIO-Pins der Tasten, Entprellzeit. Die Belegung entspricht der Verdrahtung
 *         des Prototyps (Direktverdrahtung, Taste zwischen GPIO und GND, interner Pull-up).
 */
#pragma once

#include <Arduino.h>

constexpr uint8_t NUM_KEYS = 4;

// GPIO of key 1..4. GPIO 3 is a strapping pin and stays unused. GPIO 0 (BOOT) is untouched.
constexpr uint8_t KEY_PINS[NUM_KEYS] = {1, 2, 4, 5};

// A level change must stay stable this long before it counts as a press or release.
constexpr uint32_t DEBOUNCE_MS = 10;
