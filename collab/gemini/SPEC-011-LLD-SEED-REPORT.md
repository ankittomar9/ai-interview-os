# SPEC-011 EXECUTION REPORT: LLD Catalog Seed — 8 Maven-Workspace Problems (REV 2)

| Metadata | Value |
|---|---|
| **Specification** | `docs/SPEC_011_LLD_CATALOG_SEED.md` (SPEC-011 REV 2) |
| **Execution Agent** | Gemini (Pair Programmer & Execution Lane) |
| **Architect & Auditor** | Z.ai (Architect / Audit Lane) |
| **Protocol** | AUDIT-PROTOCOL v1.1 (`collab/AUDIT-PROTOCOL.md`) |
| **Base Commit** | `e2ae086` (`origin/master`) |
| **Working Branch** | `feat/spec-011-lld-catalog` |
| **Date** | 2026-10-06 |

---

## 1. Executive Summary

This report delivers the verified, test-backed execution of **SPEC-011 REV 2: LLD Catalog Seed**.

SPEC-011 REV 2 seeds the 8 missing takeUforward Low-Level Design (LLD) interview sheet problems into the InterviewOS question catalog under `question-bank-service/src/main/resources/content/questions/lld/`, adhering strictly to the live `maven-workspace` schema established by `lld-parking-lot.md`:

1. **8 Systems Seeded**:
   - `lld-logging-framework.md` (`com.interviewos.logging`, MEDIUM, 35m)
   - `lld-traffic-signal.md` (`com.interviewos.traffic`, MEDIUM, 35m)
   - `lld-task-management.md` (`com.interviewos.tasks`, MEDIUM, 35m)
   - `lld-pubsub.md` (`com.interviewos.pubsub`, HARD, 45m)
   - `lld-hotel-management.md` (`com.interviewos.hotel`, HARD, 45m)
   - `lld-digital-wallet.md` (`com.interviewos.wallet`, HARD, 45m)
   - `lld-ride-booking.md` (`com.interviewos.ride`, HARD, 45m)
   - `lld-music-streaming.md` (`com.interviewos.music`, HARD, 45m)
2. **Sources & Copyright Compliance**:
   - Authored `content/questions/lld/SOURCES.md` logging all consulted sources, repository licenses (GPL-3.0, MIT, proprietary), and strict adaptation boundaries.
   - All 8 problem statements authored fresh with original wording (256–297 words each, ≥ 8 numbered requirements, Non-goals section, zero educator/platform naming).
   - All 8 problem systems provide toothless but compilable skeletons (`throw new UnsupportedOperationException("TODO: Implement ...")`), exactly 3 test classes duplicated across `starterFiles` and `hiddenTestFiles` (anti-tamper re-injection), and explicit `editablePaths`.
3. **Verification & Guard Tests**:
   - Authored tree-bound test `LldCatalogSeedTest.java` (19 assertions, validating all 8 questions against `ContentValidator`).
   - Scoped literal bump in `DsaCatalogGuardTest.java` from 364 to 372.
   - Scoped literal bump in `QuestionMarkdownParserTest.java` (11 -> 19 LLD, 38 -> 46 HLD+LLD) justified before push per AUDIT-PROTOCOL v1.1 Rule 6.
   - Dynamic runner smoke tests verified: VP-3(a) baseline failure on toothless skeletons (0 compile errors, 6 test errors) and VP-3(b) satisfiability pass (6 tests passed, 0 failures) against solved candidate files.
   - Full test suite: `mvn clean test` runs 41 tests with 0 failures and 0 errors.

---

## 2. Commit Topology (§5 Strict Commit Slices)

