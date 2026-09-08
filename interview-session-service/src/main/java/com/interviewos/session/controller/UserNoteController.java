package com.interviewos.session.controller;

import com.interviewos.session.dto.UserNoteRequest;
import com.interviewos.session.dto.UserNoteResponse;
import com.interviewos.session.service.UserNoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping({"/api/v1/learn/notes", "/api/v1/sessions/learn/notes"})
@RequiredArgsConstructor
public class UserNoteController {

    private final UserNoteService userNoteService;

    @GetMapping("/{slug}")
    public ResponseEntity<UserNoteResponse> getNote(
            @PathVariable("slug") String slug,
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(userNoteService.getNote(userId, slug));
    }

    @PutMapping("/{slug}")
    public ResponseEntity<UserNoteResponse> upsertNote(
            @PathVariable("slug") String slug,
            @RequestBody(required = false) UserNoteRequest request,
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        String body = request != null ? request.body() : null;
        return ResponseEntity.ok(userNoteService.upsertNote(userId, slug, body));
    }

    @DeleteMapping("/{slug}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable("slug") String slug,
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        userNoteService.deleteNote(userId, slug);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<UserNoteResponse>> listNotes(
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(userNoteService.listNotes(userId));
    }
}
