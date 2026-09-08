package com.interviewos.session.service;

import com.interviewos.session.dto.CandidateProfileRequest;
import com.interviewos.session.dto.CandidateProfileResponse;
import com.interviewos.session.entity.CandidateProfile;
import com.interviewos.session.repository.CandidateProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidateProfileService {

    private final CandidateProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(String userId) {
        String effectiveUserId = resolveUserId(userId);
        return profileRepository.findByUserId(effectiveUserId)
                .map(CandidateProfileResponse::fromEntity)
                .orElseGet(() -> CandidateProfileResponse.fromEntity(null));
    }

    @Transactional
    public CandidateProfileResponse upsertProfile(CandidateProfileRequest request) {
        String effectiveUserId = resolveUserId(request != null ? request.userId() : null);
        CandidateProfile profile = profileRepository.findByUserId(effectiveUserId)
                .orElseGet(() -> CandidateProfile.builder()
                        .userId(effectiveUserId)
                        .createdAt(Instant.now())
                        .build());

        if (request != null) {
            if (request.fullName() != null) {
                profile.setFullName(request.fullName().trim());
            }
            if (request.targetRole() != null) {
                profile.setTargetRole(request.targetRole().trim());
            }
            if (request.targetCompany() != null) {
                profile.setTargetCompany(request.targetCompany().trim());
            }
            if (request.jobDescription() != null) {
                profile.setJobDescription(request.jobDescription().trim());
            }
            if (request.resumeText() != null && !request.resumeText().isBlank()) {
                profile.setResumeText(request.resumeText().trim());
            }
            if (request.resumePdfPath() != null) {
                profile.setResumePdfPath(request.resumePdfPath().trim());
            }
            if (request.persona() != null) {
                profile.setPersona(request.persona().trim());
            }
        }
        profile.setUpdatedAt(Instant.now());

        CandidateProfile saved = profileRepository.save(profile);
        log.info("Saved candidate profile id={} for user='{}'", saved.getId(), effectiveUserId);
        return CandidateProfileResponse.fromEntity(saved);
    }

    @Transactional
    public CandidateProfileResponse updateResume(String userId, String resumeText, String resumePdfPath) {
        String effectiveUserId = resolveUserId(userId);
        CandidateProfile profile = profileRepository.findByUserId(effectiveUserId)
                .orElseGet(() -> CandidateProfile.builder()
                        .userId(effectiveUserId)
                        .createdAt(Instant.now())
                        .build());

        if (resumeText != null && !resumeText.isBlank()) {
            profile.setResumeText(resumeText.trim());
        }
        if (resumePdfPath != null && !resumePdfPath.isBlank()) {
            profile.setResumePdfPath(resumePdfPath.trim());
        }
        profile.setUpdatedAt(Instant.now());

        CandidateProfile saved = profileRepository.save(profile);
        log.info("Updated resume in candidate profile for user='{}'", effectiveUserId);
        return CandidateProfileResponse.fromEntity(saved);
    }

    private String resolveUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return "local";
        }
        return userId.trim();
    }
}
