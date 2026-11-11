package dev.makropad.backend;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Stellt die Systemuhr als Bean bereit, damit Tests die Zeit festlegen können. */
@Configuration
public class ClockConfig {

    /**
     * Systemuhr in UTC.
     *
     * @return die Uhr
     */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
