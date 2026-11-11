package dev.makropad.backend.profile;

import java.time.Clock;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/** Fachlogik zum Sichern und Wiederherstellen von Profilen. */
@Service
@Transactional
public class ProfileService {

    private final ProfileRepository repository;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    /**
     * Erzeugt den Service.
     *
     * @param repository Zugriff auf die Datenbank
     * @param jsonMapper wandelt Profile in JSON und zurück
     * @param clock      Zeitquelle, in Tests austauschbar
     */
    public ProfileService(ProfileRepository repository, JsonMapper jsonMapper, Clock clock) {
        this.repository = repository;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
    }

    /**
     * Liefert alle gesicherten Profile, sortiert nach Name.
     *
     * @return Profile, leer wenn nichts gesichert ist
     */
    @Transactional(readOnly = true)
    public List<Profile> findAll() {
        return repository.findAllByOrderByNameAsc().stream().map(this::toProfile).toList();
    }

    /**
     * Liefert ein Profil.
     *
     * @param name Name des Profils
     * @return das Profil
     * @throws ProfileNotFoundException wenn es kein Profil mit diesem Namen gibt
     */
    @Transactional(readOnly = true)
    public Profile get(String name) {
        return repository.findById(name).map(this::toProfile)
                .orElseThrow(() -> new ProfileNotFoundException(name));
    }

    /**
     * Legt ein neues Profil an.
     *
     * @param profile das Profil
     * @return das gespeicherte Profil
     * @throws ProfileAlreadyExistsException wenn der Name bereits vergeben ist
     */
    public Profile create(Profile profile) {
        if (repository.existsById(profile.name())) {
            throw new ProfileAlreadyExistsException(profile.name());
        }
        repository.save(new ProfileEntity(profile.name(), toJson(profile), clock.instant()));
        return profile;
    }

    /**
     * Ersetzt ein vorhandenes Profil. Der Name im Profil muss dem Namen in der Adresse entsprechen,
     * ein Umbenennen ist nicht vorgesehen.
     *
     * @param name    Name aus der Adresse
     * @param profile das neue Profil
     * @return das gespeicherte Profil
     * @throws ProfileNameMismatchException wenn der Name im Profil abweicht
     * @throws ProfileNotFoundException     wenn es kein Profil mit diesem Namen gibt
     */
    public Profile update(String name, Profile profile) {
        if (!name.equals(profile.name())) {
            throw new ProfileNameMismatchException(name, profile.name());
        }
        ProfileEntity entity = repository.findById(name).orElseThrow(() -> new ProfileNotFoundException(name));
        entity.update(toJson(profile), clock.instant());
        return profile;
    }

    /**
     * Löscht ein Profil.
     *
     * @param name Name des Profils
     * @throws ProfileNotFoundException wenn es kein Profil mit diesem Namen gibt
     */
    public void delete(String name) {
        if (!repository.existsById(name)) {
            throw new ProfileNotFoundException(name);
        }
        repository.deleteById(name);
    }

    private String toJson(Profile profile) {
        try {
            return jsonMapper.writeValueAsString(profile);
        } catch (JacksonException e) {
            throw new IllegalStateException("Profil lässt sich nicht als JSON speichern", e);
        }
    }

    private Profile toProfile(ProfileEntity entity) {
        try {
            return jsonMapper.readValue(entity.getContent(), Profile.class);
        } catch (JacksonException e) {
            throw new IllegalStateException("Gespeichertes Profil '" + entity.getName() + "' ist nicht lesbar", e);
        }
    }
}
