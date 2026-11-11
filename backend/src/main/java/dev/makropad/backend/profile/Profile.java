package dev.makropad.backend.profile;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

/**
 * Ein Profil im Format von Protokoll v1 (siehe {@code docs/protokoll-v1.md}, Abschnitt 4).
 *
 * <p>Das Backend prüft die Struktur, speichert das Profil aber nur als Kopie. Maßgeblich für den Betrieb ist
 * das Pad (ADR 0005). Grenzen, die nur das Pad kennt (etwa {@code maxSteps} aus {@code device.info}),
 * werden hier nicht geprüft.
 *
 * @param name   eindeutiger Name, zugleich Schlüssel im Backend
 * @param layout Tastaturlayout, im MVP nur {@code de-DE}
 * @param keys   eine Aktion je Taste, {@code null} steht für eine unbelegte Taste
 */
public record Profile(
        @NotBlank
        @Size(max = Profile.NAME_MAX_LENGTH)
        @Pattern(regexp = Profile.NAME_PATTERN, message = "darf nur Buchstaben, Ziffern, Leerzeichen, - und _ enthalten")
        String name,

        @NotNull
        @Pattern(regexp = "de-DE", message = "im MVP ist nur de-DE erlaubt")
        String layout,

        @NotEmpty
        @Size(max = Profile.MAX_KEYS)
        List<@Valid KeyAction> keys) {

    /** Maximale Länge des Namens. */
    public static final int NAME_MAX_LENGTH = 64;

    /** Erlaubte Zeichen im Namen. Verhindert Sonderzeichen, die in einer URL Probleme machen. */
    public static final String NAME_PATTERN = "^[\\p{L}\\p{N} _-]+$";

    /** Obergrenze der Tastenzahl. Das Pad meldet seine echte Zahl in {@code device.info}. */
    public static final int MAX_KEYS = 16;

    /** Obergrenze der Schritte je Taste, großzügig über dem Wert des Pads. */
    public static final int MAX_STEPS = 128;

    /**
     * Aktion einer Taste.
     *
     * @param type   {@code combo}, {@code text} oder {@code macro}, nur für die Anzeige
     * @param label  frei wählbarer Name der Taste
     * @param intent Absicht der Nutzerin. Wird gespeichert, aber nie ausgewertet.
     * @param steps  Schritte, die das Pad abspielt. Sie sind maßgeblich.
     */
    public record KeyAction(
            @NotNull
            @Pattern(regexp = "combo|text|macro", message = "muss combo, text oder macro sein")
            String type,

            @NotNull
            @Size(max = 64)
            String label,

            @NotNull
            Map<String, Object> intent,

            @NotEmpty
            @Size(max = Profile.MAX_STEPS)
            List<@NotNull @Valid Step> steps) {
    }

    /**
     * Ein Schritt: entweder Taste mit Modifikatoren drücken und loslassen ({@code mod} und {@code key})
     * oder eine Pause ({@code delay}).
     *
     * @param mod   HID-Modifier-Bitmaske
     * @param key   HID-Usage-ID
     * @param delay Pause in Millisekunden
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Step(
            @Min(0) @Max(255) Integer mod,
            @Min(0) @Max(255) Integer key,
            @Min(0) @Max(10_000) Integer delay) {

        /**
         * Ein Schritt ist entweder ein Tastendruck oder eine Pause, nie beides und nie leer.
         *
         * @return {@code true}, wenn die Form gültig ist
         */
        @JsonIgnore
        @AssertTrue(message = "ein Schritt braucht entweder key (mit optionalem mod) oder delay")
        public boolean isShapeValid() {
            boolean isKeyStep = key != null;
            boolean isDelayStep = delay != null;
            if (isKeyStep == isDelayStep) {
                return false;
            }
            return isKeyStep || mod == null;
        }
    }
}
