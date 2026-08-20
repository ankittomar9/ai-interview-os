package com.interviewos.session.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB Document representation of a Candidate's uploaded resume.
 * Enables one-to-many relationship: One candidateId can have multiple resumes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resumes")
public class ResumeDocument {

    @Id
    private String id;

    @Indexed
    private String candidateId;

    private String candidateName;

    private String resumeTitle;

    private String fileName;

    private String rawText;

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private List<String> projectExperiences = new ArrayList<>();

    private Integer yearsOfExperience;

    private Integer characterCount;

    private Integer wordCount;

    private String summary;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
