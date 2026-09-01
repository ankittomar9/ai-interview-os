package com.interviewos.questionbank.controller;

import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.dto.QuestionMatchRequest;
import com.interviewos.questionbank.dto.QuestionMatchResponse;
import com.interviewos.questionbank.dto.QuestionPublicView;
import com.interviewos.questionbank.repository.QuestionRepository;
import com.interviewos.questionbank.service.QuestionMatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionPublicController {

    private final QuestionRepository questionRepository;
    private final QuestionMatchService questionMatchService;

    @GetMapping
    public ResponseEntity<List<QuestionPublicView>> listQuestions(
            @RequestParam(required = false) String track,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sessionMode,
            @RequestParam(required = false) List<String> slugs,
            @RequestParam(required = false) Long sessionId
    ) {
        log.info("Listing public questions [track: {}, difficulty: {}, tags: {}, query: {}, sessionMode: {}, slugs: {}, sessionId: {}]",
                track, difficulty, tags, q, sessionMode, slugs, sessionId);
        boolean isInterview = "INTERVIEW".equalsIgnoreCase(sessionMode);

        List<QuestionDocument> docs;
        if (slugs != null && !slugs.isEmpty()) {
            docs = questionRepository.findAll().stream()
                    .filter(d -> "PUBLISHED".equalsIgnoreCase(d.getStatus()) && slugs.contains(d.getSlug()))
                    .toList();
        } else if (track != null && !track.isBlank() && difficulty != null && !difficulty.isBlank()) {
            docs = questionRepository.findByTrackAndDifficultyAndStatus(track, difficulty, "PUBLISHED");
        } else if (track != null && !track.isBlank()) {
            docs = questionRepository.findByTrackAndStatus(track, "PUBLISHED");
        } else if (difficulty != null && !difficulty.isBlank()) {
            docs = questionRepository.findByDifficultyAndStatus(difficulty, "PUBLISHED");
        } else {
            docs = questionRepository.findByStatus("PUBLISHED");
        }

        if (tags != null && !tags.isEmpty()) {
            docs = docs.stream()
                    .filter(d -> d.getTags() != null && d.getTags().stream().anyMatch(tags::contains))
                    .toList();
        }

        if (q != null && !q.isBlank()) {
            String queryLower = q.trim().toLowerCase();
            docs = docs.stream()
                    .filter(d -> (d.getTitle() != null && d.getTitle().toLowerCase().contains(queryLower)) ||
                                 (d.getSlug() != null && d.getSlug().toLowerCase().contains(queryLower)) ||
                                 (d.getTags() != null && d.getTags().stream().anyMatch(t -> t.toLowerCase().contains(queryLower))) ||
                                 (d.getProblemStatement() != null && d.getProblemStatement().toLowerCase().contains(queryLower)))
                    .toList();
        }

        List<QuestionPublicView> publicViews = docs.stream()
                .map(d -> QuestionPublicView.fromDocument(d, isInterview))
                .toList();

        return ResponseEntity.ok(publicViews);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<QuestionPublicView> getQuestionBySlug(
            @PathVariable String slug,
            @RequestParam(required = false) String sessionMode
    ) {
        log.info("Fetching public question for slug: '{}' (sessionMode: {})", slug, sessionMode);
        boolean isInterview = "INTERVIEW".equalsIgnoreCase(sessionMode);

        return questionRepository.findBySlug(slug)
                .filter(q -> "PUBLISHED".equalsIgnoreCase(q.getStatus()))
                .map(d -> QuestionPublicView.fromDocument(d, isInterview))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/match")
    public ResponseEntity<QuestionMatchResponse> matchQuestion(@RequestBody QuestionMatchRequest request) {
        log.info("Received question match request for track: '{}', difficulty: '{}'", request.track(), request.difficulty());
        QuestionMatchResponse response = questionMatchService.matchQuestion(request);
        return ResponseEntity.ok(response);
    }
}
