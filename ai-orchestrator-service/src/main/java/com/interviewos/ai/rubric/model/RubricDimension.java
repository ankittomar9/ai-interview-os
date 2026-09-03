package com.interviewos.ai.rubric.model;

import java.util.Arrays;
import java.util.List;

public enum RubricDimension {
    // CODING dimensions
    REQUIREMENTS_CLARIFICATION(RubricSchema.CODING, 0.20, "Did the candidate ask clarifying questions and confirm assumptions before coding?"),
    ALGORITHMIC_REASONING(RubricSchema.CODING, 0.30, "Did they accurately analyze Big-O time/space complexity and choose appropriate data structures?"),
    EDGE_CASE_THOROUGHNESS(RubricSchema.CODING, 0.15, "Did they identify and handle null, empty, boundary, overflow, or concurrency edge cases?"),
    COMMUNICATION_CLARITY(RubricSchema.CODING, 0.15, "Were explanations structured, concise, and professional, or unstructured and rambling?"),
    CODE_QUALITY(RubricSchema.CODING, 0.20, "Independent of execution, is the code clean, well-factored, idiomatic, and readable?"),

    // BEHAVIORAL dimensions
    LEADERSHIP(RubricSchema.BEHAVIORAL, 0.25, "Demonstrated ownership, initiative, and ability to influence outcomes positively?"),
    CONFLICT_RESOLUTION(RubricSchema.BEHAVIORAL, 0.20, "Handled interpersonal disagreements, technical friction, or stakeholder misalignment constructively?"),
    TEAMWORK(RubricSchema.BEHAVIORAL, 0.20, "Fostered psychological safety, active collaboration, cross-functional empathy, and mentorship?"),
    ADAPTABILITY(RubricSchema.BEHAVIORAL, 0.15, "Navigated ambiguity, changing business requirements, or shifting technical priorities calmly?"),
    COMMUNICATION_BEHAVIORAL(RubricSchema.BEHAVIORAL, 0.20, "Used structured STAR storytelling with clear situation context, decisive action, and measurable outcome?"),

    // RESUME_BASED dimensions
    TECHNICAL_DEPTH(RubricSchema.RESUME_BASED, 0.30, "Demonstrated deep mastery of claimed resume technologies, frameworks, and architecture patterns?"),
    PROJECT_IMPACT(RubricSchema.RESUME_BASED, 0.25, "Quantified business metrics, latency/throughput gains, cost savings, or reliability improvements?"),
    PROBLEM_SOLVING(RubricSchema.RESUME_BASED, 0.20, "Explained root-cause analysis, production postmortems, and complex debugging journeys?"),
    COMMUNICATION_RESUME(RubricSchema.RESUME_BASED, 0.15, "Articulated architectural trade-offs and career narrative clearly without resume exaggeration?"),
    PROFESSIONALISM_RESUME(RubricSchema.RESUME_BASED, 0.10, "Showed intellectual honesty, acknowledging past project limitations and lessons learned?"),

    // SYSTEM_DESIGN dimensions
    ARCHITECTURE(RubricSchema.SYSTEM_DESIGN, 0.30, "Sound high-level decomposition, component boundaries, and asynchronous data flows?"),
    SCALABILITY(RubricSchema.SYSTEM_DESIGN, 0.25, "Horizontal partitioning, caching tiers, read/write replicas, and backpressure mechanisms?"),
    TRADE_OFFS(RubricSchema.SYSTEM_DESIGN, 0.20, "Rigorous CAP theorem, consistency models (strong vs eventual), and cost/complexity trade-offs?"),
    COMMUNICATION_DESIGN(RubricSchema.SYSTEM_DESIGN, 0.15, "Clear whiteboard communication, systematic requirements gathering, and structured presentation?"),
    RIGOR(RubricSchema.SYSTEM_DESIGN, 0.10, "Reliability, failover mechanics, monitoring, rate limiting, and failure blast-radius containment?");

    private final RubricSchema schema;
    private final double weight;
    private final String description;

    RubricDimension(RubricSchema schema, double weight, String description) {
        this.schema = schema;
        this.weight = weight;
        this.description = description;
    }

    public RubricSchema getSchema() {
        return schema;
    }

    public double getWeight() {
        return weight;
    }

    public String getDescription() {
        return description;
    }

    public static List<RubricDimension> getDimensionsForSchema(RubricSchema schema) {
        return Arrays.stream(values())
                .filter(d -> d.schema == schema)
                .toList();
    }
}
