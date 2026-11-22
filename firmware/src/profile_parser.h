/*
 * Zweck: Profil aus JSON lesen und vollständig prüfen (Issues #29, #30).
 * Inhalt: parseProfile() prüft ein Profil nach docs/protokoll-v1.md (Tastenzahl, Schrittzahl, Wertebereiche)
 *         und füllt daraus ein StoredProfile (Profiltext unverändert, Schritte als Strukturen). Wird für
 *         profile.set und beim Laden aus dem Flash benutzt. Die Absicht (intent) wird nie ausgewertet.
 *         RequestError trägt einen Protokoll-Fehlercode (die Firmware läuft ohne Exceptions).
 */
#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>

#include "profile_store.h"

struct RequestError {
  const char* code = "";
  String message;
};

// Fill the error and return false, so callers can write "return fail(...)".
bool fail(RequestError& error, const char* code, const String& message);

// Check a whole profile and fill the candidate. Nothing is stored here.
bool parseProfile(JsonVariantConst v, StoredProfile& profile, RequestError& error);
