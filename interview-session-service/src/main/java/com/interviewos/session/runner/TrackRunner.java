package com.interviewos.session.runner;

import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;

import java.util.Map;

public interface TrackRunner {

    /**
     * Checks if this runner supports the given problem configuration.
     */
    boolean supports(ProblemDocument problem);

    /**
     * Executes the problem candidate submission with explicit programming language.
     */
    ExecutionResultResponse run(Long sessionId, ProblemDocument problem, Map<String, String> candidateFiles, String language);

    /**
     * Default execution overload assuming Java.
     */
    default ExecutionResultResponse run(Long sessionId, ProblemDocument problem, Map<String, String> candidateFiles) {
        return run(sessionId, problem, candidateFiles, "java");
    }
}
