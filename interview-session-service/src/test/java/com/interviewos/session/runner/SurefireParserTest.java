package com.interviewos.session.runner;

import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SurefireParserTest {

    @Test
    @DisplayName("parseSurefireXml should correctly parse passed testcases")
    void testParsePassedTests() {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <testsuite name="com.example.orderservice.OrderServiceIntegrationTest" time="0.82" tests="3" errors="0" skipped="0" failures="0">
                    <testcase name="testCreateOrderPersistsWithCreatedStatus()" classname="com.example.orderservice.OrderServiceIntegrationTest" time="0.35"/>
                    <testcase name="testDeleteExistingOrderTrue()" classname="com.example.orderservice.OrderServiceIntegrationTest" time="0.12"/>
                    <testcase name="testDeleteMissingOrderFalse()" classname="com.example.orderservice.OrderServiceIntegrationTest" time="0.08"/>
                </testsuite>
                """;

        List<ExecutionResultResponse.TestCaseResult> results = SurefireParser.parseSurefireXml(xml);

        assertEquals(3, results.size());
        assertEquals("testCreateOrderPersistsWithCreatedStatus()", results.get(0).name());
        assertEquals("PASS", results.get(0).status());
        assertEquals(350.0, results.get(0).durationMs());
        assertNull(results.get(0).error());

        assertEquals("testDeleteExistingOrderTrue()", results.get(1).name());
        assertEquals("PASS", results.get(1).status());

        assertEquals("testDeleteMissingOrderFalse()", results.get(2).name());
        assertEquals("PASS", results.get(2).status());
    }

    @Test
    @DisplayName("parseSurefireXml should correctly parse failures and errors")
    void testParseFailuresAndErrors() {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <testsuite name="com.example.orderservice.OrderServiceIntegrationTest" time="0.45" tests="2" errors="1" skipped="0" failures="1">
                    <testcase name="testCreateOrderPersistsWithCreatedStatus()" classname="com.example.orderservice.OrderServiceIntegrationTest" time="0.20">
                        <failure message="expected: &lt;CREATED&gt; but was: &lt;null&gt;" type="org.opentest4j.AssertionFailedError">
                            org.opentest4j.AssertionFailedError: expected: &lt;CREATED&gt; but was: &lt;null&gt;
                        </failure>
                    </testcase>
                    <testcase name="testDeleteMissingOrderFalse()" classname="com.example.orderservice.OrderServiceIntegrationTest" time="0.15">
                        <error message="NullPointerException: orderRepository is null" type="java.lang.NullPointerException">
                            java.lang.NullPointerException: orderRepository is null
                        </error>
                    </testcase>
                </testsuite>
                """;

        List<ExecutionResultResponse.TestCaseResult> results = SurefireParser.parseSurefireXml(xml);

        assertEquals(2, results.size());
        assertEquals("FAIL", results.get(0).status());
        assertTrue(results.get(0).error().contains("expected: <CREATED>"));

        assertEquals("ERROR", results.get(1).status());
        assertTrue(results.get(1).error().contains("NullPointerException"));
    }

    @Test
    @DisplayName("parseSurefireXml should handle empty or null XML safely")
    void testParseEmptyOrNull() {
        assertTrue(SurefireParser.parseSurefireXml(null).isEmpty());
        assertTrue(SurefireParser.parseSurefireXml("").isEmpty());
        assertTrue(SurefireParser.parseSurefireXml("   ").isEmpty());
    }
}
