package com.interviewos.session.controller;

import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.service.PracticeTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/practice")
@RequiredArgsConstructor
public class PracticeProgressController {

    private final PracticeTrackingService practiceTrackingService;

    @GetMapping("/progress")
    public ResponseEntity<Map<String, QuestionProgress>> getProgress(
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(practiceTrackingService.getProgressMap(userId));
    }

    @GetMapping("/attempts/{slug}")
    public ResponseEntity<List<PracticeAttempt>> getAttempts(
            @PathVariable("slug") String slug,
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(practiceTrackingService.getAttempts(userId, slug));
    }
}
