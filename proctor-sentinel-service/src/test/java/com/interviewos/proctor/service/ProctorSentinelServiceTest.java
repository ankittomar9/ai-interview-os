package com.interviewos.proctor.service;

import com.interviewos.proctor.config.ProctorScoringProperties;
import com.interviewos.proctor.dto.RecordTelemetryRequest;
import com.interviewos.proctor.dto.TelemetrySummaryResponse;
import com.interviewos.proctor.entity.TelemetryEvent;
import com.interviewos.proctor.model.IntegrityRiskLevel;
import com.interviewos.proctor.model.TelemetryEventType;
import com.interviewos.proctor.repository.TelemetryEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProctorSentinelServiceTest {

    @Mock
    private TelemetryEventRepository eventRepository;

    private ProctorScoringProperties scoringProperties;
    private ProctorSentinelService proctorService;

    @BeforeEach
    void setUp() {
        scoringProperties = new ProctorScoringProperties();
        proctorService = new ProctorSentinelService(eventRepository, scoringProperties);
    }

    private TelemetryEvent createEvent(Long id, Long sessionId, TelemetryEventType type, Integer chars, Long duration, boolean flagged) {
        return TelemetryEvent.builder()
                .id(id)
                .sessionId(sessionId)
                .eventType(type)
                .characterCount(chars)
                .durationSeconds(duration)
                .metadataDetails("test event")
                .isFlagged(flagged)
                .timestamp(Instant.now())
                .build();
    }

    @Test
    @DisplayName("D7.1: Only the 8 lifecycle types produce integrityScore 100, tabSwitches 0, and CLEAN verdict")
    void testLifecycleTypesProduceCleanScore() {
        Long sessionId = 1L;
        TelemetryEventType[] lifecycleTypes = {
                TelemetryEventType.VERIFY_CAMERA_OK,
                TelemetryEventType.VERIFY_MIC_OK,
                TelemetryEventType.VERIFY_SCREEN_OK,
                TelemetryEventType.VERIFY_SCREEN_REJECTED,
                TelemetryEventType.SHARE_LOST,
                TelemetryEventType.SHARE_RESTORED,
                TelemetryEventType.SECONDARY_CAMERA_CONNECTED,
                TelemetryEventType.SINGLE_CAMERA_ACKNOWLEDGED
        };

        List<TelemetryEvent> events = new ArrayList<>();
        long id = 1;
        for (TelemetryEventType type : lifecycleTypes) {
            events.add(createEvent(id++, sessionId, type, null, 15L, false));
        }

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        TelemetrySummaryResponse summary = proctorService.getSessionSummary(sessionId);

        assertEquals(100, summary.integrityScore());
        assertEquals(0, summary.tabSwitchCount());
        assertEquals(0, summary.pasteDumpCount());
        assertEquals(0, summary.keystrokeBurstCount());
        assertEquals(IntegrityRiskLevel.CLEAN, summary.riskLevel());
        assertTrue(summary.anomalyFlags().isEmpty());
        assertEquals(8, summary.totalEventsCount());
    }

    @Test
    @DisplayName("D7.2: Genuine TAB_BLUR with duration > 10 applies penalty 5, increments tabSwitchCount, and adds anomaly flag")
    void testGenuineTabBlurPenalizedAndFlagged() {
        Long sessionId = 2L;

        // Verify recordEvent flags TAB_BLUR with duration > 5
        RecordTelemetryRequest request = new RecordTelemetryRequest(sessionId, TelemetryEventType.TAB_BLUR, null, 30L, "switched tab");
        when(eventRepository.save(any(TelemetryEvent.class))).thenAnswer(invocation -> {
            TelemetryEvent ev = invocation.getArgument(0);
            ev.setId(10L);
            return ev;
        });

        TelemetrySummaryResponse.TelemetryEventResponse recordResponse = proctorService.recordEvent(request);
        assertTrue(recordResponse.isFlagged());

        // Verify getSessionSummary penalty & anomaly
        TelemetryEvent blurEvent = createEvent(10L, sessionId, TelemetryEventType.TAB_BLUR, null, 30L, true);
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(List.of(blurEvent));

        TelemetrySummaryResponse summary = proctorService.getSessionSummary(sessionId);
        assertEquals(95, summary.integrityScore());
        assertEquals(1, summary.tabSwitchCount());
        assertEquals(1, summary.anomalyFlags().size());
        assertTrue(summary.anomalyFlags().get(0).contains("30 seconds"));
    }

    @Test
    @DisplayName("D7.3: PASTE_DUMP with characterCount > 200 applies penalty 8 and adds anomaly flag")
    void testPasteDumpPenalizedAndFlagged() {
        Long sessionId = 3L;

        RecordTelemetryRequest request = new RecordTelemetryRequest(sessionId, TelemetryEventType.PASTE_DUMP, 500, null, "pasted block");
        when(eventRepository.save(any(TelemetryEvent.class))).thenAnswer(invocation -> {
            TelemetryEvent ev = invocation.getArgument(0);
            ev.setId(20L);
            return ev;
        });

        TelemetrySummaryResponse.TelemetryEventResponse recordResponse = proctorService.recordEvent(request);
        assertTrue(recordResponse.isFlagged());

        TelemetryEvent pasteEvent = createEvent(20L, sessionId, TelemetryEventType.PASTE_DUMP, 500, null, true);
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(List.of(pasteEvent));

        TelemetrySummaryResponse summary = proctorService.getSessionSummary(sessionId);
        assertEquals(92, summary.integrityScore());
        assertEquals(1, summary.pasteDumpCount());
        assertEquals(1, summary.anomalyFlags().size());
        assertTrue(summary.anomalyFlags().get(0).contains("500 characters"));
    }

    @Test
    @DisplayName("D7.4: Penalties accumulate and score caps at 0 with CHEATING_FLAGGED verdict")
    void testScoreCapsAtZero() {
        Long sessionId = 4L;
        List<TelemetryEvent> events = new ArrayList<>();
        // 25 tab blur events: 25 * 5 = 125 penalty (exceeds initial 100)
        for (int i = 0; i < 25; i++) {
            events.add(createEvent((long) i, sessionId, TelemetryEventType.TAB_BLUR, null, 2L, false));
        }

        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(events);

        TelemetrySummaryResponse summary = proctorService.getSessionSummary(sessionId);
        assertEquals(0, summary.integrityScore());
        assertEquals(IntegrityRiskLevel.CHEATING_FLAGGED, summary.riskLevel());
        assertTrue(summary.integrityVerdict().contains("High Cheating Risk"));
    }

    @Test
    @DisplayName("D7.5: Verdict boundaries at 85 CLEAN, 84 SUSPICIOUS, 60 SUSPICIOUS, 59 CHEATING_FLAGGED")
    void testVerdictBoundaries() {
        Long sessionId = 5L;

        // Boundary 85: 3 TAB_BLUR (3 * 5 = 15 penalty -> 85)
        List<TelemetryEvent> score85Events = List.of(
                createEvent(1L, sessionId, TelemetryEventType.TAB_BLUR, null, 2L, false),
                createEvent(2L, sessionId, TelemetryEventType.TAB_BLUR, null, 2L, false),
                createEvent(3L, sessionId, TelemetryEventType.TAB_BLUR, null, 2L, false)
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(score85Events);
        TelemetrySummaryResponse summary85 = proctorService.getSessionSummary(sessionId);
        assertEquals(85, summary85.integrityScore());
        assertEquals(IntegrityRiskLevel.CLEAN, summary85.riskLevel());

        // Boundary 84: 2 PASTE_DUMP (2 * 8 = 16 penalty -> 84)
        List<TelemetryEvent> score84Events = List.of(
                createEvent(1L, sessionId, TelemetryEventType.PASTE_DUMP, 100, null, false),
                createEvent(2L, sessionId, TelemetryEventType.PASTE_DUMP, 100, null, false)
        );
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(score84Events);
        TelemetrySummaryResponse summary84 = proctorService.getSessionSummary(sessionId);
        assertEquals(84, summary84.integrityScore());
        assertEquals(IntegrityRiskLevel.SUSPICIOUS, summary84.riskLevel());

        // Boundary 60: 8 TAB_BLUR (8 * 5 = 40 penalty -> 60)
        List<TelemetryEvent> score60Events = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            score60Events.add(createEvent((long) i, sessionId, TelemetryEventType.TAB_BLUR, null, 2L, false));
        }
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(score60Events);
        TelemetrySummaryResponse summary60 = proctorService.getSessionSummary(sessionId);
        assertEquals(60, summary60.integrityScore());
        assertEquals(IntegrityRiskLevel.SUSPICIOUS, summary60.riskLevel());

        // Boundary 59: 5 TAB_BLUR (25) + 2 PASTE_DUMP (16) = 41 penalty -> 59
        List<TelemetryEvent> score59Events = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            score59Events.add(createEvent((long) i, sessionId, TelemetryEventType.TAB_BLUR, null, 2L, false));
        }
        score59Events.add(createEvent(50L, sessionId, TelemetryEventType.PASTE_DUMP, 100, null, false));
        score59Events.add(createEvent(51L, sessionId, TelemetryEventType.PASTE_DUMP, 100, null, false));
        when(eventRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(score59Events);
        TelemetrySummaryResponse summary59 = proctorService.getSessionSummary(sessionId);
        assertEquals(59, summary59.integrityScore());
        assertEquals(IntegrityRiskLevel.CHEATING_FLAGGED, summary59.riskLevel());
    }

    @Test
    @DisplayName("D7.6: isEventSuspicious returns false for all 8 new lifecycle event types")
    void testLifecycleEventsNeverSuspicious() {
        Long sessionId = 6L;
        TelemetryEventType[] lifecycleTypes = {
                TelemetryEventType.VERIFY_CAMERA_OK,
                TelemetryEventType.VERIFY_MIC_OK,
                TelemetryEventType.VERIFY_SCREEN_OK,
                TelemetryEventType.VERIFY_SCREEN_REJECTED,
                TelemetryEventType.SHARE_LOST,
                TelemetryEventType.SHARE_RESTORED,
                TelemetryEventType.SECONDARY_CAMERA_CONNECTED,
                TelemetryEventType.SINGLE_CAMERA_ACKNOWLEDGED
        };

        ArgumentCaptor<TelemetryEvent> captor = ArgumentCaptor.forClass(TelemetryEvent.class);
        when(eventRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        for (TelemetryEventType type : lifecycleTypes) {
            RecordTelemetryRequest req = new RecordTelemetryRequest(sessionId, type, 5000, 600L, "lifecycle event");
            TelemetrySummaryResponse.TelemetryEventResponse resp = proctorService.recordEvent(req);
            assertFalse(resp.isFlagged(), "Lifecycle event " + type + " should never be flagged as suspicious");
        }

        List<TelemetryEvent> savedEvents = captor.getAllValues();
        assertEquals(8, savedEvents.size());
        for (TelemetryEvent ev : savedEvents) {
            assertFalse(ev.isFlagged());
        }
    }
}
