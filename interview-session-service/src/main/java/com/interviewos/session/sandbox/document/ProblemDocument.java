package com.interviewos.session.sandbox.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "problems")
public class ProblemDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String problemSlug;

    private String title;
    private String track;
    private String difficulty;
    private String problemStatement;

    @Builder.Default
    private Map<String, String> starterCode = Map.of();

    @Builder.Default
    private List<TestCase> sampleTests = new ArrayList<>();

    @Builder.Default
    private List<HiddenTestCase> hiddenTests = new ArrayList<>();

    @Builder.Default
    private ExecutionLimits limits = new ExecutionLimits(512, 2000);

    public record TestCase(
            String name,
            String input,
            String expectedOutput
    ) {}

    public record HiddenTestCase(
            String name,
            String input,
            String expectedOutput,
            int weight
    ) {}

    public record ExecutionLimits(
            int memoryLimitMb,
            int timeLimitMs
    ) {}
}
