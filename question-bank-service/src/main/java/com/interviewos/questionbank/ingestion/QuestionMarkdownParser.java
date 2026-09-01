package com.interviewos.questionbank.ingestion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.interviewos.questionbank.document.QuestionDocument;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class QuestionMarkdownParser {

    private final ObjectMapper yamlMapper;
    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile("^---\\s*\\R(.*?)---\\s*\\R(.*)$", Pattern.DOTALL);

    public QuestionMarkdownParser() {
        this.yamlMapper = new ObjectMapper(new YAMLFactory());
        this.yamlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public QuestionDocument parse(String markdownContent, String defaultFilename) {
        if (markdownContent == null || markdownContent.isBlank()) {
            throw new IllegalArgumentException("Markdown content cannot be empty for " + defaultFilename);
        }

        Matcher matcher = FRONTMATTER_PATTERN.matcher(markdownContent);
        if (!matcher.find()) {
            throw new IllegalArgumentException("Invalid Markdown format: Missing '---' YAML frontmatter in " + defaultFilename);
        }

        String yamlBlock = matcher.group(1);
        String bodyBlock = matcher.group(2).trim();

        try {
            Map<String, Object> yamlMap = yamlMapper.readValue(yamlBlock, new TypeReference<Map<String, Object>>() {});

            String slug = getString(yamlMap, "slug", defaultFilename.replace(".md", ""));
            String title = getString(yamlMap, "title", slug);
            String track = getString(yamlMap, "track", "ALGORITHMS_DATA_STRUCTURES");
            String difficulty = getString(yamlMap, "difficulty", "MID");
            String buildProfile = getString(yamlMap, "buildProfile", "judge0");
            String status = getString(yamlMap, "status", "PUBLISHED");
            String source = getString(yamlMap, "source", "CORE");
            String dbEngine = getString(yamlMap, "dbEngine", "postgres-13");
            String starterCode = getString(yamlMap, "starterCode", null);
            String solutionCode = getString(yamlMap, "solutionCode", null);
            String solutionSql = getString(yamlMap, "solutionSql", null);
            String setupSql = getString(yamlMap, "setupSql", null);
            String schemaMarkdown = getString(yamlMap, "schemaMarkdown", null);
            String expectedCsv = getString(yamlMap, "expectedCsv", null);
            String editorial = getString(yamlMap, "editorial", null);
            boolean ordered = getBoolean(yamlMap, "ordered", false);

            List<String> tags = getStringList(yamlMap, "tags");
            List<String> hints = getStringList(yamlMap, "hints");
            List<String> evaluationCriteria = getStringList(yamlMap, "evaluationCriteria");
            List<String> constraints = getStringList(yamlMap, "constraints");
            List<String> editablePaths = getStringList(yamlMap, "editablePaths");

            Map<String, String> starterCodeMap = getStringMap(yamlMap, "starterCodeMap");
            Map<String, String> starterFiles = getStringMap(yamlMap, "starterFiles");
            Map<String, String> solutionFiles = getStringMap(yamlMap, "solutionFiles");

            List<QuestionDocument.TestCase> sampleTests = parseSampleTests(yamlMap.get("sampleTests"));
            List<QuestionDocument.HiddenTestCase> hiddenTests = parseHiddenTests(yamlMap.get("hiddenTests"));

            QuestionDocument.CoachingContent coaching = parseCoaching(yamlMap.get("coaching"));
            QuestionDocument.ExecutionLimits limits = parseLimits(yamlMap.get("limits"));
            QuestionDocument.InterviewerNotes interviewerNotes = parseInterviewerNotes(yamlMap.get("interviewerNotes"));

            return QuestionDocument.builder()
                    .slug(slug)
                    .title(title)
                    .track(track)
                    .difficulty(difficulty)
                    .tags(tags)
                    .problemStatement(bodyBlock.isEmpty() ? title : bodyBlock)
                    .starterCode(starterCode)
                    .starterCodeMap(starterCodeMap)
                    .starterFiles(starterFiles)
                    .editablePaths(editablePaths)
                    .sampleTests(sampleTests)
                    .hiddenTests(hiddenTests)
                    .buildProfile(buildProfile)
                    .dbEngine(dbEngine)
                    .setupSql(setupSql)
                    .schemaMarkdown(schemaMarkdown)
                    .expectedCsv(expectedCsv)
                    .ordered(ordered)
                    .solutionCode(solutionCode)
                    .solutionFiles(solutionFiles)
                    .solutionSql(solutionSql)
                    .hints(hints)
                    .editorialMarkdown(editorial)
                    .evaluationCriteria(evaluationCriteria.isEmpty() ? List.of("Correctness", "Time Complexity", "Clean Code") : evaluationCriteria)
                    .constraints(constraints)
                    .coaching(coaching)
                    .limits(limits != null ? limits : new QuestionDocument.ExecutionLimits(256, 3000))
                    .interviewerNotes(interviewerNotes)
                    .status(status)
                    .source(source)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse YAML frontmatter in {}: {}", defaultFilename, e.getMessage());
            throw new RuntimeException("YAML Frontmatter parse error in " + defaultFilename + ": " + e.getMessage(), e);
        }
    }

    private String getString(Map<String, Object> map, String key, String defaultVal) {
        Object val = map.get(key);
        return val != null ? val.toString().trim() : defaultVal;
    }

    private boolean getBoolean(Map<String, Object> map, String key, boolean defaultVal) {
        Object val = map.get(key);
        if (val instanceof Boolean b) return b;
        if (val != null) return Boolean.parseBoolean(val.toString());
        return defaultVal;
    }

    @SuppressWarnings("unchecked")
    private List<String> getStringList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> getStringMap(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Map<?, ?> m) {
            Map<String, String> res = new HashMap<>();
            m.forEach((k, v) -> res.put(k.toString(), v != null ? v.toString() : ""));
            return res;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private List<QuestionDocument.TestCase> parseSampleTests(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        List<QuestionDocument.TestCase> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                String name = m.get("name") != null ? m.get("name").toString() : "Sample Test";
                String input = m.get("input") != null ? m.get("input").toString() : "";
                String expected = m.get("expectedOutput") != null ? m.get("expectedOutput").toString() : "";
                String desc = m.get("description") != null ? m.get("description").toString() : null;
                result.add(new QuestionDocument.TestCase(name, input, expected, desc));
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<QuestionDocument.HiddenTestCase> parseHiddenTests(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        List<QuestionDocument.HiddenTestCase> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                String name = m.get("name") != null ? m.get("name").toString() : "Hidden Test";
                String input = m.get("input") != null ? m.get("input").toString() : "";
                String expected = m.get("expectedOutput") != null ? m.get("expectedOutput").toString() : "";
                int weight = 10;
                if (m.get("weight") instanceof Number n) {
                    weight = n.intValue();
                }
                result.add(new QuestionDocument.HiddenTestCase(name, input, expected, weight));
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private QuestionDocument.CoachingContent parseCoaching(Object obj) {
        if (!(obj instanceof Map<?, ?> m)) return null;
        List<String> commonMistakes = m.get("commonMistakes") instanceof List<?> l ? l.stream().map(Object::toString).toList() : List.of();
        List<String> presentationTips = m.get("presentationTips") instanceof List<?> l ? l.stream().map(Object::toString).toList() : List.of();
        String outline = m.get("modelAnswerOutline") != null ? m.get("modelAnswerOutline").toString() : null;
        String approachHint = m.get("approachHint") != null ? m.get("approachHint").toString() : null;
        return new QuestionDocument.CoachingContent(commonMistakes, outline, presentationTips, approachHint);
    }

    private QuestionDocument.ExecutionLimits parseLimits(Object obj) {
        if (!(obj instanceof Map<?, ?> m)) return null;
        int memoryMb = m.get("memoryLimitMb") instanceof Number n ? n.intValue() : 256;
        int timeLimitMs = m.get("timeLimitMs") instanceof Number n ? n.intValue() : 3000;
        return new QuestionDocument.ExecutionLimits(memoryMb, timeLimitMs);
    }

    @SuppressWarnings("unchecked")
    private QuestionDocument.InterviewerNotes parseInterviewerNotes(Object obj) {
        if (!(obj instanceof Map<?, ?> m)) return null;
        List<String> concepts = m.get("expectedConcepts") instanceof List<?> l ? l.stream().map(Object::toString).toList() : List.of();
        List<String> seeds = m.get("followUpSeeds") instanceof List<?> l ? l.stream().map(Object::toString).toList() : List.of();
        List<String> checkpoints = m.get("rubricCheckpoints") instanceof List<?> l ? l.stream().map(Object::toString).toList() : List.of();
        return new QuestionDocument.InterviewerNotes(concepts, seeds, checkpoints);
    }
}
