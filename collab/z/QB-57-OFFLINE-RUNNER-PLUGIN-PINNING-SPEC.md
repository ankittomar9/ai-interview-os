# QB-57 — Offline Candidate-Build Determinism (LLD Runner Plugin Pinning)

| Field | Value |
|---|---|
| **Task ID** | QB-57 |
| **Type** | Hardening spec (latent-defect elimination; receipts FROZEN) |
| **Author** | Z.ai (audit lane), operator-directed ("go ahead", 2026-11-02) |
| **Status** | READY FOR EXECUTION |
| **Base commit** | `977d68d` (master at authoring). Branch from **current** `origin/master`; gates are commit-relative |
| **Backlog origin** | Gemini platform backlog item 2 ("offline Maven plugin pinning"). **Evidence-corrected by Z — see S1.5: no live failure reproduces on master; the defect is latent drift** |
| **Protocol** | AGENTS.md G10 two-touch: single pass, pre-authorized merge on green gates, one report, Z audits post-merge |

---

## S0 — Discipline

1. **Single-pass execution; pre-authorized merge (G10.3).** Execute S3 entirely in ONE commit; merge without waiting for Z **iff every S6 condition is machine-green**. Otherwise: stop, push, report, wait.
2. **Receipts FROZEN this time**: static `116 / 680 / 2605 / 2`, QBS executed `41 / 0F / 0S`. No test files are in scope; a moving digit = FAIL unless it is a discovered pre-existing defect (then: stop and report).
3. G3/G4 vocabulary applies (executed vs static, honest judge).
4. No improvisation; anything not in S3 is out of scope.

---

## S1 — Evidence (all machine-verified by Z at `977d68d`, 2026-11-02)

**S1.1 Runner architecture.** `docker/lld-runner/Dockerfile`: `FROM maven:3.9-eclipse-temurin-21` (**floating minor tag**), warms `~/.m2` by building `skeleton-pom.xml` (parent `spring-boot-starter-parent:3.4.1`; surefire 3.5.2 + `surefire-junit-platform` 3.5.2 declared) via `mvn -B dependency:go-offline dependency:resolve-plugins && mvn -B test`. `CMD ["mvn","-o","-B","test"]`. Image `ai-interview-os/lld-runner:latest` (compose `lld-runner-build`, profile `build-images`), consumed by ISS via `RUNNER_MAVEN_IMAGE`.

**S1.2 Warm-cache plugin pins** (Boot 3.4.1 `pluginManagement`): `maven-resources-plugin 3.3.1` · `maven-compiler-plugin 3.13.0` · `maven-surefire-plugin 3.5.2`.

**S1.3 Candidate-workspace POM census.** 41 question markdowns embed a `starterFiles` → `pom.xml` (YAML block scalar, 4-space base indent): **40 LLD** + **1 agentic** (`agentic-mcp-order-service.md`). ALL 41 pin `maven-surefire-plugin 3.5.2`. ONLY the agentic pom additionally pins `maven-resources-plugin 3.3.1` + `maven-compiler-plugin 3.13.0`. The **40 LLD poms declare NO parent and NO resources/compiler plugins** → those versions come from Maven's internal default lifecycle bindings (a function of the Maven version inside the image).

**S1.4 Fallback scaffold.** `WorkspaceProvisionerService.createFallbackScaffold()` embeds a pom pinning compiler 3.13.0 + surefire 3.5.2 — `maven-resources-plugin` **UNPINNED** (same default-bindings dependency).

**S1.5 Z reproduction (honest judge, 2026-11-02).** Dockerfile-equivalent warm cache built in a scratch repo (132 MB; `go-offline` exit 0, `resolve-plugins` exit 0, warm `test` exit 0). An exact LLD-pom-clone candidate (no parent, `junit-jupiter 5.11.4`, surefire-only pin) then ran `mvn -o -B test` against that cache: **BUILD SUCCESS (exit 0)** on Maven 3.9.9. Fully-pinned control: **BUILD SUCCESS**. → **No live failure on current master.** On Maven 3.9.9 the default bindings (resources 3.3.1, compiler 3.13.0) coincide with the Boot 3.4.1 warm pins, so offline resolution succeeds.

**S1.6 The actual defect: drift.** The Dockerfile's `maven:3.9` is floating. Default-binding plugin versions change across Maven minor releases. The warm cache is frozen at image-build time (Boot 3.4.1 pins). Any rebuild that pulls a `maven:3.9.x` whose defaults ≠ those pins breaks **all 40 LLD candidate builds offline** — the runner's sole purpose — with no code change on master. The agentic pom's existing pins are consistent with this class of failure having been hit once already.

---

## S2 — Problem statement

1. **40 LLD embedded poms** depend on Maven default-bindings for `maven-resources-plugin`/`maven-compiler-plugin` — not deterministic across image rebuilds.
2. **Fallback scaffold pom** leaves `maven-resources-plugin` to the same mechanism.
3. **`docker/lld-runner/Dockerfile` base image floats** (`maven:3.9`), making the default bindings a function of build date.

## S3 — Change spec (exhaustive)

**S3.1 — 40 LLD markdowns** (`question-bank-service/src/main/resources/content/questions/lld/*.md`, every file whose embedded pom pins ONLY surefire): insert the following two plugin blocks into the embedded pom's `<build><plugins>` **immediately BEFORE the existing `maven-surefire-plugin` block**, preserving the block-scalar indentation exactly (same 16/20-space pattern as the existing surefire block):

```xml
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-resources-plugin</artifactId>
                    <version>3.3.1</version>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.13.0</version>
                </plugin>
```

**Touch NOTHING else in the markdown** — no frontmatter changes, no reformatting, no whitespace normalization outside the inserted lines.

