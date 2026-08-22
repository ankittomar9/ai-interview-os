package com.interviewos.session.runner;

import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import lombok.extern.slf4j.Slf4j;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class SurefireParser {

    public static List<ExecutionResultResponse.TestCaseResult> parseSurefireXml(String xmlContent) {
        List<ExecutionResultResponse.TestCaseResult> results = new ArrayList<>();
        if (xmlContent == null || xmlContent.isBlank()) {
            return results;
        }

        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // Prevent XXE attacks
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);

            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xmlContent.getBytes(StandardCharsets.UTF_8)));
            doc.getDocumentElement().normalize();

            NodeList testcases = doc.getElementsByTagName("testcase");
            for (int i = 0; i < testcases.getLength(); i++) {
                Element tc = (Element) testcases.item(i);
                String name = tc.getAttribute("name");
                String classname = tc.getAttribute("classname");
                String timeAttr = tc.getAttribute("time");

                double durationMs = 0.0;
                if (timeAttr != null && !timeAttr.isBlank()) {
                    try {
                        durationMs = Double.parseDouble(timeAttr) * 1000.0;
                    } catch (NumberFormatException ignored) {}
                }

                NodeList failures = tc.getElementsByTagName("failure");
                NodeList errors = tc.getElementsByTagName("error");
                NodeList skipped = tc.getElementsByTagName("skipped");

                String status = "PASS";
                String error = null;

                if (failures.getLength() > 0) {
                    status = "FAIL";
                    Element f = (Element) failures.item(0);
                    error = f.getAttribute("message");
                    if (error == null || error.isBlank()) {
                        error = f.getTextContent() != null ? f.getTextContent().trim() : "Assertion Failed";
                    }
                } else if (errors.getLength() > 0) {
                    status = "ERROR";
                    Element e = (Element) errors.item(0);
                    error = e.getAttribute("message");
                    if (error == null || error.isBlank()) {
                        error = e.getTextContent() != null ? e.getTextContent().trim() : "Execution Error";
                    }
                } else if (skipped.getLength() > 0) {
                    status = "SKIPPED";
                }

                results.add(ExecutionResultResponse.TestCaseResult.builder()
                        .name(name != null && !name.isBlank() ? name : classname)
                        .status(status)
                        .durationMs(durationMs)
                        .input("[JUnit 5 Test Fixture]")
                        .expectedOutput("[Assertion Verified]")
                        .actualOutput(status.equals("PASS") ? "[Test Passed]" : (error != null ? error : "[Assertion Failed]"))
                        .error(error)
                        .isHidden(true)
                        .build());
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to parse Surefire report XML: {}", e.getMessage());
        }

        return results;
    }
}
