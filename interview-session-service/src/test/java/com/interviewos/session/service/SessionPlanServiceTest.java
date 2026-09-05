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
    }
}
