package com.interviewos.session.service;

import com.interviewos.session.document.ResumeDocument;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.repository.ResumeMongoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResumeParsingServiceTest {

    @Mock
    private ResumeMongoRepository resumeRepository;

    private ResumeParsingService resumeParsingService;
    private RoleCalibrationService roleCalibrationService;

    @BeforeEach
    void setUp() {
        resumeParsingService = new ResumeParsingService(resumeRepository);
        roleCalibrationService = new RoleCalibrationService();
    }

    @Test
    @DisplayName("Parse text resume extracts skills, email, experience, and infers role level")
    void testParseAndSaveTextResume() {
        when(resumeRepository.save(any(ResumeDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String resumeText = """
                Jane Doe
                jane.doe@example.com
                Experience: 6 years of experience building distributed systems with Java 21, Spring Boot, PostgreSQL, and Kafka.
                Education: Bachelor of Science in Computer Science from University of Washington
                Highlights:
                - Architected high-throughput microservices handling 20,000 req/sec
                - Led team of 5 engineers to deliver real-time analytics pipeline
                """;

        ResumeDocument doc = resumeParsingService.parseAndSaveText(
                "candidate-jane",
                "Jane Doe",
                "Backend Lead Resume",
                resumeText
        );

        assertThat(doc.getCandidateName()).isEqualTo("Jane Doe");
        assertThat(doc.getEmail()).isEqualTo("jane.doe@example.com");
        assertThat(doc.getYearsOfExperience()).isEqualTo(6);
        assertThat(doc.getInferredRoleLevel()).isEqualTo("SENIOR");
        assertThat(doc.getSuggestedDifficulty()).isEqualTo(DifficultyLevel.SENIOR);
        assertThat(doc.getSkills()).contains("Java 21", "Spring Boot", "PostgreSQL", "Kafka");
        assertThat(doc.getEducation()).isNotEmpty();

        // Test role calibration
        DifficultyLevel calibrated = roleCalibrationService.inferDifficulty(doc);
        assertThat(calibrated).isEqualTo(DifficultyLevel.SENIOR);

        List<String> calibratedSkills = roleCalibrationService.calibrateSkills(doc, InterviewTrack.SYSTEM_DESIGN);
        assertThat(calibratedSkills).isNotEmpty();
    }

    @Test
    @DisplayName("C3: RoleCalibrationService inferDifficulty boundary tests (1, 4, 7, 12 years)")
    void testRoleCalibrationBoundaryYears() {
        assertThat(roleCalibrationService.inferDifficulty(ResumeDocument.builder().yearsOfExperience(1).build()))
                .isEqualTo(DifficultyLevel.JUNIOR);
        assertThat(roleCalibrationService.inferDifficulty(ResumeDocument.builder().yearsOfExperience(4).build()))
                .isEqualTo(DifficultyLevel.MID);
        assertThat(roleCalibrationService.inferDifficulty(ResumeDocument.builder().yearsOfExperience(7).build()))
                .isEqualTo(DifficultyLevel.SENIOR);
        assertThat(roleCalibrationService.inferDifficulty(ResumeDocument.builder().yearsOfExperience(12).build()))
                .isEqualTo(DifficultyLevel.STAFF);

        // Null / missing fallback
        assertThat(roleCalibrationService.inferDifficulty(null))
                .isEqualTo(DifficultyLevel.MID);
        assertThat(roleCalibrationService.inferDifficulty(ResumeDocument.builder().yearsOfExperience(null).build()))
                .isEqualTo(DifficultyLevel.MID);
    }
}
