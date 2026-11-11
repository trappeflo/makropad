package dev.makropad.backend.profile;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Integrationstest der REST-API gegen eine Datenbank im Speicher. */
@SpringBootTest
@AutoConfigureMockMvc
class ProfileApiTest {

    private static final String PROGRAMMING = """
            {"name":"Programmierung","layout":"de-DE","keys":[
              {"type":"combo","label":"Befehlspalette","intent":{"keys":"ctrl+shift+p"},
               "steps":[{"mod":3,"key":19}]},
              {"type":"text","label":"git status","intent":{"text":"git status","enter":true},
               "steps":[{"key":10},{"delay":50},{"key":40}]},
              null,
              null]}
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ProfileRepository repository;

    @BeforeEach
    void clearDatabase() {
        repository.deleteAll();
    }

    private static String profileNamed(String name) {
        return PROGRAMMING.replace("\"Programmierung\"", "\"" + name + "\"");
    }

    @Test
    void createReturns201WithLocationAndBody() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/profiles/Programmierung"))
                .andExpect(jsonPath("$.name", is("Programmierung")));
    }

    @Test
    void createdProfileCanBeReadBackUnchanged() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isCreated());

        mvc.perform(get("/profiles/Programmierung"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.layout", is("de-DE")))
                .andExpect(jsonPath("$.keys", hasSize(4)))
                .andExpect(jsonPath("$.keys[0].intent.keys", is("ctrl+shift+p")))
                .andExpect(jsonPath("$.keys[0].steps[0].mod", is(3)))
                .andExpect(jsonPath("$.keys[1].intent.enter", is(true)))
                .andExpect(jsonPath("$.keys[1].steps[1].delay", is(50)))
                .andExpect(jsonPath("$.keys[2]", nullValue()));
    }

    @Test
    void stepsOmitFieldsThatAreNotSet() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isCreated());

        mvc.perform(get("/profiles/Programmierung"))
                .andExpect(jsonPath("$.keys[0].steps[0].delay").doesNotExist())
                .andExpect(jsonPath("$.keys[1].steps[1].key").doesNotExist())
                .andExpect(jsonPath("$.keys[1].steps[1].mod").doesNotExist());
    }

    @Test
    void createWithExistingNameReturns409() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isCreated());

        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status", is(409)));
    }

    @Test
    void listReturnsProfilesSortedByName() throws Exception {
        for (String name : new String[] {"Zeta", "Alpha", "Mitte"}) {
            mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(profileNamed(name)))
                    .andExpect(status().isCreated());
        }

        mvc.perform(get("/profiles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Alpha", "Mitte", "Zeta")));
    }

    @Test
    void listIsEmptyWithoutProfiles() throws Exception {
        mvc.perform(get("/profiles")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getUnknownProfileReturns404() throws Exception {
        mvc.perform(get("/profiles/Gibtsnicht"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail", is("Profil 'Gibtsnicht' nicht gefunden")));
    }

    @Test
    void putReplacesExistingProfile() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isCreated());
        String changed = PROGRAMMING.replace("Befehlspalette", "Neues Label");

        mvc.perform(put("/profiles/Programmierung").contentType(MediaType.APPLICATION_JSON).content(changed))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.keys[0].label", is("Neues Label")));

        mvc.perform(get("/profiles/Programmierung"))
                .andExpect(jsonPath("$.keys[0].label", is("Neues Label")));
    }

    @Test
    void putUnknownProfileReturns404() throws Exception {
        mvc.perform(put("/profiles/Programmierung").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isNotFound());
    }

    @Test
    void putWithDifferentNameInBodyReturns400() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isCreated());

        mvc.perform(put("/profiles/Programmierung").contentType(MediaType.APPLICATION_JSON)
                        .content(profileNamed("Anders")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteRemovesProfile() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(PROGRAMMING))
                .andExpect(status().isCreated());

        mvc.perform(delete("/profiles/Programmierung")).andExpect(status().isNoContent());
        mvc.perform(get("/profiles/Programmierung")).andExpect(status().isNotFound());
    }

    @Test
    void deleteUnknownProfileReturns404() throws Exception {
        mvc.perform(delete("/profiles/Gibtsnicht")).andExpect(status().isNotFound());
    }

    @Test
    void invalidProfileReturns400WithListOfViolations() throws Exception {
        String invalid = """
                {"name":"","layout":"en-US","keys":[
                  {"type":"unbekannt","label":"x","intent":{},"steps":[{"mod":1}]}]}
                """;

        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail", is("Profil ist ungültig")))
                .andExpect(jsonPath("$.errors[*].field")
                        .value(org.hamcrest.Matchers.hasItems("name", "layout", "keys[0].type")));
    }

    @Test
    void unreadableJsonReturns400AsProblemDetail() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON).content("{kaputt"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void invalidProfileIsNotStored() throws Exception {
        mvc.perform(post("/profiles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Kaputt\",\"layout\":\"de-DE\",\"keys\":[]}"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/profiles/Kaputt")).andExpect(status().isNotFound());
    }
}
