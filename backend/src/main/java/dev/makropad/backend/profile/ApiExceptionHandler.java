package dev.makropad.backend.profile;

import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Wandelt Fehler in Problem Details (RFC 9457) um. Standardfehler von Spring, etwa unlesbares JSON,
 * werden von der Basisklasse im selben Format geliefert.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    /**
     * Profil nicht gefunden.
     *
     * @param e die Ausnahme
     * @return 404
     */
    @ExceptionHandler(ProfileNotFoundException.class)
    public ProblemDetail handleNotFound(ProfileNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    /**
     * Name bereits vergeben.
     *
     * @param e die Ausnahme
     * @return 409
     */
    @ExceptionHandler(ProfileAlreadyExistsException.class)
    public ProblemDetail handleConflict(ProfileAlreadyExistsException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    /**
     * Name in Adresse und Profil weichen ab.
     *
     * @param e die Ausnahme
     * @return 400
     */
    @ExceptionHandler(ProfileNameMismatchException.class)
    public ProblemDetail handleNameMismatch(ProfileNameMismatchException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    /**
     * Ungültiges Profil. Die Antwort enthält je verletzter Regel einen Eintrag unter {@code errors}.
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<FieldViolation> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldViolation(error.getField(), error.getDefaultMessage()))
                .toList();
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Profil ist ungültig");
        problem.setProperty("errors", errors);
        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    /**
     * Eine verletzte Validierungsregel.
     *
     * @param field   Pfad des Feldes, z. B. {@code keys[0].steps[1]}
     * @param message Beschreibung der Regel
     */
    public record FieldViolation(String field, String message) {
    }
}
