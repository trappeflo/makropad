package dev.makropad.backend.profile;

/** Es gibt kein Profil mit dem angefragten Namen. */
public class ProfileNotFoundException extends RuntimeException {

    /**
     * Erzeugt die Ausnahme.
     *
     * @param name gesuchter Name
     */
    public ProfileNotFoundException(String name) {
        super("Profil '" + name + "' nicht gefunden");
    }
}
