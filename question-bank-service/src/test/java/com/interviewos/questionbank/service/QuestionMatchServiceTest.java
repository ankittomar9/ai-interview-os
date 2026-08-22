package com.interviewos.questionbank.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.dto.QuestionMatchRequest;
import com.interviewos.questionbank.dto.QuestionMatchResponse;
import com.interviewos.questionbank.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionMatchServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    private QuestionMatchService matchService;

    @BeforeEach
    void setUp() {
        matchService = new QuestionMatchService(questionRepository, new ObjectMapper());
    }

    @Test
    @DisplayName("matchQuestion should deterministically match best question by resume tags and difficulty")
    void testDeterministicMatch() {
        QuestionDocument lru = QuestionDocument.builder()
                .slug("lru-cache")
                .title("LRU Cache Implementation")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("SENIOR")
                .tags(List.of("java", "hashmap", "doubly-linked-list", "caching"))
                .status("PUBLISHED")
                .build();

        QuestionDocument reverse = QuestionDocument.builder()
                .slug("reverse-a-string")
                .title("Reverse a String")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("JUNIOR")
                .tags(List.of("strings", "arrays"))
                .status("PUBLISHED")
                .build();

        when(questionRepository.findByTrackAndDifficultyAndStatus(eq("ALGORITHMS_DATA_STRUCTURES"), eq("SENIOR"), eq("PUBLISHED")))
                .thenReturn(List.of(lru, reverse));

        QuestionMatchRequest req = new QuestionMatchRequest(
                "ALGORITHMS_DATA_STRUCTURES",
                "SENIOR",
                List.of("java", "hashmap", "caching"),
                "Staff Software Engineer at Fintech",
                null,
                null
        );

        QuestionMatchResponse response = matchService.matchQuestion(req);

        assertNotNull(response);
        assertNotNull(response.question());
        assertEquals("lru-cache", response.question().slug());
        assertFalse(response.llmAssisted());
        assertTrue(response.rationale().contains("LRU Cache Implementation"));
    }

    @Test
    @DisplayName("matchQuestion should safely fallback to deterministic scoring on invalid LLM provider without throwing")
    void testLlmFailureSafeFallback() {
        QuestionDocument lru = QuestionDocument.builder()
                .slug("lru-cache")
                .title("LRU Cache Implementation")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("SENIOR")
                .tags(List.of("java", "hashmap"))
                .status("PUBLISHED")
                .build();

        QuestionDocument reverse = QuestionDocument.builder()
                .slug("reverse-a-string")
                .title("Reverse a String")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("SENIOR")
                .tags(List.of("strings"))
                .status("PUBLISHED")
                .build();

        when(questionRepository.findByTrackAndDifficultyAndStatus(anyString(), anyString(), anyString()))
                .thenReturn(List.of(lru, reverse));

        QuestionMatchRequest req = new QuestionMatchRequest(
                "ALGORITHMS_DATA_STRUCTURES",
                "SENIOR",
                List.of("java"),
                "Backend Engineer",
                "INVALID_PROVIDER",
                "fake-key"
        );

        QuestionMatchResponse response = matchService.matchQuestion(req);

        assertNotNull(response);
        assertEquals("lru-cache", response.question().slug());
        assertFalse(response.llmAssisted());
    }

    @Test
    @DisplayName("matchQuestion should throw IllegalStateException when no published questions exist")
    void testNoQuestionsFoundThrows() {
        when(questionRepository.findByTrackAndDifficultyAndStatus(anyString(), anyString(), anyString()))
                .thenReturn(List.of());
        when(questionRepository.findByTrackAndStatus(anyString(), anyString()))
                .thenReturn(List.of());
        when(questionRepository.findByStatus(anyString()))
                .thenReturn(List.of());

        QuestionMatchRequest req = new QuestionMatchRequest(
                "ALGORITHMS_DATA_STRUCTURES",
                "SENIOR",
                List.of(),
                "",
                null,
                null
        );

        assertThrows(IllegalStateException.class, () -> matchService.matchQuestion(req));
    }
}
