package com.interviewos.session.controller;

import com.interviewos.session.dto.*;
import com.interviewos.session.service.HistoryService;
import com.interviewos.session.service.HistoryValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping("/calendar")
    public ResponseEntity<HistoryCalendarResponse> getCalendar(
            @RequestParam(value = "userId", defaultValue = "local") String userId,
            @RequestParam(value = "tz", required = false) String tz,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to
    ) {
        return ResponseEntity.ok(historyService.getCalendar(userId, tz, from, to));
    }

    @GetMapping("/day")
    public ResponseEntity<HistoryDayResponse> getDay(
            @RequestParam(value = "userId", defaultValue = "local") String userId,
            @RequestParam(value = "tz", required = false) String tz,
            @RequestParam(value = "day", required = false) String day
    ) {
        if (day == null || day.isBlank()) {
            throw new HistoryValidationException("day parameter is required", "INVALID_DAY");
        }
        return ResponseEntity.ok(historyService.getDay(userId, tz, day));
    }

    @GetMapping("/streak")
    public ResponseEntity<HistoryStreakResponse> getStreak(
            @RequestParam(value = "userId", defaultValue = "local") String userId,
            @RequestParam(value = "tz", required = false) String tz
    ) {
        return ResponseEntity.ok(historyService.getStreak(userId, tz));
    }

    @ExceptionHandler(HistoryValidationException.class)
    public ResponseEntity<HistoryErrorResponse> handleValidationException(HistoryValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new HistoryErrorResponse(ex.getMessage(), ex.getCode()));
    }
}
