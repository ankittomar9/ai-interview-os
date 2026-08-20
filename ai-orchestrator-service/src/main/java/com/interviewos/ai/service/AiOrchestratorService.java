package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.dto.GenerateQuestionRequest;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import com.interviewos.ai.model.DifficultyLevel;
import com.interviewos.ai.model.InterviewTrack;
import com.interviewos.ai.util.JsonCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestratorService {

    private final AiClientFactory clientFactory;
    private final ObjectMapper objectMapper;

    /**
     * Generates a tailored interview question based on the role and track.
     */
    public GenerateQuestionResponse generateQuestion(GenerateQuestionRequest request) {
        AiClient client = clientFactory.getClient(request.modelProvider());

        String systemInstruction = """
                You are a Principal Software Engineer and Staff Technical Interviewer at a Tier-1 tech company.
                Generate a realistic, challenging technical interview question tailored to the candidate's track and seniority.
                
                CRITICAL INSTRUCTION: You MUST reply ONLY with a valid raw JSON object matching this schema with NO conversational text:
                {
                  "title": "Short problem title",
                  "track": "%s",
                  "difficulty": "%s",
                  "problemStatement": "Detailed description, constraints, and 2-3 examples with Input/Output",
                  "starterCode": "Initial starter code snippet in Java/Python/JS",
                  "hints": ["Hint 1: Conceptual hint", "Hint 2: Edge case to consider"],
                  "evaluationCriteria": ["Time & space complexity", "Concurrency/Edge cases", "Code cleanliness"]
                }
                """.formatted(request.track(), request.difficulty());

        String userPrompt = """
                Target Role: %s
                Seniority: %s
                Interview Track: %s
                Target Job Description Context: %s
                Previously Asked Questions to Avoid: %s
                
                Generate a fresh, high-signal interview question now in strict JSON format.
                """.formatted(
                request.roleTitle(),
                request.difficulty(),
                request.track(),
                request.jobDescription() != null ? request.jobDescription() : "Standard Enterprise Tech Profile",
                request.previousQuestions() != null ? request.previousQuestions() : "None"
        );

        try {
            String rawResponse = client.generateCompletion(
                    request.modelProvider(),
                    systemInstruction,
                    userPrompt,
                    request.apiKey(),
                    request.modelName()
            );

            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            return objectMapper.readValue(cleanJson, GenerateQuestionResponse.class);
        } catch (Exception e) {
            log.warn("⚠️ LLM JSON extraction warning for provider {}: {}. Generating resilient curated problem...",
                    request.modelProvider(), e.getMessage());
            return generateCuratedFallbackQuestion(request.track(), request.difficulty(), request.roleTitle());
        }
    }

    /**
     * Handles live conversational dialogue, probing follow-up questions, and code review.
     */
    public AiDialogueResponse processDialogue(AiDialogueRequest request) {
        AiClient client = clientFactory.getClient(request.modelProvider());

        String systemInstruction = """
                You are an empathetic yet rigorous Senior Technical Interviewer conducting a live interview.
                Assess the candidate's explanation and code submission against the problem context.
                
                CRITICAL INSTRUCTION: You MUST reply ONLY with a valid raw JSON object matching this schema:
                {
                  "interviewerReply": "Direct conversational feedback acknowledging what they said/coded",
                  "followUpQuestion": "A sharp technical follow-up (e.g. edge case, scaling, or complexity optimization)",
                  "isSolutionComplete": true/false,
                  "codeAnalysis": "Short evaluation of time/space complexity or code quality",
                  "keyStrengths": ["Strength 1", "Strength 2"],
                  "areasToImprove": ["Area 1"]
                }
                """;

        String userPrompt = """
                Problem Context: %s
                Candidate Explanation: %s
                Candidate Code Snippet:
                %s
                
                Provide your evaluation and follow-up question now in JSON.
                """.formatted(
                request.questionContext(),
                request.candidateExplanation() != null ? request.candidateExplanation() : "Candidate provided initial thoughts.",
                request.candidateCode() != null ? request.candidateCode() : "No code submitted yet."
        );

        try {
            String rawResponse = client.generateCompletion(
                    request.modelProvider(),
                    systemInstruction,
                    userPrompt,
                    request.apiKey(),
                    request.modelName()
            );

            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            return objectMapper.readValue(cleanJson, AiDialogueResponse.class);
        } catch (Exception e) {
            log.warn("⚠️ Dialogue fallback triggered: {}", e.getMessage());
            return new AiDialogueResponse(
                    "Thank you for sharing your approach. I see your logic taking shape.",
                    "How would you optimize this solution for higher concurrent throughput or handle edge cases where input is empty or scaled to 10M records?",
                    false,
                    "Algorithmic structure looks promising. Focus on time/space trade-offs and boundary condition validation.",
                    List.of("Clear communicative thought process", "Structured problem breakdown"),
                    List.of("Explicit Big-O complexity analysis", "Edge-case error handling")
            );
        }
    }

    private GenerateQuestionResponse generateCuratedFallbackQuestion(
            InterviewTrack track,
            DifficultyLevel difficulty,
            String roleTitle
    ) {
        if (track == InterviewTrack.SYSTEM_DESIGN) {
            return new GenerateQuestionResponse(
                    "Design a High-Throughput Distributed Rate Limiter",
                    track,
                    difficulty,
                    """
                    ### Problem Statement
                    Design a distributed Rate Limiter service that can handle 100,000 requests per second across a cluster of API Gateways.
                    
                    ### Functional Requirements
                    - Support per-user / per-IP rate limits (e.g., max 100 requests per minute).
                    - Return HTTP 429 Too Many Requests with Retry-After header when exceeded.
                    - Low latency (< 2ms evaluation overhead per request).
                    
                    ### Architectural Questions to Address
                    1. Which rate limiting algorithm (Token Bucket, Leaky Bucket, Sliding Window Log, Sliding Window Counter) would you choose and why?
                    2. How will you store and synchronize token states across multiple distributed instances without race conditions?
                    3. How do you handle Redis cache failures gracefully?
                    """,
                    """
                    // Architectural Interface Draft
                    public interface RateLimiter {
                        boolean allowRequest(String clientId, int maxRequests, long windowMillis);
                    }
                    """,
                    List.of("Consider Redis EVAL scripts or Lua scripts for atomic increments.", "Think about local memory caching with batch sync to reduce Redis hops."),
                    List.of("Distributed state consistency", "CAP theorem latency trade-offs", "Thread-safety")
            );
        }

        // Default DSA / Java problem
        return new GenerateQuestionResponse(
                "Implement an In-Memory LRU Cache with O(1) Operations",
                track != null ? track : InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                difficulty != null ? difficulty : DifficultyLevel.SENIOR,
                """
                ### Problem Statement
                Design and implement a data structure for a Least Recently Used (LRU) Cache with capacity `capacity`.
                
                ### Constraints & Operations
                - `int get(int key)`: Return value of key if key exists, otherwise return `-1`.
                - `void put(int key, int value)`: Update or insert value. If keys exceed capacity, evict the least recently used key.
                - Both operations MUST run in `O(1)` average time complexity.
                
                ### Example
                Input:
                LRUCache cache = new LRUCache(2);
                cache.put(1, 1);
                cache.put(2, 2);
                cache.get(1);    // returns 1
                cache.put(3, 3); // evicts key 2
                cache.get(2);    // returns -1 (not found)
                """,
                """
                class LRUCache {
                    public LRUCache(int capacity) {
                        // Initialize your data structure here
                    }
                    
                    public int get(int key) {
                        return -1;
                    }
                    
                    public void put(int key, int value) {
                        // Your code here
                    }
                }
                """,
                List.of("Use a HashMap combined with a Doubly Linked List for O(1) lookups and O(1) removals.", "Keep track of head and tail dummy pointers to avoid null checks."),
                List.of("O(1) Time Complexity", "Correct eviction under capacity limits", "Null safety")
        );
    }
}