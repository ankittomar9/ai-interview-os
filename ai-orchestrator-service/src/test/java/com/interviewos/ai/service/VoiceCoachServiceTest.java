package com.interviewos.ai.service;

import com.interviewos.ai.dto.VoiceCoachTipRequest;
import com.interviewos.ai.dto.VoiceCoachTipResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class VoiceCoachServiceTest {

    private final VoiceCoachService voiceCoachService = new VoiceCoachService();

    @Test
    @DisplayName("generates edge cases tip when consecutive test failures occur")
    void testEdgeCasesTipOnFailures() {
        VoiceCoachTipRequest request = new VoiceCoachTipRequest(120, 2, 2, 50, "ALGORITHMS_DATA_STRUCTURES", "Two Sum");
        VoiceCoachTipResponse response = voiceCoachService.generateTip(request);

        assertNotNull(response);
        assertEquals("EDGE_CASES", response.category());
        assertTrue(response.shouldSpeak());
        assertTrue(response.tip().contains("edge cases"));
    }

    @Test
    @DisplayName("encourages vocalizing thought process on high elapsed time with low words")
    void testCommunicationTipOnSilentCandidate() {
        VoiceCoachTipRequest request = new VoiceCoachTipRequest(350, 0, 0, 15, "ALGORITHMS_DATA_STRUCTURES", "Two Sum");
        VoiceCoachTipResponse response = voiceCoachService.generateTip(request);

        assertNotNull(response);
        assertEquals("COMMUNICATION", response.category());
        assertTrue(response.shouldSpeak());
        assertTrue(response.tip().contains("vocalizing your line of reasoning"));
    }

    @Test
    @DisplayName("suggests complexity check after 8 minutes")
    void testComplexityTipOnLongDuration() {
        VoiceCoachTipRequest request = new VoiceCoachTipRequest(500, 0, 0, 80, "ALGORITHMS_DATA_STRUCTURES", "Two Sum");
        VoiceCoachTipResponse response = voiceCoachService.generateTip(request);

        assertNotNull(response);
        assertEquals("COMPLEXITY", response.category());
        assertTrue(response.shouldSpeak());
        assertTrue(response.tip().contains("Big-O runtime"));
    }
}
