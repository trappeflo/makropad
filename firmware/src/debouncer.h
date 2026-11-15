/*
 * Zweck: Entprellen eines einzelnen Eingangs (Issue #23).
 * Inhalt: Klasse Debouncer. Sie kennt weder Arduino noch Pins und bekommt nur den rohen Pegel und die
 *         Zeit, damit die Logik ohne Hardware nachvollziehbar bleibt.
 */
#pragma once

#include <stdint.h>

class Debouncer {
 public:
  explicit Debouncer(uint32_t stableMs) : stableMs_(stableMs) {}

  // Feed the raw level (true = pressed) and the current time in ms.
  // Returns true exactly once per accepted level change; read it with pressed().
  bool update(bool rawPressed, uint32_t nowMs) {
    if (rawPressed != candidate_) {
      candidate_ = rawPressed;  // level changed: start measuring stability again
      changedAt_ = nowMs;
      return false;
    }
    if (candidate_ != stable_ && nowMs - changedAt_ >= stableMs_) {
      stable_ = candidate_;
      return true;
    }
    return false;
  }

  bool pressed() const { return stable_; }

 private:
  uint32_t stableMs_;
  bool stable_ = false;
  bool candidate_ = false;
  uint32_t changedAt_ = 0;
};
