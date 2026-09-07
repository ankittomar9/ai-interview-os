package com.interviewos.questionbank.controller;

import com.interviewos.questionbank.dto.CatalogDtos.*;
import com.interviewos.questionbank.service.CatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/topics")
    public ResponseEntity<List<TopicSummary>> getTopics(
            @RequestParam(required = false) String track
    ) {
        return ResponseEntity.ok(catalogService.getTopics(track));
    }

    @GetMapping("/questions")
    public ResponseEntity<PagedResponse<QuestionSummary>> getQuestions(
            @RequestParam(required = false) String track,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(catalogService.getQuestions(track, topic, difficulty, q, page, size));
    }

    @GetMapping("/questions/{slug}")
    public ResponseEntity<QuestionDetail> getQuestion(
            @PathVariable("slug") String slug,
            @RequestParam(defaultValue = "false") boolean revealSolution
    ) {
        return catalogService.getQuestionDetail(slug, revealSolution)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
