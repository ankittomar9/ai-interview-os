package com.interviewos.session.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.QuestionEncountersResponse;
import com.interviewos.session.dto.SessionQuestionResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.repository.QuestionProgressRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionQuestionService {

    private final SessionQuestionRepository sessionQuestionRepository;
    private final QuestionProgressRepository questionProgressRepository;

    @Transactional
    public List<SessionQuestion> recordSessionQuestions(
            InterviewSession session,
            List<InterviewSessionDocument.SubmissionEntry> submissions
    ) {
        if (session == null || session.getId() == null) {
            log.warn("Cannot record session questions for null or unsaved session");
            return List.of();
        }

        List<String> plannedSlugs = session.getPlannedSlugs();
        if (plannedSlugs == null || plannedSlugs.isEmpty()) {
            log.info("Session {} has no planned slugs to record", session.getId());
            return List.of();
        }

        // Clean up any existing rows for idempotency
        sessionQuestionRepository.deleteBySessionId(session.getId());

        Map<String, List<InterviewSessionDocument.SubmissionEntry>> submissionsBySlug = new HashMap<>();
        if (submissions != null) {
            for (InterviewSessionDocument.SubmissionEntry entry : submissions) {
                if (entry.getProblemSlug() != null) {
                    submissionsBySlug.computeIfAbsent(entry.getProblemSlug(), k -> new ArrayList<>()).add(entry);
                }
            }
        }

        List<SessionQuestion> toSave = new ArrayList<>();
        int order = 0;
        for (String slug : plannedSlugs) {
            List<InterviewSessionDocument.SubmissionEntry> slugSubmissions = submissionsBySlug.getOrDefault(slug, List.of());

            String verdict = "UNATTEMPTED";
            Instant attemptedAt = null;

            if (!slugSubmissions.isEmpty()) {
                boolean hasPassed = slugSubmissions.stream()
                        .anyMatch(s -> "PASSED".equalsIgnoreCase(s.getStatus()));

                if (hasPassed) {
                    verdict = "PASSED";
                    // Pick the timestamp of the first or latest passed run
                    attemptedAt = slugSubmissions.stream()
                            .filter(s -> "PASSED".equalsIgnoreCase(s.getStatus()))
                            .map(s -> s.getTimestamp() != null ? s.getTimestamp().toInstant(ZoneOffset.UTC) : Instant.now())
                            .max(Comparator.naturalOrder())
                            .orElse(Instant.now());
                } else {
                    verdict = "FAILED";
                    attemptedAt = slugSubmissions.stream()
                            .map(s -> s.getTimestamp() != null ? s.getTimestamp().toInstant(ZoneOffset.UTC) : Instant.now())
                            .max(Comparator.naturalOrder())
                            .orElse(Instant.now());
                }
            }

            SessionQuestion sq = SessionQuestion.builder()
                    .sessionId(session.getId())
                    .questionSlug(slug)
                    .displayOrder(order++)
                    .verdict(verdict)
                    .attemptedAt(attemptedAt)
                    .updatedAt(Instant.now())
                    .build();

            toSave.add(sq);
        }

        List<SessionQuestion> saved = sessionQuestionRepository.saveAll(toSave);
        log.info("Recorded {} session_questions rows for session {}", saved.size(), session.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<SessionQuestionResponse> getSessionQuestions(Long sessionId) {
        return sessionQuestionRepository.findBySessionIdOrderByDisplayOrderAsc(sessionId).stream()
                .map(SessionQuestionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionEncountersResponse getQuestionEncounters(String questionSlug, String userId) {
        String effectiveUser = (userId != null && !userId.isBlank()) ? userId : "local";

        int practiceSolves = questionProgressRepository.findByUserIdAndQuestionId(effectiveUser, questionSlug)
                .map(QuestionProgress::getSolveCount)
                .orElse(0);

        List<SessionQuestion> encounterRows = sessionQuestionRepository.findByQuestionSlugOrderByAttemptedAtDesc(questionSlug);

        int interviewPasses = (int) encounterRows.stream()
                .filter(r -> "PASSED".equalsIgnoreCase(r.getVerdict()))
                .count();

        int interviewAttempts = (int) encounterRows.stream()
                .filter(r -> !"UNATTEMPTED".equalsIgnoreCase(r.getVerdict()))
                .count();

        String pressureGap = QuestionEncountersResponse.formatPressureGap(practiceSolves, interviewPasses, interviewAttempts);

        List<QuestionEncountersResponse.EncounterItem> items = encounterRows.stream()
                .map(r -> new QuestionEncountersResponse.EncounterItem(
                        r.getSessionId(),
                        r.getVerdict(),
                        r.getAttemptedAt()
                ))
                .toList();

        return new QuestionEncountersResponse(
                questionSlug,
                practiceSolves,
                interviewPasses,
                interviewAttempts,
                pressureGap,
                items
        );
    }
}
