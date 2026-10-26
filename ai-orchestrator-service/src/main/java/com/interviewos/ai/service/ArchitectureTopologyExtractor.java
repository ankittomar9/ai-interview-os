package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * SPEC-019 Phase P4: Semantic architecture topology extractor and challenge playbook builder.
 * Upgrades HLD AI evaluation from raw pixel/JSON dumps into structured component graphs with
 * topology-keyed challenge playbooks (Cache Stampede, Queue Backpressure, DB Replication Lag).
 */
@Slf4j
@Component
public class ArchitectureTopologyExtractor {

    private final ObjectMapper objectMapper;

    public ArchitectureTopologyExtractor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public record TopologyNode(
            String id,
            String name,
            String type,
            String qps,
            String notes
    ) {}

    public record TopologyEdge(
            String id,
            String sourceId,
            String sourceName,
            String targetId,
            String targetName,
            String label
    ) {}

    public record ArchitectureTopology(
            List<TopologyNode> nodes,
            List<TopologyEdge> edges,
            boolean hasCache,
            boolean hasQueue,
            boolean hasDatabase,
            boolean hasDbReplicas,
            boolean hasLoadBalancer,
            List<String> activePlaybooks,
            String formattedTopology,
            String promptAugmentation
    ) {}

    public ArchitectureTopology extractTopology(String canvasJson) {
        if (canvasJson == null || canvasJson.isBlank()) {
            return emptyTopology();
        }

        try {
            JsonNode root = objectMapper.readTree(canvasJson);
            JsonNode nodesNode = root.path("nodes");
            JsonNode edgesNode = root.path("edges");

            if (!nodesNode.isArray()) {
                return emptyTopology();
            }

            Map<String, TopologyNode> nodeMap = new LinkedHashMap<>();
            int dbCount = 0;
            boolean hasExplicitReplica = false;
            boolean hasCache = false;
            boolean hasQueue = false;
            boolean hasLoadBalancer = false;

            for (JsonNode n : nodesNode) {
                String id = n.path("id").asText("unknown-node");
                JsonNode data = n.path("data");
                String name = data.path("name").asText(n.path("name").asText(id));
                String type = data.path("type").asText(n.path("type").asText("SERVICE")).toUpperCase(Locale.ROOT);
                String qps = data.path("qps").asText(null);
                String notes = data.path("notes").asText(null);

                TopologyNode node = new TopologyNode(id, name, type, qps, notes);
                nodeMap.put(id, node);

                String nameLower = name.toLowerCase(Locale.ROOT);
                String typeLower = type.toLowerCase(Locale.ROOT);

                if (type.equals("CACHE") || nameLower.contains("cache") || nameLower.contains("redis") || nameLower.contains("memcached")) {
                    hasCache = true;
                }
                if (type.equals("QUEUE") || nameLower.contains("queue") || nameLower.contains("kafka") || nameLower.contains("rabbitmq") || nameLower.contains("sqs")) {
                    hasQueue = true;
                }
                if (type.equals("DATABASE") || nameLower.contains("db") || nameLower.contains("postgres") || nameLower.contains("mysql") || nameLower.contains("mongo")) {
                    dbCount++;
                    if (nameLower.contains("replica") || nameLower.contains("secondary") || nameLower.contains("slave") || nameLower.contains("read")) {
                        hasExplicitReplica = true;
                    }
                }
                if (type.equals("LOAD_BALANCER") || type.equals("GATEWAY") || nameLower.contains("balancer") || nameLower.contains("gateway") || nameLower.contains("nginx")) {
                    hasLoadBalancer = true;
                }
            }

            boolean hasDatabase = dbCount > 0;
            boolean hasDbReplicas = hasExplicitReplica || dbCount > 1;

            List<TopologyEdge> edges = new ArrayList<>();
            if (edgesNode.isArray()) {
                for (JsonNode e : edgesNode) {
                    String edgeId = e.path("id").asText("edge");
                    String sourceId = e.path("source").asText("");
                    String targetId = e.path("target").asText("");
                    String label = e.path("label").asText("");

                    TopologyNode src = nodeMap.get(sourceId);
                    TopologyNode tgt = nodeMap.get(targetId);

                    String sourceName = src != null ? src.name() : sourceId;
                    String targetName = tgt != null ? tgt.name() : targetId;

                    edges.add(new TopologyEdge(edgeId, sourceId, sourceName, targetId, targetName, label));
                }
            }

            List<TopologyNode> nodes = new ArrayList<>(nodeMap.values());
            List<String> activePlaybooks = new ArrayList<>();

            StringBuilder formatted = new StringBuilder();
            formatted.append("PARSED ARCHITECTURE TOPOLOGY:\n");
            formatted.append("• Components (").append(nodes.size()).append("):\n");
            for (TopologyNode node : nodes) {
                formatted.append("  - [").append(node.type()).append("] ").append(node.name());
                if (node.qps() != null && !node.qps().isBlank()) {
                    formatted.append(" (QPS: ").append(node.qps()).append(")");
                }
                formatted.append("\n");
            }

            formatted.append("• Data Flows & Connectors (").append(edges.size()).append("):\n");
            for (TopologyEdge edge : edges) {
                formatted.append("  - ").append(edge.sourceName()).append(" ──");
                if (edge.label() != null && !edge.label().isBlank()) {
                    formatted.append("[").append(edge.label()).append("]──");
                }
                formatted.append("► ").append(edge.targetName()).append("\n");
            }

            StringBuilder promptAug = new StringBuilder();
            promptAug.append("\nTOPOLOGY-KEYED ARCHITECTURE CHALLENGE PLAYBOOKS:\n");

            if (hasCache) {
                activePlaybooks.add("CACHE_INVALIDATION_AND_STAMPEDE");
                promptAug.append("""
                        1. CACHE TOPOLOGY PLAYBOOK:
                           - Invalidation Strategy: Evaluate whether the design uses write-through, write-behind, or cache-aside, and how consistency is maintained.
                           - Cache Stampede / Thundering Herd: Check if the candidate mitigates DB saturation on hot-key expiry (e.g. mutex locking, probabilistic early expiry XFetch).
                           - Eviction & Sizing: Review eviction policies (LRU/LFU) and memory limits under peak throughput.
                        """);
            }

            if (hasQueue) {
                activePlaybooks.add("QUEUE_BACKPRESSURE_AND_IDEMPOTENCY");
                promptAug.append("""
                        2. ASYNC QUEUE & STREAMING PLAYBOOK:
                           - Backpressure & Consumer Lag: Evaluate how the system handles consumer lag when write spikes exceed worker processing capacity.
                           - Idempotency & Deduplication: Given at-least-once message delivery, probe how workers ensure duplicate events do not corrupt state.
                           - Poison Pills & Dead-Letter Queues (DLQ): Verify that malformed messages are routed to a DLQ rather than halting partition consumption.
                        """);
            }

            if (hasDbReplicas) {
                activePlaybooks.add("DB_REPLICATION_AND_CONSISTENCY");
                promptAug.append("""
                        3. DATABASE REPLICATION & CONSISTENCY PLAYBOOK:
                           - Replication Lag & Read-Your-Writes: With read replicas active, evaluate how the design avoids stale reads immediately after candidate writes.
                           - Failover & Split-Brain: Evaluate leader election, health check quorum, and split-brain prevention if the primary database fails.
                        """);
            }

            if (hasLoadBalancer) {
                activePlaybooks.add("INGRESS_RESILIENCE_AND_SPOF");
                promptAug.append("""
                        4. INGRESS & LOAD BALANCING PLAYBOOK:
                           - Redundancy & Health Checks: Check whether load balancers/gateways avoid single points of failure with active-passive or anycast routing.
                           - Rate Limiting & Throttling: Verify whether token bucket or sliding window rate limiting protects downstream microservices from volumetric attacks.
                        """);
            }

            return new ArchitectureTopology(
                    nodes,
                    edges,
                    hasCache,
                    hasQueue,
                    hasDatabase,
                    hasDbReplicas,
                    hasLoadBalancer,
                    activePlaybooks,
                    formatted.toString(),
                    promptAug.toString()
            );

        } catch (Exception e) {
            log.warn("Failed to parse canvas JSON for semantic topology: {}", e.getMessage());
            return emptyTopology();
        }
    }

    private ArchitectureTopology emptyTopology() {
        return new ArchitectureTopology(
                List.of(),
                List.of(),
                false,
                false,
                false,
                false,
                false,
                List.of(),
                "No structured topology provided in canvas snapshot.",
                ""
        );
    }
}
