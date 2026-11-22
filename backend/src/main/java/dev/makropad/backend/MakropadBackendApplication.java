package dev.makropad.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Backend zum Sichern und Wiederherstellen der Profile des Makropads (ADR 0005). */
@SpringBootApplication
public class MakropadBackendApplication {

	/** Wird von Spring benötigt. */
	public MakropadBackendApplication() {
	}

	/**
	 * Startet die Anwendung.
	 *
	 * @param args Kommandozeilenargumente
	 */
	public static void main(String[] args) {
		SpringApplication.run(MakropadBackendApplication.class, args);
	}

}
