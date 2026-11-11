package dev.makropad.backend.profile;

import static org.assertj.core.api.Assertions.assertThat;

import dev.makropad.backend.profile.Profile.KeyAction;
import dev.makropad.backend.profile.Profile.Step;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Unit-Test der Validierungsregeln nach Protokoll v1, ohne Spring. */
class ProfileValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private static KeyAction action(Step... steps) {
        return new KeyAction("combo", "Test", Map.of(), List.of(steps));
    }

    private static Profile profile(String name, KeyAction... keys) {
        return new Profile(name, "de-DE", Arrays.asList(keys));
    }

    private static Step tap(int mod, int key) {
        return new Step(mod, key, null);
    }

    @Test
    void validProfilePasses() {
        Profile profile = profile("Programmierung", action(tap(3, 19)), null);

        assertThat(validator.validate(profile)).isEmpty();
    }

    @Test
    void unassignedKeysAreAllowed() {
        Profile profile = profile("Leer", (KeyAction) null, null, null, null);

        assertThat(validator.validate(profile)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "mit/Schrägstrich", "Punkt.", "Emoji😀"})
    void invalidNamesAreRejected(String name) {
        assertThat(validator.validate(profile(name, action(tap(0, 4))))).isNotEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Büro Meeting", "Profil_1", "Büro-2", "A"})
    void validNamesPass(String name) {
        assertThat(validator.validate(profile(name, action(tap(0, 4))))).isEmpty();
    }

    @Test
    void nameLongerThan64CharsIsRejected() {
        assertThat(validator.validate(profile("a".repeat(65), action(tap(0, 4))))).isNotEmpty();
        assertThat(validator.validate(profile("a".repeat(64), action(tap(0, 4))))).isEmpty();
    }

    @Test
    void onlyGermanLayoutIsAllowed() {
        Profile profile = new Profile("P", "en-US", List.of(action(tap(0, 4))));

        assertThat(validator.validate(profile)).isNotEmpty();
    }

    @Test
    void emptyKeyListIsRejected() {
        assertThat(validator.validate(new Profile("P", "de-DE", List.of()))).isNotEmpty();
    }

    @Test
    void moreThanSixteenKeysAreRejected() {
        List<KeyAction> keys = new ArrayList<>();
        for (int i = 0; i < 17; i++) {
            keys.add(action(tap(0, 4)));
        }

        assertThat(validator.validate(new Profile("P", "de-DE", keys))).isNotEmpty();
    }

    @Test
    void unknownActionTypeIsRejected() {
        KeyAction unknown = new KeyAction("beam", "x", Map.of(), List.of(tap(0, 4)));

        assertThat(validator.validate(profile("P", unknown))).isNotEmpty();
    }

    @Test
    void actionWithoutStepsIsRejected() {
        assertThat(validator.validate(profile("P", action()))).isNotEmpty();
    }

    @Test
    void tooManyStepsAreRejected() {
        Step[] steps = new Step[Profile.MAX_STEPS + 1];
        Arrays.fill(steps, tap(0, 4));

        assertThat(validator.validate(profile("P", action(steps)))).isNotEmpty();
    }

    @Test
    void stepWithKeyAndDelayIsRejected() {
        assertThat(validator.validate(profile("P", action(new Step(null, 4, 100))))).isNotEmpty();
    }

    @Test
    void emptyStepIsRejected() {
        assertThat(validator.validate(profile("P", action(new Step(null, null, null))))).isNotEmpty();
    }

    @Test
    void stepWithModifierButNoKeyIsRejected() {
        assertThat(validator.validate(profile("P", action(new Step(3, null, null))))).isNotEmpty();
    }

    @Test
    void delayStepPasses() {
        assertThat(validator.validate(profile("P", action(new Step(null, null, 50))))).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(ints = {-1, 256})
    void keyOutOfByteRangeIsRejected(int key) {
        assertThat(validator.validate(profile("P", action(new Step(0, key, null))))).isNotEmpty();
    }

    @Test
    void delayBeyondTenSecondsIsRejected() {
        assertThat(validator.validate(profile("P", action(new Step(null, null, 10_001))))).isNotEmpty();
    }

    @Test
    void nullStepInListIsRejected() {
        KeyAction withNullStep = new KeyAction("combo", "x", Map.of(), Arrays.asList(tap(0, 4), null));

        assertThat(validator.validate(profile("P", withNullStep))).isNotEmpty();
    }
}
