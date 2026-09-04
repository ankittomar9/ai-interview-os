package com.interviewos.session.service;

import com.interviewos.session.runner.LldMavenRunner;
import com.interviewos.session.runner.SqlPostgresRunner;
import com.interviewos.session.sandbox.client.Judge0Client;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSFindIterable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.data.mongodb.core.MongoTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemCapabilitiesServiceTest {

    @Mock
    private Judge0Client judge0Client;

    @Mock
    private LldMavenRunner lldMavenRunner;

    @Mock
    private SqlPostgresRunner sqlPostgresRunner;

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private Statement statement;

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private GridFSBucket gridFSBucket;

    @Mock
    private GridFSFindIterable gridFSFindIterable;

    @Mock
    private DiscoveryClient discoveryClient;

    private SystemCapabilitiesService service;

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.createStatement()).thenReturn(statement);
        lenient().when(statement.execute(anyString())).thenReturn(true);
        lenient().when(gridFSBucket.find()).thenThrow(new RuntimeException("not needed for unit test"));
        lenient().when(discoveryClient.getServices()).thenReturn(Collections.emptyList());

        service = new SystemCapabilitiesService(
                judge0Client,
                lldMavenRunner,
                sqlPostgresRunner,
                dataSource,
                mongoTemplate,
                gridFSBucket,
                discoveryClient
        );
    }

    @Test
    @DisplayName("During initial cold boot (<90s), failed probe produces STARTING instead of DOWN")
    void testColdBootInitialProbeFailure_ReturnsStarting() {
        service.setServiceStartupTime(Instant.now());
        when(judge0Client.ping()).thenReturn(false);
        when(lldMavenRunner.isDockerReady()).thenReturn(false);
        when(sqlPostgresRunner.isDockerReady()).thenReturn(false);

        SystemCapabilitiesService.SystemCapabilitiesResponse response = service.getCapabilities();

        SystemCapabilitiesService.EngineStatus dsa = response.engines().get("dsa");
        assertThat(dsa.ready()).isFalse();
        assertThat(dsa.state()).isEqualTo("STARTING");
        assertThat(dsa.detail()).contains("Starting… engines warming up");
        assertThat(dsa.lastReadyAt()).isNull();

        SystemCapabilitiesService.EngineStatus lld = response.engines().get("lld");
        assertThat(lld.ready()).isFalse();
        assertThat(lld.state()).isEqualTo("STARTING");
    }

    @Test
    @DisplayName("Successful probe produces ONLINE with lastReadyAt timestamp and ready=true")
    void testSuccessfulProbe_ReturnsOnlineWithTimestamp() {
        service.setServiceStartupTime(Instant.now());
        when(judge0Client.ping()).thenReturn(true);
        when(lldMavenRunner.isDockerReady()).thenReturn(true);
        when(sqlPostgresRunner.isDockerReady()).thenReturn(true);

        SystemCapabilitiesService.SystemCapabilitiesResponse response = service.getCapabilities();

        SystemCapabilitiesService.EngineStatus dsa = response.engines().get("dsa");
        assertThat(dsa.ready()).isTrue();
        assertThat(dsa.state()).isEqualTo("ONLINE");
        assertThat(dsa.lastReadyAt()).isNotNull();
        assertThat(dsa.detail()).contains("Judge0 CE execution engine is online");
    }

    @Test
    @DisplayName("Failed probe after engine was previously ONLINE produces DOWN and retains lastReadyAt")
    void testFailedProbeAfterOnline_ReturnsDownWithLastReadyAt() {
        Instant pastReady = Instant.now().minus(Duration.ofMinutes(2));
        service.setServiceStartupTime(Instant.now().minus(Duration.ofMinutes(5)));
        service.setEngineLastReadyAt("dsa", pastReady);

        when(judge0Client.ping()).thenReturn(false);

        SystemCapabilitiesService.SystemCapabilitiesResponse response = service.getCapabilities();

        SystemCapabilitiesService.EngineStatus dsa = response.engines().get("dsa");
        assertThat(dsa.ready()).isFalse();
        assertThat(dsa.state()).isEqualTo("DOWN");
        assertThat(dsa.lastReadyAt()).isEqualTo(pastReady.toString());
        assertThat(dsa.detail()).contains("Judge0 is unreachable");
    }

    @Test
    @DisplayName("Failed probe after cold boot window (>90s) without prior success produces DOWN")
    void testFailedProbeAfterColdBootWindow_ReturnsDown() {
        service.setServiceStartupTime(Instant.now().minus(Duration.ofSeconds(100)));
        when(judge0Client.ping()).thenReturn(false);

        SystemCapabilitiesService.SystemCapabilitiesResponse response = service.getCapabilities();

        SystemCapabilitiesService.EngineStatus dsa = response.engines().get("dsa");
        assertThat(dsa.ready()).isFalse();
        assertThat(dsa.state()).isEqualTo("DOWN");
        assertThat(dsa.lastReadyAt()).isNull();
    }

    @Test
    @DisplayName("Capabilities response is cached for 5s TTL and refreshes when cleared or expired")
    void testCacheTtl() {
        service.setServiceStartupTime(Instant.now());
        when(judge0Client.ping()).thenReturn(true);

        SystemCapabilitiesService.SystemCapabilitiesResponse response1 = service.getCapabilities();
        assertThat(response1.engines().get("dsa").state()).isEqualTo("ONLINE");

        // Ping changes to false, but within cache TTL, should return cached response
        when(judge0Client.ping()).thenReturn(false);
        SystemCapabilitiesService.SystemCapabilitiesResponse response2 = service.getCapabilities();
        assertThat(response2.engines().get("dsa").state()).isEqualTo("ONLINE");

        // After clearing cache, fresh probe runs
        service.clearCache();
        SystemCapabilitiesService.SystemCapabilitiesResponse response3 = service.getCapabilities();
        assertThat(response3.engines().get("dsa").state()).isEqualTo("DOWN");
    }
}
