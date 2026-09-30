package com.interviewos.questionbank.ingestion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.document.ReferenceSolution;
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
            List<String> topics = getStringList(yamlMap, "topics");
            Integer estMinutes = getInteger(yamlMap, "est_minutes");
            if (estMinutes == null) {
                estMinutes = getInteger(yamlMap, "estMinutes");
            }
            String solutionVideoUrl = getString(yamlMap, "solution_video_url", getString(yamlMap, "solutionVideoUrl", null));

            List<String> hints = getStringList(yamlMap, "hints");
            List<String> evaluationCriteria = getStringList(yamlMap, "evaluationCriteria");
            List<String> constraints = getStringList(yamlMap, "constraints");
            List<String> editablePaths = getStringList(yamlMap, "editablePaths");

            Map<String, String> starterCodeMap = getStringMap(yamlMap, "starterCodeMap");
            Map<String, String> starterFiles = getStringMap(yamlMap, "starterFiles");
            Map<String, String> solutionFiles = getStringMap(yamlMap, "solutionFiles");
            Map<String, String> hiddenTestFiles = getStringMap(yamlMap, "hiddenTestFiles");

            List<QuestionDocument.TestCase> sampleTests = parseSampleTests(yamlMap.get("sampleTests"));
            List<QuestionDocument.HiddenTestCase> hiddenTests = parseHiddenTests(yamlMap.get("hiddenTests"));

            QuestionDocument.CoachingContent coaching = parseCoaching(yamlMap.get("coaching"));
            QuestionDocument.ExecutionLimits limits = parseLimits(yamlMap.get("limits"));
            QuestionDocument.InterviewerNotes interviewerNotes = parseInterviewerNotes(yamlMap.get("interviewerNotes"));
            List<QuestionDocument.ResourceItem> resources = parseResources(yamlMap.get("resources"));
            List<ReferenceSolution> referenceSolutions = parseReferenceSolutions(yamlMap.get("referenceSolutions"), slug);
            if (referenceSolutions != null && !referenceSolutions.isEmpty()) {
                Optional<ReferenceSolution> primary = referenceSolutions.stream()
                        .filter(a -> a.approachClass() == ReferenceSolution.ApproachClass.PRIMARY)
                        .findFirst();
                if (primary.isPresent()) {
                    ReferenceSolution p = primary.get();
                    if (solutionCode == null && p.kind() == ReferenceSolution.Kind.CODE && p.code() != null) {
                        solutionCode = p.code();
                    }
                    if (solutionFiles == null && p.kind() == ReferenceSolution.Kind.CODE && p.files() != null) {
                        solutionFiles = p.files();
                    }
                    if (solutionSql == null && p.kind() == ReferenceSolution.Kind.SQL && p.sql() != null) {
                        solutionSql = p.sql();
                    }
                }
            }

            return QuestionDocument.builder()
                    .slug(slug)
                    .title(title)
                    .track(track)
                    .difficulty(difficulty)
                    .topics(topics)
                    .estMinutes(estMinutes)
                    .solutionVideoUrl(solutionVideoUrl)
                    .tags(tags)
                    .problemStatement(bodyBlock.isEmpty() ? title : bodyBlock)
                    .starterCode(starterCode)
                    .starterCodeMap(starterCodeMap)
                    .starterFiles(starterFiles)
                    .editablePaths(editablePaths)
                    .hiddenTestFiles(hiddenTestFiles)
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
                    .referenceSolutions(referenceSolutions)
                    .hints(hints)
                    .editorialMarkdown(editorial)
                    .evaluationCriteria(evaluationCriteria.isEmpty() ? List.of("Correctness", "Time Complexity", "Clean Code") : evaluationCriteria)
                    .constraints(constraints)
                    .coaching(coaching)
                    .resources(resources)
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

    private Integer getInteger(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key)) return null;
        Object val = map.get(key);
        if (val instanceof Number n) return n.intValue();
        if (val != null) {
            try {
                return Integer.parseInt(val.toString().trim());
            } catch (NumberFormatException ignored) {}
        }
        return null;
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

    @SuppressWarnings("unchecked")
    private List<QuestionDocument.ResourceItem> parseResources(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        List<QuestionDocument.ResourceItem> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                String label = m.get("label") != null ? m.get("label").toString().trim() : "";
                String url = m.get("url") != null ? m.get("url").toString().trim() : "";
                if (!label.isBlank() && !url.isBlank()) {
                    result.add(new QuestionDocument.ResourceItem(label, url));
                }
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<ReferenceSolution> parseReferenceSolutions(Object obj, String slug) {
        if (obj == null) {
            return null;
        }
        if (!(obj instanceof List<?> list)) {
            throw new IllegalArgumentException("referenceSolutions in slug " + slug + " must be a YAML list");
        }
        if (list.isEmpty()) {
            throw new IllegalArgumentException("missing or multiple PRIMARY approaches in slug " + slug + ": expected exactly 1, found 0");
        }

        List<ReferenceSolution> approaches = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();
        int primaryCount = 0;

        for (Object item : list) {
            if (!(item instanceof Map<?, ?> m)) {
                throw new IllegalArgumentException("Each referenceSolution in slug " + slug + " must be a map");
            }

            // approachId
            String approachId = m.get("approachId") != null ? m.get("approachId").toString().trim() : null;
            if (approachId == null || approachId.isBlank() || !approachId.matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")) {
                throw new IllegalArgumentException("Invalid or missing approachId '" + approachId + "' in slug " + slug + ": must be kebab-case");
            }
            if (seenIds.contains(approachId)) {
                throw new IllegalArgumentException("duplicate approachId '" + approachId + "' in slug " + slug);
            }
            seenIds.add(approachId);

            // label
            String label = m.get("label") != null ? m.get("label").toString().trim() : null;
            if (label == null || label.isBlank()) {
                throw new IllegalArgumentException("missing label for approach '" + approachId + "' in slug " + slug);
            }

            // approachClass
            String rawClass = m.get("approachClass") != null ? m.get("approachClass").toString().trim() : null;
            if (rawClass == null) {
                throw new IllegalArgumentException("unknown approachClass 'null' in slug " + slug);
            }
            ReferenceSolution.ApproachClass approachClass;
            try {
                approachClass = ReferenceSolution.ApproachClass.valueOf(rawClass.toUpperCase());
            } catch (Exception ex) {
                throw new IllegalArgumentException("unknown approachClass '" + rawClass + "' in slug " + slug);
            }
            if (approachClass == ReferenceSolution.ApproachClass.PRIMARY) {
                primaryCount++;
            }

            // kind
            String rawKind = m.get("kind") != null ? m.get("kind").toString().trim() : null;
            if (rawKind == null) {
                throw new IllegalArgumentException("unknown kind 'null' in slug " + slug);
            }
            ReferenceSolution.Kind kind;
            try {
                kind = ReferenceSolution.Kind.valueOf(rawKind.toUpperCase());
            } catch (Exception ex) {
                throw new IllegalArgumentException("unknown kind '" + rawKind + "' in slug " + slug);
            }

            // Payloads
            String code = m.get("code") != null ? m.get("code").toString() : null;
            Map<String, String> files = null;
            if (m.get("files") instanceof Map<?, ?> fMap) {
                files = new HashMap<>();
                for (Map.Entry<?, ?> entry : fMap.entrySet()) {
                    files.put(entry.getKey().toString(), entry.getValue() != null ? entry.getValue().toString() : "");
                }
            }
            String sql = m.get("sql") != null ? m.get("sql").toString() : null;
            String writeUp = m.get("writeUp") != null ? m.get("writeUp").toString() : (m.get("write_up") != null ? m.get("write_up").toString() : null);
            String diagramNotes = m.get("diagramNotes") != null ? m.get("diagramNotes").toString() : (m.get("diagram_notes") != null ? m.get("diagram_notes").toString() : null);

            String timeComplexity = m.get("timeComplexity") != null ? m.get("timeComplexity").toString().trim() : (m.get("time_complexity") != null ? m.get("time_complexity").toString().trim() : null);
            String spaceComplexity = m.get("spaceComplexity") != null ? m.get("spaceComplexity").toString().trim() : (m.get("space_complexity") != null ? m.get("space_complexity").toString().trim() : null);

            // Validate payload matching kind
            if (kind == ReferenceSolution.Kind.CODE) {
                boolean hasCode = code != null && !code.isBlank();
                boolean hasFiles = files != null && !files.isEmpty();
                boolean hasSql = sql != null && !sql.isBlank();
                boolean hasWriteUp = writeUp != null && !writeUp.isBlank();

                if (hasSql || hasWriteUp || (hasCode && hasFiles) || (!hasCode && !hasFiles)) {
                    throw new IllegalArgumentException("kind/payload mismatch: CODE approach '" + approachId + "' in slug " + slug + " must specify exactly one of code or files");
                }
                if (timeComplexity == null || timeComplexity.isBlank() || spaceComplexity == null || spaceComplexity.isBlank()) {
                    throw new IllegalArgumentException("missing timeComplexity or spaceComplexity for CODE approach '" + approachId + "' in slug " + slug);
                }
            } else if (kind == ReferenceSolution.Kind.SQL) {
                boolean hasCode = code != null && !code.isBlank();
                boolean hasFiles = files != null && !files.isEmpty();
                boolean hasSql = sql != null && !sql.isBlank();
                boolean hasWriteUp = writeUp != null && !writeUp.isBlank();

                if (!hasSql || hasCode || hasFiles || hasWriteUp) {
                    throw new IllegalArgumentException("kind/payload mismatch: SQL approach '" + approachId + "' in slug " + slug + " must specify sql");
                }
                if (timeComplexity == null || timeComplexity.isBlank() || spaceComplexity == null || spaceComplexity.isBlank()) {
                    throw new IllegalArgumentException("missing timeComplexity or spaceComplexity for SQL approach '" + approachId + "' in slug " + slug);
                }
            } else if (kind == ReferenceSolution.Kind.WRITEUP) {
                boolean hasCode = code != null && !code.isBlank();
                boolean hasFiles = files != null && !files.isEmpty();
                boolean hasSql = sql != null && !sql.isBlank();
                boolean hasWriteUp = writeUp != null && !writeUp.isBlank();

                if (!hasWriteUp || hasCode || hasFiles || hasSql) {
                    throw new IllegalArgumentException("kind/payload mismatch: WRITEUP approach '" + approachId + "' in slug " + slug + " must specify writeUp");
                }
            }

            String summary = m.get("summary") != null ? m.get("summary").toString().trim() : "";
            String keyIdea = m.get("keyIdea") != null ? m.get("keyIdea").toString().trim() : "";
            String whenToUse = m.get("whenToUse") != null ? m.get("whenToUse").toString().trim() : "";
            List<String> tradeoffs = new ArrayList<>();
            if (m.get("tradeoffs") instanceof List<?> tList) {
                for (Object t : tList) {
                    if (t != null) tradeoffs.add(t.toString());
                }
            }

            approaches.add(ReferenceSolution.builder()
                    .approachId(approachId)
                    .label(label)
                    .approachClass(approachClass)
                    .kind(kind)
                    .summary(summary)
                    .keyIdea(keyIdea)
                    .timeComplexity(timeComplexity)
                    .spaceComplexity(spaceComplexity)
                    .tradeoffs(tradeoffs)
                    .whenToUse(whenToUse)
                    .code(code)
                    .files(files)
                    .sql(sql)
                    .writeUp(writeUp)
                    .diagramNotes(diagramNotes)
                    .build());
        }

        if (primaryCount != 1) {
            throw new IllegalArgumentException("missing or multiple PRIMARY approaches in slug " + slug + ": expected exactly 1, found " + primaryCount);
        }

        return approaches;
    }
}
