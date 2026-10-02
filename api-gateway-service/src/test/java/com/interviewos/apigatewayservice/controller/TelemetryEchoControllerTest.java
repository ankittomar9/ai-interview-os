package com.interviewos.apigatewayservice.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TelemetryEchoControllerTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private TelemetryEchoController controller;

    @Test
    @DisplayName("VP-2: Happy path echoes events and returns 202 Accepted")
    void testHappyPathReturns202() {
        List<TelemetryEchoController.ClientLogEventDto> events = List.of(
                new TelemetryEchoController.ClientLogEventDto(
                        "2026-10-03T01:00:00Z", "info", "TIMER_TRANSITION",
                        "TIMER_TRANSITION fromSection=0 toSection=1 displayed=07:42",
                        146L, "INTERVIEW", Map.of("step", 1)
                ),
                new TelemetryEchoController.ClientLogEventDto(
                        "2026-10-03T01:00:05Z", "warn", "TIMER_EXTEND_BLOCKED",
                        "TIMER_EXTEND_BLOCKED mode=INTERVIEW",
                        146L, "INTERVIEW", Map.of()
                )
        );

        ResponseEntity<Void> response = controller.echoClientLogs(
                1024L,
                new TelemetryEchoController.ClientLogsBatchDto(events)
        ).block();

        assertNotNull(response);
        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
    }

    @Test
    @DisplayName("VP-2: 51 events returns 400 Bad Request")
    void test51EventsReturns400() {
        List<TelemetryEchoController.ClientLogEventDto> events = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            events.add(new TelemetryEchoController.ClientLogEventDto(
                    "2026-10-03T01:00:00Z", "info", "TIMER_TRANSITION", "Event #" + i,
                    146L, "INTERVIEW", Map.of()
            ));
        }

        ResponseEntity<Void> response = controller.echoClientLogs(
                null,
                new TelemetryEchoController.ClientLogsBatchDto(events)
        ).block();

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("VP-2: Body > 64 KB returns 413 Payload Too Large")
    void testPayloadTooLargeReturns413() {
        List<TelemetryEchoController.ClientLogEventDto> events = List.of(
                new TelemetryEchoController.ClientLogEventDto(
                        "2026-10-03T01:00:00Z", "info", "TIMER_TRANSITION", "Trace event",
                        146L, "INTERVIEW", Map.of()
                )
        );

        // Content-Length 70000 > 65536
        ResponseEntity<Void> response = controller.echoClientLogs(
                70000L,
                new TelemetryEchoController.ClientLogsBatchDto(events)
        ).block();

        assertNotNull(response);
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
    }

    @Test
    @DisplayName("VP-2: Malformed batch or invalid event tag returns 400 Bad Request")
    void testMalformedBatchReturns400() {
        // Null batch
        ResponseEntity<Void> r1 = controller.echoClientLogs(null, null).block();
        assertNotNull(r1);
        assertEquals(HttpStatus.BAD_REQUEST, r1.getStatusCode());

        // Null events list
        ResponseEntity<Void> r2 = controller.echoClientLogs(null, new TelemetryEchoController.ClientLogsBatchDto(null)).block();
        assertNotNull(r2);
        assertEquals(HttpStatus.BAD_REQUEST, r2.getStatusCode());

        // Blank tag
        List<TelemetryEchoController.ClientLogEventDto> blankTagEvents = List.of(
                new TelemetryEchoController.ClientLogEventDto(
                        "2026-10-03T01:00:00Z", "info", "   ", "Message",
                        146L, "INTERVIEW", Map.of()
                )
        );
        ResponseEntity<Void> r3 = controller.echoClientLogs(null, new TelemetryEchoController.ClientLogsBatchDto(blankTagEvents)).block();
        assertNotNull(r3);
        assertEquals(HttpStatus.BAD_REQUEST, r3.getStatusCode());

        // Message exceeding 512 chars
        List<TelemetryEchoController.ClientLogEventDto> longMsgEvents = List.of(
                new TelemetryEchoController.ClientLogEventDto(
                        "2026-10-03T01:00:00Z", "info", "TIMER_TRANSITION", "x".repeat(600),
                        146L, "INTERVIEW", Map.of()
                )
        );
        ResponseEntity<Void> r4 = controller.echoClientLogs(null, new TelemetryEchoController.ClientLogsBatchDto(longMsgEvents)).block();
        assertNotNull(r4);
        assertEquals(HttpStatus.BAD_REQUEST, r4.getStatusCode());
    }

    @Test
    @DisplayName("VP-2: No repository or Mongo bean anywhere in TelemetryEchoController dependency graph")
    void testNoRepositoryBeansInDependencyGraph() {
        // 1. Inspect fields of TelemetryEchoController class
        Field[] fields = TelemetryEchoController.class.getDeclaredFields();
        for (Field field : fields) {
            String typeName = field.getType().getName().toLowerCase();
            assertFalse(typeName.contains("repository"), "TelemetryEchoController must not depend on any repository");
            assertFalse(typeName.contains("mongo"), "TelemetryEchoController must not depend on Mongo");
        }

        // 2. Inspect applicationContext to verify zero MongoRepository beans exist in the gateway
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        for (String beanName : beanNames) {
            Object bean = applicationContext.getBean(beanName);
            String className = bean.getClass().getName().toLowerCase();
            assertFalse(className.contains("mongorepository"), "Gateway must have zero Mongo repository beans");
        }
    }
}
