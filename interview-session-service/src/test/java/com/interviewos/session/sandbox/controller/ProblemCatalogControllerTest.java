package com.interviewos.session.sandbox.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProblemCatalogController.class)
class ProblemCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private QuestionBankClient questionBankClient;

    private ProblemDocument createMockProblemWithHiddenTests() {
        return ProblemDocument.builder()
                .problemSlug("lld-order-service")
                .title("Spring Boot Order Management Microservice")
                .track("SPRING_LLD")
                .difficulty("MID")
                .buildProfile("maven-workspace")
                .problemStatement("Design and implement an Order Management service.")
                .starterFiles(Map.of("pom.xml", "<project>...</project>"))
                .editablePaths(List.of("src/main/java/OrderService.java"))
                .hiddenTestFiles(Map.of(
                        "src/test/java/SecretOrderTest.java",
                        "public class SecretOrderTest { void secretCheck() { org.junit.jupiter.api.Assertions.fail(); } }"
                ))
                .sampleTests(List.of(new ProblemDocument.TestCase("Sample 1", "in", "out")))
                .hiddenTests(List.of(new ProblemDocument.HiddenTestCase("Hidden 1", "secret_in", "secret_out", 10)))
                .build();
    }

    @Test
    @DisplayName("V8-01 / V8-g2: GET /api/v1/problems/{slug} never leaks hiddenTestFiles or hidden test source bytes")
    void testGetProblemBySlugNeverLeaksHiddenTests() throws Exception {
        ProblemDocument mockDoc = createMockProblemWithHiddenTests();
        when(questionBankClient.fetchProblemBySlug("lld-order-service")).thenReturn(Optional.of(mockDoc));

        mockMvc.perform(get("/api/v1/problems/lld-order-service")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problemSlug").value("lld-order-service"))
                .andExpect(jsonPath("$.hiddenTestFiles").doesNotExist())
                .andExpect(jsonPath("$.hiddenTests").doesNotExist())
                .andExpect(content().string(not(containsString("hiddenTestFiles"))))
                .andExpect(content().string(not(containsString("SecretOrderTest"))))
                .andExpect(content().string(not(containsString("secretCheck"))))
                .andExpect(content().string(not(containsString("secret_in"))));
    }

    @Test
    @DisplayName("V8-01 / V8-g2: GET /api/v1/problems list never leaks hiddenTestFiles in collection views")
    void testListProblemsNeverLeaksHiddenTests() throws Exception {
        ProblemDocument mockDoc = createMockProblemWithHiddenTests();
        when(questionBankClient.listProblems(any(), any())).thenReturn(List.of(mockDoc));

        mockMvc.perform(get("/api/v1/problems")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].problemSlug").value("lld-order-service"))
                .andExpect(jsonPath("$[0].hiddenTestFiles").doesNotExist())
                .andExpect(jsonPath("$[0].hiddenTests").doesNotExist())
                .andExpect(content().string(not(containsString("hiddenTestFiles"))))
                .andExpect(content().string(not(containsString("SecretOrderTest"))))
                .andExpect(content().string(not(containsString("secretCheck"))));
    }

    @Test
    @DisplayName("V8-01: ProblemDocument @JsonIgnore ensures entity-level Jackson serialization omits hiddenTestFiles")
    void testProblemDocumentDirectSerializationIgnoresHiddenTests() throws Exception {
        ProblemDocument mockDoc = createMockProblemWithHiddenTests();
        String json = objectMapper.writeValueAsString(mockDoc);

        assertFalse(json.contains("hiddenTestFiles"), "@JsonIgnore must omit hiddenTestFiles");
        assertFalse(json.contains("hiddenTests"), "@JsonIgnore must omit hiddenTests");
        assertFalse(json.contains("SecretOrderTest"), "@JsonIgnore must omit hidden test class name");
        assertFalse(json.contains("secretCheck"), "@JsonIgnore must omit hidden test source content");
    }
}
