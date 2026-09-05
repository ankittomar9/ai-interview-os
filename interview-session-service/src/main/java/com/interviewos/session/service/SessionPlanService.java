package com.interviewos.session.service;

import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.PlannedSection;
import com.interviewos.session.model.SectionType;
import com.interviewos.session.model.SessionPlan;
import com.interviewos.session.sandbox.client.QuestionBankClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class SessionPlanService {

    private final QuestionBankClient questionBankClient;

    private static final Map<DifficultyLevel, List<String>> DSA_MAP = Map.of(
            DifficultyLevel.JUNIOR, List.of("two-sum", "reverse-a-string", "valid-parentheses"),
            DifficultyLevel.MID, List.of("longest-substring-without-repeating-characters", "search-in-rotated-sorted-array", "lru-cache"),
            DifficultyLevel.SENIOR, List.of("lru-cache", "merge-k-sorted-lists", "trapping-rain-water"),
            DifficultyLevel.STAFF, List.of("trapping-rain-water", "topo-course-schedule", "merge-k-sorted-lists")
    );

    private static final Map<DifficultyLevel, List<String>> SQL_MAP = Map.of(
            DifficultyLevel.JUNIOR, List.of("monthly-active-users", "sql-user-cohort-retention", "sql-running-revenue"),
            DifficultyLevel.MID, List.of("sql-running-revenue", "sql-funnel-ratios", "sql-dedup-keep-latest", "department-top-salaries"),
            DifficultyLevel.SENIOR, List.of("sql-top-n-per-group", "sql-sessionization", "sql-7d-moving-average", "sql-month-over-month"),
            DifficultyLevel.STAFF, List.of("sql-top-n-per-group", "sql-spend-quartiles", "complex-financial-rollup")
    );

    private static final Map<DifficultyLevel, List<String>> LLD_MAP = Map.of(
            DifficultyLevel.JUNIOR, List.of("parking-lot-system", "lld-order-service"),
            DifficultyLevel.MID, List.of("lld-order-service", "rate-limiter-service", "cache-eviction-service"),
            DifficultyLevel.SENIOR, List.of("distributed-task-scheduler", "cache-eviction-service"),
            DifficultyLevel.STAFF, List.of("distributed-task-scheduler", "cache-eviction-service")
    );

    private static final Map<DifficultyLevel, List<String>> HLD_MAP = Map.of(
            DifficultyLevel.JUNIOR, List.of("url-shortener", "url-shortener-system-design"),
            DifficultyLevel.MID, List.of("url-shortener-system-design", "distributed-cache", "ride-sharing-dispatch"),
            DifficultyLevel.SENIOR, List.of("distributed-rate-limiter", "real-time-chat", "distributed-cache"),
            DifficultyLevel.STAFF, List.of("distributed-rate-limiter", "real-time-chat")
    );

    private static final Map<DifficultyLevel, List<String>> BEHAVIORAL_MAP = Map.of(
            DifficultyLevel.JUNIOR, List.of("leadership-conflict", "behavioral-technical-conflict"),
            DifficultyLevel.MID, List.of("critical-bug-production", "leadership-conflict", "behavioral-technical-conflict"),
            DifficultyLevel.SENIOR, List.of("behavioral-technical-conflict", "cross-team-collaboration", "critical-bug-production"),
            DifficultyLevel.STAFF, List.of("behavioral-technical-conflict", "cross-team-collaboration")
    );

    private static final Map<DifficultyLevel, List<String>> RESUME_MAP = Map.of(
            DifficultyLevel.JUNIOR, List.of("resume-technical-deep-dive", "resume-project-impact"),
            DifficultyLevel.MID, List.of("resume-technical-deep-dive", "resume-scale-challenge", "resume-project-impact"),
            DifficultyLevel.SENIOR, List.of("resume-system-architecture", "resume-scale-challenge", "resume-past-impact"),
            DifficultyLevel.STAFF, List.of("resume-system-architecture", "resume-past-impact", "resume-scale-challenge")
    );

    private static final Map<String, Map<DifficultyLevel, List<String>>> FALLBACK_CATALOG = Map.ofEntries(
            Map.entry("ALGORITHMS_DATA_STRUCTURES", DSA_MAP),
            Map.entry("SQL", SQL_MAP),
            Map.entry("SQL_DATABASE", SQL_MAP),
            Map.entry("SPRING_LLD", LLD_MAP),
            Map.entry("JAVA_SPRING_BOOT", LLD_MAP),
            Map.entry("SYSTEM_DESIGN_LLD", LLD_MAP),
            Map.entry("SYSTEM_DESIGN", HLD_MAP),
            Map.entry("SYSTEM_DESIGN_HLD", HLD_MAP),
            Map.entry("BEHAVIORAL_STAR", BEHAVIORAL_MAP),
            Map.entry("BEHAVIORAL", BEHAVIORAL_MAP),
            Map.entry("RESUME_BASED", RESUME_MAP),
            Map.entry("AI-from-resume", RESUME_MAP)
    );

    @Autowired
    public SessionPlanService(@Autowired(required = false) QuestionBankClient questionBankClient) {
        this.questionBankClient = questionBankClient;
    }

    public String resolveCatalogTrackKey(InterviewTrack track) {
        if (track == null) return "ALGORITHMS_DATA_STRUCTURES";
        return switch (track) {
            case SQL -> "SQL_DATABASE";
            case SPRING_LLD, JAVA_SPRING_BOOT, LLD_HLD -> "SYSTEM_DESIGN_LLD";
            case SYSTEM_DESIGN -> "SYSTEM_DESIGN_HLD";
            case BEHAVIORAL_STAR -> "BEHAVIORAL";
            case RESUME_BASED -> "AI-from-resume";
            case ALGORITHMS_DATA_STRUCTURES, DSA_LLD, DSA_LLD_HLD -> "ALGORITHMS_DATA_STRUCTURES";
            case FULL_LOOP -> "FULL_LOOP";
        };
    }

    public SessionPlan buildPlan(InterviewTrack track, DifficultyLevel difficulty, long seed) {
        return buildPlan(track, difficulty, seed, "SETUP_SELECTION");
    }

    public SessionPlan buildPlan(InterviewTrack track, DifficultyLevel difficulty, long seed, String source) {
        if (track == null) track = InterviewTrack.ALGORITHMS_DATA_STRUCTURES;
        if (difficulty == null) difficulty = DifficultyLevel.MID;
        if (source == null || source.isBlank()) source = "SETUP_SELECTION";

        List<PlannedSection> sections;
        int plannedTotalMinutes;

        if (track == InterviewTrack.FULL_LOOP) {
            sections = buildFullLoopSections(difficulty, seed);
            plannedTotalMinutes = switch (difficulty) {
                case JUNIOR -> 52;
                case MID -> 58;
                case SENIOR -> 55;
                case STAFF -> 52;
            };
        } else if (track == InterviewTrack.DSA_LLD) {
            sections = buildDsaLldSections(difficulty, seed);
            plannedTotalMinutes = sections.stream().mapToInt(PlannedSection::softTimeBudgetMinutes).sum();
        } else if (track == InterviewTrack.LLD_HLD) {
            sections = buildLldHldSections(difficulty, seed);
            plannedTotalMinutes = sections.stream().mapToInt(PlannedSection::softTimeBudgetMinutes).sum();
        } else if (track == InterviewTrack.DSA_LLD_HLD) {
            sections = buildDsaLldHldSections(difficulty, seed);
            plannedTotalMinutes = sections.stream().mapToInt(PlannedSection::softTimeBudgetMinutes).sum();
        } else {
            sections = buildFocusedSections(track, difficulty, seed);
            plannedTotalMinutes = sections.stream().mapToInt(PlannedSection::softTimeBudgetMinutes).sum();
        }

        return new SessionPlan(source, difficulty, sections, plannedTotalMinutes);
    }

    private List<PlannedSection> buildFullLoopSections(DifficultyLevel difficulty, long seed) {
        Set<String> seenSlugs = new HashSet<>();
        List<PlannedSection> sections = new ArrayList<>();

        // Every plan starts with INTRODUCTION (5 min, 1 item)
        sections.add(new PlannedSection(
                SectionType.INTRODUCTION,
                InterviewTrack.BEHAVIORAL_STAR,
                1,
                5,
                "Candidate background, role calibration & warm-up",
                List.of()
        ));

        switch (difficulty) {
            case JUNIOR -> {
                // DSA x 2 (15, 15)
                List<String> dsaSlugs = buildPlannedSlugsForTrack(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, difficulty, 2, seed, seenSlugs);
                seenSlugs.addAll(dsaSlugs);
                sections.add(new PlannedSection(
                        SectionType.DSA,
                        InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                        2,
                        30,
                        "Core algorithms & data structures",
                        dsaSlugs
                ));
                // LLD x 1 (15)
                List<String> lldSlugs = buildPlannedSlugsForTrack(InterviewTrack.SPRING_LLD, difficulty, 1, seed + 1, seenSlugs);
                seenSlugs.addAll(lldSlugs);
                sections.add(new PlannedSection(
                        SectionType.LLD,
                        InterviewTrack.SPRING_LLD,
                        1,
                        15,
                        "Object-oriented and low-level component design",
                        lldSlugs
                ));
            }
            case MID -> {
                // DSA x 2 (15, 15)
                List<String> dsaSlugs = buildPlannedSlugsForTrack(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, difficulty, 2, seed, seenSlugs);
                seenSlugs.addAll(dsaSlugs);
                sections.add(new PlannedSection(
                        SectionType.DSA,
                        InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                        2,
                        30,
                        "Algorithmic problem solving & edge cases",
                        dsaSlugs
                ));
                // LLD x 2 (15, 5 rapid-fire) -> 20 min
                List<String> lldSlugs = buildPlannedSlugsForTrack(InterviewTrack.SPRING_LLD, difficulty, 2, seed + 1, seenSlugs);
                seenSlugs.addAll(lldSlugs);
                sections.add(new PlannedSection(
                        SectionType.LLD,
                        InterviewTrack.SPRING_LLD,
                        2,
                        20,
                        "Low-level system implementation & rapid-fire design",
                        lldSlugs
                ));
            }
            case SENIOR -> {
                // DSA x 1 (15)
                List<String> dsaSlugs = buildPlannedSlugsForTrack(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, difficulty, 1, seed, seenSlugs);
                seenSlugs.addAll(dsaSlugs);
                sections.add(new PlannedSection(
                        SectionType.DSA,
                        InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                        1,
                        15,
                        "Algorithmic problem solving",
                        dsaSlugs
                ));
                // LLD x 1 (15)
                List<String> lldSlugs = buildPlannedSlugsForTrack(InterviewTrack.SPRING_LLD, difficulty, 1, seed + 1, seenSlugs);
                seenSlugs.addAll(lldSlugs);
                sections.add(new PlannedSection(
                        SectionType.LLD,
                        InterviewTrack.SPRING_LLD,
                        1,
                        15,
                        "Modular component & low-level design",
                        lldSlugs
                ));
                // SD x 1 (18)
                List<String> sdSlugs = buildPlannedSlugsForTrack(InterviewTrack.SYSTEM_DESIGN, difficulty, 1, seed + 2, seenSlugs);
                seenSlugs.addAll(sdSlugs);
                sections.add(new PlannedSection(
                        SectionType.SYSTEM_DESIGN,
                        InterviewTrack.SYSTEM_DESIGN,
                        1,
                        18,
                        "High-level distributed architecture & trade-offs",
                        sdSlugs
                ));
            }
            case STAFF -> {
                // LLD x 1 (15)
                List<String> lldSlugs = buildPlannedSlugsForTrack(InterviewTrack.SPRING_LLD, difficulty, 1, seed, seenSlugs);
                seenSlugs.addAll(lldSlugs);
                sections.add(new PlannedSection(
                        SectionType.LLD,
                        InterviewTrack.SPRING_LLD,
                        1,
                        15,
                        "Enterprise low-level architecture",
                        lldSlugs
                ));
                // SD x 1 (18)
                List<String> sdSlugs = buildPlannedSlugsForTrack(InterviewTrack.SYSTEM_DESIGN, difficulty, 1, seed + 1, seenSlugs);
                seenSlugs.addAll(sdSlugs);
                sections.add(new PlannedSection(
                        SectionType.SYSTEM_DESIGN,
                        InterviewTrack.SYSTEM_DESIGN,
                        1,
                        18,
                        "Large-scale system architecture & scalability",
                        sdSlugs
                ));
                // RESUME x 1 (12)
                List<String> resumeSlugs = buildPlannedSlugsForTrack(InterviewTrack.RESUME_BASED, difficulty, 1, seed + 2, seenSlugs);
                seenSlugs.addAll(resumeSlugs);
                sections.add(new PlannedSection(
                        SectionType.RESUME,
                        InterviewTrack.RESUME_BASED,
                        1,
                        12,
                        "Deep-dive into past architectural impact",
                        resumeSlugs
                ));
            }
        }

        return sections;
    }

    private List<PlannedSection> buildDsaLldSections(DifficultyLevel difficulty, long seed) {
        Set<String> seenSlugs = new HashSet<>();
        List<PlannedSection> sections = new ArrayList<>();
        sections.add(new PlannedSection(
                SectionType.INTRODUCTION,
                InterviewTrack.BEHAVIORAL_STAR,
                1,
                5,
                "Candidate background, role calibration & warm-up",
                List.of()
        ));

        int dsaCount = (difficulty == DifficultyLevel.JUNIOR || difficulty == DifficultyLevel.MID) ? 2 : 1;
        int dsaMinutes = (difficulty == DifficultyLevel.JUNIOR || difficulty == DifficultyLevel.MID) ? 30 : 15;
        List<String> dsaSlugs = buildPlannedSlugsForTrack(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, difficulty, dsaCount, seed, seenSlugs);
        seenSlugs.addAll(dsaSlugs);
        sections.add(new PlannedSection(
                SectionType.DSA,
                InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                dsaCount,
                dsaMinutes,
                "Core algorithms & data structures",
                dsaSlugs
        ));

        int lldCount = (difficulty == DifficultyLevel.MID) ? 2 : 1;
        int lldMinutes = (difficulty == DifficultyLevel.MID) ? 20 : 15;
        List<String> lldSlugs = buildPlannedSlugsForTrack(InterviewTrack.SPRING_LLD, difficulty, lldCount, seed + 1, seenSlugs);
        seenSlugs.addAll(lldSlugs);
        sections.add(new PlannedSection(
                SectionType.LLD,
                InterviewTrack.SPRING_LLD,
                lldCount,
                lldMinutes,
                "Object-oriented and low-level component design",
                lldSlugs
        ));

        return sections;
    }

    private List<PlannedSection> buildLldHldSections(DifficultyLevel difficulty, long seed) {
        Set<String> seenSlugs = new HashSet<>();
        List<PlannedSection> sections = new ArrayList<>();
        sections.add(new PlannedSection(
                SectionType.INTRODUCTION,
                InterviewTrack.BEHAVIORAL_STAR,
                1,
                5,
                "Candidate background, role calibration & warm-up",
                List.of()
        ));

        int lldCount = (difficulty == DifficultyLevel.MID) ? 2 : 1;
        int lldMinutes = (difficulty == DifficultyLevel.MID) ? 20 : 15;
        List<String> lldSlugs = buildPlannedSlugsForTrack(InterviewTrack.SPRING_LLD, difficulty, lldCount, seed, seenSlugs);
        seenSlugs.addAll(lldSlugs);
        sections.add(new PlannedSection(
                SectionType.LLD,
                InterviewTrack.SPRING_LLD,
                lldCount,
                lldMinutes,
                "Modular component & low-level design",
                lldSlugs
        ));

        int hldCount = 1;
        int hldMinutes = 18;
        List<String> sdSlugs = buildPlannedSlugsForTrack(InterviewTrack.SYSTEM_DESIGN, difficulty, hldCount, seed + 1, seenSlugs);
        seenSlugs.addAll(sdSlugs);
        sections.add(new PlannedSection(
                SectionType.SYSTEM_DESIGN,
                InterviewTrack.SYSTEM_DESIGN,
                hldCount,
                hldMinutes,
                "High-level distributed architecture & trade-offs",
                sdSlugs
        ));

        return sections;
    }

    private List<PlannedSection> buildDsaLldHldSections(DifficultyLevel difficulty, long seed) {
        Set<String> seenSlugs = new HashSet<>();
        List<PlannedSection> sections = new ArrayList<>();
        sections.add(new PlannedSection(
                SectionType.INTRODUCTION,
                InterviewTrack.BEHAVIORAL_STAR,
                1,
                5,
                "Candidate background, role calibration & warm-up",
                List.of()
        ));

        int dsaCount = (difficulty == DifficultyLevel.JUNIOR || difficulty == DifficultyLevel.MID) ? 2 : 1;
        int dsaMinutes = (difficulty == DifficultyLevel.JUNIOR || difficulty == DifficultyLevel.MID) ? 30 : 15;
        List<String> dsaSlugs = buildPlannedSlugsForTrack(InterviewTrack.ALGORITHMS_DATA_STRUCTURES, difficulty, dsaCount, seed, seenSlugs);
        seenSlugs.addAll(dsaSlugs);
        sections.add(new PlannedSection(
                SectionType.DSA,
                InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                dsaCount,
                dsaMinutes,
                "Core algorithms & algorithmic problem solving",
                dsaSlugs
        ));

        int lldCount = (difficulty == DifficultyLevel.MID) ? 2 : 1;
        int lldMinutes = (difficulty == DifficultyLevel.MID) ? 20 : 15;
        List<String> lldSlugs = buildPlannedSlugsForTrack(InterviewTrack.SPRING_LLD, difficulty, lldCount, seed + 1, seenSlugs);
        seenSlugs.addAll(lldSlugs);
        sections.add(new PlannedSection(
                SectionType.LLD,
                InterviewTrack.SPRING_LLD,
                lldCount,
                lldMinutes,
                "Modular component & low-level design",
                lldSlugs
        ));

        int hldCount = 1;
        int hldMinutes = 18;
        List<String> sdSlugs = buildPlannedSlugsForTrack(InterviewTrack.SYSTEM_DESIGN, difficulty, hldCount, seed + 2, seenSlugs);
        seenSlugs.addAll(sdSlugs);
        sections.add(new PlannedSection(
                SectionType.SYSTEM_DESIGN,
                InterviewTrack.SYSTEM_DESIGN,
                hldCount,
                hldMinutes,
                "High-level distributed architecture & trade-offs",
                sdSlugs
        ));

        return sections;
    }

    private List<PlannedSection> buildFocusedSections(InterviewTrack track, DifficultyLevel difficulty, long seed) {
        Set<String> seenSlugs = new HashSet<>();
        List<PlannedSection> sections = new ArrayList<>();

        // Every plan starts with INTRODUCTION (5 min, 1 item)
        sections.add(new PlannedSection(
                SectionType.INTRODUCTION,
                track,
                1,
                5,
                "Candidate introduction and domain calibration",
                List.of()
        ));

        SectionType domainSectionType = mapTrackToSectionType(track);
        int itemCount;
        int softMinutesPerItem;

        switch (track) {
            case ALGORITHMS_DATA_STRUCTURES -> {
                softMinutesPerItem = 15;
                itemCount = switch (difficulty) {
                    case JUNIOR, MID -> 2;
                    case SENIOR, STAFF -> 1;
                };
            }
            case SQL -> {
                softMinutesPerItem = 12;
                itemCount = switch (difficulty) {
                    case JUNIOR, MID -> 2;
                    case SENIOR, STAFF -> 1;
                };
            }
            case SPRING_LLD, JAVA_SPRING_BOOT -> {
                softMinutesPerItem = 15;
                itemCount = switch (difficulty) {
                    case JUNIOR, SENIOR, STAFF -> 1;
                    case MID -> 2;
                };
            }
            case SYSTEM_DESIGN -> {
                softMinutesPerItem = 18;
                itemCount = switch (difficulty) {
                    case JUNIOR, MID -> 1;
                    case SENIOR, STAFF -> 2;
                };
            }
            case BEHAVIORAL_STAR -> {
                softMinutesPerItem = 8;
                itemCount = 2;
            }
            case RESUME_BASED -> {
                softMinutesPerItem = 10;
                itemCount = 2;
            }
            default -> {
                softMinutesPerItem = 15;
                itemCount = 2;
            }
        }

        List<String> slugs = buildPlannedSlugsForTrack(track, difficulty, itemCount, seed, seenSlugs);
        int sectionBudget = itemCount * softMinutesPerItem;
        sections.add(new PlannedSection(
                domainSectionType,
                track,
                itemCount,
                sectionBudget,
                track.name() + " technical assessment",
                slugs
        ));

        return sections;
    }

    private SectionType mapTrackToSectionType(InterviewTrack track) {
        if (track == null) return SectionType.DSA;
        return switch (track) {
            case ALGORITHMS_DATA_STRUCTURES, DSA_LLD, DSA_LLD_HLD -> SectionType.DSA;
            case SQL -> SectionType.SQL;
            case SPRING_LLD, JAVA_SPRING_BOOT, LLD_HLD -> SectionType.LLD;
            case SYSTEM_DESIGN -> SectionType.SYSTEM_DESIGN;
            case BEHAVIORAL_STAR -> SectionType.BEHAVIORAL;
            case RESUME_BASED -> SectionType.RESUME;
            case FULL_LOOP -> SectionType.CORE_TECH;
        };
    }

    public List<String> buildPlannedSlugs(InterviewTrack track, DifficultyLevel difficulty, long seed) {
        return buildPlannedSlugsForTrack(track, difficulty, 3, seed, new HashSet<>());
    }

    public List<String> buildPlannedSlugsForTrack(
            InterviewTrack track,
            DifficultyLevel difficulty,
            int count,
            long seed,
            Set<String> alreadyChosenSlugs
    ) {
        if (track == null) track = InterviewTrack.ALGORITHMS_DATA_STRUCTURES;
        if (difficulty == null) difficulty = DifficultyLevel.MID;
        if (count <= 0) count = 1;

        DifficultyLevel low = switch (difficulty) {
            case JUNIOR, MID -> DifficultyLevel.JUNIOR;
            case SENIOR -> DifficultyLevel.MID;
            case STAFF -> DifficultyLevel.SENIOR;
        };
        DifficultyLevel mid = difficulty;
        DifficultyLevel high = switch (difficulty) {
            case JUNIOR -> DifficultyLevel.MID;
            case MID -> DifficultyLevel.SENIOR;
            case SENIOR, STAFF -> DifficultyLevel.STAFF;
        };

        List<DifficultyLevel> ladder;
        if (count == 1) {
            ladder = List.of(difficulty);
        } else if (count == 2) {
            ladder = List.of(low, high);
        } else {
            ladder = List.of(low, mid, high);
        }

        String canonicalKey = resolveCatalogTrackKey(track);
        Map<DifficultyLevel, List<String>> trackMap = FALLBACK_CATALOG.get(canonicalKey);
        if (trackMap == null) {
            trackMap = FALLBACK_CATALOG.getOrDefault(track.name(), DSA_MAP);
        }

        List<String> planned = new ArrayList<>();
        Set<String> localSeen = new HashSet<>(alreadyChosenSlugs != null ? alreadyChosenSlugs : Set.of());
        Random random = new Random(seed);

        for (int i = 0; i < count; i++) {
            DifficultyLevel rung = ladder.get(Math.min(i, ladder.size() - 1));
            List<String> candidates = new ArrayList<>();
            String source = "FALLBACK";
            DifficultyLevel chosenDifficulty = rung;

            if (questionBankClient != null) {
                try {
                    var remote = questionBankClient.listProblems(canonicalKey, rung.name());
                    if (remote != null && !remote.isEmpty()) {
                        remote.forEach(p -> candidates.add(p.getProblemSlug()));
                        if (!candidates.isEmpty()) {
                            source = "REMOTE";
                        }
                    }
                } catch (Exception e) {
                    log.debug("Notice on remote question bank lookup for ladder: {}", e.getMessage());
                }
            }

            if (candidates.isEmpty()) {
                source = "FALLBACK";
                List<String> rungCandidates = trackMap.get(rung);
                if (rungCandidates != null && !rungCandidates.isEmpty()) {
                    candidates.addAll(rungCandidates);
                } else {
                    candidates.addAll(findAdjacentRungCandidates(trackMap, rung));
                }
            }

            List<String> eligible = candidates.stream()
                    .filter(s -> !localSeen.contains(s))
                    .toList();

            String chosen;
            if (!eligible.isEmpty()) {
                chosen = eligible.get(random.nextInt(eligible.size()));
            } else if (!candidates.isEmpty()) {
                chosen = candidates.get(random.nextInt(candidates.size()));
            } else {
                List<String> fallbackPool = trackMap.getOrDefault(chosenDifficulty, List.of());
                if (fallbackPool.isEmpty()) {
                    fallbackPool = findAdjacentRungCandidates(trackMap, chosenDifficulty);
                }
                chosen = !fallbackPool.isEmpty()
                        ? fallbackPool.get(random.nextInt(fallbackPool.size()))
                        : "question-" + canonicalKey.toLowerCase() + "-" + rung.name().toLowerCase();
            }

            localSeen.add(chosen);
            planned.add(chosen);
            log.info("Ladder pick: {}|{}|{}|source={}", chosen, rung, chosenDifficulty, source);
        }

        return planned;
    }

    private List<String> findAdjacentRungCandidates(
            Map<DifficultyLevel, List<String>> trackMap,
            DifficultyLevel rung
    ) {
        DifficultyLevel[] order = switch (rung) {
            case STAFF -> new DifficultyLevel[]{
                    DifficultyLevel.SENIOR,
                    DifficultyLevel.MID,
                    DifficultyLevel.JUNIOR
            };
            case SENIOR -> new DifficultyLevel[]{
                    DifficultyLevel.MID,
                    DifficultyLevel.STAFF,
                    DifficultyLevel.JUNIOR
            };
            case MID -> new DifficultyLevel[]{
                    DifficultyLevel.SENIOR,
                    DifficultyLevel.JUNIOR,
                    DifficultyLevel.STAFF
            };
            case JUNIOR -> new DifficultyLevel[]{
                    DifficultyLevel.MID,
                    DifficultyLevel.SENIOR,
                    DifficultyLevel.STAFF
            };
        };

        for (DifficultyLevel adj : order) {
            List<String> adjCandidates = trackMap.get(adj);
            if (adjCandidates != null && !adjCandidates.isEmpty()) {
                return adjCandidates;
            }
        }
        return List.of();
    }
}
