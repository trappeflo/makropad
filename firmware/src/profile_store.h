/*
 * Zweck: Profile im Pad speichern und für die Tasten bereithalten (Issues #29, #30).
 * Inhalt: Datentypen StoredKey und StoredProfile sowie die Klasse ProfileStore mit den Profil-Slots.
 *         Je Slot liegen der Profiltext (unverändert wie empfangen, für profile.get) und die daraus
 *         gelesenen Schritte je Taste (maßgeblich für das Abspielen). Der Profiltext liegt zusätzlich im
 *         Flash (NVS, Issue #30) und wird beim Start gelesen und neu geprüft.
 */
#pragma once

#include <Arduino.h>

#include "actions.h"
#include "config.h"

// Limits reported by device.info (docs/protokoll-v1.md). Placeholders until measured in the spike (#43).
constexpr size_t MAX_STEPS = 32;
constexpr size_t MAX_MESSAGE_BYTES = 4096;

struct StoredKey {
  uint8_t count = 0;  // 0 = key not assigned
  Step steps[MAX_STEPS];
};

struct StoredProfile {
  bool used = false;  // false = slot was never written
  String json;        // profile object as received, returned unchanged by profile.get
  StoredKey keys[NUM_KEYS];
};

class ProfileStore {
 public:
  bool isUsed(uint8_t index) const { return slots_[index].used; }
  const String& json(uint8_t index) const { return slots_[index].json; }
  const StoredKey& key(uint8_t index, uint8_t keyIndex) const { return slots_[index].keys[keyIndex]; }

  // Open the flash storage and load the stored profiles. Call it once in setup(). If the flash cannot be
  // opened, the store works in RAM only (persistent() is false).
  void begin();

  // Store a checked profile in a slot (flash first, then RAM). Returns false if storing failed, the old
  // profile stays then.
  bool save(uint8_t index, StoredProfile&& profile);

  // true = profiles survive a restart (flash), false = RAM only.
  bool persistent() const { return persistent_; }

 private:
  StoredProfile slots_[NUM_PROFILES];
  bool persistent_ = false;
};

extern ProfileStore profileStore;
