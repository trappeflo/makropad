/*
 * Spike #43, Test 2: USB-Tastatur und serielle Schnittstelle gleichzeitig (USB-OTG/TinyUSB, Issue #31).
 *
 * Zweck: klären, ob das Board am selben USB-Kabel eine Tastatur (HID) und eine serielle Schnittstelle
 * anbietet, die der Browser per WebSerial nutzen kann (Risiko R1, ADR 0004).
 *
 * Inhalt: Das Board meldet sich als "Makropad Spike" mit Tastatur und serieller Schnittstelle. Es tippt NIE
 * von selbst. Nur auf einen Befehl über die serielle Schnittstelle:
 *   ping   antwortet mit "pong"
 *   type   tippt einmalig den Text "makropad-test" per keyboard.print() (US-Codes, Bindestrich wird zu ß!)
 *   raw    tippt "makropad-test" mit rohen HID-Codes für ein deutsches Layout (Bindestrich = Taste "/")
 *   combo  sendet Strg+Umschalt+M (Teams-Mute-Kürzel, nur zum Testen)
 */
#include <Arduino.h>
#include <USB.h>
#include <USBHIDKeyboard.h>

USBHIDKeyboard keyboard;

void setup() {
  Serial.begin(115200);
  keyboard.begin();
  USB.productName("Makropad Spike");
  USB.manufacturerName("Makropad");
  USB.begin();
}

void loop() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line == "ping") {
    Serial.println("pong");
  } else if (line == "type") {
    Serial.println("tippe makropad-test");
    keyboard.print("makropad-test");
  } else if (line == "raw") {
    // HID-Usage-IDs: m a k r o p a d - t e s t. Der Bindestrich liegt im deutschen Layout auf 0x38.
    const uint8_t codes[] = {0x10, 0x04, 0x0E, 0x15, 0x12, 0x13, 0x04, 0x07, 0x38, 0x17, 0x08, 0x16, 0x17};
    Serial.println("tippe makropad-test mit rohen Codes");
    for (uint8_t code : codes) {
      keyboard.pressRaw(code);
      keyboard.releaseRaw(code);
      delay(10);
    }
  } else if (line == "combo") {
    Serial.println("sende Strg+Umschalt+M");
    keyboard.press(KEY_LEFT_CTRL);
    keyboard.press(KEY_LEFT_SHIFT);
    keyboard.press('m');
    delay(50);
    keyboard.releaseAll();
  } else if (line.length() > 0) {
    Serial.println("Befehle: ping, type, raw, combo");
  }
}
