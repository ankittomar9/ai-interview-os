package com.interviewos.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.service.EgressTracker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpenAiFrontierRoutingAndEgressTest {

    @Mock
    private RestClient.Builder restClientBuilder;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestBodyUriSpec uriSpec;

    @Mock
    private RestClient.RequestBodySpec bodySpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    @Mock
    private EgressTracker egressTracker;

    private ObjectMapper objectMapper = new ObjectMapper();
    private AiProviderProperties providerProperties;
    private OpenAiCompatibleClient openAiClient;

    @BeforeEach
    void setUp() {
        AiProviderProperties.ProviderConfig openAiConfig = new AiProviderProperties.ProviderConfig(
                "https://api.openai.com/v1",
                "gpt-4o",
                "gpt-4o",
                "gpt-4o-mini",
                "gpt-4o",
                null,
                "sk-test-key"
        );

        providerProperties = new AiProviderProperties(Map.of(
                "openai", openAiConfig
        ));

        openAiClient = new OpenAiCompatibleClient(
                restClientBuilder,
                providerProperties,
                objectMapper,
                egressTracker
        );
    }

    @Test
    @DisplayName("AC-5.1: AiClientFactory routes ModelProvider.OPENAI to OpenAiCompatibleClient")
    void testAiClientFactoryRoutesOpenAi() {
        AiClient otherClient = mock(AiClient.class);
        when(otherClient.supports(ModelProvider.OPENAI)).thenReturn(false);

        AiClientFactory factory = new AiClientFactory(List.of(otherClient, openAiClient));
        AiClient resolved = factory.getClient(ModelProvider.OPENAI);

        assertThat(resolved).isNotNull();
        assertThat(resolved).isSameAs(openAiClient);
        assertThat(openAiClient.supports(ModelProvider.OPENAI)).isTrue();
    }

    @Test
    @DisplayName("AC-5.1: OPENAI execution calls egressTracker.recordCloudCall('OPENAI') and normalizes endpoint")
    void testOpenAiExecutionRecordsEgressAndNormalizesEndpoint() {
        when(restClientBuilder.build()).thenReturn(restClient);
        when(restClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.header(anyString(), anyString())).thenReturn(bodySpec);
        when(bodySpec.contentType(any())).thenReturn(bodySpec);
        doReturn(bodySpec).when(bodySpec).body(any(Object.class));
        when(bodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(String.class)).thenReturn(
                "{\"choices\":[{\"message\":{\"content\":\"Hello from GPT-4o\"}}]}"
        );

        String result = openAiClient.generateCompletion(
                ModelProvider.OPENAI,
                "You are an interviewer.",
                "Hello world",
                "sk-custom-key",
                "dialogue"
        );

        assertEquals("Hello from GPT-4o", result);

        // Verify egress tracked
        verify(egressTracker, times(1)).recordCloudCall("OPENAI");

        // Verify endpoint normalized to include /chat/completions
        ArgumentCaptor<String> uriCaptor = ArgumentCaptor.forClass(String.class);
        verify(uriSpec).uri(uriCaptor.capture());
        assertEquals("https://api.openai.com/v1/chat/completions", uriCaptor.getValue());

        // Verify request payload used resolved dialogue model (gpt-4o)
        ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
        verify(bodySpec).body(bodyCaptor.capture());
        Map<?, ?> payload = (Map<?, ?>) bodyCaptor.getValue();
        assertEquals("gpt-4o", payload.get("model"));
    }

    @Test
    @DisplayName("AC-5.1: OPENAI rubric evaluation task 'eval' resolves modelEval and records egress")
    void testOpenAiRubricEvalResolvesModelAndRecordsEgress() {
        when(restClientBuilder.build()).thenReturn(restClient);
        when(restClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.header(anyString(), anyString())).thenReturn(bodySpec);
        when(bodySpec.contentType(any())).thenReturn(bodySpec);
        doReturn(bodySpec).when(bodySpec).body(any(Object.class));
        when(bodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(String.class)).thenReturn(
                "{\"choices\":[{\"message\":{\"content\":\"{\\\"overallScore\\\": 85}\"}}]}"
        );

        String result = openAiClient.generateCompletion(
                ModelProvider.OPENAI,
                "Score this solution",
                "int x = 1;",
                "sk-custom-key",
                "eval"
        );

        assertEquals("{\"overallScore\": 85}", result);
        verify(egressTracker, times(1)).recordCloudCall("OPENAI");

        ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
        verify(bodySpec).body(bodyCaptor.capture());
        Map<?, ?> payload = (Map<?, ?>) bodyCaptor.getValue();
        assertEquals("gpt-4o", payload.get("model"));
    }
}
