package com.interviewos.session.service;

import com.interviewos.session.dto.UserNoteResponse;
import com.interviewos.session.entity.UserNote;
import com.interviewos.session.repository.UserNoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserNoteService {

    private final UserNoteRepository userNoteRepository;
    private final LearnTreeService learnTreeService;

    private String resolveUserId(String userId) {
        return (userId != null && !userId.isBlank()) ? userId.trim() : "local";
    }

    private void validateSlug(String slug) {
        if (slug == null || slug.isBlank() || !learnTreeService.isValidSlug(slug)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown question slug: " + slug);
        }
    }

    @Transactional(readOnly = true)
    public UserNoteResponse getNote(String userId, String slug) {
        validateSlug(slug);
        String effectiveUserId = resolveUserId(userId);
        return userNoteRepository.findByUserIdAndQuestionSlug(effectiveUserId, slug)
                .map(UserNoteResponse::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found for slug: " + slug));
    }

    @Transactional
    public UserNoteResponse upsertNote(String userId, String slug, String body) {
        validateSlug(slug);
        if (body == null || body.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note body cannot be blank");
        }

        String effectiveUserId = resolveUserId(userId);
        UserNote note = userNoteRepository.findByUserIdAndQuestionSlug(effectiveUserId, slug)
                .orElseGet(() -> UserNote.builder()
                        .userId(effectiveUserId)
                        .questionSlug(slug)
                        .createdAt(Instant.now())
                        .build());

        note.setBody(body.trim());
        note.setUpdatedAt(Instant.now());
        UserNote saved = userNoteRepository.save(note);
        log.info("Saved user note for user {} on question {}", effectiveUserId, slug);
        return UserNoteResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteNote(String userId, String slug) {
        validateSlug(slug);
        String effectiveUserId = resolveUserId(userId);
        userNoteRepository.deleteByUserIdAndQuestionSlug(effectiveUserId, slug);
        log.info("Deleted user note for user {} on question {}", effectiveUserId, slug);
    }

    @Transactional(readOnly = true)
    public List<UserNoteResponse> listNotes(String userId) {
        String effectiveUserId = resolveUserId(userId);
        return userNoteRepository.findByUserIdOrderByUpdatedAtDesc(effectiveUserId).stream()
                .map(UserNoteResponse::fromEntity)
                .toList();
    }
}
