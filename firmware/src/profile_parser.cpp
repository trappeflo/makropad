/*
 * Zweck: Prüfung und Lesen eines Profils (Issues #29, #30), siehe profile_parser.h.
 * Inhalt: Prüfung von Schritt, Taste und Profil. Das Profil wird unverändert als Text im StoredProfile
 *         abgelegt, die Schritte zusätzlich als Strukturen.
 */
#include "profile_parser.h"

bool fail(RequestError& error, const char* code, const String& message) {
  error.code = code;
  error.message = message;
  return false;
}

namespace {

constexpr size_t MAX_NAME_LENGTH = 64;
constexpr size_t MAX_LABEL_LENGTH = 64;
constexpr int MAX_DELAY_MS = 10000;

bool isIntIn(JsonVariantConst v, int min, int max) {
  if (!v.is<int>()) return false;
  const int value = v.as<int>();
  return value >= min && value <= max;
}

bool readStep(JsonVariantConst v, Step& step, const String& where, RequestError& error) {
  if (!v.is<JsonObjectConst>()) return fail(error, "BAD_REQUEST", where + " is not an object");
  JsonObjectConst object = v.as<JsonObjectConst>();
  if (object["delay"].is<int>()) {
    if (!isIntIn(object["delay"], 0, MAX_DELAY_MS)) return fail(error, "BAD_REQUEST", where + ".delay out of range");
    step = pause(static_cast<uint16_t>(object["delay"].as<int>()));
    return true;
  }
  if (!isIntIn(object["mod"], 0, 255) || !isIntIn(object["key"], 0, 255)) {
    return fail(error, "BAD_REQUEST", where + " needs mod and key (0..255) or delay");
  }
  step = press(static_cast<uint8_t>(object["mod"].as<int>()), static_cast<uint8_t>(object["key"].as<int>()));
  return true;
}

bool readKey(JsonVariantConst v, StoredKey& key, const String& where, RequestError& error) {
  key.count = 0;
  if (v.isNull()) return true;  // unassigned key
  if (!v.is<JsonObjectConst>()) return fail(error, "BAD_REQUEST", where + " is not an object or null");
  JsonObjectConst object = v.as<JsonObjectConst>();

  const char* type = object["type"] | "";
  if (strcmp(type, "combo") != 0 && strcmp(type, "text") != 0 && strcmp(type, "macro") != 0) {
    return fail(error, "BAD_REQUEST", where + ".type unknown");
  }
  if (!object["label"].is<const char*>() || strlen(object["label"].as<const char*>()) > MAX_LABEL_LENGTH) {
    return fail(error, "BAD_REQUEST", where + ".label missing or too long");
  }
  if (!object["intent"].is<JsonObjectConst>()) return fail(error, "BAD_REQUEST", where + ".intent missing");
  if (!object["steps"].is<JsonArrayConst>()) return fail(error, "BAD_REQUEST", where + ".steps missing");

  JsonArrayConst steps = object["steps"].as<JsonArrayConst>();
  if (steps.size() == 0) return fail(error, "BAD_REQUEST", where + ".steps is empty");
  if (steps.size() > MAX_STEPS) return fail(error, "TOO_LARGE", "at most " + String(MAX_STEPS) + " steps per key");

  uint8_t count = 0;
  for (JsonVariantConst step : steps) {
    if (!readStep(step, key.steps[count], where + ".steps[" + String(count) + "]", error)) return false;
    count++;
  }
  key.count = count;
  return true;
}

}  // namespace

bool parseProfile(JsonVariantConst v, StoredProfile& profile, RequestError& error) {
  if (!v.is<JsonObjectConst>()) return fail(error, "BAD_REQUEST", "profile missing");
  JsonObjectConst object = v.as<JsonObjectConst>();

  if (!object["name"].is<const char*>() || strlen(object["name"].as<const char*>()) > MAX_NAME_LENGTH) {
    return fail(error, "BAD_REQUEST", "profile.name missing or too long");
  }
  if (strcmp(object["layout"] | "", "de-DE") != 0) return fail(error, "BAD_REQUEST", "profile.layout must be de-DE");
  if (!object["keys"].is<JsonArrayConst>()) return fail(error, "BAD_REQUEST", "profile.keys missing");

  JsonArrayConst keys = object["keys"].as<JsonArrayConst>();
  if (keys.size() != NUM_KEYS) {
    return fail(error, "OUT_OF_RANGE", "expected " + String(NUM_KEYS) + " keys, got " + String(keys.size()));
  }
  uint8_t i = 0;
  for (JsonVariantConst key : keys) {
    if (!readKey(key, profile.keys[i], "keys[" + String(i) + "]", error)) return false;
    i++;
  }
  serializeJson(v, profile.json);  // stored unchanged, intent included
  return true;
}

