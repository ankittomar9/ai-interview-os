package com.interviewos.session.service;

import com.interviewos.session.runner.LldMavenRunner;
import com.interviewos.session.runner.SqlPostgresRunner;
import com.interviewos.session.sandbox.client.Judge0Client;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSFindIterable;
import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemCapabilitiesService {

    private final Judge0Client judge0Client;
    private final LldMavenRunner lldMavenRunner;
    private final SqlPostgresRunner sqlPostgresRunner;
    private final DataSource dataSource;
    private final MongoTemplate mongoTemplate;
    private final GridFSBucket gridFSBucket;
    private final DiscoveryClient discoveryClient;

    @Value("${ai.orchestrator.url:http://ai-orchestrator-service:8082}")
    private String orchestratorUrl;

    @Value("${proctor.sentinel.url:http://proctor-sentinel-service:8083}")
    private String proctorUrl;

    @Value("${question.bank.url:http://question-bank-service:8086}")
    private String questionBankUrl;

    private final AtomicReference<CachedCapabilities> cache = new AtomicReference<>();
    private static final Duration CACHE_TTL = Duration.ofSeconds(30);

    public SystemCapabilitiesResponse getCapabilities() {
        CachedCapabilities current = cache.get();
        Instant now = Instant.now();

        if (current != null && Duration.between(current.timestamp(), now).compareTo(CACHE_TTL) < 0) {
            return current.response();
        }

        SystemCapabilitiesResponse fresh = probeCapabilities();
        cache.set(new CachedCapabilities(now, fresh));
        return fresh;
    }

    private SystemCapabilitiesResponse probeCapabilities() {
        log.debug("Probing system capabilities across engines, microservices, and storage...");

        // 1. Engines
        boolean dsaReady = false;
        String dsaDetail = "Judge0 sandbox is offline";
        try {
            dsaReady = judge0Client.ping();
            dsaDetail = dsaReady ? "Judge0 CE execution engine is online and responsive"
                    : "Judge0 is unreachable — start engines with 'docker compose --profile engines up -d'";
        } catch (Exception ignored) {}

        boolean lldReady = false;
        String lldDetail = "Docker daemon socket is not accessible";
        try {
            lldReady = lldMavenRunner.isDockerReady();
            lldDetail = lldReady ? "Docker daemon is accessible with pre-warmed Maven image"
                    : "Docker socket unavailable — LLD sandbox requires Docker socket access";
        } catch (Exception ignored) {}

        boolean sqlReady = false;
        String sqlDetail = "Docker daemon socket is not accessible";
        try {
            sqlReady = sqlPostgresRunner.isDockerReady();
            sqlDetail = sqlReady ? "PostgreSQL 13 isolated container sandbox runner is online"
                    : "Docker socket unavailable — SQL sandbox requires Docker socket access";
        } catch (Exception ignored) {}

        Map<String, EngineStatus> engines = Map.of(
                "dsa", new EngineStatus(dsaReady, dsaDetail),
                "lld", new EngineStatus(lldReady, lldDetail),
                "sql", new EngineStatus(sqlReady, sqlDetail),
                "hld", new EngineStatus(true, "Client-side React Flow + multimodal vision evaluator"),
                "behavioral", new EngineStatus(true, "Audio & transcript dialogue engine")
        );

        // 2. Microservices
        Map<String, Boolean> services = new HashMap<>();
        services.put("postgres", probePostgres());
        services.put("mongo", probeMongo());
        services.put("eureka", probeEureka());
        services.put("orchestrator", probeHttp(orchestratorUrl + "/actuator/health"));
        services.put("proctor", probeHttp(proctorUrl + "/actuator/health"));
        services.put("questionBank", probeHttp(questionBankUrl + "/actuator/health"));

        // 3. Storage metrics (GridFS)
        StorageMetrics storage = probeStorage();

        return SystemCapabilitiesResponse.builder()
                .engines(engines)
                .services(services)
                .storage(storage)
                .checkedAt(Instant.now().toString())
                .build();
    }

    private boolean probePostgres() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.setQueryTimeout(2);
            return stmt.execute("SELECT 1");
        } catch (Exception e) {
            return false;
        }
    }

    private boolean probeMongo() {
        try {
            return mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1)).getDouble("ok") == 1.0;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean probeEureka() {
        try {
            return discoveryClient != null && !discoveryClient.getServices().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private boolean probeHttp(String url) {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(Duration.ofSeconds(2));
            factory.setReadTimeout(Duration.ofSeconds(2));
            RestClient client = RestClient.builder().requestFactory(factory).build();
            String res = client.get().uri(url).retrieve().body(String.class);
            return res != null && res.contains("UP");
        } catch (Exception e) {
            return false;
        }
    }

    private StorageMetrics probeStorage() {
        long count = 0;
        long bytes = 0;
        try {
            GridFSFindIterable files = gridFSBucket.find();
            for (GridFSFile file : files) {
                count++;
                bytes += file.getLength();
            }
        } catch (Exception e) {
            log.debug("GridFS storage metrics probe skipped: {}", e.getMessage());
        }
        return new StorageMetrics(count, bytes);
    }

    @Builder
    public record SystemCapabilitiesResponse(
            Map<String, EngineStatus> engines,
            Map<String, Boolean> services,
            StorageMetrics storage,
            String checkedAt
    ) {}

    public record EngineStatus(boolean ready, String detail) {}
    public record StorageMetrics(long gridFsAttachmentCount, long gridFsBytes) {}
    private record CachedCapabilities(Instant timestamp, SystemCapabilitiesResponse response) {}
}
