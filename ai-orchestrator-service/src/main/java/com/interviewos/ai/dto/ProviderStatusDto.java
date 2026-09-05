package com.interviewos.ai.dto;

public record ProviderStatusDto(
        String provider,
        boolean configPresent,
        String keySource,
        String state,
        String configuredModel,
        Boolean modelListed,
        String reason,
        LastKnownResult lastKnown,
        long checkedAt
) {
    public record LastKnownResult(
            String outcome,
            Integer httpStatus,
            long at
    ) {}
}
