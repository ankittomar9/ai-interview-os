package com.interviewos.ai.util;

import com.interviewos.ai.dto.TranscriptTurnDto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Pure, unit-testable builder that constructs conversation memory and adaptive directives.
 */
public class DialogueMemoryBuilder {

    public record MemoryView(
            String recentVerbatim,
            String runningSummary,
            List<String> intentHistory,
            int stuckCount,
            String previousIntent,
            String currentIntentHint,
            String adaptiveDirective
    ) {}

    public static MemoryView buildMemory(List<TranscriptTurnDto> turns, String currentCandidateText, String coachingMistakesHint) {
        if (turns == null) {
            turns = List.of();
        }

        // 1. Recent Verbatim: last 3 turns (candidate + AI) verbatim, truncated to 400 chars each
        StringBuilder verbatimSb = new StringBuilder();
        int startIdx = Math.max(0, turns.size() - 3);
        for (int i = startIdx; i < turns.size(); i++) {
            TranscriptTurnDto t = turns.get(i);
            String role = t.senderRole() != null ? t.senderRole() : "UNKNOWN";
            String msgType = t.messageType() != null ? t.messageType() : "MESSAGE";
            String content = t.content() != null ? t.content() : "";
            if (content.length() > 400) {
                content = content.substring(0, 400) + "... [truncated]";
            }
            verbatimSb.append(String.format("- [%s | %s]: %s\n", role, msgType, content));
        }
        String recentVerbatim = verbatimSb.length() > 0 ? verbatimSb.toString().trim() : "None";

        // 2. Running summary: join of all AI-turn metadata.turnSummary ("So far: ...")
        List<String> summaries = new ArrayList<>();
        List<String> intents = new ArrayList<>();

        for (TranscriptTurnDto t : turns) {
            Map<String, String> meta = t.metadata();
            if (meta != null) {
                String sum = meta.get("turnSummary");
                if (sum != null && !sum.isBlank()) {
                    summaries.add(sum.trim());
                }
                String intent = meta.get("detectedIntent");
                if (intent != null && !intent.isBlank()) {
                    intents.add(intent.trim());
                }
            }
        }

        String runningSummary = summaries.isEmpty() ? "n/a" : "So far: " + String.join("; ", summaries);

        // 3. Intent history (tail 6)
        List<String> intentTail = intents.size() > 6 ? intents.subList(intents.size() - 6, intents.size()) : intents;

        // 4. Stuck count: consecutive STUCK intents ending at previous turn
        int stuckCount = 0;
        for (int i = intents.size() - 1; i >= 0; i--) {
            if ("STUCK".equalsIgnoreCase(intents.get(i))) {
                stuckCount++;
            } else {
                break;
            }
        }

        String previousIntent = intents.isEmpty() ? null : intents.get(intents.size() - 1);

        // 5. Current Intent Hint heuristic based on candidate text
        String currentIntentHint = null;
        if (currentCandidateText != null) {
            String trimmed = currentCandidateText.trim().toLowerCase();
            if (trimmed.endsWith("?") || trimmed.startsWith("can i") || trimmed.startsWith("should i") ||
                trimmed.startsWith("is it allowed") || trimmed.startsWith("what if") || trimmed.startsWith("are there") ||
                trimmed.startsWith("does it") || trimmed.contains("clarify") || trimmed.contains("clarification")) {
                currentIntentHint = "CLARIFYING";
            } else if (trimmed.contains("i am stuck") || trimmed.contains("i'm stuck") || trimmed.contains("don't know") ||
                       trimmed.contains("dont know") || trimmed.contains("lost") || trimmed.contains("confused")) {
                currentIntentHint = "STUCK";
            }
        }

        // 6. Adaptive Directive assembly
        String adaptiveDirective;
        if (stuckCount >= 2) {
            String hintContent = coachingMistakesHint != null && !coachingMistakesHint.isBlank()
                    ? " Targeted coaching guidance: " + coachingMistakesHint
                    : "";
            adaptiveDirective = "OFFER_HINT: Candidate is stuck (" + stuckCount + " consecutive STUCK turns). Give ONE targeted hint derived from coaching context." + hintContent + " Be encouraging, do not penalize.";
        } else if ("COMPLETE".equalsIgnoreCase(previousIntent)) {
            adaptiveDirective = "ADVANCE_STAGE: Candidate completed previous requirement. Acknowledge mastery in one sentence, then advance deeper into complexity, edge cases, or next stage topic.";
        } else if ("CLARIFYING".equalsIgnoreCase(currentIntentHint)) {
            adaptiveDirective = "ANSWER_CLARIFICATION: Candidate asked a clarifying question. Answer the clarification in <= 2 sentences, then re-pose the original question.";
        } else if (currentCandidateText != null && (currentCandidateText.contains("class ") || currentCandidateText.contains("public ") || currentCandidateText.contains("def ") || currentCandidateText.contains("function "))) {
            adaptiveDirective = "CODING: Candidate is coding. Keep commentary brief; ask about approach and complexity.";
        } else {
            adaptiveDirective = "PROBE_DEEPER: Challenge with an edge case, scalability invariant, or trade-off.";
        }

        return new MemoryView(
                recentVerbatim,
                runningSummary,
                intentTail,
                stuckCount,
                previousIntent,
                currentIntentHint,
                adaptiveDirective
        );
    }
}
