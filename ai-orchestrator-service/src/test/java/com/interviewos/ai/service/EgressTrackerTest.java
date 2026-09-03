package com.interviewos.ai.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EgressTrackerTest {

    @Test
    @DisplayName("Initial state should reflect 100% local purity with 0 cloud calls")
    void testInitialPurity() {
        EgressTracker tracker = new EgressTracker();

        assertThat(tracker.isLocalPurity()).isTrue();
        assertThat(tracker.getCloudCallCount()).isZero();
        assertThat(tracker.getDestinations()).isEmpty();

        EgressTracker.PurityStatus status = tracker.getStatus();
        assertThat(status.isLocal()).isTrue();
        assertThat(status.cloudCallCount()).isZero();
        assertThat(status.description()).contains("100% Local");
    }

    @Test
    @DisplayName("Recording cloud egress updates counts and marks local purity false")
    void testRecordCloudCall() {
        EgressTracker tracker = new EgressTracker();

        tracker.recordCloudCall("GROQ");
        tracker.recordCloudCall("GEMINI");

        assertThat(tracker.isLocalPurity()).isFalse();
        assertThat(tracker.getCloudCallCount()).isEqualTo(2);
        assertThat(tracker.getDestinations()).containsExactlyInAnyOrder("GROQ", "GEMINI");
        assertThat(tracker.getLastEgressAt()).isNotNull();

        EgressTracker.PurityStatus status = tracker.getStatus();
        assertThat(status.isLocal()).isFalse();
        assertThat(status.cloudCallCount()).isEqualTo(2);
        assertThat(status.description()).contains("Cloud AI Egress Detected");
    }
}
