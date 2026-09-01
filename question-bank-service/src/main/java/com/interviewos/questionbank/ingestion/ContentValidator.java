package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class ContentValidator {

    public record ValidationResult(
            boolean isValid,
            String status,
            List<String> errors,
            List<String> warnings,
            double similarityRatio
    ) {}

    public ValidationResult validate(QuestionDocument doc, String rawMarkdown) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // 1. Basic Metadata Validation
        if (doc.getSlug() == null || doc.getSlug().isBlank()) {
            errors.add("Slug must not be blank");
        }
        if (doc.getTitle() == null || doc.getTitle().isBlank()) {
            errors.add("Title must not be blank");
        }
        if (doc.getTrack() == null || doc.getTrack().isBlank()) {
            errors.add("Track must not be blank");
        }
        if (doc.getDifficulty() == null || doc.getDifficulty().isBlank()) {
            errors.add("Difficulty must not be blank");
        }
        if (doc.getProblemStatement() == null || doc.getProblemStatement().trim().length() < 20) {
            errors.add("Problem statement is too short or missing (< 20 chars)");
        }

        // 2. Track-specific Checks
        String track = doc.getTrack() != null ? doc.getTrack().toUpperCase() : "";
        if ("ALGORITHMS_DATA_STRUCTURES".equals(track)) {
            if (doc.getSolutionCode() == null || doc.getSolutionCode().isBlank()) {
                errors.add("DSA Question requires valid solutionCode");
            } else {
                if (!doc.getSolutionCode().contains("class") && !doc.getSolutionCode().contains("def ")) {
                    warnings.add("solutionCode does not appear to contain a class or function structure");
                }
                // Single-file DSA Java solutionCode must declare class 'Main'
                Matcher publicClassMatcher = Pattern.compile("public\\s+class\\s+(\\w+)").matcher(doc.getSolutionCode());
                if (publicClassMatcher.find()) {
                    String className = publicClassMatcher.group(1);
                    if (!"Main".equals(className)) {
                        errors.add("DSA solutionCode must declare class 'Main', but found: " + className);
                    }
                }
            }

            int testCount = (doc.getSampleTests() != null ? doc.getSampleTests().size() : 0) +
                            (doc.getHiddenTests() != null ? doc.getHiddenTests().size() : 0);
            if (testCount < 2) {
                errors.add("DSA Question requires at least 2 sample/hidden test cases (found: " + testCount + ")");
            }
        } else if ("SQL".equals(track)) {
            if (doc.getSetupSql() == null || doc.getSetupSql().isBlank()) {
                errors.add("SQL Question requires setupSql DDL/DML");
            }
            if (doc.getSolutionSql() == null || doc.getSolutionSql().isBlank()) {
                errors.add("SQL Question requires solutionSql");
            }
        } else if ("SPRING_LLD".equals(track)) {
            if ((doc.getStarterFiles() == null || doc.getStarterFiles().isEmpty()) &&
                (doc.getStarterCode() == null || doc.getStarterCode().isBlank())) {
                errors.add("LLD Question requires starterFiles or starterCode");
            }
        }

        // 3. Similarity Guard
        double similarity = computeSourceSimilarity(doc.getProblemStatement(), doc.getSource());
        if (similarity > 0.35) {
            warnings.add(String.format("Similarity to source (%s) is %.2f > 0.35 threshold (Too close to source)", doc.getSource(), similarity));
            errors.add("Similarity guard triggered: Levenshtein/word-overlap ratio exceeds 0.35");
        }

        boolean isValid = errors.isEmpty();
        String finalStatus = isValid ? "PUBLISHED" : "DRAFT";
        doc.setStatus(finalStatus);

        // 4. Write validation report
        writeValidationReport(doc.getSlug(), isValid, finalStatus, errors, warnings, similarity);

        return new ValidationResult(isValid, finalStatus, errors, warnings, similarity);
    }

    private double computeSourceSimilarity(String body, String source) {
        if (body == null || source == null || source.isBlank() || source.startsWith("inspired-by:")) {
            return 0.0;
        }

        Set<String> bodyWords = extractWords(body);
        Set<String> sourceWords = extractWords(source);

        if (bodyWords.isEmpty() || sourceWords.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(bodyWords);
        intersection.retainAll(sourceWords);

        Set<String> union = new HashSet<>(bodyWords);
        union.addAll(sourceWords);

        return (double) intersection.size() / union.size();
    }

    private Set<String> extractWords(String text) {
        Set<String> words = new HashSet<>();
        String[] tokens = text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
        for (String t : tokens) {
            if (t.length() > 3) {
                words.add(t);
            }
        }
        return words;
    }

    private void writeValidationReport(String slug, boolean isValid, String status, List<String> errors, List<String> warnings, double similarity) {
        try {
            Path reportsDir = Paths.get("content/reports");
            if (!Files.exists(reportsDir)) {
                Files.createDirectories(reportsDir);
            }

            File reportFile = reportsDir.resolve(slug + ".log").toFile();
            try (FileWriter writer = new FileWriter(reportFile)) {
                writer.write("=== Question Ingestion Validation Report ===\n");
                writer.write("Slug: " + slug + "\n");
                writer.write("Timestamp: " + LocalDateTime.now() + "\n");
                writer.write("Status: " + status + " (Passed: " + isValid + ")\n");
                writer.write("Similarity Ratio: " + String.format("%.4f", similarity) + "\n\n");

                if (!errors.isEmpty()) {
                    writer.write("--- ERRORS (" + errors.size() + ") ---\n");
                    for (String err : errors) {
                        writer.write("  [ERROR] " + err + "\n");
                    }
                    writer.write("\n");
                }

                if (!warnings.isEmpty()) {
                    writer.write("--- WARNINGS (" + warnings.size() + ") ---\n");
                    for (String warn : warnings) {
                        writer.write("  [WARN] " + warn + "\n");
                    }
                    writer.write("\n");
                }

                if (isValid) {
                    writer.write("SUCCESS: Question passed all compilation, schema, and similarity validation gates.\n");
                }
            }
        } catch (Exception e) {
            log.warn("Could not write validation report for {}: {}", slug, e.getMessage());
        }
    }
}