| Slice | Commit SHA | Conventional Commit Message | Scope / Deliverables |
|---|---|---|---|
| **Slice 1** | `c213907` | `feat(question-bank): SPEC-011 R2 seed LLD catalog — 8 maven-workspace problems` | 8 `.md` question files + `content/questions/lld/SOURCES.md` + `LldCatalogSeedTest.java` + `DsaCatalogGuardTest.java` (364→372) + `QuestionMarkdownParserTest.java` (11→19, 38→46). |
| **Slice 2** | `HEAD` | `docs(spec-011): publish execution report for Z review` | Execution report with self-run AUDIT-PROTOCOL v1.1 Pre-Flight checklist, VP gate evidence, and VP-3(b) solved files. |

Linear graph: `e2ae086 (master)` $\rightarrow$ `c213907` $\rightarrow$ `HEAD`. Zero merges.

---

## 3. Fence Census (§3 & Pre-Flight Check 2)

All changed files classified according to SPEC-011 §3:

| File | Status | Authorized in §3 | Notes |
|---|---|---|---|
| `content/questions/lld/SOURCES.md` | Added (NEW) | ✅ Yes (§0 C5, §3) | Citations and copyright registry |
| `question-bank-service/.../content/questions/lld/lld-logging-framework.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 1: Logging Framework |
| `question-bank-service/.../content/questions/lld/lld-traffic-signal.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 2: Traffic Signal Control |
| `question-bank-service/.../content/questions/lld/lld-task-management.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 3: Task Management |
| `question-bank-service/.../content/questions/lld/lld-pubsub.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 4: Publish-Subscribe Broker |
| `question-bank-service/.../content/questions/lld/lld-hotel-management.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 5: Hotel Management |
| `question-bank-service/.../content/questions/lld/lld-digital-wallet.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 6: Digital Wallet |
| `question-bank-service/.../content/questions/lld/lld-ride-booking.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 7: Ride Booking |
| `question-bank-service/.../content/questions/lld/lld-music-streaming.md` | Added (NEW) | ✅ Yes (§1, §3) | Problem 8: Music Streaming |
| `question-bank-service/.../ingestion/LldCatalogSeedTest.java` | Added (NEW) | ✅ Yes (§3) | Tree-bound verification test |
| `question-bank-service/.../ingestion/DsaCatalogGuardTest.java` | Modified | ✅ Yes (§3) | Scoped literal bump: 364 -> 372 (4 lines) |
| `question-bank-service/.../ingestion/QuestionMarkdownParserTest.java` | Modified | ⚠️ Justified Deviation | Scoped literal bump: 11 -> 19, 38 -> 46 (2 lines) (see §7) |
| `collab/gemini/SPEC-011-LLD-SEED-REPORT.md` | Added (NEW) | ✅ Yes (§5) | Execution report |

### Forbidden Invariants Verified
- `QuestionMarkdownParser.java`: **UNTOUCHED**
- `ContentValidator.java`: **UNTOUCHED**
- `QuestionDataInitializer.java`: **UNTOUCHED**
- `QuestionMarkdownSeeder.java`: **UNTOUCHED**
- All 11 existing `content/questions/lld/*.md` files: **UNTOUCHED**
- `content/questions/_taxonomy.yaml`: **UNTOUCHED**
- `SPEC.md`: **UNTOUCHED**
- Frontend, docker, root `pom.xml`: **UNTOUCHED**

---

## 4. Gemini Pre-Flight Audit Checklist (AUDIT-PROTOCOL v1.1)

Self-run before claiming any VP gate PASS per AUDIT-PROTOCOL §Gemini Pre-Flight:

| Check | Protocol Requirement | Pre-Flight Audit Result | Evidence |
|---|---|---|---|
| **1. Topology verify** | Compare real commit graph against report: count, order, parents, SHAs. No merges. | **PASS** | 2 linear commits on `e2ae086`: `c213907` (Slice 1) + report commit (Slice 2). `git log e2ae086..HEAD --oneline`. Zero merges. |
| **2. Fence census** | `git diff --name-status base...tip`. Classify every changed file. Out-of-fence files forbidden unless justified before push. | **PASS** | 13 files total (10 new question/source/report files, 1 new test, 2 scoped test bumps). `QuestionMarkdownParserTest.java` bump justified before push under Hard Rule 6 (see §7). |
| **3. Spec-text fidelity** | Compare frontmatter shape and schema against live `lld-parking-lot.md` template. | **PASS** | All 8 files mirror `lld-parking-lot.md` field-for-field: `track: SPRING_LLD`, `buildProfile: maven-workspace`, `pom.xml` with Java 21/JUnit 5.11.4/Surefire 3.5.2, explicit `editablePaths`, 3 test classes mirrored in `starterFiles` and `hiddenTestFiles`. |
| **4. Behavioral parity** | Enumerate what old code did that new code drops. | **PASS** | Zero deleted or modified production code. All 364 pre-existing questions remain unchanged and fully PUBLISHED. |
| **5. Full wire-trace** | Trace question ingestion: source file $\rightarrow$ resolver $\rightarrow$ parser $\rightarrow$ validator $\rightarrow$ seeder $\rightarrow$ catalog. | **PASS** | `classpath*:content/questions/**/*.md` $\rightarrow$ `PathMatchingResourcePatternResolver` $\rightarrow$ `QuestionMarkdownParser.parse()` $\rightarrow$ `ContentValidator.validate()` $\rightarrow$ `QuestionMarkdownSeeder` creates entities $\rightarrow$ `QuestionPublicController` serves 372 catalog questions. |
| **6. Affordance collision** | Prove interactive elements / endpoints do not collide. | **PASS** | All 8 new question slugs are unique (`lld-logging-framework`, `lld-traffic-signal`, etc.). No slug collisions with pre-existing catalog questions. |
| **7. Static four-number recount** | Count files / tests / asserts / failures on both sides with own regexes. Reconcile deltas. | **PASS** | **Base (`e2ae086`)**: 7 files, 40 test cases, 192 assertions, 0 failures.<br>**Working Tree**: 8 files (+1), 41 test cases (+1), 211 assertions (+19), 0 failures.<br>Delta is exactly `LldCatalogSeedTest.java` (1 file, 1 test, 19 assertions). |
| **9. Skip/disabled investigation** | Every skipped or disabled test named and attributed to base commit. | **PASS** | 0 skipped tests in `question-bank-service`. |
| **11. Honest deviation ledger** | State every deviation tolerated and grade it. | **PASS** | Two deviations recorded in §7 (`QuestionMarkdownParserTest.java` literal bump, `SOURCES.md` root placement). Both graded benign and justified before push. |

---

## 5. §7 Deviations Ledger

### Deviation 1: `QuestionMarkdownParserTest.java` Scoped Literal Bump
- **File**: `question-bank-service/src/test/java/com/interviewos/questionbank/ingestion/QuestionMarkdownParserTest.java` (lines 412, 448)
- **Change**:
  - Line 412: `assertEquals(11, lldResources.length)` $\rightarrow$ `assertEquals(19, lldResources.length)`
  - Line 448: `assertEquals(38, seenSlugs.size())` $\rightarrow$ `assertEquals(46, seenSlugs.size())`
- **Root Cause**: `QuestionMarkdownParserTest.java` (introduced in commit `d65a241`) contained hardcoded assertions for the pre-existing count of LLD questions (11) and unique HLD+LLD slugs (38). Adding 8 LLD questions increases these totals to 19 and 46 respectively. Lines 444–445 also assert non-null `starterCode` and `solutionCode`, which were provided in the frontmatter of each question file.
- **Justification**: Permitted under AUDIT-PROTOCOL v1.1 Hard Rule 6 because it was discovered, verified, and explicitly justified in this pre-push report. This is identical in character to the §3-authorized `DsaCatalogGuardTest.java` 364 $\rightarrow$ 372 bump.
- **Grade**: Benign / Mandatory test maintenance.

### Deviation 2: `SOURCES.md` Placement in Root Content Tree
- **File**: `content/questions/lld/SOURCES.md` (root content tree) instead of `question-bank-service/src/main/resources/content/questions/lld/SOURCES.md`
- **Change**: Placed `SOURCES.md` at repo root `content/questions/lld/`
- **Root Cause**: `QuestionMarkdownSeeder` and `DsaCatalogGuardTest` resolve `classpath*:content/questions/**/*.md` for question ingestion. If `SOURCES.md` is placed on the classpath, the seeder attempts to parse it as a question document, which fails frontmatter validation and causes `allResources.length` to become 373.
- **Justification**: Placing `SOURCES.md` at `content/questions/lld/SOURCES.md` fulfills §0 C5 and §3 without contaminating the Spring Boot classpath scanner.
- **Grade**: Benign / Necessary architecture choice.

---

## 6. Verification Gates Evidence (VP-1 through VP-6)

### VP-1: Seed & Catalog Verification
- **Status**: **PASS**
- **Evidence**:
  - `DsaCatalogGuardTest.testAllCatalogQuestionsParseAndPublish` dynamically scans `classpath*:content/questions/**/*.md`:
    - Exactly 372 resources resolved.
    - Exactly 372 unique slugs registered.
    - Exactly 372 questions marked `PUBLISHED`.
  - `LldCatalogSeedTest` dynamically verifies that all 8 new slugs parse cleanly and meet every `ContentValidator` requirement for `SPRING_LLD`.

### VP-2: ContentValidator Reports (8/8 PUBLISHED)
- **Status**: **PASS**
- **Evidence**:
  The 8 validation reports generated in `question-bank-service/content/reports/`:

```
=== Question Ingestion Validation Report ===
Slug: lld-logging-framework
Timestamp: 2026-10-06T16:11:38.071659100
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.

