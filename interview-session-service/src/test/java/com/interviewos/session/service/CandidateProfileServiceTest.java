package com.interviewos.session.service;

import com.interviewos.session.dto.CandidateProfileRequest;
import com.interviewos.session.dto.CandidateProfileResponse;
import com.interviewos.session.entity.CandidateProfile;
import com.interviewos.session.repository.CandidateProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CandidateProfileServiceTest {

    @Mock
    private CandidateProfileRepository profileRepository;

    private CandidateProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService = new CandidateProfileService(profileRepository);
    }

    @Test
    @DisplayName("getProfile returns empty response when no profile exists in database")
    void getProfile_emptyWhenNotFound() {
        when(profileRepository.findByUserId("local")).thenReturn(Optional.empty());

        CandidateProfileResponse response = profileService.getProfile("local");

        assertThat(response).isNotNull();
        assertThat(response.id()).isNull();
        assertThat(response.userId()).isEqualTo("local");
        assertThat(response.hasResume()).isFalse();
        assertThat(response.fullName()).isNull();
    }

    @Test
    @DisplayName("getProfile returns populated response when profile exists")
    void getProfile_returnsExistingProfile() {
        CandidateProfile profile = CandidateProfile.builder()
                .id(1L)
                .userId("local")
                .fullName("Jane Doe")
                .targetRole("Senior Backend Engineer")
                .targetCompany("Acme Corp")
                .jobDescription("Distributed systems and event streaming")
                .resumeText("Jane Doe resume: 8 years building distributed systems with Kafka and Go")
                .persona("TECH")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(profileRepository.findByUserId("local")).thenReturn(Optional.of(profile));

        CandidateProfileResponse response = profileService.getProfile("local");

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.fullName()).isEqualTo("Jane Doe");
        assertThat(response.targetRole()).isEqualTo("Senior Backend Engineer");
        assertThat(response.hasResume()).isTrue();
    }

    @Test
    @DisplayName("upsertProfile creates new record when none exists")
    void upsertProfile_createsNew() {
        when(profileRepository.findByUserId("local")).thenReturn(Optional.empty());
        when(profileRepository.save(any(CandidateProfile.class))).thenAnswer(inv -> {
            CandidateProfile entity = inv.getArgument(0);
            entity.setId(10L);
            return entity;
        });

        CandidateProfileRequest req = new CandidateProfileRequest(
                "local",
                "Alice Wonder",
                "Staff Engineer",
                "Stripe",
                "Build scalable payments",
                "Alice Wonder resume text",
                null,
                "TECH"
        );

        CandidateProfileResponse response = profileService.upsertProfile(req);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.fullName()).isEqualTo("Alice Wonder");
        assertThat(response.targetRole()).isEqualTo("Staff Engineer");
        assertThat(response.hasResume()).isTrue();
        verify(profileRepository).save(any(CandidateProfile.class));
    }

    @Test
    @DisplayName("upsertProfile updates existing record fields")
    void upsertProfile_updatesExisting() {
        CandidateProfile existing = CandidateProfile.builder()
                .id(5L)
                .userId("local")
                .fullName("Old Name")
                .targetRole("Junior Dev")
                .createdAt(Instant.now())
                .build();

        when(profileRepository.findByUserId("local")).thenReturn(Optional.of(existing));
        when(profileRepository.save(any(CandidateProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        CandidateProfileRequest req = new CandidateProfileRequest(
                "local",
                "New Name",
                "Principal Architect",
                "Google",
                "Distributed consensus",
                "Updated resume",
                null,
                "TECH"
        );

        CandidateProfileResponse response = profileService.upsertProfile(req);

        assertThat(response.id()).isEqualTo(5L);
        assertThat(response.fullName()).isEqualTo("New Name");
        assertThat(response.targetRole()).isEqualTo("Principal Architect");
        assertThat(response.targetCompany()).isEqualTo("Google");
    }

    @Test
    @DisplayName("updateResume updates resume text and pdf path")
    void updateResume_updatesFields() {
        CandidateProfile existing = CandidateProfile.builder()
                .id(1L)
                .userId("local")
                .build();

        when(profileRepository.findByUserId("local")).thenReturn(Optional.of(existing));
        when(profileRepository.save(any(CandidateProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        CandidateProfileResponse response = profileService.updateResume("local", "Parsed resume content", "/tmp/resume.pdf");

        assertThat(response.resumeText()).isEqualTo("Parsed resume content");
        assertThat(response.resumePdfPath()).isEqualTo("/tmp/resume.pdf");
        assertThat(response.hasResume()).isTrue();
    }
}
