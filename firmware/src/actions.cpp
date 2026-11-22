/*
 * Zweck: Abspielen von Schritten über die USB-Tastatur und die eingebaute Beispielbelegung (Issue #24).
 * Inhalt: Der Tastatur-Treiber (Arduino USBHIDKeyboard) wird mit fertigen HID-Reports angesteuert, damit
 *         das Tastaturlayout des Rechners keine Rolle spielt (print() würde US-Codes senden, siehe
 *         docs/hardware-spike.md). Darunter die Beispielbelegung beider Profile als HID-Codes und das aktive Profil (Issue #27).
 */
#include "actions.h"

#include <Arduino.h>
#include <USB.h>
#include <USBHIDKeyboard.h>

namespace {

USBHIDKeyboard keyboard;

constexpr uint16_t HOLD_MS = 10;  // time between press and release report

void sendKey(uint8_t mod, uint8_t key) {
  KeyReport report = {};
  report.modifiers = mod;
  report.keys[0] = key;
  keyboard.sendReport(&report);
  delay(HOLD_MS);
  KeyReport release = {};
  keyboard.sendReport(&release);
  delay(HOLD_MS);
}

// HID usage IDs (USB HID usage table, keyboard page). Letters are layout independent for a..x
// (z and y are swapped on a German keyboard, so they are not used here).
constexpr uint8_t HID_A = 0x04, HID_E = 0x08, HID_G = 0x0A, HID_I = 0x0C, HID_L = 0x0F, HID_M = 0x10,
                  HID_N = 0x11, HID_P = 0x13, HID_R = 0x15, HID_S = 0x16, HID_T = 0x17, HID_U = 0x18,
                  HID_ENTER = 0x28, HID_SPACE = 0x2C;
constexpr uint8_t HID_Z_DE = 0x1C;  // HID code 0x1C is "Y" in US layout and "Z" in German layout

// T1: command palette Ctrl+Shift+P
constexpr Step T1[] = {press(MOD_CTRL | MOD_SHIFT, HID_P)};
// T2: "git status" + Enter
constexpr Step T2[] = {press(0, HID_G), press(0, HID_I), press(0, HID_T), press(0, HID_SPACE),
                       press(0, HID_S), press(0, HID_T), press(0, HID_A), press(0, HID_T),
                       press(0, HID_U), press(0, HID_S), press(0, HID_ENTER)};
// T3: Windows key, wait, "terminal", Enter
constexpr Step T3[] = {press(MOD_GUI, 0), pause(500), press(0, HID_T), press(0, HID_E), press(0, HID_R),
                       press(0, HID_M), press(0, HID_I), press(0, HID_N), press(0, HID_A),
                       press(0, HID_L), pause(300), press(0, HID_ENTER)};
// T4: undo Ctrl+Z (HID code of "Z" on a German keyboard is 0x1C)
constexpr Step T4[] = {press(MOD_CTRL, HID_Z_DE)};

template <size_t N>
constexpr KeyAction make(const Step (&steps)[N]) {
  return {steps, N};
}

// Profile 2 "Büro/Meeting" (docs/anforderungen.md)
constexpr uint8_t HID_TAB = 0x2B;
// T1: Teams mute Ctrl+Shift+M
constexpr Step B1[] = {press(MOD_CTRL | MOD_SHIFT, HID_M)};
// T2: Teams screen sharing Ctrl+Shift+E
constexpr Step B2[] = {press(MOD_CTRL | MOD_SHIFT, HID_E)};
// T4: Alt+Tab
constexpr Step B4[] = {press(MOD_ALT, HID_TAB)};

// T3 of profile 2 (mail address) is a placeholder and stays unassigned.
const KeyAction PROFILES[NUM_PROFILES][NUM_KEYS] = {
    {make(T1), make(T2), make(T3), make(T4)},
    {make(B1), make(B2), {nullptr, 0}, make(B4)},
};

uint8_t active = 0;

}  // namespace

void initKeyboard() {
  keyboard.begin();
  USB.productName("Makropad");
  USB.manufacturerName("Makropad");
  USB.begin();
}

void playSteps(const Step* steps, size_t count) {
  for (size_t i = 0; i < count; i++) {
    if (steps[i].isDelay) {
      delay(steps[i].ms);
    } else {
      sendKey(steps[i].mod, steps[i].key);
    }
  }
}

const KeyAction& actionForKey(uint8_t keyIndex) { return PROFILES[active][keyIndex]; }

uint8_t activeProfile() { return active; }

uint8_t nextProfile() {
  active = (active + 1) % NUM_PROFILES;
  return active;
}
