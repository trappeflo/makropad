package dev.makropad.backend.profile;

import static org.assertj.core.api.Assertions.assertThat;

import dev.makropad.backend.MakropadBackendApplication;
import dev.makropad.backend.profile.Profile.KeyAction;
import dev.makropad.backend.profile.Profile.Step;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

/** Prüft, dass gesicherte Profile einen Neustart der Anwendung überleben (#18). */
class ProfilePersistenceTest {

    @TempDir
    Path tempDir;

    private ConfigurableApplicationContext start() {
        // Als Argumente übergeben, damit sie Vorrang vor der application.properties der Tests haben
        // (SpringApplicationBuilder.properties() setzt nur Standardwerte mit niedrigster Priorität).
        return new SpringApplicationBuilder(MakropadBackendApplication.class)
                .web(WebApplicationType.NONE)
                .run(
                        "--spring.datasource.url=jdbc:h2:file:" + tempDir.resolve("makropad").toAbsolutePath(),
                        "--spring.jpa.hibernate.ddl-auto=update");
    }

    @Test
    void profileSurvivesRestartWithFileDatabase() {
        Profile saved = new Profile("Büro Meeting", "de-DE", Arrays.asList(
                new KeyAction("combo", "Mute", Map.of("keys", "ctrl+shift+m"), List.of(new Step(3, 16, null))),
                null));

        try (ConfigurableApplicationContext first = start()) {
            first.getBean(ProfileService.class).create(saved);
        }

        assertThat(tempDir.resolve("makropad.mv.db")).exists();

        try (ConfigurableApplicationContext second = start()) {
            ProfileService service = second.getBean(ProfileService.class);

            assertThat(service.findAll()).containsExactly(saved);
            assertThat(service.get("Büro Meeting")).isEqualTo(saved);
        }
    }

    @Test
    void deletedProfileStaysDeletedAfterRestart() {
        Profile profile = new Profile("Weg", "de-DE",
                List.of(new KeyAction("combo", "x", Map.of(), List.of(new Step(0, 4, null)))));

        try (ConfigurableApplicationContext first = start()) {
            ProfileService service = first.getBean(ProfileService.class);
            service.create(profile);
            service.delete("Weg");
        }

        try (ConfigurableApplicationContext second = start()) {
            assertThat(second.getBean(ProfileService.class).findAll()).isEmpty();
        }
    }
}
