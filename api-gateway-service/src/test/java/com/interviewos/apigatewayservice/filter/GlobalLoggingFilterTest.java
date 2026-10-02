package com.interviewos.apigatewayservice.filter;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalLoggingFilterTest {

    private GlobalLoggingFilter filter;
    private Logger logger;
    private ListAppender<ILoggingEvent> listAppender;

    @BeforeEach
    void setUp() {
        filter = new GlobalLoggingFilter();
        logger = (Logger) LoggerFactory.getLogger(GlobalLoggingFilter.class);
        listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);
    }

    @AfterEach
    void tearDown() {
        if (logger != null && listAppender != null) {
            logger.detachAppender(listAppender);
        }
    }

    @Test
    @DisplayName("VP-3: Request to /api/v1/telemetry/client-logs skips both INBOUND and OUTBOUND logging")
    void testTelemetryPathSkipsLogging() {
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/v1/telemetry/client-logs")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, chain).block();

        List<ILoggingEvent> logs = listAppender.list;
        boolean hasInbound = logs.stream().anyMatch(e -> e.getMessage().contains("INBOUND REQUEST"));
        boolean hasOutbound = logs.stream().anyMatch(e -> e.getMessage().contains("OUTBOUND"));

        assertFalse(hasInbound, "Telemetry requests must NOT produce INBOUND REQUEST log lines");
        assertFalse(hasOutbound, "Telemetry requests must NOT produce OUTBOUND log lines");
    }

    @Test
    @DisplayName("VP-3: Control path (/api/v1/sessions/146) logs both INBOUND and OUTBOUND")
    void testControlPathLogsBothInboundAndOutbound() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/sessions/146")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, chain).block();

        List<ILoggingEvent> logs = listAppender.list;
        boolean hasInbound = logs.stream().anyMatch(e -> e.getMessage().contains("INBOUND REQUEST"));
        boolean hasOutbound = logs.stream().anyMatch(e -> e.getMessage().contains("OUTBOUND"));

        assertTrue(hasInbound, "Control requests must produce INBOUND REQUEST log line");
        assertTrue(hasOutbound, "Control requests must produce OUTBOUND log line");
    }
}
