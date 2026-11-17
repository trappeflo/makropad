package dev.makropad.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Erlaubt der Web-App den Zugriff auf die API, obwohl sie von einer anderen Herkunft (Port) geladen wird.
 * Erlaubt sind nur die Herkünfte aus {@code makropad.cors.allowed-origins}, nie alle. Standard ist der
 * Entwicklungsserver der Web-App.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    /**
     * Erzeugt die Konfiguration.
     *
     * @param allowedOrigins erlaubte Herkünfte, z. B. {@code http://localhost:5173}, mehrere durch Komma getrennt
     */
    public CorsConfig(@Value("${makropad.cors.allowed-origins:http://localhost:5173}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/profiles/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
