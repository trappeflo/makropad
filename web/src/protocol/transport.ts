/*
 * Zweck: Schnittstelle zwischen Protokoll-Client und Verbindung zum Pad (Issue #12).
 * Inhalt: Interface Transport. Es arbeitet zeilenweise, das Zerlegen des Byte-Stroms in Zeilen liegt in der
 *         jeweiligen Verbindung (WebSerial in #11, Mock des Geräts in #13).
 */

/** A line-based connection to the pad. A line is one JSON message without the trailing newline. */
export interface Transport {
  /** Sends one line. The implementation appends the newline. */
  send(line: string): void
  /** Registers a listener for incoming lines and returns a function that removes it again. */
  onLine(listener: (line: string) => void): () => void
}
