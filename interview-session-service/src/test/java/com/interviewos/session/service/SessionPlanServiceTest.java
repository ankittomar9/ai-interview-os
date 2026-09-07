package com.interviewos.session.service;

import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.PlannedSection;
import com.interviewos.session.model.SectionType;
import com.interviewos.session.model.SessionPlan;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SessionPlanServiceTest {

    private SessionPlanService sessionPlanService;

    @BeforeEach
    void setUp() {
        sessionPlanService = new SessionPlanService(null);
    }

    @ParameterizedTest
    @EnumSource(DifficultyLevel.class)
    @DisplayName("Combo tracks generate canonical section order with valid slugs")
    void testComboCanonicalOrders(DifficultyLevel diff) {
        SessionPlan dsaLld = sessionPlanService.buildPlan(InterviewTrack.DSA_LLD, diff, 42L);
        assertThat(dsaLld.sections().stream().map(PlannedSection::sectionType).toList())
                .containsExactly(SectionType.INTRODUCTION, SectionType.DSA, SectionType.LLD);
        assertThat(dsaLld.sections().get(1).problemSlugs()).isNotEmpty();
        assertThat(dsaLld.sections().get(2).problemSlugs()).isNotEmpty();

        SessionPlan lldHld = sessionPlanService.buildPlan(InterviewTrack.LLD_HLD, diff, 42L);
        assertThat(lldHld.sections().stream().map(PlannedSection::sectionType).toList())
                .containsExactly(SectionType.INTRODUCTION, SectionType.LLD, SectionType.SYSTEM_DESIGN);
        assertThat(lldHld.sections().get(1).problemSlugs()).isNotEmpty();
        assertThat(lldHld.sections().get(2).problemSlugs()).isNotEmpty();

        SessionPlan dsaLldHld = sessionPlanService.buildPlan(InterviewTrack.DSA_LLD_HLD, diff, 42L);
        assertThat(dsaLldHld.sections().stream().map(PlannedSection::sectionType).toList())
                .containsExactly(SectionType.INTRODUCTION, SectionType.DSA, SectionType.LLD, SectionType.SYSTEM_DESIGN);
        assertThat(dsaLldHld.sections().get(1).problemSlugs()).isNotEmpty();
        assertThat(dsaLldHld.sections().get(2).problemSlugs()).isNotEmpty();
        assertThat(dsaLldHld.sections().get(3).problemSlugs()).isNotEmpty();
    }

    @Test
    @DisplayName("Catalog key resolution maps combo tracks to canonical categories")
    void testResolveCatalogTrackKey() {
        assertThat(sessionPlanService.resolveCatalogTrackKey(InterviewTrack.DSA_LLD)).isEqualTo("ALGORITHMS_DATA_STRUCTURES");
        assertThat(sessionPlanService.resolveCatalogTrackKey(InterviewTrack.DSA_LLD_HLD)).isEqualTo("ALGORITHMS_DATA_STRUCTURES");
        assertThat(sessionPlanService.resolveCatalogTrackKey(InterviewTrack.LLD_HLD)).isEqualTo("SYSTEM_DESIGN_LLD");
        assertThat(sessionPlanService.resolveCatalogTrackKey(InterviewTrack.CUSTOM)).isEqualTo("FULL_LOOP");
    }

    @Test
    @DisplayName("VP6: Custom Plan Preset 'All' (all 5 domains) matches selection stage list & durations")
    void testCustomPlan_PresetAll() {
        List<com.interviewos.session.dto.CustomDomainConfig> presetAll = List.of(
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, 20),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.SPRING_LLD, 20),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.SYSTEM_DESIGN, 20),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.SQL, 20),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.RESUME_BASED, 20)
        );

        SessionPlan plan = sessionPlanService.buildCustomPlan(DifficultyLevel.SENIOR, presetAll, 42L, "CUSTOM_BUILDER");

        assertThat(plan).isNotNull();
        assertThat(plan.plannedTotalMinutes()).isEqualTo(100);
        assertThat(plan.sections()).hasSize(5);
        assertThat(plan.sections().stream().map(PlannedSection::sectionType).toList())
                .containsExactly(SectionType.DSA, SectionType.LLD, SectionType.SYSTEM_DESIGN, SectionType.SQL, SectionType.RESUME);
        assertThat(plan.sections().stream().map(PlannedSection::softTimeBudgetMinutes).toList())
                .containsExactly(20, 20, 20, 20, 20);
        for (PlannedSection sec : plan.sections()) {
            assertThat(sec.problemSlugs()).isNotEmpty();
        }
    }

    @Test
    @DisplayName("VP6: Custom Plan Preset 'DSA+HLD' matches selection stage list & durations")
    void testCustomPlan_PresetDsaHld() {
        List<com.interviewos.session.dto.CustomDomainConfig> presetDsaHld = List.of(
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, 30),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.SYSTEM_DESIGN, 30)
        );

        SessionPlan plan = sessionPlanService.buildCustomPlan(DifficultyLevel.MID, presetDsaHld, 42L, "CUSTOM_BUILDER");

        assertThat(plan.plannedTotalMinutes()).isEqualTo(60);
        assertThat(plan.sections()).hasSize(2);
        assertThat(plan.sections().get(0).sectionType()).isEqualTo(SectionType.DSA);
        assertThat(plan.sections().get(0).softTimeBudgetMinutes()).isEqualTo(30);
        assertThat(plan.sections().get(1).sectionType()).isEqualTo(SectionType.SYSTEM_DESIGN);
        assertThat(plan.sections().get(1).softTimeBudgetMinutes()).isEqualTo(30);
    }

    @Test
    @DisplayName("VP6: Custom Plan Preset 'DSA+LLD' matches selection stage list & durations")
    void testCustomPlan_PresetDsaLld() {
        List<com.interviewos.session.dto.CustomDomainConfig> presetDsaLld = List.of(
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, 30),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.SPRING_LLD, 30)
        );

        SessionPlan plan = sessionPlanService.buildCustomPlan(DifficultyLevel.MID, presetDsaLld, 42L, "CUSTOM_BUILDER");

        assertThat(plan.plannedTotalMinutes()).isEqualTo(60);
        assertThat(plan.sections()).hasSize(2);
        assertThat(plan.sections().get(0).sectionType()).isEqualTo(SectionType.DSA);
        assertThat(plan.sections().get(0).softTimeBudgetMinutes()).isEqualTo(30);
        assertThat(plan.sections().get(1).sectionType()).isEqualTo(SectionType.LLD);
        assertThat(plan.sections().get(1).softTimeBudgetMinutes()).isEqualTo(30);
    }

    @Test
    @DisplayName("VP6: Custom Plan sum > 120 minutes is rejected with IllegalArgumentException")
    void testCustomPlan_SumExceeds120_Rejected() {
        List<com.interviewos.session.dto.CustomDomainConfig> tooLong = List.of(
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, 60),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.SYSTEM_DESIGN, 60),
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.SQL, 10)
        );

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            sessionPlanService.buildCustomPlan(DifficultyLevel.SENIOR, tooLong, 42L, "CUSTOM_BUILDER");
        });
    }

    @Test
    @DisplayName("VP6: Custom Plan with invalid domain duration (<10 or >60) is rejected")
    void testCustomPlan_InvalidDuration_Rejected() {
        List<com.interviewos.session.dto.CustomDomainConfig> invalidLow = List.of(
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, 5)
        );
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            sessionPlanService.buildCustomPlan(DifficultyLevel.SENIOR, invalidLow, 42L, "CUSTOM_BUILDER");
        });

        List<com.interviewos.session.dto.CustomDomainConfig> invalidHigh = List.of(
                new com.interviewos.session.dto.CustomDomainConfig(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, 65)
        );
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            sessionPlanService.buildCustomPlan(DifficultyLevel.SENIOR, invalidHigh, 42L, "CUSTOM_BUILDER");
        });
    }

    @Test
    @DisplayName("VP6: Custom Plan with empty domain list is rejected")
    void testCustomPlan_EmptyDomains_Rejected() {
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            sessionPlanService.buildCustomPlan(DifficultyLevel.SENIOR, List.of(), 42L, "CUSTOM_BUILDER");
        });
    }

    @Test
    @DisplayName("VP6: buildPlan(CUSTOM) returns default valid custom plan")
    void testBuildPlan_CustomDefault() {
        SessionPlan plan = sessionPlanService.buildPlan(InterviewTrack.CUSTOM, DifficultyLevel.SENIOR, 42L);
        assertThat(plan).isNotNull();
        assertThat(plan.plannedTotalMinutes()).isEqualTo(60);
        assertThat(plan.sections()).hasSize(2);
    }
}
