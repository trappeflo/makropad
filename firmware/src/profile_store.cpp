/*
 * Zweck: Speicher der Profil-Slots (Issues #29, #30).
 * Inhalt: Das globale ProfileStore-Objekt und save(). Bisher nur im RAM.
 */
#include "profile_store.h"

ProfileStore profileStore;

bool ProfileStore::save(uint8_t index, StoredProfile&& profile) {
  profile.used = true;
  slots_[index] = static_cast<StoredProfile&&>(profile);
  return true;
}
