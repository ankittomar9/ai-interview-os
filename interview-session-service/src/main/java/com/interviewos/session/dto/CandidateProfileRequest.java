package com.interviewos.session.dto;

public record CandidateProfileRequest(
        String userId,
        String fullName,
        String targetRole,
        String targetCompany,
        String jobDescription,
        String resumeText,
        String resumePdfPath,
        String persona
) {}
