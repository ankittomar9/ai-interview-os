package com.interviewos.session.service;

import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.QuestionProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PracticeTrackingServiceTest {

    private PracticeAttemptRepository practiceAttemptRepository;
    private QuestionProgressRepository questionProgressRepository;
    private PracticeTrackingService practiceTrackingService;

    @BeforeEach
    void setUp() {
        practiceAttemptRepository = mock(PracticeAttemptRepository.class);
        questionProgressRepository = mock(QuestionProgressRepository.class);
        practiceTrackingService = new PracticeTrackingService(practiceAttemptRepository, questionProgressRepository);
    }

    @Test
    @DisplayName("recordAttempt records first attempt and marks question solved on PASSED")
    void testRecordAttempt_firstPassed() {
        when(practiceAttemptRepository.countByUserIdAndQuestionId("local", "two-sum")).thenReturn(0L);
        when(practiceAttemptRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(questionProgressRepository.findByUserIdAndQuestionId("local", "two-sum")).thenReturn(Optional.empty());

        PracticeAttempt attempt = practiceTrackingService.recordAttempt(
                "local", "two-sum", "ALGORITHMS_DATA_STRUCTURES", 62, "PASSED", 5, 5, 45, 12000
        );

        assertNotNull(attempt);
        assertEquals(1, attempt.getAttemptSeq());
        assertEquals("PASSED", attempt.getVerdict());
        assertEquals(5, attempt.getTestsPassed());

        ArgumentCaptor<QuestionProgress> progressCaptor = ArgumentCaptor.forClass(QuestionProgress.class);
        verify(questionProgressRepository).save(progressCaptor.capture());
        QuestionProgress progress = progressCaptor.getValue();
        assertEquals(1, progress.getAttemptCount());
        assertEquals(1, progress.getSolveCount());
        assertNotNull(progress.getFirstSolvedAt());
    }

    @Test
    @DisplayName("recordAttempt increments attempt_count but not solve_count on FAILED")
    void testRecordAttempt_failed() {
        when(practiceAttemptRepository.countByUserIdAndQuestionId("local", "two-sum")).thenReturn(1L);
        when(practiceAttemptRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        QuestionProgress existing = QuestionProgress.builder()
                .userId("local")
                .questionId("two-sum")
                .attemptCount(1)
                .solveCount(1)
                .build();
        when(questionProgressRepository.findByUserIdAndQuestionId("local", "two-sum")).thenReturn(Optional.of(existing));

        PracticeAttempt attempt = practiceTrackingService.recordAttempt(
                "local", "two-sum", "ALGORITHMS_DATA_STRUCTURES", 62, "FAILED", 2, 5, 30, 10000
        );

        assertNotNull(attempt);
        assertEquals(2, attempt.getAttemptSeq());
        assertEquals("FAILED", attempt.getVerdict());

        ArgumentCaptor<QuestionProgress> progressCaptor = ArgumentCaptor.forClass(QuestionProgress.class);
        verify(questionProgressRepository).save(progressCaptor.capture());
        QuestionProgress progress = progressCaptor.getValue();
        assertEquals(2, progress.getAttemptCount());
        assertEquals(1, progress.getSolveCount());
    }

    @Test
    @DisplayName("getProgressMap returns progress keyed by questionId")
    void testGetProgressMap() {
        QuestionProgress q1 = QuestionProgress.builder().userId("local").questionId("two-sum").solveCount(1).build();
        QuestionProgress q2 = QuestionProgress.builder().userId("local").questionId("reverse-a-string").solveCount(0).build();
        when(questionProgressRepository.findByUserId("local")).thenReturn(List.of(q1, q2));

        Map<String, QuestionProgress> map = practiceTrackingService.getProgressMap("local");
        assertEquals(2, map.size());
        assertTrue(map.containsKey("two-sum"));
        assertTrue(map.containsKey("reverse-a-string"));
    }
}