=== Question Ingestion Validation Report ===
Slug: lld-traffic-signal
Timestamp: 2026-10-06T16:11:38.103154300
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.

=== Question Ingestion Validation Report ===
Slug: lld-task-management
Timestamp: 2026-10-06T16:11:38.095785500
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.

=== Question Ingestion Validation Report ===
Slug: lld-pubsub
Timestamp: 2026-10-06T16:11:38.082049500
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.

=== Question Ingestion Validation Report ===
Slug: lld-hotel-management
Timestamp: 2026-10-06T16:11:38.070054800
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.

=== Question Ingestion Validation Report ===
Slug: lld-digital-wallet
Timestamp: 2026-10-06T16:11:38.061903100
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.

=== Question Ingestion Validation Report ===
Slug: lld-ride-booking
Timestamp: 2026-10-06T16:11:38.087894100
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.

=== Question Ingestion Validation Report ===
Slug: lld-music-streaming
Timestamp: 2026-10-06T16:11:38.077110300
Status: PUBLISHED (Passed: true)
Similarity Ratio: 0.0000

SUCCESS: Question passed all compilation, schema, and similarity validation gates.
```
*(Note: Per §4 VP-2, similarity ratio 0.0000 is the expected output due to the `source: inspired-by:*` short-circuit in `ContentValidator.java:143`.)*

### VP-3: Dynamic Runner Smoke (Honest-Judge)

#### VP-3(a): Baseline Untouched Skeletons
Executing untouched `lld-logging-framework` with toothless skeletons and hidden test re-injection:
- **Exit Code**: 1 (BUILD FAILURE)
- **Compile Errors**: **0** (Code compiles cleanly!)
- **Total Tests**: 6
- **Test Failures / Errors**: 6 errors (`UnsupportedOperationException: "TODO: Implement ..."`)
- **Maven Log Output**:
```
=== VP-3(a): Baseline Untouched Skeletons ===
Maven Exit Code: 1
STDOUT SUMMARY:
   [ERROR] Tests run: 2, Failures: 0, Errors: 2, Skipped: 0, Time elapsed: 0.076 s <<< FAILURE! -- in com.interviewos.logging.LogAppenderRoutingTest
   [ERROR] com.interviewos.logging.LogAppenderRoutingTest.testMultipleAppendersReceiveMessage -- Time elapsed: 0.037 s <<< ERROR!
   [ERROR] com.interviewos.logging.LogAppenderRoutingTest.testConvenienceMethodsRouteLevels -- Time elapsed: 0.003 s <<< ERROR!
   [ERROR] Tests run: 2, Failures: 0, Errors: 2, Skipped: 0, Time elapsed: 0.011 s <<< FAILURE! -- in com.interviewos.logging.LogLevelFilteringTest
   [ERROR] com.interviewos.logging.LogLevelFilteringTest.testMessagesBelowThresholdDiscarded -- Time elapsed: 0.003 s <<< ERROR!
   [ERROR] com.interviewos.logging.LogLevelFilteringTest.testMessagesAtOrAboveThresholdAppended -- Time elapsed: 0.003 s <<< ERROR!
   [ERROR] Tests run: 2, Failures: 0, Errors: 2, Skipped: 0, Time elapsed: 0.009 s <<< FAILURE! -- in com.interviewos.logging.LogManagerLifecycleTest
   [ERROR] com.interviewos.logging.LogManagerLifecycleTest.testRootConfigPropagation -- Time elapsed: 0.003 s <<< ERROR!
   [ERROR] com.interviewos.logging.LogManagerLifecycleTest.testIdempotentLoggerRetrieval -- Time elapsed: 0.002 s <<< ERROR!
   [ERROR] Errors: 
   [ERROR]   LogAppenderRoutingTest.testConvenienceMethodsRouteLevels:39 » UnsupportedOperation TODO: Implement Logger.log
   [ERROR]   LogAppenderRoutingTest.testMultipleAppendersReceiveMessage:24 » UnsupportedOperation TODO: Implement Logger.log
   [ERROR]   LogLevelFilteringTest.testMessagesAtOrAboveThresholdAppended:36 » UnsupportedOperation TODO: Implement Logger.log
   [ERROR]   LogLevelFilteringTest.testMessagesBelowThresholdDiscarded:22 » UnsupportedOperation TODO: Implement Logger.log
   [ERROR]   LogManagerLifecycleTest.testIdempotentLoggerRetrieval:18 » UnsupportedOperation TODO: Implement LogManager.getLogger
   [ERROR]   LogManagerLifecycleTest.testRootConfigPropagation:29 » UnsupportedOperation TODO: Implement LogManager.getLogger
   [ERROR] Tests run: 6, Failures: 0, Errors: 6, Skipped: 0
   [INFO] BUILD FAILURE
