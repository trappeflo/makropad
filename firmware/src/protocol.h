/*
 * Zweck: Protokoll-Handler der Firmware (Issue #29, docs/protokoll-v1.md).
 * Inhalt: handleRequest() beantwortet eine Zeile (JSON) mit genau einer Antwortzeile. Befehle:
 *         device.info, profile.get, profile.set, profile.activate. Fehler kommen als Fehlerantwort mit den
 *         Codes des Protokolls. pollSerial() liest die serielle Schnittstelle zeilenweise und ruft den Handler.
 */
#pragma once

#include <Print.h>

// Answer one request line. Writes exactly one response line (ending in '\n') to out.
void handleRequest(const char* line, Print& out);

// Write the error response for a line that could not be read (id unknown, so 0).
void writeError(Print& out, long id, const char* code, const char* message);

// Read pending bytes from Serial, answer every complete line. Call it from loop().
void pollSerial();
