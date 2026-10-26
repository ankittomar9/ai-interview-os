package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.SessionAttachmentClient;
import com.interviewos.ai.dto.DesignEvaluationRequest;
import com.interviewos.ai.dto.DesignEvaluationResponse;
import com.interviewos.ai.model.ModelProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DesignEvaluationTopologyProbingTest {

    @Mock
    private AiClientFactory clientFactory;

    @Mock
    private SessionAttachmentClient attachmentClient;

    @Mock
    private AiClient aiClient;

    private ObjectMapper objectMapper;
    private ArchitectureTopologyExtractor topologyExtractor;
    private DesignEvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        topologyExtractor = new ArchitectureTopologyExtractor(objectMapper);
        evaluationService = new DesignEvaluationService(clientFactory, attachmentClient, objectMapper, topologyExtractor);
        ReflectionTestUtils.setField(evaluationService, "configuredProvider", "gemini");
        ReflectionTestUtils.setField(evaluationService, "configuredApiKey", "test-key");
    }

    private static final String RICH_CANVAS_JSON = """
            {
              "nodes": [
                {
                  "id": "gw-1",
                  "data": { "type": "GATEWAY", "name": "Kong Gateway", "qps": "45,000" }
                },
                {
                  "id": "svc-1",
                  "data": { "type": "SERVICE", "name": "Order Service", "qps": "15,000" }
                },
                {
                  "id": "cache-1",
                  "data": { "type": "CACHE", "name": "Redis Session Store" }
                },
                {
                  "id": "queue-1",
                  "data": { "type": "QUEUE", "name": "Kafka Orders Topic" }
                },
                {
                  "id": "db-1",
                  "data": { "type": "DATABASE", "name": "PostgreSQL Primary" }
                },
                {
                  "id": "db-2",
                  "data": { "type": "DATABASE", "name": "PostgreSQL Read Replica" }
                }
              ],
              "edges": [
                { "id": "e1", "source": "gw-1", "target": "svc-1", "label": "HTTPS" },
                { "id": "e2", "source": "svc-1", "target": "cache-1", "label": "RESP" },
                { "id": "e3", "source": "svc-1", "target": "queue-1", "label": "Produce" },
                { "id": "e4", "source": "svc-1", "target": "db-1", "label": "JDBC" }
              ]
            }
            """;

    @Test
    @DisplayName("P4: extractTopology identifies nodes, connections, and triggers all challenge playbooks")
    void testExtractTopology_RichArchitecture() {
        ArchitectureTopologyExtractor.ArchitectureTopology topology = topologyExtractor.extractTopology(RICH_CANVAS_JSON);

        assertNotNull(topology);
        assertEquals(6, topology.nodes().size());
        assertEquals(4, topology.edges().size());

        assertTrue(topology.hasCache(), "Must detect CACHE component");
        assertTrue(topology.hasQueue(), "Must detect QUEUE component");
        assertTrue(topology.hasDatabase(), "Must detect DATABASE component");
        assertTrue(topology.hasDbReplicas(), "Must detect DB replicas (2 database nodes)");
        assertTrue(topology.hasLoadBalancer(), "Must detect GATEWAY / Load Balancer");

        assertTrue(topology.activePlaybooks().contains("CACHE_INVALIDATION_AND_STAMPEDE"));
        assertTrue(topology.activePlaybooks().contains("QUEUE_BACKPRESSURE_AND_IDEMPOTENCY"));
        assertTrue(topology.activePlaybooks().contains("DB_REPLICATION_AND_CONSISTENCY"));
        assertTrue(topology.activePlaybooks().contains("INGRESS_RESILIENCE_AND_SPOF"));

        String formatted = topology.formattedTopology();
        assertTrue(formatted.contains("Kong Gateway"));
        assertTrue(formatted.contains("Order Service"));
        assertTrue(formatted.contains("Redis Session Store"));
        assertTrue(formatted.contains("Kafka Orders Topic"));
        assertTrue(formatted.contains("PostgreSQL Read Replica"));
        assertTrue(formatted.contains("Kong Gateway ──[HTTPS]──► Order Service"));

        String promptAug = topology.promptAugmentation();
        assertTrue(promptAug.contains("CACHE TOPOLOGY PLAYBOOK"));
        assertTrue(promptAug.contains("ASYNC QUEUE & STREAMING PLAYBOOK"));
        assertTrue(promptAug.contains("DATABASE REPLICATION & CONSISTENCY PLAYBOOK"));
        assertTrue(promptAug.contains("INGRESS & LOAD BALANCING PLAYBOOK"));
    }

    @Test
    @DisplayName("P4: extractTopology degrades gracefully on null, empty, or malformed JSON")
    void testExtractTopology_DegradesGracefully() {
        ArchitectureTopologyExtractor.ArchitectureTopology nullTop = topologyExtractor.extractTopology(null);
        assertNotNull(nullTop);
        assertEquals(0, nullTop.nodes().size());
        assertFalse(nullTop.hasCache());

        ArchitectureTopologyExtractor.ArchitectureTopology emptyTop = topologyExtractor.extractTopology("");
        assertNotNull(emptyTop);
        assertEquals(0, emptyTop.nodes().size());

        ArchitectureTopologyExtractor.ArchitectureTopology malformedTop = topologyExtractor.extractTopology("{ not valid json }");
        assertNotNull(malformedTop);
        assertEquals(0, malformedTop.nodes().size());
    }

    @Test
    @DisplayName("P4: evaluateDesign wires extracted topology and challenge playbooks into AI prompt")
    void testEvaluateDesign_WiresTopologyAndPlaybooksIntoPrompt() {
        DesignEvaluationRequest request = new DesignEvaluationRequest(
                401L,
                "att-json-401",
                null,
                new DesignEvaluationRequest.DesignRequirements("25M", "3x", "15:1"),
                ModelProvider.GEMINI,
                "custom-key"
        );

        when(clientFactory.getClient(ModelProvider.GEMINI)).thenReturn(aiClient);
        when(attachmentClient.fetchAttachmentText(eq(401L), eq("att-json-401"))).thenReturn(RICH_CANVAS_JSON);

        String mockResponse = """
                {
                  "score": 88,
                  "feedback": [
                    "Order Service cleanly routes reads to Redis Session Store.",
                    "Cache invalidation policy addresses stampede thundering herd via mutex lock.",
                    "Kafka Orders Topic handles write decoupling under peak load."
                  ],
                  "evidence": "Topology evaluated: Gateway -> Order Service -> Redis & Kafka"
                }
                """;

        when(aiClient.generateCompletion(eq(ModelProvider.GEMINI), anyString(), anyString(), eq("custom-key"), any()))
                .thenReturn(mockResponse);

        DesignEvaluationResponse response = evaluationService.evaluateDesign(request);

        assertNotNull(response);
        assertEquals(88, response.score());
        assertTrue(response.llmGenerated());
        assertEquals(3, response.feedback().size());

        // Verify the prompt passed to the AI client contains the semantic topology and challenge playbooks
        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiClient).generateCompletion(eq(ModelProvider.GEMINI), anyString(), promptCaptor.capture(), eq("custom-key"), any());

        String capturedPrompt = promptCaptor.getValue();
        assertTrue(capturedPrompt.contains("Candidate Architecture Graph (Structured Semantic Topology):"));
        assertTrue(capturedPrompt.contains("Redis Session Store"));
        assertTrue(capturedPrompt.contains("Kafka Orders Topic"));
        assertTrue(capturedPrompt.contains("CACHE TOPOLOGY PLAYBOOK:"));
        assertTrue(capturedPrompt.contains("ASYNC QUEUE & STREAMING PLAYBOOK:"));
    }
}