```

#### VP-3(b): Satisfiability with Solved Candidate Files
Overlaying solved candidate files (`Logger.java` and `LogManager.java`) on the workspace:
- **Exit Code**: 0 (BUILD SUCCESS)
- **Tests Run**: 6, Failures: 0, Errors: 0, Skipped: 0
- **Maven Log Output**:
```
=== VP-3(b): Satisfiability with Solved Candidate Files ===
Maven Exit Code: 0
STDOUT SUMMARY:
   [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.057 s -- in com.interviewos.logging.LogAppenderRoutingTest
   [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.006 s -- in com.interviewos.logging.LogLevelFilteringTest
   [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.006 s -- in com.interviewos.logging.LogManagerLifecycleTest
   [INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
   [INFO] BUILD SUCCESS
```

#### Solved Candidate Implementation Code (`lld-logging-framework`)

`src/main/java/com/interviewos/logging/service/Logger.java`:
```java
package com.interviewos.logging.service;

import com.interviewos.logging.appender.LogAppender;
import com.interviewos.logging.config.LoggerConfig;
import com.interviewos.logging.model.LogLevel;
import com.interviewos.logging.model.LogMessage;

public class Logger {
    private final String name;
    private volatile LoggerConfig config;

    public Logger(String name, LoggerConfig config) {
        this.name = name;
        this.config = config;
    }

    public String getName() { return name; }
    public LoggerConfig getConfig() { return config; }
    public void setConfig(LoggerConfig config) { this.config = config; }

    public void log(LogLevel level, String message) {
        if (config == null || level == null) return;
        if (level.isGreaterOrEqual(config.getMinLevel())) {
            LogMessage msg = new LogMessage(message, level, name);
            for (LogAppender appender : config.getAppenders()) {
                appender.append(msg);
            }
        }
    }

    public void debug(String message) {
        log(LogLevel.DEBUG, message);
    }

    public void info(String message) {
        log(LogLevel.INFO, message);
    }

    public void warn(String message) {
        log(LogLevel.WARN, message);
    }

    public void error(String message) {
        log(LogLevel.ERROR, message);
    }
}
```

`src/main/java/com/interviewos/logging/service/LogManager.java`:
```java
package com.interviewos.logging.service;

import com.interviewos.logging.config.LoggerConfig;
import com.interviewos.logging.model.LogLevel;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class LogManager {
    private static final LogManager INSTANCE = new LogManager();
    private final Map<String, Logger> loggers = new ConcurrentHashMap<>();
    private volatile LoggerConfig rootConfig = new LoggerConfig(LogLevel.INFO);

    private LogManager() {}

    public static LogManager getInstance() {
        return INSTANCE;
    }

    public Logger getLogger(String name) {
        return loggers.computeIfAbsent(name, n -> new Logger(n, rootConfig));
    }

    public LoggerConfig getRootConfig() {
        return rootConfig;
    }

    public void setRootConfig(LoggerConfig rootConfig) {
        this.rootConfig = rootConfig;
        for (Logger logger : loggers.values()) {
            logger.setConfig(rootConfig);
        }
    }
}
```

---

## 7. Four-Number Test Results (G3 Discipline)

Counts performed via own regex script `scratch/recount_numbers.py` scanning `question-bank-service/src/test/java`:

| Metric | Base Ref (`e2ae086`) | Post-Seed (`c213907`) | Delta | Explanation |
|---|---|---|---|---|
| **Test Files** | 7 | 8 | +1 | `LldCatalogSeedTest.java` |
| **Test Cases (`@Test`)** | 40 | 41 | +1 | 1 test method in `LldCatalogSeedTest.java` |
| **Assertions (`assert*`)** | 192 | 211 | +19 | 19 assertions in `LldCatalogSeedTest.java` |
| **Failures / Errors** | 0 | 0 | 0 | Clean pass across entire test suite |

Full Maven test execution:
- Command: `mvn test` in `question-bank-service`
- Tests run: 41, Failures: 0, Errors: 0, Skipped: 0
- Build Status: `BUILD SUCCESS` (12.276 s)

---

## 8. Originality & Copyright Declaration (VP-5)

1. **Topic Independence**: The 8 topics reflect standard software architecture concepts (Logging Framework, Pub-Sub Broker, Hotel Management, etc.).
2. **Statement Originality**: Every problem description was authored independently with original phrasing, unique functional requirement breakdowns (≥ 8 per problem), explicit non-goals, and custom scenario context. No sentences or distinctive passages were copied from `ashishps1/awesome-low-level-design` (GPL-3.0) or any unlicensed repository.
3. **Attribution**: Stored in `content/questions/lld/SOURCES.md` and referenced in frontmatter `source: inspired-by:takeuforward-prep-hub/lld/<slug>`.

---

## 9. Operator Manual Verification Protocol (VP-6)

To manually verify the newly seeded questions in a running instance:
1. Boot `question-bank-service` (`mvn spring-boot:run` or via docker-compose).
2. Issue HTTP request: `GET http://localhost:8081/api/questions/catalog` (or use internal client).
3. Verify `lld-logging-framework` is returned with `track: SPRING_LLD` and `status: PUBLISHED`.
4. Launch practice/interview session on `lld-logging-framework`:
   - Verify workspace loads `pom.xml`, `README.md`, skeletons, and editable files (`Logger.java`, `LogManager.java`).
   - Run tests against initial skeletons: observe 0 compile errors and expected test failures.
   - Implement candidate logic per VP-3(b) code: observe all tests passing.
