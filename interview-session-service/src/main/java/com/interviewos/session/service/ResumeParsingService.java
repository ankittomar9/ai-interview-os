package com.interviewos.session.service;

import com.interviewos.session.document.ResumeDocument;
import com.interviewos.session.repository.ResumeMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeParsingService {

    private final ResumeMongoRepository resumeRepository;
    private final Map<String, ResumeDocument> inMemoryResumes = new ConcurrentHashMap<>();

    private static final Set<String> TECH_DICTIONARY = Set.of(
            "Java", "Java 21", "Spring Boot", "Spring Cloud", "Microservices", "Kafka", "Redis",
            "PostgreSQL", "MySQL", "MongoDB", "Cassandra", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
            "GraphQL", "REST API", "gRPC", "Elasticsearch", "RabbitMQ", "Distributed Systems", "Netty",
            "Multi-threading", "Concurrency", "High Throughput", "Low Latency", "System Design", "Python",
            "React", "TypeScript", "Node.js", "CI/CD", "Terraform", "OAuth2", "JWT", "Prometheus", "Grafana",
            "SQL", "Git", "Linux", "CI", "CD", "Agile", "Scrum"
    );

    /**
     * Ingests a candidate resume from an uploaded Multipart file (PDF or Text).
     */
    public ResumeDocument parseAndSaveResume(
            String candidateId,
            String candidateName,
            String resumeTitle,
            MultipartFile file
    ) throws IOException {
        String rawText;
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";

        if (fileName.toLowerCase().endsWith(".pdf")) {
            rawText = extractTextFromPdf(file.getBytes());
        } else {
            rawText = new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        return processAndPersist(candidateId, candidateName, resumeTitle, fileName, rawText);
    }

    /**
     * Ingests a candidate resume from plain pasted text.
     */
    public ResumeDocument parseAndSaveText(
            String candidateId,
            String candidateName,
            String resumeTitle,
            String resumeText
    ) {
        return processAndPersist(candidateId, candidateName, resumeTitle, "pasted-resume.txt", resumeText != null ? resumeText : "");
    }

    private ResumeDocument processAndPersist(
            String candidateId,
            String candidateName,
            String resumeTitle,
            String fileName,
            String rawText
    ) {
        log.info("📄 Ingesting resume for Candidate: {} ({}), File: {}, Length: {} chars",
                candidateName, candidateId, fileName, rawText.length());

        List<String> detectedSkills = extractSkills(rawText);
        List<String> projectHighlights = extractProjectHighlights(rawText);
        Integer expYears = estimateExperience(rawText);
        String summary = generateQuickSummary(candidateName, expYears, detectedSkills, projectHighlights);

        int charCount = rawText.length();
        int wordCount = rawText.trim().isEmpty() ? 0 : rawText.trim().split("\\s+").length;

        ResumeDocument document = ResumeDocument.builder()
                .candidateId(candidateId)
                .candidateName(candidateName)
                .resumeTitle(resumeTitle != null && !resumeTitle.isBlank() ? resumeTitle : "Primary Technical Resume")
                .fileName(fileName)
                .rawText(rawText)
                .skills(detectedSkills)
                .projectExperiences(projectHighlights)
                .yearsOfExperience(expYears)
                .characterCount(charCount)
                .wordCount(wordCount)
                .summary(summary)
                .uploadedAt(LocalDateTime.now())
                .build();

        ResumeDocument saved;
        try {
            saved = resumeRepository.save(document);
            log.info("✅ Resume persisted in MongoDB with ID: {} | Skills detected: {}", saved.getId(), detectedSkills);
        } catch (Exception e) {
            log.warn("⚠️ MongoDB save warning (using in-memory resilience): {}", e.getMessage());
            document.setId("res-" + UUID.randomUUID().toString().substring(0, 8));
            inMemoryResumes.put(document.getId(), document);
            saved = document;
        }

        return saved;
    }

    private String extractTextFromPdf(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String extracted = stripper.getText(document);
            if (extracted != null && !extracted.isBlank()) {
                return extracted;
            }
        } catch (Exception e) {
            log.warn("⚠️ PDFBox extraction note: {}. Falling back to byte inspection.", e.getMessage());
        }
        return new String(pdfBytes, StandardCharsets.ISO_8859_1);
    }

    private List<String> extractSkills(String text) {
        Set<String> skills = new LinkedHashSet<>();
        String lower = text.toLowerCase();

        for (String tech : TECH_DICTIONARY) {
            Pattern pattern = Pattern.compile("(?i)\\b" + Pattern.quote(tech) + "\\b");
            if (pattern.matcher(lower).find()) {
                skills.add(tech);
            }
        }
        // If empty, add a sensible default
        if (skills.isEmpty()) {
            skills.add("Java 21");
            skills.add("Spring Boot");
            skills.add("Microservices");
        }
        return new ArrayList<>(skills);
    }

    private List<String> extractProjectHighlights(String text) {
        List<String> highlights = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        for (String line : lines) {
            String trimmed = line.trim();
            if ((trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) && trimmed.length() > 25) {
                highlights.add(trimmed.substring(1).trim());
                if (highlights.size() >= 6) break;
            }
        }
        return highlights;
    }

    private Integer estimateExperience(String text) {
        Pattern pattern = Pattern.compile("(\\d+)\\+?\\s*(?:years?|yrs?)\\s*(?:of)?\\s*experience", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {}
        }
        return 4; // Default reasonable baseline
    }

    private String generateQuickSummary(String name, Integer exp, List<String> skills, List<String> projects) {
        return String.format(
                "Candidate %s has ~%d years of experience specializing in %s. Highlighted past systems include: %s.",
                name, exp,
                String.join(", ", skills.subList(0, Math.min(5, skills.size()))),
                projects.isEmpty() ? "Distributed microservices & backend architecture" : projects.get(0)
        );
    }
}