**S3.2 — Fallback scaffold** (`interview-session-service/.../workspace/service/WorkspaceProvisionerService.java`, the `createFallbackScaffold` text block): insert the same `maven-resources-plugin 3.3.1` block before the existing compiler block, matching the text-block indentation.

**S3.3 — `docker/lld-runner/Dockerfile`**: `FROM maven:3.9-eclipse-temurin-21` → `FROM maven:3.9.9-eclipse-temurin-21`.

**S3.4 — Version authority rule.** Candidate-pom pins MUST equal the skeleton warm-cache versions (S1.2). If `skeleton-pom.xml`'s parent is ever bumped, the 41 candidate pins must be re-synced in the same change. (Spec note only — no code change.)

**S3.5 — Explicitly NO changes to**: `agentic-mcp-order-service.md` (already fully pinned), `skeleton-pom.xml`, `docker-compose*.yaml`, `ContentValidator`, `QuestionMarkdownParser`, question taxonomy, hidden tests, catalog counts.

---

## S4 — Verification gates (executor, machine)

1. **File-set gate**: exactly **42 files** changed: the 40 LLD markdowns + `WorkspaceProvisionerService.java` + `docker/lld-runner/Dockerfile`.
2. **Parse gate** (script below, run from repo root; exit 0 required): every one of the 41 embedded poms + the fallback pom parses and pins the trio `resources 3.3.1 / compiler 3.13.0 / surefire 3.5.2`.
3. **Receipt gate**: `count-tests.sh --markdown` = `116 / 680 / 2605 / 2`; `mvn -pl question-bank-service surefire:test` executed `41 / 0F / 0S` (proves ContentValidator/ingestion still green over the edited markdowns).
4. **Offline E2E gate** (docker; the real proof): build the runner, run the spec's candidate fixture inside it:
   ```bash
   docker compose --profile build-images build lld-runner-build
   docker run --rm -v <ABSOLUTE_PATH_TO>/qb57-fixture:/workspace ai-interview-os/lld-runner:latest
   ```
   → exit 0, `BUILD SUCCESS`, `Tests run: 1, Failures: 0`. The fixture (appendix A) is an exact post-fix LLD-pom-clone.
5. **Diff hygiene gate**: per markdown, `git diff` shows exactly ONE hunk (the plugin insertion); the Java file and Dockerfile one hunk each.

**Parse-gate script**:
```python
import re, glob, sys
import yaml, xml.etree.ElementTree as ET
TRIO = {'maven-resources-plugin':'3.3.1','maven-compiler-plugin':'3.13.0','maven-surefire-plugin':'3.5.2'}
bad = []
for md in glob.glob('question-bank-service/src/main/resources/content/questions/**/*.md', recursive=True):
    text = open(md, encoding='utf-8').read()
    for m in re.finditer(r'<project[\s\S]*?</project>', text):
        pom = m.group(0)
        if '<modelVersion>' not in pom: continue
        try: root = ET.fromstring(pom)
        except ET.ParseError as e: bad.append((md, f'PARSE {e}')); continue
        got = {}
        for p in root.iter('{http://maven.apache.org/POM/4.0.0}plugin'):
            a = p.findtext('{http://maven.apache.org/POM/4.0.0}artifactId')
            v = p.findtext('{http://maven.apache.org/POM/4.0.0}version')
            if a in TRIO: got[a] = v
        if got != TRIO: bad.append((md, f'PINS {got}'))
        if len(text.split('<project')) > 2: bad.append((md, 'MULTIPLE project blocks'))
print('BAD:', bad) if bad else print('ALL 41 EMBEDDED POMS PIN THE TRIO')
sys.exit(1 if bad else 0)
```
(The fallback pom is covered by the S6 checklist + visual diff; it is a Java string literal.)

---

## S5 — Prohibitions

No question content additions/removals (catalog stays 475 PUBLISHED); no taxonomy edits; no skeleton parent bump; no markdown reformatting beyond the inserted lines; no changes to `count-tests.sh`, `docs/`, `collab/**`; no IDE auto-format on the Java file (single hunk only).

---

## S6 — Single pass & merge pre-authorization

ONE commit: `fix(qb57): pin candidate-workspace lifecycle plugins + runner base image (offline determinism)`. Merge to `master` without waiting for Z **iff all five S4 gates are machine-green**, then post `collab/gemini/QB-57-REPORT.md` (same shape as QB-56's: checklist ✓/✗, manifest with +/−, receipts, parse-gate + E2E-gate output pasted, deviations). Any ✗ → stop, push, report, wait.

**Z post-merge audit will additionally verify**: warm-cache reproduction (fresh scratch repo, offline candidate build — as executed in S1.5), hunk-level diff review, and receipt reproduction.

---

## S7 — Non-goals

SQL runner determinism; DSA/Judge0 path; `count-tests.sh` scope expansion; host-maven documentation; agentic-track content work; skeleton parent upgrade.

---

## Appendix A — Offline E2E fixture

`qb57-fixture/pom.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.interviewos.lld</groupId>
    <artifactId>qb57-fixture</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.jupiter.version>5.11.4</junit.jupiter.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.jupiter.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.3.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.5.2</version>
            </plugin>
        </plugins>
    </build>
</project>
```
`qb57-fixture/src/main/java/com/interviewos/workspace/Solution.java`:
```java
package com.interviewos.workspace;
public class Solution {
    public int add(int a, int b) { return a + b; }
}
```
`qb57-fixture/src/test/java/SolutionTest.java`:
```java
import com.interviewos.workspace.Solution;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
class SolutionTest {
    @Test
    void adds() { assertEquals(4, new Solution().add(2, 2)); }
}
```
