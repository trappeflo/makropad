/*
 * Zweck: Protokoll v1 auf der Firmware-Seite (Issue #29).
 * Inhalt: Prüfung der Anfrage (Version, id, cmd), die vier Befehle und die vollständige Prüfung eines Profils
 *         vor dem Speichern (Tastenzahl, Schrittzahl, Wertebereiche). Das Profil wird unverändert als Text
 *         abgelegt, die Schritte werden zusätzlich in Strukturen gelesen. Die Absicht (intent) wird nie
 *         ausgewertet. Die Antwort wird immer als eine Zeile geschrieben.
 */
#include "protocol.h"

#include <Arduino.h>
#include <ArduinoJson.h>

#include "actions.h"
#include "config.h"
#include "line_reader.h"
#include "profile_store.h"

namespace {

constexpr const char* FIRMWARE_VERSION = "0.1.0";
constexpr size_t MAX_NAME_LENGTH = 64;
constexpr size_t MAX_LABEL_LENGTH = 64;
constexpr int MAX_DELAY_MS = 10000;

// Error with a protocol code (docs/protokoll-v1.md, section 5). The firmware is built without exceptions,
// so functions return false and fill this in.
struct RequestError {
  const char* code = "";
  String message;
};

bool fail(RequestError& error, const char* code, const String& message) {
  error.code = code;
  error.message = message;
  return false;
}

bool isIntIn(JsonVariantConst v, int min, int max) {
  if (!v.is<int>()) return false;
  const int value = v.as<int>();
  return value >= min && value <= max;
}

// Read the slot index of a request: integer, 0 <= index < NUM_PROFILES.
bool readSlot(JsonVariantConst v, uint8_t& index, RequestError& error) {
  if (!v.is<int>()) return fail(error, "BAD_REQUEST", "index missing");
  const int value = v.as<int>();
  if (value < 0 || value >= NUM_PROFILES) return fail(error, "OUT_OF_RANGE", "index " + String(value));
  index = static_cast<uint8_t>(value);
  return true;
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

// Check a whole profile and fill the candidate. Nothing is stored here.
bool readProfile(JsonVariantConst v, StoredProfile& profile, RequestError& error) {
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

void writeResponse(Print& out, JsonDocument& response) {
  serializeJson(response, out);
  out.write('\n');
}

void handleInfo(JsonDocument& response) {
  response["protocol"] = 1;
  response["firmware"] = FIRMWARE_VERSION;
  response["keys"] = NUM_KEYS;
  response["profiles"] = NUM_PROFILES;
  response["activeProfile"] = activeProfile();
  response["persistent"] = profileStore.persistent();
  response["limits"]["maxSteps"] = MAX_STEPS;
  response["limits"]["maxMessageBytes"] = MAX_MESSAGE_BYTES;
}

bool handleGet(JsonVariantConst request, JsonDocument& response, RequestError& error) {
  uint8_t index = 0;
  if (!readSlot(request["index"], index, error)) return false;
  if (profileStore.isUsed(index)) {
    response["profile"] = serialized(profileStore.json(index));
  } else {
    // A slot that was never written is an empty profile.
    JsonObject profile = response["profile"].to<JsonObject>();
    profile["name"] = "";
    profile["layout"] = "de-DE";
    JsonArray keys = profile["keys"].to<JsonArray>();
    for (uint8_t i = 0; i < NUM_KEYS; i++) keys.add(nullptr);
  }
  return true;
}

bool handleSet(JsonVariantConst request, RequestError& error) {
  uint8_t index = 0;
  if (!readSlot(request["index"], index, error)) return false;
  // Check everything first, so a failed write leaves the old profile untouched.
  StoredProfile candidate;
  if (!readProfile(request["profile"], candidate, error)) return false;
  if (!profileStore.save(index, static_cast<StoredProfile&&>(candidate))) {
    return fail(error, "STORAGE_FAILED", "saving failed, old profile is unchanged");
  }
  return true;
}

bool handleActivate(JsonVariantConst request, JsonDocument& response, RequestError& error) {
  uint8_t index = 0;
  if (!readSlot(request["index"], index, error)) return false;
  setActiveProfile(index);
  response["activeProfile"] = activeProfile();
  return true;
}

LineReader<MAX_MESSAGE_BYTES> reader;

}  // namespace

void writeError(Print& out, long id, const char* code, const char* message) {
  JsonDocument response;
  response["v"] = 1;
  response["id"] = id;
  response["ok"] = false;
  response["error"]["code"] = code;
  response["error"]["message"] = message;
  writeResponse(out, response);
}

void handleRequest(const char* line, Print& out) {
  JsonDocument request;
  if (deserializeJson(request, line) != DeserializationError::Ok || !request.is<JsonObject>()) {
    writeError(out, 0, "BAD_REQUEST", "not a valid JSON object");
    return;
  }
  const long id = request["id"].is<long>() ? request["id"].as<long>() : 0;
  if (!request["v"].is<int>() || request["v"].as<int>() != 1) {
    writeError(out, id, "UNSUPPORTED_VERSION", "only protocol 1 is supported");
    return;
  }
  if (!request["id"].is<long>()) {
    writeError(out, 0, "BAD_REQUEST", "id missing");
    return;
  }
  if (!request["cmd"].is<const char*>()) {
    writeError(out, id, "BAD_REQUEST", "cmd missing");
    return;
  }
  const char* cmd = request["cmd"].as<const char*>();

  JsonDocument response;
  response["v"] = 1;
  response["id"] = id;
  response["ok"] = true;

  RequestError error;
  bool ok = true;
  if (strcmp(cmd, "device.info") == 0) {
    handleInfo(response);
  } else if (strcmp(cmd, "profile.get") == 0) {
    ok = handleGet(request, response, error);
  } else if (strcmp(cmd, "profile.set") == 0) {
    ok = handleSet(request, error);
  } else if (strcmp(cmd, "profile.activate") == 0) {
    ok = handleActivate(request, response, error);
  } else {
    ok = fail(error, "UNKNOWN_CMD", cmd);
  }

  if (!ok) {
    writeError(out, id, error.code, error.message.c_str());
    return;
  }
  writeResponse(out, response);
}

void pollSerial() {
  while (Serial.available() > 0) {
    switch (reader.feed(static_cast<char>(Serial.read()))) {
      case LineReader<MAX_MESSAGE_BYTES>::Result::Line:
        handleRequest(reader.line(), Serial);
        break;
      case LineReader<MAX_MESSAGE_BYTES>::Result::TooLarge:
        writeError(Serial, 0, "TOO_LARGE", "message too large");
        break;
      case LineReader<MAX_MESSAGE_BYTES>::Result::None:
        break;
    }
  }
}
