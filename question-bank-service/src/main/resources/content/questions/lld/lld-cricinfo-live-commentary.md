---
slug: lld-cricinfo-live-commentary
title: "Live Sports Scorecard & Commentary Stream Engine"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['observer', 'scorecard', 'streaming', 'state-machine']
buildProfile: maven-workspace
source: ai-generated:v1
status: PUBLISHED
hints:
  - "Decouple interfaces from concrete implementations using standard design patterns."
  - "Ensure thread safety across shared data structures using concurrent collections or synchronization."
  - "Keep domain classes cohesive with clean single responsibilities."
coaching:
  presentationTips:
    - "Clarify functional requirements and thread-safety expectations before writing code."
    - "Identify core design patterns (Factory, Strategy, Observer, State, Composite) explicitly."
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.sports</groupId>
        <artifactId>scorecard-engine</artifactId>
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
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>3.5.2</version>
                </plugin>
            </plugins>
        </build>
    </project>
  README.md: |
    # Live Sports Scorecard & Commentary Stream Engine

    ## Overview
    Design a sports scorecard and commentary system tracking runs, wickets, extras, and broadcasting ball-by-ball commentary to subscribers.
  src/main/java/com/interviewos/sports/MatchScorecardEngine.java: |
    package com.interviewos.sports;

    public interface MatchScorecardEngine {
        void recordBall(int runs, boolean isWicket, String commentary);
        MatchSummary getSummary();
    }

    record MatchSummary(int runs, int wickets, int oversCompleted, int ballsInCurrentOver) {}
  src/main/java/com/interviewos/sports/impl/MatchScorecardEngineImpl.java: |
    package com.interviewos.sports;

    public class CricketScorecardEngine implements MatchScorecardEngine {

        private int totalRuns = 0;
        private int wickets = 0;
        private int legalBalls = 0;

        @Override
        public synchronized void recordBall(int runs, boolean isWicket, String commentary) {
            this.totalRuns += runs;
            if (isWicket) this.wickets++;
            this.legalBalls++;
        }

        @Override
        public synchronized MatchSummary getSummary() {
            return new MatchSummary(totalRuns, wickets, legalBalls / 6, legalBalls % 6);
        }
    }
starterCode: |
  package com.interviewos.sports;

  public interface MatchScorecardEngine {
      void recordBall(int runs, boolean isWicket, String commentary);
      MatchSummary getSummary();
  }

  record MatchSummary(int runs, int wickets, int oversCompleted, int ballsInCurrentOver) {}
solutionCode: |
  package com.interviewos.sports;

  public class CricketScorecardEngine implements MatchScorecardEngine {

      private int totalRuns = 0;
      private int wickets = 0;
      private int legalBalls = 0;

      @Override
      public synchronized void recordBall(int runs, boolean isWicket, String commentary) {
          this.totalRuns += runs;
          if (isWicket) this.wickets++;
          this.legalBalls++;
      }

      @Override
      public synchronized MatchSummary getSummary() {
          return new MatchSummary(totalRuns, wickets, legalBalls / 6, legalBalls % 6);
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/sports/MatchScorecardEngineTest.java: |
    package com.interviewos.sports;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class ScorecardEngineTest {

        @Test
        @DisplayName("Track runs and wickets cumulatively")
        void testScorecardTracking() {
            MatchScorecardEngine engine = new CricketScorecardEngine();
            engine.recordBall(4, false, "Boundary through covers");
            engine.recordBall(0, true, "Bowled clean");
            engine.recordBall(6, false, "Six over long on");

            MatchSummary summary = engine.getSummary();
            assertEquals(10, summary.runs());
            assertEquals(1, summary.wickets());
            assertEquals(0, summary.oversCompleted());
            assertEquals(3, summary.ballsInCurrentOver());
        }
    }
referenceSolutions:
  - approachId: canonical-lld-cricinfo-live-commentary
    label: "Primary — Live Sports Scorecard & Commentary Stream Engine"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a sports scorecard and commentary system tracking runs, wickets, extras, and broadcasting ball-by-ball commentary to subscribers."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.sports;

      public class CricketScorecardEngine implements MatchScorecardEngine {

          private int totalRuns = 0;
          private int wickets = 0;
          private int legalBalls = 0;

          @Override
          public synchronized void recordBall(int runs, boolean isWicket, String commentary) {
              this.totalRuns += runs;
              if (isWicket) this.wickets++;
              this.legalBalls++;
          }

          @Override
          public synchronized MatchSummary getSummary() {
              return new MatchSummary(totalRuns, wickets, legalBalls / 6, legalBalls % 6);
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Live Sports Scorecard & Commentary Stream Engine

Design a sports scorecard and commentary system tracking runs, wickets, extras, and broadcasting ball-by-ball commentary to subscribers.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Live Sports Scorecard & Commentary Stream Engine.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
