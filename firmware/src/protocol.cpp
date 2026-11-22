/*
 * Zweck: Protokoll v1 auf der Firmware-Seite (Issue #29).
 * Inhalt: Prüfung der Anfrage (Version, id, cmd) und die vier Befehle. Die Prüfung eines Profils liegt in
 *         profile_parser.cpp. Die Antwort wird immer als eine Zeile geschrieben.
 */
#include "protocol.h"

#include <Arduino.h>
#include <ArduinoJson.h>

#include "actions.h"
#include "config.h"
#include "line_reader.h"
#include "profile_parser.h"
#include "profile_store.h"

namespace {

constexpr const char* FIRMWARE_VERSION = "0.1.0";

// Read the slot index of a request: integer, 0 <= index < NUM_PROFILES.
bool readSlot(JsonVariantConst v, uint8_t& index, RequestError& error) {
  if (!v.is<int>()) return fail(error, "BAD_REQUEST", "index missing");
  const int value = v.as<int>();
  if (value < 0 || value >= NUM_PROFILES) return fail(error, "OUT_OF_RANGE", "index " + String(value));
  index = static_cast<uint8_t>(value);
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
  if (!parseProfile(request["profile"], candidate, error)) return false;
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
