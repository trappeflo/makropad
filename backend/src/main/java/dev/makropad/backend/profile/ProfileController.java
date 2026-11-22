package dev.makropad.backend.profile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Profile", description = "Gesicherte Profile, der Name ist der Schlüssel")
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
    @Operation(summary = "Alle gesicherten Profile", responses = {
            @ApiResponse(responseCode = "200", description = "Profile, nach Name sortiert")
    })
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
    @Operation(summary = "Ein Profil lesen", responses = {
            @ApiResponse(responseCode = "200", description = "Das Profil"),
            @ApiResponse(responseCode = "404", description = "Kein Profil mit diesem Namen", content = @Content(mediaType = "application/problem+json"))
    })
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
    @Operation(summary = "Neues Profil sichern", responses = {
            @ApiResponse(responseCode = "201", description = "Gesichert, Adresse im Header Location"),
            @ApiResponse(responseCode = "400", description = "Profil ungültig, errors nennt jede verletzte Regel", content = @Content(mediaType = "application/problem+json")),
            @ApiResponse(responseCode = "409", description = "Der Name ist schon vergeben", content = @Content(mediaType = "application/problem+json"))
    })
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
    @Operation(summary = "Vorhandenes Profil ersetzen", responses = {
            @ApiResponse(responseCode = "200", description = "Gespeichert"),
            @ApiResponse(responseCode = "400", description = "Profil ungültig oder Name weicht vom Pfad ab", content = @Content(mediaType = "application/problem+json")),
            @ApiResponse(responseCode = "404", description = "Kein Profil mit diesem Namen", content = @Content(mediaType = "application/problem+json"))
    })
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
    @Operation(summary = "Profil löschen", responses = {
            @ApiResponse(responseCode = "204", description = "Gelöscht"),
            @ApiResponse(responseCode = "404", description = "Kein Profil mit diesem Namen", content = @Content(mediaType = "application/problem+json"))
    })
    @DeleteMapping("/{name}")
    public ResponseEntity<Void> delete(@PathVariable String name) {
        service.delete(name);
        return ResponseEntity.noContent().build();
    }
}
