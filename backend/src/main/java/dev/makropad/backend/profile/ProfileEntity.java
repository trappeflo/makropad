package dev.makropad.backend.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Gespeicherte Kopie eines Profils. Das Profil liegt als JSON in einer Spalte (Format Protokoll v1),
 * der Name ist der Schlüssel.
 */
@Entity
@Table(name = "profile")
public class ProfileEntity {

    @Id
    @Column(length = Profile.NAME_MAX_LENGTH)
    private String name;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private Instant updatedAt;

    /** Wird von JPA benötigt. */
    protected ProfileEntity() {
    }

    /**
     * Erzeugt einen Eintrag.
     *
     * @param name      Name des Profils
     * @param content   Profil als JSON
     * @param updatedAt Zeitpunkt der letzten Änderung
     */
    public ProfileEntity(String name, String content, Instant updatedAt) {
        this.name = name;
        this.content = content;
        this.updatedAt = updatedAt;
    }

    public String getName() {
        return name;
    }

    public String getContent() {
        return content;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Ersetzt den Inhalt.
     *
     * @param content   neues Profil als JSON
     * @param updatedAt Zeitpunkt der Änderung
     */
    public void update(String content, Instant updatedAt) {
        this.content = content;
        this.updatedAt = updatedAt;
    }
}
