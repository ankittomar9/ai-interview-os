package com.interviewos.questionbank.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "questions")
@CompoundIndex(name = "track_diff_status_idx", def = "{'track': 1, 'difficulty': 1, 'status': 1}")
public class QuestionDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String title;

    private String track; // ALGORITHMS_DATA_STRUCTURES, SPRING_LLD, SYSTEM_DESIGN, BEHAVIORAL_STAR

    private String difficulty; // JUNIOR, MID, SENIOR, STAFF

    private List<String> tags;

    private String problemStatement;

    private String starterCode;

    private Map<String, String> starterCodeMap;

    private Map<String, String> starterFiles;

    private List<String> editablePaths;

    private List<TestCase> sampleTests;

    private List<HiddenTestCase> hiddenTests;

    private Map<String, String> hiddenTestFiles;

    private String buildProfile; // judge0, maven-spring

    private ExecutionLimits limits;

    private List<String> evaluationCriteria;

    private InterviewerNotes interviewerNotes;

    private CoachingContent coaching;

    @Builder.Default
    private String version = "1.0.0";

    @Builder.Default
    private String status = "PUBLISHED"; // DRAFT, PUBLISHED, ARCHIVED

    @Builder.Default
    private String source = "CORE"; // CORE, COMMUNITY

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public record TestCase(
            String name,
            String input,
            String expectedOutput,
            String description
    ) {
        public TestCase(String name, String input, String expectedOutput) {
            this(name, input, expectedOutput, null);
        }
    }

    public record HiddenTestCase(
            String name,
            String input,
            String expectedOutput,
            int weight
    ) {}

    public record ExecutionLimits(
            int memoryLimitMb,
            int timeLimitMs
    ) {}

    public record InterviewerNotes(
            List<String> expectedConcepts,
            List<String> followUpSeeds,
            List<String> rubricCheckpoints
    ) {}

    public record CoachingContent(
            List<String> commonMistakes,
            String modelAnswerOutline,
            List<String> presentationTips
    ) {}
}
