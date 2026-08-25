package com.interviewos.questionbank.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.dto.QuestionMatchRequest;
import com.interviewos.questionbank.dto.QuestionMatchResponse;
import com.interviewos.questionbank.dto.QuestionPublicView;
import com.interviewos.questionbank.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionMatchService {

    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;

    public QuestionMatchResponse matchQuestion(QuestionMatchRequest request) {
        String track = request.track() != null ? request.track().trim() : "ALGORITHMS_DATA_STRUCTURES";
        String difficulty = request.difficulty() != null ? request.difficulty().trim() : "JUNIOR";

        log.info("Matching question for track: '{}', difficulty: '{}', skills: {}",
                track, difficulty, request.resumeSkills());

        // 1. Retrieve candidates from MongoDB
        List<QuestionDocument> candidates = questionRepository.findByTrackAndDifficultyAndStatus(track, difficulty, "PUBLISHED");
        if (candidates.isEmpty()) {
            candidates = questionRepository.findByTrackAndStatus(track, "PUBLISHED");
        }
        if (candidates.isEmpty()) {
            candidates = questionRepository.findByStatus("PUBLISHED");
        }

        if (candidates.isEmpty()) {
            throw new IllegalStateException("Question bank is empty. Ensure questions are seeded and published.");
        }

        // 2. Deterministic Scoring
        List<ScoredCandidate> scored = scoreCandidates(candidates, request);
        scored.sort(Comparator.comparingDouble(ScoredCandidate::score).reversed());

        int count = (request.count() != null && request.count() > 0) ? request.count() : 1;
        List<QuestionPublicView> topNViews = scored.stream()
                .limit(count)
                .map(ScoredCandidate::doc)
                .map(QuestionPublicView::fromDocument)
                .toList();

        ScoredCandidate topPick = scored.get(0);

        // 3. Optional LLM Re-Ranking among top 5 candidates
        if (request.provider() != null && request.apiKey() != null && !request.apiKey().isBlank() && scored.size() > 1) {
            List<ScoredCandidate> top5 = scored.stream().limit(5).toList();
            Optional<LlmDecision> decision = invokeLlmReranker(top5, request);
            if (decision.isPresent()) {
                LlmDecision d = decision.get();
                QuestionDocument selectedDoc = top5.stream()
                        .map(ScoredCandidate::doc)
                        .filter(doc -> doc.getSlug().equalsIgnoreCase(d.chosenSlug))
                        .findFirst()
                        .orElse(topPick.doc());

                return QuestionMatchResponse.builder()
                        .question(QuestionPublicView.fromDocument(selectedDoc))
                        .questions(topNViews)
                        .rationale(d.rationale)
                        .llmAssisted(true)
                        .build();
            }
        }

        // Deterministic Fallback Output
        String rationale = String.format("Selected '%s' based on track '%s', difficulty '%s', and resume skill alignment.",
                topPick.doc().getTitle(), track, difficulty);

        return QuestionMatchResponse.builder()
                .question(QuestionPublicView.fromDocument(topPick.doc()))
                .questions(topNViews)
                .rationale(rationale)
                .llmAssisted(false)
                .build();
    }

    private List<ScoredCandidate> scoreCandidates(List<QuestionDocument> candidates, QuestionMatchRequest request) {
        Set<String> skills = (request.resumeSkills() != null ? request.resumeSkills() : List.<String>of())
                .stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        String jd = request.jdText() != null ? request.jdText().toLowerCase() : "";

        List<ScoredCandidate> results = new ArrayList<>();
        for (QuestionDocument doc : candidates) {
            double score = 10.0;

            // Tag overlap with resume skills
            if (doc.getTags() != null) {
                for (String tag : doc.getTags()) {
                    if (skills.contains(tag.toLowerCase())) {
                        score += 5.0;
                    }
                }
            }

            // Keyword overlap with JD
            if (!jd.isBlank() && doc.getTitle() != null && jd.contains(doc.getTitle().toLowerCase())) {
                score += 4.0;
            }

            // Difficulty match bonus
            if (request.difficulty() != null && request.difficulty().equalsIgnoreCase(doc.getDifficulty())) {
                score += 3.0;
            }

            results.add(new ScoredCandidate(doc, score));
        }
        return results;
    }

    private Optional<LlmDecision> invokeLlmReranker(List<ScoredCandidate> topCandidates, QuestionMatchRequest req) {
        try {
            String provider = req.provider().toUpperCase();
            String apiKey = req.apiKey().trim();

            StringBuilder prompt = new StringBuilder();
            prompt.append("Select the single best technical interview problem for this candidate from the list below.\n\n");
            prompt.append("Candidate Skills: ").append(req.resumeSkills()).append("\n");
            prompt.append("Target Track: ").append(req.track()).append(", Target Difficulty: ").append(req.difficulty()).append("\n\n");
            prompt.append("Candidate Options:\n");
            for (ScoredCandidate sc : topCandidates) {
                prompt.append(String.format("- Slug: %s | Title: %s | Tags: %s\n",
                        sc.doc().getSlug(), sc.doc().getTitle(), sc.doc().getTags()));
            }
            prompt.append("\nReturn strictly JSON: {\"chosenSlug\": \"slug-here\", \"rationale\": \"One concise sentence why this problem matches candidate background.\"}\n");

            RestClient client = RestClient.builder()
                    .defaultHeader("Accept", "application/json")
                    .build();

            if ("GEMINI".equalsIgnoreCase(provider)) {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
                Map<String, Object> body = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt.toString())))),
                        "generationConfig", Map.of("temperature", 0.1, "responseMimeType", "application/json")
                );

                String rawJson = client.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);

                JsonNode root = objectMapper.readTree(rawJson);
                String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                JsonNode parsed = objectMapper.readTree(cleanJson(text));
                return Optional.of(new LlmDecision(parsed.path("chosenSlug").asText(), parsed.path("rationale").asText()));
            } else if ("GROQ".equalsIgnoreCase(provider) || "OPENAI".equalsIgnoreCase(provider)) {
                String url = "GROQ".equalsIgnoreCase(provider)
                        ? "https://api.groq.com/openai/v1/chat/completions"
                        : "https://api.openai.com/v1/chat/completions";
                String model = "GROQ".equalsIgnoreCase(provider) ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

                Map<String, Object> body = Map.of(
                        "model", model,
                        "messages", List.of(
                                Map.of("role", "system", "content", "You are an expert technical interviewer assistant. Return valid JSON."),
                                Map.of("role", "user", "content", prompt.toString())
                        ),
                        "temperature", 0.1
                );

                String rawJson = client.post()
                        .uri(url)
                        .header("Authorization", "Bearer " + apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);

                JsonNode root = objectMapper.readTree(rawJson);
                String text = root.path("choices").get(0).path("message").path("content").asText();
                JsonNode parsed = objectMapper.readTree(cleanJson(text));
                return Optional.of(new LlmDecision(parsed.path("chosenSlug").asText(), parsed.path("rationale").asText()));
            }

        } catch (Exception e) {
            log.warn("⚠️ LLM question re-ranking skipped/failed: {}. Falling back to deterministic scoring.", e.getMessage());
        }
        return Optional.empty();
    }

    private String cleanJson(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private record ScoredCandidate(QuestionDocument doc, double score) {}
    private record LlmDecision(String chosenSlug, String rationale) {}
}
