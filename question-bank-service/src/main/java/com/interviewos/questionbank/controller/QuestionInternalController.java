package com.interviewos.questionbank.controller;

import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.dto.QuestionFullView;
import com.interviewos.questionbank.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/internal/v1/questions")
@RequiredArgsConstructor
public class QuestionInternalController {

    private final QuestionRepository questionRepository;

    @GetMapping("/{slug}/full")
    public ResponseEntity<QuestionFullView> getQuestionFullView(@PathVariable String slug) {
        log.info("Fetching internal full question view for slug: '{}'", slug);
        return questionRepository.findBySlug(slug)
                .map(QuestionFullView::fromDocument)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importQuestions(@RequestBody List<QuestionFullView> questions) {
        log.info("Importing {} questions into Question Bank catalog...", questions.size());
        int upserted = 0;
        for (QuestionFullView q : questions) {
            if (q.slug() == null || q.slug().isBlank()) continue;
            QuestionDocument doc = q.toDocument();
            questionRepository.findBySlug(q.slug())
                    .ifPresent(existing -> doc.setId(existing.getId()));
            questionRepository.save(doc);
            upserted++;
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "SUCCESS",
                "importedCount", upserted
        ));
    }
}
