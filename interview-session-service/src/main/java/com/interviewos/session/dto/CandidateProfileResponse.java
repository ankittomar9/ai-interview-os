package com.interviewos.session.dto;

import com.interviewos.session.entity.CandidateProfile;

import java.time.Instant;

public record CandidateProfileResponse(
        Long id,
        String userId,
        String fullName,
        String targetRole,
        String targetCompany,
        String jobDescription,
        String resumeText,
        String resumePdfPath,
        String persona,
        boolean hasResume,
        Instant createdAt,
        Instant updatedAt
) {
    public static CandidateProfileResponse fromEntity(CandidateProfile entity) {
        if (entity == null) {
            return new CandidateProfileResponse(
                    null,
                    "local",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    null
            );
        }
        boolean hasResume = (entity.getResumeText() != null && !entity.getResumeText().isBlank())
                || (entity.getResumePdfPath() != null && !entity.getResumePdfPath().isBlank());
        return new CandidateProfileResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getFullName(),
                entity.getTargetRole(),
                entity.getTargetCompany(),
                entity.getJobDescription(),
                entity.getResumeText(),
                entity.getResumePdfPath(),
                entity.getPersona(),
                hasResume,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
