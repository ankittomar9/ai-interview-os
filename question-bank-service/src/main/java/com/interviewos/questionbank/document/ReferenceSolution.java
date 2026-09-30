package com.interviewos.questionbank.document;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReferenceSolution(
        String approachId,
        String label,
        ApproachClass approachClass,
        Kind kind,
        String summary,
        String keyIdea,
        String timeComplexity,
        String spaceComplexity,
        List<String> tradeoffs,
        String whenToUse,
        String code,
        Map<String, String> files,
        String sql,
        String writeUp,
        String diagramNotes
) {
    public enum ApproachClass {
        PRIMARY,
        ALTERNATE
    }

    public enum Kind {
        CODE,
        SQL,
        WRITEUP
    }
}
