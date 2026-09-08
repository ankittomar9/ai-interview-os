package com.interviewos.session.controller;

import com.interviewos.session.dto.CandidateProfileRequest;
import com.interviewos.session.dto.CandidateProfileResponse;
import com.interviewos.session.service.CandidateProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping({"/api/v1/profile", "/api/v1/sessions/profile"})
@RequiredArgsConstructor
public class CandidateProfileController {

    private final CandidateProfileService profileService;

    @GetMapping
    public ResponseEntity<CandidateProfileResponse> getProfile(
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping
    public ResponseEntity<CandidateProfileResponse> upsertProfile(
            @RequestBody CandidateProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.upsertProfile(request));
    }

    @PostMapping(value = "/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CandidateProfileResponse> uploadResumeFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) throws IOException {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.txt";
        String content = new String(file.getBytes(), StandardCharsets.UTF_8);
        return ResponseEntity.ok(profileService.updateResume(userId, content, filename));
    }

    @PostMapping(value = "/resume", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CandidateProfileResponse> uploadResumeText(
            @RequestBody Map<String, String> payload,
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        String resumeText = payload.getOrDefault("resumeText", "");
        String filename = payload.getOrDefault("fileName", "pasted-resume.txt");
        return ResponseEntity.ok(profileService.updateResume(userId, resumeText, filename));
    }
}
