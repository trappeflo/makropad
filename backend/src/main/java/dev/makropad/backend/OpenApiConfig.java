package dev.makropad.backend;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Titel und Hinweise der OpenAPI-Beschreibung, abrufbar unter {@code /v3/api-docs}, Oberfläche unter {@code /swagger-ui.html}. */
@Configuration
public class OpenApiConfig {

    /** Wird von Spring benötigt. */
    public OpenApiConfig() {
    }

    /**
     * Allgemeine Angaben zur API.
     *
     * @return Beschreibung mit Titel, Version und Hinweis zum lokalen Betrieb
     */
    @Bean
    public OpenAPI makropadOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Makropad Backend")
                .version("v1")
                .description("Sicherung und Wiederherstellung der Profile des Makropads. Das Pad bleibt für den Betrieb "
                        + "maßgeblich, das Backend hält eine Kopie (ADR 0005). Es gibt keine Anmeldung, die API ist für den "
                        + "lokalen Betrieb gedacht und nicht für öffentliches Hosting. Fehler kommen als Problem Details "
                        + "(RFC 9457)."));
    }
}
