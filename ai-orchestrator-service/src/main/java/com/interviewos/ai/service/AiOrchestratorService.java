package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.dto.GenerateQuestionRequest;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import com.interviewos.ai.exception.AiException;
import com.interviewos.ai.util.JsonCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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

        String rawResponse = client.generateCompletion(
                request.modelProvider(),
                systemInstruction,
                userPrompt,
                request.apiKey(),
                request.modelName()
        );

        try {
            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            return objectMapper.readValue(cleanJson, GenerateQuestionResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse GenerateQuestionResponse JSON: {}", rawResponse, e);
            throw new AiException.ResponseParseException(request.modelProvider(), "LLM failed to output valid question JSON schema", e);
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
                Problem Context:
                %s
                
                Candidate Latest Explanation:
                %s
                
                Candidate Code Workspace:
                %s
                
                Evaluate their response and ask your next follow-up question in strict JSON format.
                """.formatted(
                request.questionContext(),
                request.candidateExplanation() != null ? request.candidateExplanation() : "No verbal explanation provided yet.",
                request.candidateCode() != null ? request.candidateCode() : "No code submitted yet."
        );

        String rawResponse = client.generateCompletion(
                request.modelProvider(),
                systemInstruction,
                userPrompt,
                request.apiKey(),
                request.modelName()
        );

        try {
            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            return objectMapper.readValue(cleanJson, AiDialogueResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse AiDialogueResponse JSON: {}", rawResponse, e);
            throw new AiException.ResponseParseException(request.modelProvider(), "LLM failed to output valid dialogue JSON schema", e);
        }
    }
}