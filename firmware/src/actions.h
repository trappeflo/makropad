/*
 * Zweck: Aktionen einer Taste als rohe HID-Schritte (Issue #24).
 * Inhalt: Datentyp Step (Kombination oder Pause), Hilfsfunktionen zum Schreiben von Schritten,
 *         playSteps() zum Abspielen über die USB-Tastatur die fest eingebaute Beispielbelegung beider Profile und das aktive Profil.
 *         Die Schritte entsprechen Protokoll v1: {mod, key} als HID-Modifier-Bitmaske und HID-Usage-ID,
 *         {delay} als Pause. Text wird nie in der Firmware umgerechnet, das macht die Web-App (de-DE).
 */
#pragma once

#include <stddef.h>
#include <stdint.h>

#include "config.h"

// HID modifier bitmask (USB HID spec): left Ctrl, Shift, Alt, GUI (Windows key).
constexpr uint8_t MOD_CTRL = 0x01;
constexpr uint8_t MOD_SHIFT = 0x02;
constexpr uint8_t MOD_ALT = 0x04;
constexpr uint8_t MOD_GUI = 0x08;

struct Step {
  bool isDelay;
  uint8_t mod;
  uint8_t key;
  uint16_t ms;
};

constexpr Step press(uint8_t mod, uint8_t key) { return {false, mod, key, 0}; }
constexpr Step pause(uint16_t ms) { return {true, 0, 0, ms}; }

struct KeyAction {
  const Step* steps;  // nullptr = key not assigned
  size_t count;
};

// Start the USB keyboard (HID) together with the serial interface.
void initKeyboard();

// Press and release every step in order. Delay steps wait. Blocks until finished.
void playSteps(const Step* steps, size_t count);

// Action of a key in the active profile. A slot written via the protocol (profile store) wins. A slot
// that was never written plays the built-in example profiles "Programmierung" and "Büro/Meeting"
// (docs/anforderungen.md).
const KeyAction& actionForKey(uint8_t keyIndex);

// Index of the active profile (0 after power-up).
uint8_t activeProfile();

// Activate a profile by index. Returns false if the index is out of range.
bool setActiveProfile(uint8_t index);

// Switch to the next profile (wraps around) and return its index.
uint8_t nextProfile();
