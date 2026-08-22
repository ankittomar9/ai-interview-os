package com.interviewos.session.sandbox.controller;

import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ProblemPublicView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
public class ProblemCatalogController {

    private final QuestionBankClient questionBankClient;

    @GetMapping
    public ResponseEntity<List<ProblemPublicView>> listProblems(
            @RequestParam(required = false) String track,
            @RequestParam(required = false) String difficulty
    ) {
        log.info("Fetching public problem catalog via QuestionBankClient [track: {}, difficulty: {}]", track, difficulty);
        List<ProblemDocument> list = questionBankClient.listProblems(track, difficulty);

        List<ProblemPublicView> views = list.stream()
                .map(ProblemPublicView::fromDocument)
                .toList();

        return ResponseEntity.ok(views);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProblemPublicView> getProblemBySlug(@PathVariable String slug) {
        log.info("Fetching public problem detail for slug: {}", slug);
        return questionBankClient.fetchProblemBySlug(slug)
                .map(ProblemPublicView::fromDocument)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
