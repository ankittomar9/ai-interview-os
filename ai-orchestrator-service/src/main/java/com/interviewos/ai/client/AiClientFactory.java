package com.interviewos.ai.client;

import com.interviewos.ai.model.ModelProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Factory and registry that dynamically selects the right AiClient adapter based on ModelProvider.
 */
@Component
@RequiredArgsConstructor
public class AiClientFactory {

    private final List<AiClient> clients;

    public AiClient getClient(ModelProvider provider) {
        return clients.stream()
                .filter(client -> client.supports(provider))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported AI provider: " + provider));
    }
}