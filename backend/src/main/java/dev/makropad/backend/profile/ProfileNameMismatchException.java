package dev.makropad.backend.profile;

/** Der Name in der Adresse stimmt nicht mit dem Namen im Profil überein. */
public class ProfileNameMismatchException extends RuntimeException {

    /**
     * Erzeugt die Ausnahme.
     *
     * @param pathName Name aus der Adresse
     * @param bodyName Name aus dem Profil
     */
    public ProfileNameMismatchException(String pathName, String bodyName) {
        super("Name in der Adresse ('" + pathName + "') und im Profil ('" + bodyName
                + "') müssen übereinstimmen. Umbenennen ist nicht vorgesehen.");
    }
}
