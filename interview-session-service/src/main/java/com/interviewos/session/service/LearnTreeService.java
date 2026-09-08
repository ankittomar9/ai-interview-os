package com.interviewos.session.service;

import com.interviewos.session.dto.LearnTreeResponse;
import com.interviewos.session.dto.LearnTreeResponse.QuestionNode;
import com.interviewos.session.dto.LearnTreeResponse.TopicNode;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.QuestionProgressRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LearnTreeService {

    private final QuestionProgressRepository questionProgressRepository;
    private final PracticeAttemptRepository practiceAttemptRepository;
    private final SessionQuestionRepository sessionQuestionRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final String questionBankUrl;
    private RestClient restClient;

    private static final long CACHE_TTL_MILLIS = 10 * 60 * 1000L; // 10 minutes
    private volatile CachedCatalog cachedCatalog = null;

    private static final Set<String> EXCLUDED_LEGACY_SLUGS = Set.of(
            "behavioral-technical-conflict",
            "distributed-rate-limiter",
            "lld-order-service",
            "longest-substring-without-repeating-characters",
            "lru-cache",
            "merge-k-sorted-lists",
            "reverse-a-string",
            "sql-7d-moving-average",
            "sql-dedup-keep-latest",
            "sql-funnel-ratios",
            "sql-month-over-month",
            "sql-running-revenue",
            "sql-sessionization",
            "sql-spend-quartiles",
            "sql-top-n-per-group",
            "two-sum",
            "url-shortener-system-design",
            "valid-parentheses"
    );

    public record CatalogQuestionItem(
            String slug,
            String title,
            String track,
            String difficulty,
            List<String> topics
    ) {}

    public record CatalogPageResponse(
            List<CatalogQuestionItem> content,
            long totalElements
    ) {}

    public record CatalogTopicItem(
            String id,
            String name,
            String track
    ) {}

    public record CachedCatalog(
            long timestamp,
            List<CatalogQuestionItem> questions,
            Map<String, String> topicNames,
            Map<String, String> topicTracks
    ) {}

    public LearnTreeService(
            QuestionProgressRepository questionProgressRepository,
            PracticeAttemptRepository practiceAttemptRepository,
            SessionQuestionRepository sessionQuestionRepository,
            InterviewSessionRepository interviewSessionRepository,
            @Value("${question.bank.url:http://question-bank-service:8086}") String questionBankUrl
    ) {
        this.questionProgressRepository = questionProgressRepository;
        this.practiceAttemptRepository = practiceAttemptRepository;
        this.sessionQuestionRepository = sessionQuestionRepository;
        this.interviewSessionRepository = interviewSessionRepository;
        this.questionBankUrl = questionBankUrl;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(questionBankUrl)
                .build();
    }

    public void setRestClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public void setCachedCatalog(CachedCatalog cachedCatalog) {
        this.cachedCatalog = cachedCatalog;
    }

    public synchronized CachedCatalog getOrRefreshCatalog() {
        long now = System.currentTimeMillis();
        if (cachedCatalog != null && (now - cachedCatalog.timestamp() < CACHE_TTL_MILLIS)) {
            return cachedCatalog;
        }

        try {
            log.info("Refreshing question catalog cache from {}", questionBankUrl);
            CatalogPageResponse page = restClient.get()
                    .uri("/api/v1/catalog/questions?size=1000")
                    .retrieve()
                    .body(CatalogPageResponse.class);

            if (page != null && page.content() != null) {
                List<CatalogQuestionItem> curated = page.content().stream()
                        .filter(q -> q.slug() != null && !EXCLUDED_LEGACY_SLUGS.contains(q.slug()))
                        .filter(q -> q.slug().startsWith("dsa-")
                                || q.slug().startsWith("hld-")
                                || q.slug().startsWith("lld-")
                                || q.slug().startsWith("sql-")
                                || q.slug().startsWith("beh-"))
                        .toList();

                Map<String, String> topicNames = new HashMap<>();
                Map<String, String> topicTracks = new HashMap<>();

                try {
                    List<CatalogTopicItem> topics = restClient.get()
                            .uri("/api/v1/catalog/topics")
                            .retrieve()
                            .body(new ParameterizedTypeReference<List<CatalogTopicItem>>() {});
                    if (topics != null) {
                        for (CatalogTopicItem t : topics) {
                            topicNames.put(t.id(), t.name());
                            topicTracks.put(t.id(), t.track());
                        }
                    }
                } catch (Exception te) {
                    log.warn("Failed to fetch catalog topics, using defaults: {}", te.getMessage());
                }

                cachedCatalog = new CachedCatalog(now, curated, topicNames, topicTracks);
                log.info("Cached {} curated catalog questions across {} topics", curated.size(), topicNames.size());
                return cachedCatalog;
            }
        } catch (Exception e) {
            log.warn("Question Bank catalog fetch failed: {}", e.getMessage());
            if (cachedCatalog != null) {
                return cachedCatalog;
            }
        }

        return null;
    }

    @Transactional(readOnly = true)
    public LearnTreeResponse getLearnTree(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "local";

        // 1. Fetch user progress
        List<QuestionProgress> progressList = questionProgressRepository.findByUserId(effectiveUserId);
        Map<String, QuestionProgress> progressMap = new HashMap<>();
        for (QuestionProgress qp : progressList) {
            progressMap.put(qp.getQuestionId(), qp);
        }

        List<PracticeAttempt> attempts = practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId);
        Map<String, List<PracticeAttempt>> attemptsBySlug = attempts.stream()
                .collect(Collectors.groupingBy(PracticeAttempt::getQuestionId));

        List<InterviewSession> sessions = interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(effectiveUserId);
        if (sessions.isEmpty() && "local".equals(effectiveUserId)) {
            sessions = interviewSessionRepository.findAllByOrderByCreatedAtDesc();
        }
        List<Long> sessionIds = sessions.stream().map(InterviewSession::getId).toList();
        List<SessionQuestion> sessionQuestions = sessionIds.isEmpty()
                ? List.of()
                : sessionQuestionRepository.findBySessionIdInOrderByAttemptedAtDesc(sessionIds);
        Map<String, List<SessionQuestion>> sessionQuestionsBySlug = sessionQuestions.stream()
                .collect(Collectors.groupingBy(SessionQuestion::getQuestionSlug));

        // 2. Catalog retrieval
        CachedCatalog catalog = getOrRefreshCatalog();
        if (catalog == null) {
            // Graceful degradation: stale=true, total=null, HTTP 200 OK
            log.warn("Catalog unavailable for learn tree, returning degraded response for user {}", effectiveUserId);
            return buildDegradedResponse(progressMap, attemptsBySlug, sessionQuestionsBySlug);
        }

        // 3. Group questions by primary topic
        Map<String, List<CatalogQuestionItem>> questionsByTopic = new LinkedHashMap<>();
        Map<String, String> topicToTrack = new LinkedHashMap<>();
        Map<String, Integer> trackTotals = new LinkedHashMap<>();

        for (CatalogQuestionItem q : catalog.questions()) {
            String track = q.track();
            trackTotals.put(track, trackTotals.getOrDefault(track, 0) + 1);

            String primaryTopic = (q.topics() != null && !q.topics().isEmpty())
                    ? q.topics().get(0)
                    : defaultTopicForTrack(track);

            questionsByTopic.computeIfAbsent(primaryTopic, k -> new ArrayList<>()).add(q);
            topicToTrack.put(primaryTopic, track);
        }

        // 4. Build Topic Nodes
        List<TopicNode> topicNodes = new ArrayList<>();

        for (Map.Entry<String, List<CatalogQuestionItem>> entry : questionsByTopic.entrySet()) {
            String topicId = entry.getKey();
            List<CatalogQuestionItem> qList = entry.getValue();
            String track = topicToTrack.getOrDefault(topicId, "ALGORITHMS_DATA_STRUCTURES");
            String topicName = catalog.topicNames().getOrDefault(topicId, formatTopicName(topicId));

            int total = qList.size();
            int attempted = 0;
            int solved = 0;
            int passed = 0;
            int failed = 0;

            List<QuestionNode> questionNodes = new ArrayList<>();

            for (CatalogQuestionItem q : qList) {
                String slug = q.slug();
                String verdict = computeVerdict(slug, progressMap, attemptsBySlug, sessionQuestionsBySlug);

                if (!"UNATTEMPTED".equals(verdict)) {
                    attempted++;
                }
                if (hasPracticeSolve(slug, progressMap, attemptsBySlug)) {
                    solved++;
                }

                // Interview counts per question
                List<SessionQuestion> sqList = getSessionQuestionsForSlug(slug, sessionQuestionsBySlug);
                for (SessionQuestion sq : sqList) {
                    if ("PASSED".equalsIgnoreCase(sq.getVerdict())) {
                        passed++;
                    } else if ("FAILED".equalsIgnoreCase(sq.getVerdict())) {
                        failed++;
                    }
                }

                questionNodes.add(new QuestionNode(slug, q.title(), q.track(), q.difficulty(), verdict));
            }

            int interviewAttempted = passed + failed;
            String pressureGap = String.format("Practice ×%d · Interview %d/%d", solved, passed, interviewAttempted);

            topicNodes.add(new TopicNode(
                    topicId,
                    topicName,
                    track,
                    total,
                    attempted,
                    solved,
                    passed,
                    failed,
                    pressureGap,
                    questionNodes
            ));
        }

        return new LearnTreeResponse(topicNodes, trackTotals, false);
    }

    private LearnTreeResponse buildDegradedResponse(
            Map<String, QuestionProgress> progressMap,
            Map<String, List<PracticeAttempt>> attemptsBySlug,
            Map<String, List<SessionQuestion>> sessionQuestionsBySlug
    ) {
        List<TopicNode> nodes = new ArrayList<>();
        List<String> fallbackTopics = List.of("arrays", "strings", "linked-list", "trees", "graphs", "dp", "hashing",
                "two-pointers", "sliding-window", "stacks-queues", "binary-search", "bit-manipulation", "recursion",
                "greedy", "heap", "trie", "math", "matrix", "patterns", "system-design", "lld", "sql", "behavioral");

        for (String topicId : fallbackTopics) {
            String track = defaultTrackForTopic(topicId);
            String pressureGap = "Practice ×0 · Interview 0/0";
            nodes.add(new TopicNode(
                    topicId,
                    formatTopicName(topicId),
                    track,
                    null,
                    0,
                    0,
                    0,
                    0,
                    pressureGap,
                    List.of()
            ));
        }

        return new LearnTreeResponse(nodes, Map.of(), true);
    }

    private String computeVerdict(
            String slug,
            Map<String, QuestionProgress> progressMap,
            Map<String, List<PracticeAttempt>> attemptsBySlug,
            Map<String, List<SessionQuestion>> sessionQuestionsBySlug
    ) {
        if (hasPracticeSolve(slug, progressMap, attemptsBySlug)) {
            return "PASSED";
        }
        List<SessionQuestion> sqs = getSessionQuestionsForSlug(slug, sessionQuestionsBySlug);
        boolean interviewPassed = sqs.stream().anyMatch(sq -> "PASSED".equalsIgnoreCase(sq.getVerdict()));
        if (interviewPassed) {
            return "PASSED";
        }

        boolean hasFailedPractice = getAttemptsForSlug(slug, attemptsBySlug).stream()
                .anyMatch(a -> !"PASSED".equalsIgnoreCase(a.getVerdict()));
        boolean hasFailedInterview = sqs.stream().anyMatch(sq -> "FAILED".equalsIgnoreCase(sq.getVerdict()));

        if (hasFailedPractice || hasFailedInterview) {
            return "FAILED";
        }

        boolean hasAnyAttempt = progressMap.containsKey(slug)
                || !getAttemptsForSlug(slug, attemptsBySlug).isEmpty()
                || !sqs.isEmpty();
        return hasAnyAttempt ? "FAILED" : "UNATTEMPTED";
    }

    private boolean hasPracticeSolve(
            String slug,
            Map<String, QuestionProgress> progressMap,
            Map<String, List<PracticeAttempt>> attemptsBySlug
    ) {
        QuestionProgress qp = getProgressForSlug(slug, progressMap);
        if (qp != null && qp.getSolveCount() > 0) {
            return true;
        }
        return getAttemptsForSlug(slug, attemptsBySlug).stream()
                .anyMatch(a -> "PASSED".equalsIgnoreCase(a.getVerdict()));
    }

    private QuestionProgress getProgressForSlug(String slug, Map<String, QuestionProgress> map) {
        if (map.containsKey(slug)) return map.get(slug);
        String unaliased = stripPrefix(slug);
        if (unaliased != null && map.containsKey(unaliased)) return map.get(unaliased);
        return null;
    }

    private List<PracticeAttempt> getAttemptsForSlug(String slug, Map<String, List<PracticeAttempt>> map) {
        if (map.containsKey(slug)) return map.get(slug);
        String unaliased = stripPrefix(slug);
        if (unaliased != null && map.containsKey(unaliased)) return map.get(unaliased);
        return List.of();
    }

    private List<SessionQuestion> getSessionQuestionsForSlug(String slug, Map<String, List<SessionQuestion>> map) {
        if (map.containsKey(slug)) return map.get(slug);
        String unaliased = stripPrefix(slug);
        if (unaliased != null && map.containsKey(unaliased)) return map.get(unaliased);
        return List.of();
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

    private String defaultTopicForTrack(String track) {
        if ("SYSTEM_DESIGN".equalsIgnoreCase(track)) return "system-design";
        if ("SPRING_LLD".equalsIgnoreCase(track)) return "lld";
        if ("SQL".equalsIgnoreCase(track)) return "sql";
        if ("BEHAVIORAL_STAR".equalsIgnoreCase(track)) return "behavioral";
        return "arrays";
    }

    private String defaultTrackForTopic(String topic) {
        if ("system-design".equals(topic)) return "SYSTEM_DESIGN";
        if ("lld".equals(topic)) return "SPRING_LLD";
        if ("sql".equals(topic)) return "SQL";
        if ("behavioral".equals(topic)) return "BEHAVIORAL_STAR";
        return "ALGORITHMS_DATA_STRUCTURES";
    }

    private String formatTopicName(String topicId) {
        if (topicId == null || topicId.isBlank()) return "Topic";
        return Arrays.stream(topicId.split("-"))
                .map(s -> s.isEmpty() ? "" : Character.toUpperCase(s.charAt(0)) + s.substring(1))
                .collect(Collectors.joining(" "));
    }
}
