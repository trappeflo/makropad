/*
 * Zweck: Drehrichtung eines Quadratur-Drehreglers erkennen (Issue #26).
 * Inhalt: Klasse QuadratureDecoder. Sie kennt weder Arduino noch Pins und bekommt nur die Pegel von
 *         A und B. Eine Zustandstabelle wertet jeden Schritt aus und ignoriert ungültige Sprünge
 *         (Prellen), ein Rastpunkt (Detent) zählt erst nach einer vollständigen Schrittfolge.
 */
#pragma once

#include <stdint.h>

class QuadratureDecoder {
 public:
  // stepsPerDetent: Quadratur-Schritte je Rastpunkt (4 bei den meisten Drehreglern, manche haben 2).
  explicit QuadratureDecoder(int8_t stepsPerDetent = 4) : stepsPerDetent_(stepsPerDetent) {}

  // Feed the current levels of A and B (true = high). Call it as often as possible.
  // Returns +1 or -1 when a full detent was turned, otherwise 0.
  int8_t update(bool a, bool b) {
    const uint8_t current = (a ? 2 : 0) | (b ? 1 : 0);
    // Index = previous state (2 bits) and current state (2 bits). A valid move changes exactly one bit.
    static const int8_t TABLE[16] = {0, -1, 1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, -1, 0};
    accumulated_ += TABLE[(previous_ << 2) | current];
    previous_ = current;

    if (accumulated_ >= stepsPerDetent_) {
      accumulated_ = 0;
      return 1;
    }
    if (accumulated_ <= -stepsPerDetent_) {
      accumulated_ = 0;
      return -1;
    }
    return 0;
  }

 private:
  int8_t stepsPerDetent_;
  uint8_t previous_ = 3;  // both inputs idle high (internal pull-up)
  int8_t accumulated_ = 0;
};
