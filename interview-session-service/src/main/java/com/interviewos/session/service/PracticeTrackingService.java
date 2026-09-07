package com.interviewos.session.service;

import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.QuestionProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PracticeTrackingService {

    private final PracticeAttemptRepository practiceAttemptRepository;
    private final QuestionProgressRepository questionProgressRepository;

    @Transactional
    public PracticeAttempt recordAttempt(
            String userId,
            String questionId,
            String track,
            int languageId,
            String verdict,
            int testsPassed,
            int testsTotal,
            Integer runtimeMs,
            Integer memoryKb
    ) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "local";
        String normalizedVerdict = (verdict != null) ? verdict.toUpperCase() : "FAILED";

        long priorAttempts = practiceAttemptRepository.countByUserIdAndQuestionId(effectiveUserId, questionId);
        int attemptSeq = (int) priorAttempts + 1;

        PracticeAttempt attempt = PracticeAttempt.builder()
                .userId(effectiveUserId)
                .questionId(questionId)
                .track(track != null ? track : "ALGORITHMS_DATA_STRUCTURES")
                .languageId(languageId)
                .verdict(normalizedVerdict)
                .testsPassed(testsPassed)
                .testsTotal(testsTotal)
                .runtimeMs(runtimeMs)
                .memoryKb(memoryKb)
                .attemptSeq(attemptSeq)
                .createdAt(Instant.now())
                .build();

        PracticeAttempt savedAttempt = practiceAttemptRepository.save(attempt);

        // Upsert QuestionProgress
        QuestionProgress progress = questionProgressRepository.findByUserIdAndQuestionId(effectiveUserId, questionId)
                .orElseGet(() -> QuestionProgress.builder()
                        .userId(effectiveUserId)
                        .questionId(questionId)
                        .attemptCount(0)
                        .solveCount(0)
                        .build());

        progress.setAttemptCount(progress.getAttemptCount() + 1);
        progress.setLastAttemptedAt(Instant.now());

        if ("PASSED".equals(normalizedVerdict)) {
            progress.setSolveCount(progress.getSolveCount() + 1);
            if (progress.getFirstSolvedAt() == null) {
                progress.setFirstSolvedAt(Instant.now());
            }
        }

        questionProgressRepository.save(progress);

        log.info("Recorded practice attempt #{} for user '{}', question '{}', verdict: {}, progress: {}/{} solved",
                attemptSeq, effectiveUserId, questionId, normalizedVerdict, progress.getSolveCount(), progress.getAttemptCount());

        return savedAttempt;
    }

    public List<PracticeAttempt> getAttempts(String userId, String questionId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "local";
        return practiceAttemptRepository.findByUserIdAndQuestionIdOrderByCreatedAtDesc(effectiveUserId, questionId);
    }

    public Map<String, QuestionProgress> getProgressMap(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "local";
        return questionProgressRepository.findByUserId(effectiveUserId).stream()
                .collect(Collectors.toMap(QuestionProgress::getQuestionId, p -> p));
    }
}
