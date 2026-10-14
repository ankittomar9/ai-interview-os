package com.interviewos.session.service;

import com.interviewos.session.dto.*;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HistoryServiceTest {

    @Mock
    private PracticeAttemptRepository practiceAttemptRepository;

    @Mock
    private SessionQuestionRepository sessionQuestionRepository;

    @InjectMocks
    private HistoryService historyService;

    // ─────────────────────────────────────────────────────────────────────────
    // Gate H-06: Timezone Triples
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("H-06 Triple 1: 2026-10-14T20:30:00Z in Asia/Kolkata buckets to 2026-10-15")
    void testTimezoneTriple1_AsiaKolkata() {
        Instant instant = Instant.parse("2026-10-14T20:30:00Z");
        ZoneId zone = ZoneId.of("Asia/Kolkata");
        String dayKey = historyService.bucketDayKey(instant, zone);
        assertThat(dayKey).isEqualTo("2026-10-15");

        HistoryEvent event = new HistoryEvent(
                "P-1", "PRACTICE", "dsa-two-sum", "PASSED", "ALGORITHMS_DATA_STRUCTURES",
                instant, "all passed", HistoryLinkDto.practice("dsa-two-sum")
        );
        List<HistoryCalendarDayDto> days = historyService.buildDays(List.of(event), zone, "2026-10-14", "2026-10-16");
        assertThat(days).hasSize(1);
        assertThat(days.get(0).day()).isEqualTo("2026-10-15");
    }

    @Test
    @DisplayName("H-06 Triple 2: 2026-10-14T20:30:00Z in UTC buckets to 2026-10-14")
    void testTimezoneTriple2_UTC() {
        Instant instant = Instant.parse("2026-10-14T20:30:00Z");
        ZoneId zone = ZoneId.of("UTC");
        String dayKey = historyService.bucketDayKey(instant, zone);
        assertThat(dayKey).isEqualTo("2026-10-14");

        HistoryEvent event = new HistoryEvent(
                "P-1", "PRACTICE", "dsa-two-sum", "PASSED", "ALGORITHMS_DATA_STRUCTURES",
                instant, "all passed", HistoryLinkDto.practice("dsa-two-sum")
        );
        List<HistoryCalendarDayDto> days = historyService.buildDays(List.of(event), zone, "2026-10-14", "2026-10-16");
        assertThat(days).hasSize(1);
        assertThat(days.get(0).day()).isEqualTo("2026-10-14");
    }

    @Test
    @DisplayName("H-06 Triple 3: 2026-03-08T06:30:00Z in America/New_York (DST day) buckets to 2026-03-08")
    void testTimezoneTriple3_AmericaNewYork_DST() {
        Instant instant = Instant.parse("2026-03-08T06:30:00Z");
        ZoneId zone = ZoneId.of("America/New_York");
        String dayKey = historyService.bucketDayKey(instant, zone);
        assertThat(dayKey).isEqualTo("2026-03-08");

        HistoryEvent event = new HistoryEvent(
                "P-1", "PRACTICE", "dsa-two-sum", "PASSED", "ALGORITHMS_DATA_STRUCTURES",
                instant, "all passed", HistoryLinkDto.practice("dsa-two-sum")
        );
        List<HistoryCalendarDayDto> days = historyService.buildDays(List.of(event), zone, "2026-03-07", "2026-03-09");
        assertThat(days).hasSize(1);
        assertThat(days.get(0).day()).isEqualTo("2026-03-08");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.8-2: Distinct-question semantics
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Same question PASSED twice same day -> solvedCount=1, attemptCount=2")
    void testSameQuestionPassedTwiceSameDay() {
        ZoneId zone = ZoneId.of("UTC");
        Instant t1 = Instant.parse("2026-10-14T10:00:00Z");
        Instant t2 = Instant.parse("2026-10-14T14:00:00Z");

        List<HistoryEvent> events = List.of(
                new HistoryEvent("P-1", "PRACTICE", "dsa-two-sum", "PASSED", "DSA", t1, "detail", HistoryLinkDto.practice("dsa-two-sum")),
                new HistoryEvent("P-2", "PRACTICE", "dsa-two-sum", "PASSED", "DSA", t2, "detail", HistoryLinkDto.practice("dsa-two-sum"))
        );

        List<HistoryCalendarDayDto> days = historyService.buildDays(events, zone, "2026-10-14", "2026-10-14");
        assertThat(days).hasSize(1);
        HistoryCalendarDayDto day = days.get(0);
        assertThat(day.solvedCount()).isEqualTo(1);
        assertThat(day.attemptCount()).isEqualTo(2);
        assertThat(day.practiceSolved()).isEqualTo(1);
        assertThat(day.interviewSolved()).isEqualTo(0);
    }

    @Test
    @DisplayName("Same question across two days -> counts on both")
    void testSameQuestionAcrossTwoDays() {
        ZoneId zone = ZoneId.of("UTC");
        Instant t1 = Instant.parse("2026-10-13T10:00:00Z");
        Instant t2 = Instant.parse("2026-10-14T10:00:00Z");

        List<HistoryEvent> events = List.of(
                new HistoryEvent("P-1", "PRACTICE", "dsa-two-sum", "PASSED", "DSA", t1, "detail", HistoryLinkDto.practice("dsa-two-sum")),
                new HistoryEvent("P-2", "PRACTICE", "dsa-two-sum", "PASSED", "DSA", t2, "detail", HistoryLinkDto.practice("dsa-two-sum"))
        );

        List<HistoryCalendarDayDto> days = historyService.buildDays(events, zone, "2026-10-13", "2026-10-14");
        assertThat(days).hasSize(2);
        assertThat(days.get(0).solvedCount()).isEqualTo(1);
        assertThat(days.get(1).solvedCount()).isEqualTo(1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.8-3: Source union
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Source union: practice PASSED + interview PASSED on same question same day -> solvedCount=1, practiceSolved=1, interviewSolved=1")
    void testSourceUnionSameQuestionSameDay() {
        ZoneId zone = ZoneId.of("UTC");
        Instant t1 = Instant.parse("2026-10-14T10:00:00Z");
        Instant t2 = Instant.parse("2026-10-14T12:00:00Z");

        List<HistoryEvent> events = List.of(
                new HistoryEvent("P-1", "PRACTICE", "dsa-two-sum", "PASSED", "DSA", t1, "detail", HistoryLinkDto.practice("dsa-two-sum")),
                new HistoryEvent("I-1", "INTERVIEW", "dsa-two-sum", "PASSED", "INTERVIEW", t2, "detail", HistoryLinkDto.report(1L))
        );

        List<HistoryCalendarDayDto> days = historyService.buildDays(events, zone, "2026-10-14", "2026-10-14");
        assertThat(days).hasSize(1);
        HistoryCalendarDayDto day = days.get(0);
        assertThat(day.solvedCount()).isEqualTo(1);
        assertThat(day.attemptCount()).isEqualTo(2);
        assertThat(day.practiceSolved()).isEqualTo(1);
        assertThat(day.interviewSolved()).isEqualTo(1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.8-4: UNATTEMPTED and FAILED behavior
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Interview row with verdict='FAILED' counts in attemptCount but not solvedCount; UNATTEMPTED excluded entirely")
    void testVerdictFiltering() {
        ZoneId zone = ZoneId.of("UTC");
        Instant t1 = Instant.parse("2026-10-14T10:00:00Z");
        Instant t2 = Instant.parse("2026-10-14T11:00:00Z");

        List<HistoryEvent> events = List.of(
                new HistoryEvent("I-1", "INTERVIEW", "hld-design-bitly", "FAILED", "INTERVIEW", t1, "detail", HistoryLinkDto.report(1L)),
                new HistoryEvent("I-2", "INTERVIEW", "hld-rate-limiter", "UNATTEMPTED", "INTERVIEW", t2, "detail", HistoryLinkDto.report(1L))
        );

        List<HistoryCalendarDayDto> days = historyService.buildDays(events, zone, "2026-10-14", "2026-10-14");
        assertThat(days).hasSize(1);
        HistoryCalendarDayDto day = days.get(0);
        assertThat(day.solvedCount()).isEqualTo(0);
        assertThat(day.attemptCount()).isEqualTo(1); // I-1 only, I-2 excluded
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Gate H-08 / §3.8-5: Streak Algorithm Determinism
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("H-08 Case (a): solved today only -> currentStreak=1, longestStreak=1, activeToday=true")
    void testStreak_TodayOnly() {
        ZoneId zone = ZoneId.of("UTC");
        LocalDate today = LocalDate.now(zone);
        Instant t = today.atStartOfDay(zone).plusSeconds(3600).toInstant();

        List<HistoryEvent> events = List.of(
                new HistoryEvent("P-1", "PRACTICE", "q1", "PASSED", "DSA", t, "detail", HistoryLinkDto.practice("q1"))
        );

        HistoryStreakDto streak = historyService.buildStreak(events, zone);
        assertThat(streak.currentStreak()).isEqualTo(1);
        assertThat(streak.longestStreak()).isEqualTo(1);
        assertThat(streak.activeToday()).isTrue();
        assertThat(streak.lastSolvedDay()).isEqualTo(today.toString());
        assertThat(streak.totalDaysActive()).isEqualTo(1);
        assertThat(streak.totalSolved()).isEqualTo(1);
    }

    @Test
    @DisplayName("H-08 Case (b): yesterday only -> currentStreak=1 (grace), longestStreak=1, activeToday=false")
    void testStreak_YesterdayOnly() {
        ZoneId zone = ZoneId.of("UTC");
        LocalDate today = LocalDate.now(zone);
        LocalDate yesterday = today.minusDays(1);
        Instant t = yesterday.atStartOfDay(zone).plusSeconds(3600).toInstant();

        List<HistoryEvent> events = List.of(
                new HistoryEvent("P-1", "PRACTICE", "q1", "PASSED", "DSA", t, "detail", HistoryLinkDto.practice("q1"))
        );

        HistoryStreakDto streak = historyService.buildStreak(events, zone);
        assertThat(streak.currentStreak()).isEqualTo(1);
        assertThat(streak.longestStreak()).isEqualTo(1);
        assertThat(streak.activeToday()).isFalse();
        assertThat(streak.lastSolvedDay()).isEqualTo(yesterday.toString());
        assertThat(streak.totalDaysActive()).isEqualTo(1);
    }

    @Test
    @DisplayName("H-08 Case (c): day-before-yesterday only -> currentStreak=0, longestStreak=1, activeToday=false")
    void testStreak_DayBeforeYesterdayOnly() {
        ZoneId zone = ZoneId.of("UTC");
        LocalDate today = LocalDate.now(zone);
        LocalDate dayBeforeYesterday = today.minusDays(2);
        Instant t = dayBeforeYesterday.atStartOfDay(zone).plusSeconds(3600).toInstant();

        List<HistoryEvent> events = List.of(
                new HistoryEvent("P-1", "PRACTICE", "q1", "PASSED", "DSA", t, "detail", HistoryLinkDto.practice("q1"))
        );

        HistoryStreakDto streak = historyService.buildStreak(events, zone);
        assertThat(streak.currentStreak()).isEqualTo(0);
        assertThat(streak.longestStreak()).isEqualTo(1);
        assertThat(streak.activeToday()).isFalse();
        assertThat(streak.lastSolvedDay()).isEqualTo(dayBeforeYesterday.toString());
    }

    @Test
    @DisplayName("H-08 Case (d): 5-day run with a gap -> longestStreak=5, currentStreak=0")
    void testStreak_FiveDayRunWithGap() {
        ZoneId zone = ZoneId.of("UTC");
        LocalDate today = LocalDate.now(zone);

        List<HistoryEvent> events = new ArrayList<>();
        // 5 consecutive days ending 5 days ago (gap between then and today)
        for (int i = 5; i <= 9; i++) {
            LocalDate d = today.minusDays(i);
            Instant t = d.atStartOfDay(zone).plusSeconds(3600).toInstant();
            events.add(new HistoryEvent("P-" + i, "PRACTICE", "q-" + i, "PASSED", "DSA", t, "detail", HistoryLinkDto.practice("q-" + i)));
        }

        HistoryStreakDto streak = historyService.buildStreak(events, zone);
        assertThat(streak.currentStreak()).isEqualTo(0);
        assertThat(streak.longestStreak()).isEqualTo(5);
        assertThat(streak.activeToday()).isFalse();
        assertThat(streak.totalDaysActive()).isEqualTo(5);
        assertThat(streak.totalSolved()).isEqualTo(5);
    }

    @Test
    @DisplayName("H-08 Case (e): empty ledger -> all zeros")
    void testStreak_EmptyLedger() {
        ZoneId zone = ZoneId.of("UTC");
        HistoryStreakDto streak = historyService.buildStreak(List.of(), zone);
        assertThat(streak.currentStreak()).isEqualTo(0);
        assertThat(streak.longestStreak()).isEqualTo(0);
        assertThat(streak.activeToday()).isFalse();
        assertThat(streak.lastSolvedDay()).isNull();
        assertThat(streak.totalDaysActive()).isEqualTo(0);
        assertThat(streak.totalSolved()).isEqualTo(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.8-6: Validation
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Validation: bad day (2026-13-40) throws INVALID_DAY")
    void testValidation_BadDay() {
        assertThatThrownBy(() -> historyService.getDay("local", "Asia/Kolkata", "2026-13-40"))
                .isInstanceOf(HistoryValidationException.class)
                .satisfies(ex -> assertThat(((HistoryValidationException) ex).getCode()).isEqualTo("INVALID_DAY"));
    }

    @Test
    @DisplayName("Validation: bad tz (Mars/Olympus) throws INVALID_TZ")
    void testValidation_BadTz() {
        assertThatThrownBy(() -> historyService.getCalendar("local", "Mars/Olympus", null, null))
                .isInstanceOf(HistoryValidationException.class)
                .satisfies(ex -> assertThat(((HistoryValidationException) ex).getCode()).isEqualTo("INVALID_TZ"));
    }

    @Test
    @DisplayName("Validation: from > to throws INVALID_RANGE")
    void testValidation_FromGreaterThanTo() {
        assertThatThrownBy(() -> historyService.getCalendar("local", "UTC", "2026-10-15", "2026-10-10"))
                .isInstanceOf(HistoryValidationException.class)
                .satisfies(ex -> assertThat(((HistoryValidationException) ex).getCode()).isEqualTo("INVALID_RANGE"));
    }

    @Test
    @DisplayName("Validation: window > 730d throws RANGE_TOO_LARGE")
    void testValidation_WindowTooLarge() {
        assertThatThrownBy(() -> historyService.getCalendar("local", "UTC", "2024-01-01", "2026-10-14"))
                .isInstanceOf(HistoryValidationException.class)
                .satisfies(ex -> assertThat(((HistoryValidationException) ex).getCode()).isEqualTo("RANGE_TOO_LARGE"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.8-7 & §3.8-8: Day Cap & Ordering Determinism
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Day cap: 201 items -> 200 returned, truncated=true; items sorted by at DESC, tie-break source/id ASC")
    void testDayCapAndOrderingDeterminism() {
        ZoneId zone = ZoneId.of("UTC");
        String day = "2026-10-14";
        HistoryStreakDto dummyStreak = new HistoryStreakDto(0, 0, false, null, 0, 0);

        List<HistoryEvent> events = new ArrayList<>();
        Instant baseTime = Instant.parse("2026-10-14T12:00:00Z");

        for (int i = 1; i <= 201; i++) {
            // vary timestamps slightly
            Instant at = baseTime.plusSeconds(i);
            events.add(new HistoryEvent(
                    "PRACTICE-" + String.format("%03d", i),
                    "PRACTICE",
                    "q-" + i,
                    "PASSED",
                    "DSA",
                    at,
                    "detail",
                    HistoryLinkDto.practice("q-" + i)
            ));
        }

        HistoryDayResponse response = historyService.buildDayDetail("local", "UTC", day, events, dummyStreak);

        assertThat(response.attemptCount()).isEqualTo(201);
        assertThat(response.solvedCount()).isEqualTo(201);
        assertThat(response.truncated()).isTrue();
        assertThat(response.items()).hasSize(200);

        // Verification of sort order: descending by at
        assertThat(response.items().get(0).id()).isEqualTo("PRACTICE-201");
        assertThat(response.items().get(199).id()).isEqualTo("PRACTICE-002");
    }

    @Test
    @DisplayName("Ordering determinism tie-break: same timestamp -> source ASC, id ASC")
    void testOrderingDeterminismTieBreak() {
        HistoryStreakDto dummyStreak = new HistoryStreakDto(0, 0, false, null, 0, 0);
        Instant sameTime = Instant.parse("2026-10-14T12:00:00Z");

        List<HistoryEvent> events = List.of(
                new HistoryEvent("PRACTICE-B", "PRACTICE", "q2", "PASSED", "DSA", sameTime, "d", HistoryLinkDto.practice("q2")),
                new HistoryEvent("INTERVIEW-A", "INTERVIEW", "q1", "PASSED", "INT", sameTime, "d", HistoryLinkDto.report(1L)),
                new HistoryEvent("PRACTICE-A", "PRACTICE", "q3", "PASSED", "DSA", sameTime, "d", HistoryLinkDto.practice("q3"))
        );

        HistoryDayResponse response = historyService.buildDayDetail("local", "UTC", "2026-10-14", events, dummyStreak);
        List<HistoryDayItem> items = response.items();
        assertThat(items).hasSize(3);

        // INTERVIEW comes before PRACTICE alphabetically
        assertThat(items.get(0).id()).isEqualTo("INTERVIEW-A");
        // Among PRACTICE, PRACTICE-A comes before PRACTICE-B
        assertThat(items.get(1).id()).isEqualTo("PRACTICE-A");
        assertThat(items.get(2).id()).isEqualTo("PRACTICE-B");
    }
}
