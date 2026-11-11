package dev.makropad.backend.profile;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Zugriff auf die gespeicherten Profile. */
public interface ProfileRepository extends JpaRepository<ProfileEntity, String> {

    /**
     * Liefert alle Profile, sortiert nach Name.
     *
     * @return Profile in alphabetischer Reihenfolge
     */
    List<ProfileEntity> findAllByOrderByNameAsc();
}
