/*
 * Zweck: Speicher der Profil-Slots im RAM und im Flash (Issues #29, #30).
 * Inhalt: Das globale ProfileStore-Objekt. begin() liest die Profiltexte aus dem Flash (NVS, Namensraum
 *         "makropad", Schlüssel "p0", "p1", ...) und prüft sie wie bei profile.set. Defekte Einträge werden
 *         ignoriert, der Slot gilt dann als nie beschrieben. save() schreibt zuerst in den Flash und erst bei
 *         Erfolg ins RAM, so bleibt bei einem Fehler das alte Profil unverändert.
 */
#include "profile_store.h"

#include <ArduinoJson.h>
#include <Preferences.h>

#include "profile_parser.h"

ProfileStore profileStore;

namespace {

Preferences preferences;
constexpr const char* NAMESPACE = "makropad";

String keyName(uint8_t index) { return "p" + String(index); }

}  // namespace

void ProfileStore::begin() {
  persistent_ = preferences.begin(NAMESPACE, false);
  if (!persistent_) return;

  for (uint8_t i = 0; i < NUM_PROFILES; i++) {
    const String name = keyName(i);
    const size_t length = preferences.getBytesLength(name.c_str());
    if (length == 0 || length > MAX_MESSAGE_BYTES) continue;

    // Read the whole blob once into a heap buffer (up to 4 KB, too big for the task stack).
    uint8_t* heap = static_cast<uint8_t*>(malloc(length + 1));
    if (heap == nullptr) continue;
    preferences.getBytes(name.c_str(), heap, length);
    heap[length] = '\0';

    JsonDocument document;
    StoredProfile loaded;
    RequestError error;
    if (deserializeJson(document, reinterpret_cast<const char*>(heap)) == DeserializationError::Ok &&
        parseProfile(document.as<JsonVariantConst>(), loaded, error)) {
      loaded.used = true;
      slots_[i] = static_cast<StoredProfile&&>(loaded);
    }
    free(heap);
  }
}

bool ProfileStore::save(uint8_t index, StoredProfile&& profile) {
  if (persistent_) {
    const size_t written = preferences.putBytes(keyName(index).c_str(), profile.json.c_str(), profile.json.length());
    if (written != profile.json.length()) return false;
  }
  profile.used = true;
  slots_[index] = static_cast<StoredProfile&&>(profile);
  return true;
}
