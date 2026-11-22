package dev.makropad.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** Prüft, dass nur die Web-App auf die API zugreifen darf. */
@SpringBootTest
@AutoConfigureMockMvc
class CorsTest {

    private static final String WEB_APP = "http://localhost:5173";

    @Autowired
    private MockMvc mvc;

    @Test
    void preflightFromWebAppIsAllowed() throws Exception {
        mvc.perform(options("/profiles/Test")
                        .header("Origin", WEB_APP)
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", WEB_APP));
    }

    @Test
    void preflightFromOtherOriginIsRejected() throws Exception {
        mvc.perform(options("/profiles")
                        .header("Origin", "http://example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void answerToWebAppCarriesAllowOriginHeader() throws Exception {
        mvc.perform(get("/profiles").header("Origin", WEB_APP))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", WEB_APP));
    }
}
