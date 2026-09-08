package com.interviewos.session.controller;

import com.interviewos.session.dto.RetryQueueItem;
import com.interviewos.session.service.RetryQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/learn/retry", "/api/v1/sessions/learn/retry"})
public class RetryQueueController {

    private final RetryQueueService retryQueueService;

    public RetryQueueController(RetryQueueService retryQueueService) {
        this.retryQueueService = retryQueueService;
    }

    @GetMapping
    public ResponseEntity<List<RetryQueueItem>> getRetryQueue(
            @RequestParam(name = "userId", required = false, defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(retryQueueService.getRetryQueue(userId));
    }
}
