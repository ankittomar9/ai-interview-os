package com.interviewos.session.service;

import com.interviewos.session.dto.RetryQueueItem;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * RetryQueueService resurfaces questions where the candidate has experienced failure.
 *
 * Candidate Selection:
 * - Candidates are questions with at least 1 FAILED practice attempt (verdict != "PASSED")
 *   OR at least 1 interview verdict FAILED (verdict == "FAILED").
 * - Questions that are PASSED with zero failures across practice and interview are strictly excluded.
 *
 * Ordering Rule:
 * - Primary key: latest failure recency DESC (most recently failed first).
 * - Secondary key: topic pressure DESC (total interview attempts in the question's topic).
 * - Tertiary key: fail count DESC (total number of failures for this question).
 * - Quaternary key: slug ASC (deterministic alphabetical tie-breaker).
 *
 * Output Cap:
 * - Capped at 20 items.
 *
 * Ordering Expression:
 * Comparator.comparing(CandidateAggregate::latestFailureAt, Comparator.nullsLast(Comparator.reverseOrder()))
 *     .thenComparing(Comparator.comparingInt((CandidateAggregate c) -> topicPressureMap.getOrDefault(c.topic(), 0)).reversed())
 *     .thenComparing(Comparator.comparingInt(CandidateAggregate::failCount).reversed())
 *     .thenComparing(CandidateAggregate::slug)
 */
@Service
public class RetryQueueService {

    private static final Logger log = LoggerFactory.getLogger(RetryQueueService.class);
    private static final int MAX_QUEUE_CAP = 20;

    private final PracticeAttemptRepository practiceAttemptRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final SessionQuestionRepository sessionQuestionRepository;
    private final LearnTreeService learnTreeService;

    public RetryQueueService(
            PracticeAttemptRepository practiceAttemptRepository,
            InterviewSessionRepository interviewSessionRepository,
            SessionQuestionRepository sessionQuestionRepository,
            LearnTreeService learnTreeService
    ) {
        this.practiceAttemptRepository = practiceAttemptRepository;
        this.interviewSessionRepository = interviewSessionRepository;
        this.sessionQuestionRepository = sessionQuestionRepository;
        this.learnTreeService = learnTreeService;
    }

    public record CandidateAggregate(
            String slug,
            String title,
            String topic,
            String lastVerdict,
            int failCount,
            Instant lastAttemptAt,
            Instant latestFailureAt
    ) {}

    @Transactional(readOnly = true)
    public List<RetryQueueItem> getRetryQueue(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "local";

        // 1. Fetch practice attempts
        List<PracticeAttempt> practiceAttempts = practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId);

        // 2. Fetch interview sessions and session questions
        List<InterviewSession> sessions = interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(effectiveUserId);
        if (sessions.isEmpty() && "local".equals(effectiveUserId)) {
            sessions = interviewSessionRepository.findAllByOrderByCreatedAtDesc();
        }
        List<Long> sessionIds = sessions.stream().map(InterviewSession::getId).toList();
        List<SessionQuestion> sessionQuestions = sessionIds.isEmpty()
                ? List.of()
                : sessionQuestionRepository.findBySessionIdInOrderByAttemptedAtDesc(sessionIds);

        // 3. Catalog lookup for titles and topics
        LearnTreeService.CachedCatalog catalog = learnTreeService.getOrRefreshCatalog();
        Map<String, LearnTreeService.CatalogQuestionItem> catalogQuestions = new HashMap<>();
        if (catalog != null && catalog.questions() != null) {
            for (LearnTreeService.CatalogQuestionItem q : catalog.questions()) {
                catalogQuestions.put(q.slug(), q);
                String unaliased = stripPrefix(q.slug());
                if (unaliased != null) {
                    catalogQuestions.putIfAbsent(unaliased, q);
                }
            }
        }

        // Group attempts by question slug
        Map<String, List<PracticeAttempt>> attemptsBySlug = practiceAttempts.stream()
                .filter(a -> a.getQuestionId() != null)
                .collect(Collectors.groupingBy(PracticeAttempt::getQuestionId));

        Map<String, List<SessionQuestion>> sessionQuestionsBySlug = sessionQuestions.stream()
                .filter(sq -> sq.getQuestionSlug() != null)
                .collect(Collectors.groupingBy(SessionQuestion::getQuestionSlug));

        // Union of all attempted slugs
        Set<String> allSlugs = new LinkedHashSet<>();
        allSlugs.addAll(attemptsBySlug.keySet());
        allSlugs.addAll(sessionQuestionsBySlug.keySet());

        // Compute topic pressure: total interview encounters per topic
        Map<String, Integer> topicPressureMap = new HashMap<>();
        for (SessionQuestion sq : sessionQuestions) {
            String qSlug = sq.getQuestionSlug();
            String topic = resolveTopic(qSlug, catalogQuestions);
            if ("PASSED".equalsIgnoreCase(sq.getVerdict()) || "FAILED".equalsIgnoreCase(sq.getVerdict())) {
                topicPressureMap.put(topic, topicPressureMap.getOrDefault(topic, 0) + 1);
            }
        }

        List<CandidateAggregate> candidates = new ArrayList<>();

        for (String slug : allSlugs) {
            List<PracticeAttempt> paList = attemptsBySlug.getOrDefault(slug, List.of());
            List<SessionQuestion> sqList = sessionQuestionsBySlug.getOrDefault(slug, List.of());

            int failCount = 0;
            Instant latestFailureAt = null;
            Instant latestAttemptAt = null;
            String lastVerdict = "UNATTEMPTED";

            // Process practice attempts
            for (PracticeAttempt pa : paList) {
                Instant attemptTime = pa.getCreatedAt() != null ? pa.getCreatedAt() : Instant.EPOCH;
                if (latestAttemptAt == null || attemptTime.isAfter(latestAttemptAt)) {
                    latestAttemptAt = attemptTime;
                    lastVerdict = pa.getVerdict();
                }
                boolean isFailed = !"PASSED".equalsIgnoreCase(pa.getVerdict());
                if (isFailed) {
                    failCount++;
                    if (latestFailureAt == null || attemptTime.isAfter(latestFailureAt)) {
                        latestFailureAt = attemptTime;
                    }
                }
            }

            // Process interview session questions
            for (SessionQuestion sq : sqList) {
                Instant attemptTime = sq.getAttemptedAt() != null
                        ? sq.getAttemptedAt()
                        : (sq.getUpdatedAt() != null ? sq.getUpdatedAt() : Instant.EPOCH);
                if (latestAttemptAt == null || attemptTime.isAfter(latestAttemptAt)) {
                    latestAttemptAt = attemptTime;
                    lastVerdict = sq.getVerdict();
                }
                boolean isFailed = "FAILED".equalsIgnoreCase(sq.getVerdict());
                if (isFailed) {
                    failCount++;
                    if (latestFailureAt == null || attemptTime.isAfter(latestFailureAt)) {
                        latestFailureAt = attemptTime;
                    }
                }
            }

            // Candidate selection rule:
            // ≥1 FAILED practice attempt OR ≥1 interview verdict FAILED;
            // Exclude questions PASSED with zero failures.
            if (failCount < 1) {
                continue;
            }

            String topic = resolveTopic(slug, catalogQuestions);
            String title = resolveTitle(slug, catalogQuestions);

            candidates.add(new CandidateAggregate(
                    slug,
                    title,
                    topic,
                    lastVerdict,
                    failCount,
                    latestAttemptAt,
                    latestFailureAt
            ));
        }

        // Order by: (latest failure recency DESC, topic pressure DESC, failCount DESC, slug ASC)
        Comparator<CandidateAggregate> ordering = Comparator.comparing(CandidateAggregate::latestFailureAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(Comparator.comparingInt((CandidateAggregate c) -> topicPressureMap.getOrDefault(c.topic(), 0)).reversed())
                .thenComparing(Comparator.comparingInt(CandidateAggregate::failCount).reversed())
                .thenComparing(CandidateAggregate::slug);

        return candidates.stream()
                .sorted(ordering)
                .limit(MAX_QUEUE_CAP)
                .map(c -> new RetryQueueItem(
                        c.slug(),
                        c.title(),
                        c.topic(),
                        c.lastVerdict(),
                        c.failCount(),
                        c.lastAttemptAt()
                ))
                .toList();
    }

    private String resolveTopic(String slug, Map<String, LearnTreeService.CatalogQuestionItem> catalog) {
        LearnTreeService.CatalogQuestionItem item = findInCatalog(slug, catalog);
        if (item != null && item.topics() != null && !item.topics().isEmpty()) {
            return item.topics().get(0);
        }
        if (slug != null) {
            String lower = slug.toLowerCase();
            if (lower.contains("rain-water")) return "two-pointers";
            if (lower.contains("two-sum")) return "arrays";
            if (lower.contains("lru")) return "stacks-queues";
            if (lower.contains("intervals")) return "arrays";
            if (lower.contains("parentheses")) return "stacks-queues";
            if (lower.startsWith("hld-") || lower.startsWith("system-design")) return "system-design";
            if (lower.startsWith("lld-")) return "lld";
            if (lower.startsWith("sql-")) return "sql";
            if (lower.startsWith("beh-")) return "behavioral";
        }
        return "arrays";
    }

    private String resolveTitle(String slug, Map<String, LearnTreeService.CatalogQuestionItem> catalog) {
        LearnTreeService.CatalogQuestionItem item = findInCatalog(slug, catalog);
        if (item != null && item.title() != null && !item.title().isBlank()) {
            return item.title();
        }
        if (slug == null || slug.isBlank()) return "Unknown Question";
        String stripped = stripPrefix(slug);
        String base = stripped != null ? stripped : slug;
        return Arrays.stream(base.split("-"))
                .filter(s -> !s.isBlank())
                .map(s -> Character.toUpperCase(s.charAt(0)) + s.substring(1))
                .collect(Collectors.joining(" "));
    }

    private LearnTreeService.CatalogQuestionItem findInCatalog(String slug, Map<String, LearnTreeService.CatalogQuestionItem> catalog) {
        if (slug == null || catalog == null) return null;
        if (catalog.containsKey(slug)) return catalog.get(slug);
        String stripped = stripPrefix(slug);
        if (stripped != null && catalog.containsKey(stripped)) return catalog.get(stripped);
        return null;
    }

    private String stripPrefix(String slug) {
        if (slug == null) return null;
        for (String pfx : List.of("dsa-", "hld-", "lld-", "sql-", "beh-")) {
            if (slug.startsWith(pfx)) {
                return slug.substring(pfx.length());
            }
        }
        return null;
    }
}
