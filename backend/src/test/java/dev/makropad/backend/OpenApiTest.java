package dev.makropad.backend;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** Prüft, dass die OpenAPI-Beschreibung alle Endpunkte und ihre Antwortcodes enthält. */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void descriptionCoversAllEndpoints() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths", hasKey("/profiles")))
                .andExpect(jsonPath("$.paths", hasKey("/profiles/{name}")))
                .andExpect(jsonPath("$.paths['/profiles'].get").exists())
                .andExpect(jsonPath("$.paths['/profiles'].post").exists())
                .andExpect(jsonPath("$.paths['/profiles/{name}'].get").exists())
                .andExpect(jsonPath("$.paths['/profiles/{name}'].put").exists())
                .andExpect(jsonPath("$.paths['/profiles/{name}'].delete").exists());
    }

    @Test
    void descriptionNamesTheErrorCodesOfEachEndpoint() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.paths['/profiles'].post.responses", hasKey("201")))
                .andExpect(jsonPath("$.paths['/profiles'].post.responses", hasKey("400")))
                .andExpect(jsonPath("$.paths['/profiles'].post.responses", hasKey("409")))
                .andExpect(jsonPath("$.paths['/profiles/{name}'].get.responses", hasKey("404")))
                .andExpect(jsonPath("$.paths['/profiles/{name}'].put.responses", hasKey("400")))
                .andExpect(jsonPath("$.paths['/profiles/{name}'].put.responses", hasKey("404")))
                .andExpect(jsonPath("$.paths['/profiles/{name}'].delete.responses", hasKey("204")))
                .andExpect(jsonPath("$.paths['/profiles/{name}'].delete.responses", hasKey("404")));
    }

    @Test
    void descriptionHasTitleAndLocalOnlyNote() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.info.title", is("Makropad Backend")))
                .andExpect(jsonPath("$.info.description", containsString("lokalen Betrieb")));
    }

    @Test
    void profileSchemaCarriesAnExample() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.components.schemas.Profile.example").exists());
    }

    @Test
    void swaggerUiIsServed() throws Exception {
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }
}
