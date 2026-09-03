package com.interviewos.ai.service;

import com.interviewos.ai.dto.VoiceCoachTipRequest;
import com.interviewos.ai.dto.VoiceCoachTipResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class VoiceCoachService {

    public VoiceCoachTipResponse generateTip(VoiceCoachTipRequest request) {
        if (request == null) {
            return new VoiceCoachTipResponse("Keep explaining your thought process clearly.", "COMMUNICATION", false);
        }

        // 1. Multiple consecutive test failures -> Suggest edge case analysis
        if (request.consecutiveFailures() >= 2 || request.testFailures() >= 3) {
            return new VoiceCoachTipResponse(
                    "Consider tracing your loop boundaries and testing edge cases with empty or single-element inputs.",
                    "EDGE_CASES",
                    true
            );
        }

        // 2. High elapsed time (> 5 minutes / 300s) with low candidate word count -> Encourage vocalizing approach
        if (request.elapsedSeconds() > 300 && request.candidateWords() < 40) {
            return new VoiceCoachTipResponse(
                    "Try vocalizing your line of reasoning as you write code. Interviewers look for communication as much as correctness.",
                    "COMMUNICATION",
                    true
            );
        }

        // 3. Time spent > 8 minutes -> Propose checking time & space complexity
        if (request.elapsedSeconds() > 480) {
            return new VoiceCoachTipResponse(
                    "Consider whether your current data structure offers the optimal Big-O runtime for this problem.",
                    "COMPLEXITY",
                    true
            );
        }

        // 4. Default gentle coaching
        return new VoiceCoachTipResponse(
                "You are making steady progress. State any key trade-offs before locking in your implementation.",
                "TRADE_OFFS",
                false
        );
    }
}
