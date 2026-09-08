package com.interviewos.session.service;

import com.interviewos.session.dto.RetryQueueItem;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RetryQueueServiceTest {

    @Mock
    private PracticeAttemptRepository practiceAttemptRepository;

    @Mock
    private InterviewSessionRepository interviewSessionRepository;

    @Mock
    private SessionQuestionRepository sessionQuestionRepository;

    @Mock
    private LearnTreeService learnTreeService;

    private RetryQueueService retryQueueService;

    @BeforeEach
    void setUp() {
        retryQueueService = new RetryQueueService(
                practiceAttemptRepository,
                interviewSessionRepository,
                sessionQuestionRepository,
                learnTreeService
        );

        LearnTreeService.CachedCatalog catalog = new LearnTreeService.CachedCatalog(
                System.currentTimeMillis(),
                List.of(
                        new LearnTreeService.CatalogQuestionItem("two-sum", "Two Sum Target Pair", "ALGORITHMS_DATA_STRUCTURES", "EASY", List.of("arrays")),
                        new LearnTreeService.CatalogQuestionItem("valid-parentheses", "Valid Parentheses Match", "ALGORITHMS_DATA_STRUCTURES", "EASY", List.of("stacks-queues")),
                        new LearnTreeService.CatalogQuestionItem("merge-intervals", "Merge Intervals Overlap", "ALGORITHMS_DATA_STRUCTURES", "MEDIUM", List.of("arrays")),
                        new LearnTreeService.CatalogQuestionItem("trapping-rain-water", "Elevation Map Rainwater Retention", "ALGORITHMS_DATA_STRUCTURES", "HARD", List.of("two-pointers")),
                        new LearnTreeService.CatalogQuestionItem("dsa-two-sum", "Two Sum Target Pair", "ALGORITHMS_DATA_STRUCTURES", "EASY", List.of("arrays")),
                        new LearnTreeService.CatalogQuestionItem("dsa-lru-cache", "LRU Cache Implementation", "ALGORITHMS_DATA_STRUCTURES", "MEDIUM", List.of("stacks-queues"))
                ),
                Map.of("arrays", "Arrays", "two-pointers", "Two Pointers", "stacks-queues", "Stacks & Queues"),
                Map.of("arrays", "ALGORITHMS_DATA_STRUCTURES", "two-pointers", "ALGORITHMS_DATA_STRUCTURES", "stacks-queues", "ALGORITHMS_DATA_STRUCTURES")
        );
        when(learnTreeService.getOrRefreshCatalog()).thenReturn(catalog);
    }

    @Test
    @DisplayName("Gate VP14: VP10 scripted seed produces exactly the 2 failed slugs in documented order")
    void testVp10SeedProducesExactTwoFailedSlugsInOrder() {
        Instant now = Instant.now();
        String userId = "vp10-candidate";

        // 1. Practice Attempts: 3 PASSED, 1 FAILED
        PracticeAttempt pa1 = new PracticeAttempt();
        pa1.setUserId(userId);
        pa1.setQuestionId("two-sum");
        pa1.setVerdict("PASSED");
        pa1.setCreatedAt(now.minus(40, ChronoUnit.MINUTES));

        PracticeAttempt pa2 = new PracticeAttempt();
        pa2.setUserId(userId);
        pa2.setQuestionId("valid-parentheses");
        pa2.setVerdict("PASSED");
        pa2.setCreatedAt(now.minus(30, ChronoUnit.MINUTES));

        PracticeAttempt pa3 = new PracticeAttempt();
        pa3.setUserId(userId);
        pa3.setQuestionId("merge-intervals");
        pa3.setVerdict("PASSED");
        pa3.setCreatedAt(now.minus(20, ChronoUnit.MINUTES));

        PracticeAttempt pa4 = new PracticeAttempt();
        pa4.setUserId(userId);
        pa4.setQuestionId("trapping-rain-water");
        pa4.setVerdict("FAILED");
        pa4.setCreatedAt(now.minus(10, ChronoUnit.MINUTES));

        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(pa4, pa3, pa2, pa1));

        // 2. Interview Session: 1 PASSED, 1 FAILED
        InterviewSession session = new InterviewSession();
        session.setId(101L);
        session.setCandidateId(userId);
        session.setStatus(SessionStatus.COMPLETED);
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(session));

        SessionQuestion sq1 = new SessionQuestion();
        sq1.setSessionId(101L);
        sq1.setQuestionSlug("dsa-two-sum");
        sq1.setVerdict("PASSED");
        sq1.setAttemptedAt(now.minus(18, ChronoUnit.MINUTES));

        SessionQuestion sq2 = new SessionQuestion();
        sq2.setSessionId(101L);
        sq2.setQuestionSlug("dsa-lru-cache");
        sq2.setVerdict("FAILED");
        sq2.setAttemptedAt(now.minus(7, ChronoUnit.MINUTES));

        when(sessionQuestionRepository.findBySessionIdInOrderByAttemptedAtDesc(List.of(101L)))
                .thenReturn(List.of(sq2, sq1));

        // Act
        List<RetryQueueItem> queue = retryQueueService.getRetryQueue(userId);

        // Assert: Queue must contain exactly the 2 failed slugs in documented order
        assertThat(queue).hasSize(2);

        // Item 0: dsa-lru-cache (failed 7 min ago - more recent)
        RetryQueueItem item0 = queue.get(0);
        assertThat(item0.slug()).isEqualTo("dsa-lru-cache");
        assertThat(item0.lastVerdict()).isEqualTo("FAILED");
        assertThat(item0.failCount()).isEqualTo(1);
        assertThat(item0.topic()).isEqualTo("stacks-queues");

        // Item 1: trapping-rain-water (failed 10 min ago)
        RetryQueueItem item1 = queue.get(1);
        assertThat(item1.slug()).isEqualTo("trapping-rain-water");
        assertThat(item1.lastVerdict()).isEqualTo("FAILED");
        assertThat(item1.failCount()).isEqualTo(1);
        assertThat(item1.topic()).isEqualTo("two-pointers");
    }

    @Test
    @DisplayName("Questions with zero failures are strictly excluded")
    void testZeroFailuresExcluded() {
        String userId = "clean-candidate";
        PracticeAttempt pa1 = new PracticeAttempt();
        pa1.setUserId(userId);
        pa1.setQuestionId("two-sum");
        pa1.setVerdict("PASSED");
        pa1.setCreatedAt(Instant.now());

        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(pa1));
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        List<RetryQueueItem> queue = retryQueueService.getRetryQueue(userId);
        assertThat(queue).isEmpty();
    }

    @Test
    @DisplayName("Question failed then passed is included with failCount=1 and lastVerdict=PASSED")
    void testFailedThenPassedIncluded() {
        String userId = "improving-candidate";
        Instant now = Instant.now();

        PracticeAttempt paFail = new PracticeAttempt();
        paFail.setUserId(userId);
        paFail.setQuestionId("two-sum");
        paFail.setVerdict("FAILED");
        paFail.setCreatedAt(now.minus(1, ChronoUnit.HOURS));

        PracticeAttempt paPass = new PracticeAttempt();
        paPass.setUserId(userId);
        paPass.setQuestionId("two-sum");
        paPass.setVerdict("PASSED");
        paPass.setCreatedAt(now.minus(10, ChronoUnit.MINUTES));

        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(paPass, paFail));
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        List<RetryQueueItem> queue = retryQueueService.getRetryQueue(userId);
        assertThat(queue).hasSize(1);
        assertThat(queue.get(0).slug()).isEqualTo("two-sum");
        assertThat(queue.get(0).failCount()).isEqualTo(1);
        assertThat(queue.get(0).lastVerdict()).isEqualTo("PASSED");
    }

    @Test
    @DisplayName("Queue is capped at 20 items")
    void testQueueCappedAt20() {
        String userId = "many-fails";
        Instant now = Instant.now();
        List<PracticeAttempt> attempts = new ArrayList<>();

        for (int i = 1; i <= 25; i++) {
            PracticeAttempt pa = new PracticeAttempt();
            pa.setUserId(userId);
            pa.setQuestionId("q-" + i);
            pa.setVerdict("FAILED");
            pa.setCreatedAt(now.minus(i, ChronoUnit.MINUTES));
            attempts.add(pa);
        }

        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(attempts);
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        List<RetryQueueItem> queue = retryQueueService.getRetryQueue(userId);
        assertThat(queue).hasSize(20);
        assertThat(queue.get(0).slug()).isEqualTo("q-1"); // most recent failure
        assertThat(queue.get(19).slug()).isEqualTo("q-20");
    }

    @Test
    @DisplayName("Topic pressure breaks tie when latest failure timestamps are identical")
    void testTopicPressureTieBreaker() {
        String userId = "tie-candidate";
        Instant sameTime = Instant.now().minus(15, ChronoUnit.MINUTES);

        // Two practice failures at identical timestamps
        PracticeAttempt pa1 = new PracticeAttempt();
        pa1.setUserId(userId);
        pa1.setQuestionId("two-sum"); // topic: arrays
        pa1.setVerdict("FAILED");
        pa1.setCreatedAt(sameTime);

        PracticeAttempt pa2 = new PracticeAttempt();
        pa2.setUserId(userId);
        pa2.setQuestionId("trapping-rain-water"); // topic: two-pointers
        pa2.setVerdict("FAILED");
        pa2.setCreatedAt(sameTime);

        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(pa1, pa2));

        // Interview session with 2 questions in arrays, 0 in two-pointers
        InterviewSession s = new InterviewSession();
        s.setId(200L);
        s.setCandidateId(userId);
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(s));

        SessionQuestion sq1 = new SessionQuestion();
        sq1.setSessionId(200L);
        sq1.setQuestionSlug("two-sum");
        sq1.setVerdict("PASSED");
        sq1.setAttemptedAt(Instant.now());

        SessionQuestion sq2 = new SessionQuestion();
        sq2.setSessionId(200L);
        sq2.setQuestionSlug("merge-intervals");
        sq2.setVerdict("FAILED");
        sq2.setAttemptedAt(Instant.now());

        when(sessionQuestionRepository.findBySessionIdInOrderByAttemptedAtDesc(List.of(200L)))
                .thenReturn(List.of(sq1, sq2));

        List<RetryQueueItem> queue = retryQueueService.getRetryQueue(userId);

        // Arrays has higher topic pressure -> two-sum should come first
        assertThat(queue).extracting(RetryQueueItem::slug)
                .containsExactly("merge-intervals", "two-sum", "trapping-rain-water");
    }
}
