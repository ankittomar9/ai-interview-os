package com.interviewos.session.controller;

import com.interviewos.session.dto.AddMessageRequest;
import com.interviewos.session.dto.CreateSessionRequest;
import com.interviewos.session.dto.SessionResponse;
import com.interviewos.session.service.InterviewSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions")
//@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InterviewSessionController {

    private final InterviewSessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        long start = System.currentTimeMillis();
        log.info("Received request to CREATE session: Candidate='{}', Role='{}', Track='{}', Seniority='{}'",
                request.candidateId(), request.roleTitle(), request.track(), request.difficulty());
        SessionResponse response = sessionService.createSession(request);
        log.info("Session CREATED successfully with ID: {} in {}ms", response.id(), (System.currentTimeMillis() - start));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<SessionResponse> startSession(@PathVariable Long id) {
        long start = System.currentTimeMillis();
        log.info("Received request to START session ID: {}", id);
        SessionResponse response = sessionService.startSession(id);
        log.info("Session ID: {} STARTED successfully (Status: {}) in {}ms", id, response.status(), (System.currentTimeMillis() - start));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<SessionResponse.MessageResponse> addMessage(
            @PathVariable Long id,
            @Valid @RequestBody AddMessageRequest request
    ) {
        long start = System.currentTimeMillis();
        log.info("Adding message to session ID: {} [Sender: {}, Type: {}, SnippetPresent: {}]",
                id, request.senderRole(), request.messageType(), request.codeSnippet() != null && !request.codeSnippet().isBlank());
        SessionResponse.MessageResponse response = sessionService.addMessage(id, request);
        log.info("Message added to session ID: {} (Message ID: {}) in {}ms", id, response.id(), (System.currentTimeMillis() - start));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable Long id) {
        log.info("Fetching session details for ID: {}", id);
        SessionResponse response = sessionService.getSessionById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/transcript")
    public ResponseEntity<List<SessionResponse.MessageResponse>> getSessionTranscript(@PathVariable Long id) {
        log.info("Fetching transcript history for session ID: {}", id);
        List<SessionResponse.MessageResponse> transcript = sessionService.getSessionTranscript(id);
        log.info("Retrieved {} transcript messages for session ID: {}", transcript.size(), id);
        return ResponseEntity.ok(transcript);
    }

    @GetMapping("/{id}/submissions")
    public ResponseEntity<List<com.interviewos.session.document.InterviewSessionDocument.SubmissionEntry>> getSessionSubmissions(@PathVariable Long id) {
        log.info("Fetching submissions ledger for session ID: {}", id);
        List<com.interviewos.session.document.InterviewSessionDocument.SubmissionEntry> submissions = sessionService.getSubmissions(id);
        log.info("Retrieved {} submissions ledger entries for session ID: {}", submissions.size(), id);
        return ResponseEntity.ok(submissions);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SessionResponse> completeSession(@PathVariable Long id) {
        long start = System.currentTimeMillis();
        log.info("Received request to COMPLETE session ID: {}", id);
        SessionResponse response = sessionService.completeSession(id);
        log.info("Session ID: {} COMPLETED in {}ms (Total Duration: {}s)",
                id, (System.currentTimeMillis() - start), response.durationSeconds());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<SessionResponse>> getCandidateSessions(@PathVariable String candidateId) {
        log.info("Querying all interview sessions for candidate: {}", candidateId);
        List<SessionResponse> responses = sessionService.getCandidateSessions(candidateId);
        log.info("Found {} sessions for candidate: {}", responses.size(), candidateId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update/Ingest Resume for an ongoing Session.
     */
    @PostMapping("/{id}/resume")
    public ResponseEntity<com.interviewos.session.document.ResumeDocument> updateSessionResume(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload
    ) {
        log.info("Updating resume for Session ID: {}", id);
        com.interviewos.session.document.ResumeDocument doc = sessionService.updateSessionResume(id, payload);
        return ResponseEntity.ok(doc);
    }

    /**
     * Upload & Ingest Resume file for an ongoing Session.
     */
    @PostMapping(value = "/{id}/resume/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.interviewos.session.document.ResumeDocument> uploadSessionResumeFile(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "candidateName", required = false) String candidateName
    ) {
        log.info("Uploading resume file for Session ID: {}", id);
        com.interviewos.session.document.ResumeDocument doc = sessionService.updateSessionResumeFile(id, file, candidateName);
        return ResponseEntity.status(HttpStatus.CREATED).body(doc);
    }

    /**
     * Get the active parsed resume for a session.
     */
    @GetMapping("/{id}/resume")
    public ResponseEntity<com.interviewos.session.document.ResumeDocument> getSessionResume(@PathVariable Long id) {
        log.info("Fetching resume for Session ID: {}", id);
        com.interviewos.session.document.ResumeDocument doc = sessionService.getSessionResume(id);
        if (doc == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(doc);
    }

    /**
     * Record a section transition.
     */
    @PostMapping("/{id}/section-transitions")
    public ResponseEntity<List<com.interviewos.session.document.InterviewSessionDocument.SectionProgress>> recordSectionTransition(
            @PathVariable Long id,
            @RequestBody com.interviewos.session.dto.SectionTransitionRequest request
    ) {
        log.info("Recording section transition for session {}: from={} to={} idx={} reason={}",
                id, request.fromSectionType(), request.toSectionType(), request.sectionIndex(), request.reason());
        List<com.interviewos.session.document.InterviewSessionDocument.SectionProgress> progress = sessionService.recordSectionTransition(id, request);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get section progress history for a session.
     */
    @GetMapping("/{id}/section-transitions")
    public ResponseEntity<List<com.interviewos.session.document.InterviewSessionDocument.SectionProgress>> getSectionProgress(@PathVariable Long id) {
        log.info("Fetching section progress for session ID: {}", id);
        List<com.interviewos.session.document.InterviewSessionDocument.SectionProgress> progress = sessionService.getSectionProgress(id);
        return ResponseEntity.ok(progress);
    }
}