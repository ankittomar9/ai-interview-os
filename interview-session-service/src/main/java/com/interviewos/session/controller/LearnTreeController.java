package com.interviewos.session.controller;

import com.interviewos.session.dto.LearnTreeResponse;
import com.interviewos.session.service.LearnTreeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class LearnTreeController {

    private final LearnTreeService learnTreeService;

    @GetMapping({"/api/v1/learn/tree", "/api/v1/sessions/learn/tree"})
    public ResponseEntity<LearnTreeResponse> getLearnTree(
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(learnTreeService.getLearnTree(userId));
    }
}
