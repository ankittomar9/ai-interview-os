package com.interviewos.ai.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class EgressTracker {

    private final AtomicInteger cloudCallCount = new AtomicInteger(0);
    private final Set<String> destinations = ConcurrentHashMap.newKeySet();
    private volatile Instant lastEgressAt = null;

    public void recordCloudCall(String providerName) {
        int count = cloudCallCount.incrementAndGet();
        if (providerName != null && !providerName.isBlank()) {
            destinations.add(providerName.toUpperCase());
        }
        lastEgressAt = Instant.now();
        log.info("☁️ [EgressTracker] Recorded external cloud API call #{}: destination={}", count, providerName);
    }

    public boolean isLocalPurity() {
        return cloudCallCount.get() == 0;
    }

    public int getCloudCallCount() {
        return cloudCallCount.get();
    }

    public Set<String> getDestinations() {
        return destinations;
    }

    public Instant getLastEgressAt() {
        return lastEgressAt;
    }

    public PurityStatus getStatus() {
        boolean local = isLocalPurity();
        return new PurityStatus(
                local,
                cloudCallCount.get(),
                new ArrayList<>(destinations),
                local ? "100% Local — Nothing leaves your machine" : "Cloud AI Egress Detected (" + cloudCallCount.get() + " calls)"
        );
    }

    public record PurityStatus(
            @JsonProperty("isLocal") boolean isLocal,
            @JsonProperty("cloudCallCount") int cloudCallCount,
            @JsonProperty("destinations") List<String> destinations,
            @JsonProperty("description") String description
    ) {
        @JsonProperty("local")
        public boolean getLocal() {
            return isLocal;
        }
    }
}
