package com.interviewos.session.sandbox.controller;

import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ProblemPublicView;
import com.interviewos.session.sandbox.repository.ProblemRepository;
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

    private final ProblemRepository problemRepository;

    @GetMapping
    public ResponseEntity<List<ProblemPublicView>> listProblems(
            @RequestParam(required = false) String track,
            @RequestParam(required = false) String difficulty
    ) {
        log.info("Fetching public problem catalog [track: {}, difficulty: {}]", track, difficulty);
        List<ProblemDocument> all = problemRepository.findAll();

        List<ProblemPublicView> filtered = all.stream()
                .filter(p -> track == null || track.isBlank() || p.getTrack() == null || p.getTrack().equalsIgnoreCase(track))
                .filter(p -> difficulty == null || difficulty.isBlank() || p.getDifficulty() == null || p.getDifficulty().equalsIgnoreCase(difficulty))
                .map(ProblemPublicView::fromDocument)
                .toList();

        // If specific filter yielded 0, return all problems in that track or all available
        if (filtered.isEmpty() && !all.isEmpty()) {
            filtered = all.stream()
                    .filter(p -> track == null || track.isBlank() || p.getTrack() == null || p.getTrack().equalsIgnoreCase(track))
                    .map(ProblemPublicView::fromDocument)
                    .toList();
        }

        if (filtered.isEmpty()) {
            filtered = all.stream().map(ProblemPublicView::fromDocument).toList();
        }

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProblemPublicView> getProblemBySlug(@PathVariable String slug) {
        log.info("Fetching public problem detail for slug: {}", slug);
        return problemRepository.findByProblemSlug(slug)
                .map(ProblemPublicView::fromDocument)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
