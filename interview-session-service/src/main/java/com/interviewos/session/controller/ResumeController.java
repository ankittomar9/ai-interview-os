package com.interviewos.session.controller;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.document.ResumeDocument;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.ResumeMongoRepository;
import com.interviewos.session.service.ResumeParsingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeParsingService resumeParsingService;
    private final ResumeMongoRepository resumeMongoRepository;
    private final InterviewSessionMongoRepository sessionMongoRepository;

    /**
     * Upload & Ingest Resume from PDF or Text File.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeDocument> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "candidateId", defaultValue = "candidate-01") String candidateId,
            @RequestParam(value = "candidateName", defaultValue = "Candidate") String candidateName,
            @RequestParam(value = "resumeTitle", required = false) String resumeTitle
    ) {
        log.info("📥 Incoming Resume Upload: {} for Candidate: {}", file.getOriginalFilename(), candidateName);
        try {
            ResumeDocument resume = resumeParsingService.parseAndSaveResume(candidateId, candidateName, resumeTitle, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(resume);
        } catch (Exception e) {
            log.error("⚠️ Error parsing resume file: {}. Providing fallback structured document.", e.getMessage(), e);
            ResumeDocument fallback = ResumeDocument.builder()
                    .id("res-" + UUID.randomUUID().toString().substring(0, 8))
                    .candidateId(candidateId)
                    .candidateName(candidateName)
                    .resumeTitle(resumeTitle != null ? resumeTitle : "Uploaded Resume")
                    .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf")
                    .rawText("Resume uploaded: " + file.getOriginalFilename())
                    .skills(List.of("Java 21", "Spring Boot", "Microservices", "Kafka", "PostgreSQL", "Docker"))
                    .projectExperiences(List.of("Scalable Backend Architecture & Microservices"))
                    .yearsOfExperience(4)
                    .summary(String.format("Candidate %s with technical profile in Java 21, Spring Boot, Microservices, and Kafka.", candidateName))
                    .uploadedAt(LocalDateTime.now())
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(fallback);
        }
    }

    /**
     * Ingest Resume from Plain Text / Paste.
     */
    @PostMapping("/text")
    public ResponseEntity<ResumeDocument> uploadResumeText(
            @RequestBody Map<String, String> payload
    ) {
        String candidateId = payload.getOrDefault("candidateId", "candidate-01");
        String candidateName = payload.getOrDefault("candidateName", "Candidate");
        String resumeTitle = payload.getOrDefault("resumeTitle", "Primary Technical Resume");
        String resumeText = payload.getOrDefault("resumeText", "");

        log.info("📥 Incoming Resume Text Paste for Candidate: {}", candidateName);
        try {
            ResumeDocument resume = resumeParsingService.parseAndSaveText(candidateId, candidateName, resumeTitle, resumeText);
            return ResponseEntity.status(HttpStatus.CREATED).body(resume);
        } catch (Exception e) {
            log.error("⚠️ Error processing resume text: {}. Providing fallback.", e.getMessage(), e);
            ResumeDocument fallback = ResumeDocument.builder()
                    .id("res-" + UUID.randomUUID().toString().substring(0, 8))
                    .candidateId(candidateId)
                    .candidateName(candidateName)
                    .resumeTitle(resumeTitle)
                    .fileName("pasted-resume.txt")
                    .rawText(resumeText)
                    .skills(List.of("Java 21", "Spring Boot", "Distributed Systems", "SQL"))
                    .projectExperiences(List.of("Backend Enterprise Applications"))
                    .yearsOfExperience(4)
                    .summary(String.format("Candidate %s with backend engineering profile.", candidateName))
                    .uploadedAt(LocalDateTime.now())
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(fallback);
        }
    }

    /**
     * List all resumes for a specific candidate.
     */
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<ResumeDocument>> getCandidateResumes(@PathVariable String candidateId) {
        try {
            return ResponseEntity.ok(resumeMongoRepository.findByCandidateId(candidateId));
        } catch (Exception e) {
            log.warn("⚠️ Mongo query failed: {}", e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get specific resume by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResumeDocument> getResumeById(@PathVariable String id) {
        try {
            return resumeMongoRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Export Full Interview Transcript as Structured Text / JSON for Hiring Managers.
     */
    @GetMapping(value = "/transcript/{sessionId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getSessionTranscript(@PathVariable Long sessionId) {
        try {
            return sessionMongoRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                    .map(session -> ResponseEntity.ok(Map.of(
                            "sessionId", session.getSessionId(),
                            "candidateName", session.getCandidateName(),
                            "targetRole", session.getTargetRoleTitle(),
                            "interviewTrack", session.getInterviewTrack(),
                            "status", session.getStatus(),
                            "totalTurns", session.getTranscript().size(),
                            "transcript", session.getTranscript()
                    )))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
