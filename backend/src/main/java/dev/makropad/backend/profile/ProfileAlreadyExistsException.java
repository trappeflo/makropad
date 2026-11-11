package dev.makropad.backend.profile;

/** Ein Profil mit diesem Namen gibt es schon. */
public class ProfileAlreadyExistsException extends RuntimeException {

    /**
     * Erzeugt die Ausnahme.
     *
     * @param name bereits vergebener Name
     */
    public ProfileAlreadyExistsException(String name) {
        super("Profil '" + name + "' existiert bereits");
    }
}
