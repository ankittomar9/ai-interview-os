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
    private static final Duration CACHE_TTL = Duration.ofSeconds(5);

    private Instant serviceStartupTime = Instant.now();
    private final Map<String, Instant> engineLastReadyAt = new java.util.concurrent.ConcurrentHashMap<>();

    void setServiceStartupTime(Instant startupTime) {
        this.serviceStartupTime = startupTime;
    }

    void setEngineLastReadyAt(String engineKey, Instant instant) {
        if (instant != null) {
            this.engineLastReadyAt.put(engineKey, instant);
        } else {
            this.engineLastReadyAt.remove(engineKey);
        }
    }

    void clearCache() {
        this.cache.set(null);
    }

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

    EngineStatus resolveEngineStatus(String engineKey, boolean probeSuccess, String onlineDetail, String offlineDetail) {
        Instant now = Instant.now();
        if (probeSuccess) {
            engineLastReadyAt.put(engineKey, now);
            return new EngineStatus(true, "ONLINE", onlineDetail, now.toString());
        }

        Instant lastReady = engineLastReadyAt.get(engineKey);
        boolean inColdBoot = Duration.between(serviceStartupTime, now).getSeconds() < 90;

        if (lastReady == null && inColdBoot) {
            return new EngineStatus(false, "STARTING", "Starting… engines warming up", null);
        } else {
            return new EngineStatus(false, "DOWN", offlineDetail, lastReady != null ? lastReady.toString() : null);
        }
    }

    private SystemCapabilitiesResponse probeCapabilities() {
        log.debug("Probing system capabilities across engines, microservices, and storage...");

        // 1. Engines
        boolean dsaReady = false;
        try {
            dsaReady = judge0Client.ping();
        } catch (Exception ignored) {}
        EngineStatus dsaStatus = resolveEngineStatus(
                "dsa",
                dsaReady,
                "Judge0 CE execution engine is online and responsive",
                "Judge0 is unreachable — start engines with 'docker compose --profile engines up -d'"
        );

        boolean lldReady = false;
        try {
            lldReady = lldMavenRunner.isDockerReady();
        } catch (Exception ignored) {}
        EngineStatus lldStatus = resolveEngineStatus(
                "lld",
                lldReady,
                "Docker daemon is accessible with pre-warmed Maven image",
                "Docker socket unavailable — LLD sandbox requires Docker socket access"
        );

        boolean sqlReady = false;
        try {
            sqlReady = sqlPostgresRunner.isDockerReady();
        } catch (Exception ignored) {}
        EngineStatus sqlStatus = resolveEngineStatus(
                "sql",
                sqlReady,
                "PostgreSQL 13 isolated container sandbox runner is online",
                "Docker socket unavailable — SQL sandbox requires Docker socket access"
        );

        EngineStatus hldStatus = resolveEngineStatus(
                "hld",
                true,
                "Client-side React Flow + multimodal vision evaluator",
                "HLD engine unavailable"
        );

        EngineStatus behavioralStatus = resolveEngineStatus(
                "behavioral",
                true,
                "Audio & transcript dialogue engine",
                "Behavioral engine unavailable"
        );

        Map<String, EngineStatus> engines = Map.of(
                "dsa", dsaStatus,
                "lld", lldStatus,
                "sql", sqlStatus,
                "hld", hldStatus,
                "behavioral", behavioralStatus
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
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));
        RestClient client = RestClient.builder().requestFactory(factory).build();

        for (int attempt = 0; attempt < 2; attempt++) {
            if (attempt > 0) {
                try {
                    Thread.sleep(200);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }
            try {
                String res = client.get().uri(url).retrieve().body(String.class);
                if (res != null && res.contains("UP")) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }
        return false;
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

    public record EngineStatus(boolean ready, String state, String detail, String lastReadyAt) {
        public EngineStatus(boolean ready, String detail) {
            this(ready, ready ? "ONLINE" : "DOWN", detail, ready ? Instant.now().toString() : null);
        }
    }
    public record StorageMetrics(long gridFsAttachmentCount, long gridFsBytes) {}
    private record CachedCapabilities(Instant timestamp, SystemCapabilitiesResponse response) {}
}
