/*
 * Zweck: Zeilen aus einem Bytestrom zusammensetzen (Issue #29, Protokoll v1 Abschnitt 1).
 * Inhalt: Klasse LineReader. Sie sammelt Zeichen bis zum Zeilenumbruch und meldet dann eine fertige Zeile.
 *         Ist die Zeile länger als der Puffer, wird sie bis zum nächsten Zeilenumbruch verworfen und als
 *         "zu groß" gemeldet. Leere Zeilen und '\r' werden ignoriert. Kennt weder Arduino noch die Schnittstelle.
 */
#pragma once

#include <stddef.h>

template <size_t CAPACITY>
class LineReader {
 public:
  enum class Result { None, Line, TooLarge };

  // Feed one received byte. Line: line() is valid until the next call. TooLarge: the line was dropped.
  Result feed(char c) {
    if (c == '\r') return Result::None;
    if (c == '\n') {
      const bool wasOverflow = overflow_;
      const size_t length = length_;
      length_ = 0;
      overflow_ = false;
      if (wasOverflow) return Result::TooLarge;
      if (length == 0) return Result::None;  // ignore empty lines
      buffer_[length] = '\0';
      return Result::Line;
    }
    if (overflow_) return Result::None;
    if (length_ >= CAPACITY) {
      overflow_ = true;
      return Result::None;
    }
    buffer_[length_++] = c;
    return Result::None;
  }

  const char* line() const { return buffer_; }

 private:
  char buffer_[CAPACITY + 1];
  size_t length_ = 0;
  bool overflow_ = false;
};
