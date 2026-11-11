/*
 * Spike #43, Test 1: Onboard-LED und serielle Schnittstelle im USB-Serial/JTAG-Modus.
 *
 * Zweck: herausfinden, an welchem Pin die Onboard-LED hängt und ob sie einfarbig oder RGB ist (R8),
 * und prüfen, dass die serielle Schnittstelle über die native USB-Buchse funktioniert.
 *
 * Inhalt: Beim Start leuchtet eine RGB-LED an GPIO 48 nacheinander rot, grün, blau. Über den seriellen
 * Monitor lässt sich ein anderer Pin ausprobieren:
 *   n<pin>   RGB-LED (NeoPixel) an diesem Pin: rot, grün, blau, aus   z. B. n48
 *   l<pin>   einfache LED an diesem Pin: viermal blinken              z. B. l47
 *   i        Chip-Infos ausgeben
 */
#include <Arduino.h>

static void printHelp() {
  Serial.println("Befehle: n<pin> RGB testen, l<pin> einfache LED blinken, i Infos");
}

static void printInfo() {
  Serial.printf("Chip: %s, Revision %d, %d Kerne, %lu MHz\n", ESP.getChipModel(), ESP.getChipRevision(),
                ESP.getChipCores(), (unsigned long)ESP.getCpuFreqMHz());
  Serial.printf("Flash: %lu KB, Sketch: %lu KB, freier Heap: %lu KB\n",
                (unsigned long)(ESP.getFlashChipSize() / 1024), (unsigned long)(ESP.getSketchSize() / 1024),
                (unsigned long)(ESP.getFreeHeap() / 1024));
#ifdef LED_BUILTIN
  Serial.printf("LED_BUILTIN = %d\n", LED_BUILTIN);
#endif
#ifdef RGB_BUILTIN
  Serial.printf("RGB_BUILTIN = %d\n", RGB_BUILTIN);
#endif
}

static void testRgb(int pin) {
  Serial.printf("RGB an GPIO %d: rot, grün, blau, aus\n", pin);
  const uint8_t colors[4][3] = {{32, 0, 0}, {0, 32, 0}, {0, 0, 32}, {0, 0, 0}};
  for (const auto& c : colors) {
    neopixelWrite(pin, c[0], c[1], c[2]);
    delay(700);
  }
}

static void testPlain(int pin) {
  Serial.printf("Einfache LED an GPIO %d: 4x blinken\n", pin);
  pinMode(pin, OUTPUT);
  for (int i = 0; i < 4; i++) {
    digitalWrite(pin, HIGH);
    delay(300);
    digitalWrite(pin, LOW);
    delay(300);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);  // Zeit, den Monitor zu öffnen
  Serial.println("Spike #43 led_serial gestartet");
  printInfo();
  printHelp();
  testRgb(48);
}

void loop() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) return;
    char cmd = line.charAt(0);
    int pin = line.substring(1).toInt();
    if (cmd == 'n') {
      testRgb(pin);
    } else if (cmd == 'l') {
      testPlain(pin);
    } else if (cmd == 'i') {
      printInfo();
    } else {
      printHelp();
    }
  }
}
