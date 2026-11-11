package dev.makropad.backend.profile;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * REST-API zum Sichern und Wiederherstellen von Profilen. Der Name im Pfad ist der Schlüssel.
 * Fehler werden als Problem Details (RFC 9457) geliefert.
 */
@RestController
@RequestMapping("/profiles")
public class ProfileController {

    private final ProfileService service;

    /**
     * Erzeugt den Controller.
     *
     * @param service Fachlogik
     */
    public ProfileController(ProfileService service) {
        this.service = service;
    }

    /**
     * Liefert alle gesicherten Profile.
     *
     * @return Profile, sortiert nach Name, 200
     */
    @GetMapping
    public List<Profile> list() {
        return service.findAll();
    }

    /**
     * Liefert ein Profil.
     *
     * @param name Name des Profils
     * @return das Profil, 200, oder 404
     */
    @GetMapping("/{name}")
    public Profile get(@PathVariable String name) {
        return service.get(name);
    }

    /**
     * Legt ein neues Profil an.
     *
     * @param profile das Profil
     * @return das Profil mit Adresse im Header {@code Location}, 201, oder 400 bei ungültigem Profil,
     *         oder 409 wenn der Name vergeben ist
     */
    @PostMapping
    public ResponseEntity<Profile> create(@Valid @RequestBody Profile profile) {
        Profile saved = service.create(profile);
        URI location = UriComponentsBuilder.fromPath("/profiles/{name}").buildAndExpand(saved.name()).encode().toUri();
        return ResponseEntity.created(location).body(saved);
    }

    /**
     * Ersetzt ein vorhandenes Profil.
     *
     * @param name    Name aus der Adresse
     * @param profile das neue Profil
     * @return das gespeicherte Profil, 200, oder 400 bei ungültigem Profil oder abweichendem Namen,
     *         oder 404
     */
    @PutMapping("/{name}")
    public Profile update(@PathVariable String name, @Valid @RequestBody Profile profile) {
        return service.update(name, profile);
    }

    /**
     * Löscht ein Profil.
     *
     * @param name Name des Profils
     * @return 204 ohne Inhalt, oder 404
     */
    @DeleteMapping("/{name}")
    public ResponseEntity<Void> delete(@PathVariable String name) {
        service.delete(name);
        return ResponseEntity.noContent().build();
    }
}
