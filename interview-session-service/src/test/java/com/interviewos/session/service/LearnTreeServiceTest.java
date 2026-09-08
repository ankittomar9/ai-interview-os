package com.interviewos.session.service;

import com.interviewos.session.dto.LearnTreeResponse;
import com.interviewos.session.dto.LearnTreeResponse.TopicNode;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.QuestionProgressRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LearnTreeServiceTest {

    @Mock
    private QuestionProgressRepository questionProgressRepository;

    @Mock
    private PracticeAttemptRepository practiceAttemptRepository;

    @Mock
    private SessionQuestionRepository sessionQuestionRepository;

    @Mock
    private InterviewSessionRepository interviewSessionRepository;

    private LearnTreeService learnTreeService;
    private final String testUserId = "vp12-candidate";

    @BeforeEach
    void setUp() {
        learnTreeService = new LearnTreeService(
                questionProgressRepository,
                practiceAttemptRepository,
                sessionQuestionRepository,
                interviewSessionRepository,
                "http://localhost:8086"
        );
    }

    private void seedStagedCatalog() {
        // Create a small staged catalog snapshot
        List<LearnTreeService.CatalogQuestionItem> questions = List.of(
                new LearnTreeService.CatalogQuestionItem("dsa-two-sum-target", "Two Sum", "ALGORITHMS_DATA_STRUCTURES", "EASY", List.of("arrays")),
                new LearnTreeService.CatalogQuestionItem("dsa-lc56-merge-intervals", "Merge Intervals", "ALGORITHMS_DATA_STRUCTURES", "MEDIUM", List.of("arrays")),
                new LearnTreeService.CatalogQuestionItem("dsa-lc20-valid-parentheses", "Valid Parentheses", "ALGORITHMS_DATA_STRUCTURES", "EASY", List.of("stacks-queues")),
                new LearnTreeService.CatalogQuestionItem("dsa-trapping-rain-water", "Trapping Rain Water", "ALGORITHMS_DATA_STRUCTURES", "HARD", List.of("two-pointers")),
                new LearnTreeService.CatalogQuestionItem("hld-url-shortener-bitly", "URL Shortener", "SYSTEM_DESIGN", "MID", List.of("system-design")),
                new LearnTreeService.CatalogQuestionItem("lld-parking-lot", "Parking Lot", "SPRING_LLD", "MID", List.of("lld")),
                new LearnTreeService.CatalogQuestionItem("sql-second-highest-salary-safe", "Second Highest Salary", "SQL", "EASY", List.of("sql")),
                new LearnTreeService.CatalogQuestionItem("beh-critical-production-outage-rollback", "Outage Rollback", "BEHAVIORAL_STAR", "MID", List.of("behavioral"))
        );

        Map<String, String> topicNames = Map.of(
                "arrays", "Arrays",
                "stacks-queues", "Stacks & Queues",
                "two-pointers", "Two Pointers",
                "system-design", "System Design",
                "lld", "Low-Level Design",
                "sql", "SQL",
                "behavioral", "Behavioral"
        );

        Map<String, String> topicTracks = Map.of(
                "arrays", "ALGORITHMS_DATA_STRUCTURES",
                "stacks-queues", "ALGORITHMS_DATA_STRUCTURES",
                "two-pointers", "ALGORITHMS_DATA_STRUCTURES",
                "system-design", "SYSTEM_DESIGN",
                "lld", "SPRING_LLD",
                "sql", "SQL",
                "behavioral", "BEHAVIORAL_STAR"
        );

        learnTreeService.setCachedCatalog(new LearnTreeService.CachedCatalog(
                System.currentTimeMillis(),
                questions,
                topicNames,
                topicTracks
        ));
    }

    @Test
    @DisplayName("Empty state returns clean zero progress with total counts from catalog")
    void testEmptyStateReturnsCleanZeroesWithCatalogTotals() {
        seedStagedCatalog();

        when(questionProgressRepository.findByUserId(testUserId)).thenReturn(List.of());
        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of());
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of());

        LearnTreeResponse tree = learnTreeService.getLearnTree(testUserId);

        assertThat(tree).isNotNull();
        assertThat(tree.stale()).isFalse();
        assertThat(tree.trackTotals()).containsEntry("ALGORITHMS_DATA_STRUCTURES", 4);
        assertThat(tree.trackTotals()).containsEntry("SYSTEM_DESIGN", 1);
        assertThat(tree.trackTotals()).containsEntry("SPRING_LLD", 1);
        assertThat(tree.trackTotals()).containsEntry("SQL", 1);
        assertThat(tree.trackTotals()).containsEntry("BEHAVIORAL_STAR", 1);

        TopicNode arraysNode = tree.topics().stream()
                .filter(t -> "arrays".equals(t.topicId()))
                .findFirst().orElseThrow();

        assertThat(arraysNode.total()).isEqualTo(2);
        assertThat(arraysNode.solved()).isEqualTo(0);
        assertThat(arraysNode.attempted()).isEqualTo(0);
        assertThat(arraysNode.passed()).isEqualTo(0);
        assertThat(arraysNode.failed()).isEqualTo(0);
        assertThat(arraysNode.pressureGap()).isEqualTo("Practice ×0 · Interview 0/0");
        assertThat(arraysNode.questions()).hasSize(2);
        assertThat(arraysNode.questions().get(0).verdict()).isEqualTo("UNATTEMPTED");
    }

    @Test
    @DisplayName("Gate VP12: Scripted activity produces exact topic counts, pressureGap strings, and question verdicts")
    void testGateVP12ScriptedActivityMath() {
        seedStagedCatalog();

        // 3 practice solved (2 in arrays, 1 in stacks-queues), 1 practice failed (in two-pointers)
        QuestionProgress qp1 = QuestionProgress.builder().userId(testUserId).questionId("dsa-two-sum-target").attemptCount(1).solveCount(1).build();
        QuestionProgress qp2 = QuestionProgress.builder().userId(testUserId).questionId("dsa-lc56-merge-intervals").attemptCount(1).solveCount(1).build();
        QuestionProgress qp3 = QuestionProgress.builder().userId(testUserId).questionId("dsa-lc20-valid-parentheses").attemptCount(1).solveCount(1).build();
        QuestionProgress qp4 = QuestionProgress.builder().userId(testUserId).questionId("dsa-trapping-rain-water").attemptCount(1).solveCount(0).build();

        when(questionProgressRepository.findByUserId(testUserId)).thenReturn(List.of(qp1, qp2, qp3, qp4));

        PracticeAttempt pa1 = PracticeAttempt.builder().id(1L).userId(testUserId).questionId("dsa-two-sum-target").verdict("PASSED").createdAt(Instant.now()).build();
        PracticeAttempt pa2 = PracticeAttempt.builder().id(2L).userId(testUserId).questionId("dsa-lc56-merge-intervals").verdict("PASSED").createdAt(Instant.now()).build();
        PracticeAttempt pa3 = PracticeAttempt.builder().id(3L).userId(testUserId).questionId("dsa-lc20-valid-parentheses").verdict("PASSED").createdAt(Instant.now()).build();
        PracticeAttempt pa4 = PracticeAttempt.builder().id(4L).userId(testUserId).questionId("dsa-trapping-rain-water").verdict("FAILED").createdAt(Instant.now()).build();

        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of(pa4, pa3, pa2, pa1));

        // 1 interview session with 1 pass (dsa-two-sum-target in arrays), 1 fail (dsa-trapping-rain-water in two-pointers)
        InterviewSession session = InterviewSession.builder().id(101L).candidateId(testUserId).build();
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of(session));

        SessionQuestion sq1 = SessionQuestion.builder().id(1L).sessionId(101L).questionSlug("dsa-two-sum-target").verdict("PASSED").build();
        SessionQuestion sq2 = SessionQuestion.builder().id(2L).sessionId(101L).questionSlug("dsa-trapping-rain-water").verdict("FAILED").build();
        when(sessionQuestionRepository.findBySessionIdInOrderByAttemptedAtDesc(List.of(101L))).thenReturn(List.of(sq1, sq2));

        LearnTreeResponse tree = learnTreeService.getLearnTree(testUserId);

        // Verify arrays node: 2 total, 2 solved, 2 attempted, 1 interview pass, 0 interview fail -> Practice ×2 · Interview 1/1
        TopicNode arraysNode = tree.topics().stream().filter(t -> "arrays".equals(t.topicId())).findFirst().orElseThrow();
        assertThat(arraysNode.total()).isEqualTo(2);
        assertThat(arraysNode.solved()).isEqualTo(2);
        assertThat(arraysNode.attempted()).isEqualTo(2);
        assertThat(arraysNode.passed()).isEqualTo(1);
        assertThat(arraysNode.failed()).isEqualTo(0);
        assertThat(arraysNode.pressureGap()).isEqualTo("Practice ×2 · Interview 1/1");

        // Verify two-pointers node: 1 total, 0 solved, 1 attempted, 0 interview pass, 1 interview fail -> Practice ×0 · Interview 0/1
        TopicNode twoPointersNode = tree.topics().stream().filter(t -> "two-pointers".equals(t.topicId())).findFirst().orElseThrow();
        assertThat(twoPointersNode.total()).isEqualTo(1);
        assertThat(twoPointersNode.solved()).isEqualTo(0);
        assertThat(twoPointersNode.attempted()).isEqualTo(1);
        assertThat(twoPointersNode.passed()).isEqualTo(0);
        assertThat(twoPointersNode.failed()).isEqualTo(1);
        assertThat(twoPointersNode.pressureGap()).isEqualTo("Practice ×0 · Interview 0/1");

        // Verify stacks-queues node: 1 total, 1 solved, 1 attempted, 0 interview pass, 0 interview fail -> Practice ×1 · Interview 0/0
        TopicNode sqNode = tree.topics().stream().filter(t -> "stacks-queues".equals(t.topicId())).findFirst().orElseThrow();
        assertThat(sqNode.total()).isEqualTo(1);
        assertThat(sqNode.solved()).isEqualTo(1);
        assertThat(sqNode.pressureGap()).isEqualTo("Practice ×1 · Interview 0/0");
    }

    @Test
    @DisplayName("Degradation mode: When catalog cache is missing and question-bank unreachable, return HTTP 200 with stale=true and total=null")
    void testDegradationModeReturnsStaleAndNullTotals() {
        // No catalog cached, restClient will fail to connect
        when(questionProgressRepository.findByUserId(testUserId)).thenReturn(List.of());
        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of());
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of());

        LearnTreeResponse tree = learnTreeService.getLearnTree(testUserId);

        assertThat(tree).isNotNull();
        assertThat(tree.stale()).isTrue();
        assertThat(tree.trackTotals()).isEmpty();
        assertThat(tree.topics()).isNotEmpty();
        for (TopicNode node : tree.topics()) {
            assertThat(node.total()).isNull();
            assertThat(node.questions()).isEmpty();
        }
    }
}
