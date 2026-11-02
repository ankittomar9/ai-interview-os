---
slug: lld-circuit-breaker-resilience
title: "State-Machine Circuit Breaker with Half-Open Transitions"
track: SPRING_LLD
difficulty: HARD
topics:
  - lld
est_minutes: 35
tags: ['circuit-breaker', 'state-machine', 'resilience', 'concurrency']
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
        <groupId>com.interviewos.circuitbreaker</groupId>
        <artifactId>circuit-breaker</artifactId>
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
  README.md: |
    # State-Machine Circuit Breaker with Half-Open Transitions

    ## Overview
    Design a resilient circuit breaker supporting CLOSED, OPEN, and HALF_OPEN states based on consecutive failure thresholds and cooldown windows.
  src/main/java/com/interviewos/circuitbreaker/CircuitBreaker.java: |
    package com.interviewos.circuitbreaker;

    import java.util.function.Supplier;

    public interface CircuitBreaker {
        <T> T execute(Supplier<T> action) throws Exception;
        CircuitState getState();
    }

    enum CircuitState { CLOSED, OPEN, HALF_OPEN }
  src/main/java/com/interviewos/circuitbreaker/impl/CircuitBreakerImpl.java: |
    package com.interviewos.circuitbreaker;

    import java.util.function.Supplier;

    public class DefaultCircuitBreaker implements CircuitBreaker {

        private CircuitState state = CircuitState.CLOSED;
        private int consecutiveFailures = 0;
        private final int failureThreshold;
        private final long cooldownMillis;
        private long lastStateTransitionTime = System.currentTimeMillis();

        public DefaultCircuitBreaker(int failureThreshold, long cooldownMillis) {
            this.failureThreshold = failureThreshold;
            this.cooldownMillis = cooldownMillis;
        }

        @Override
        public synchronized <T> T execute(Supplier<T> action) throws Exception {
            checkStateTransition();
            if (state == CircuitState.OPEN) {
                throw new IllegalStateException("Circuit is OPEN");
            }

            try {
                T result = action.get();
                onSuccess();
                return result;
            } catch (Exception ex) {
                onFailure();
                throw ex;
            }
        }

        private void checkStateTransition() {
            if (state == CircuitState.OPEN && System.currentTimeMillis() - lastStateTransitionTime >= cooldownMillis) {
                state = CircuitState.HALF_OPEN;
            }
        }

        private void onSuccess() {
            if (state == CircuitState.HALF_OPEN) {
                state = CircuitState.CLOSED;
            }
            consecutiveFailures = 0;
        }

        private void onFailure() {
            consecutiveFailures++;
            if (consecutiveFailures >= failureThreshold || state == CircuitState.HALF_OPEN) {
                state = CircuitState.OPEN;
                lastStateTransitionTime = System.currentTimeMillis();
            }
        }

        @Override
        public synchronized CircuitState getState() {
            checkStateTransition();
            return state;
        }
    }
starterCode: |
  package com.interviewos.circuitbreaker;

  import java.util.function.Supplier;

  public interface CircuitBreaker {
      <T> T execute(Supplier<T> action) throws Exception;
      CircuitState getState();
  }

  enum CircuitState { CLOSED, OPEN, HALF_OPEN }
solutionCode: |
  package com.interviewos.circuitbreaker;

  import java.util.function.Supplier;

  public class DefaultCircuitBreaker implements CircuitBreaker {

      private CircuitState state = CircuitState.CLOSED;
      private int consecutiveFailures = 0;
      private final int failureThreshold;
      private final long cooldownMillis;
      private long lastStateTransitionTime = System.currentTimeMillis();

      public DefaultCircuitBreaker(int failureThreshold, long cooldownMillis) {
          this.failureThreshold = failureThreshold;
          this.cooldownMillis = cooldownMillis;
      }

      @Override
      public synchronized <T> T execute(Supplier<T> action) throws Exception {
          checkStateTransition();
          if (state == CircuitState.OPEN) {
              throw new IllegalStateException("Circuit is OPEN");
          }

          try {
              T result = action.get();
              onSuccess();
              return result;
          } catch (Exception ex) {
              onFailure();
              throw ex;
          }
      }

      private void checkStateTransition() {
          if (state == CircuitState.OPEN && System.currentTimeMillis() - lastStateTransitionTime >= cooldownMillis) {
              state = CircuitState.HALF_OPEN;
          }
      }

      private void onSuccess() {
          if (state == CircuitState.HALF_OPEN) {
              state = CircuitState.CLOSED;
          }
          consecutiveFailures = 0;
      }

      private void onFailure() {
          consecutiveFailures++;
          if (consecutiveFailures >= failureThreshold || state == CircuitState.HALF_OPEN) {
              state = CircuitState.OPEN;
              lastStateTransitionTime = System.currentTimeMillis();
          }
      }

      @Override
      public synchronized CircuitState getState() {
          checkStateTransition();
          return state;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/circuitbreaker/CircuitBreakerTest.java: |
    package com.interviewos.circuitbreaker;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class CircuitBreakerTest {

        @Test
        @DisplayName("Trips to OPEN on consecutive failures")
        void testOpenOnFailures() {
            CircuitBreaker cb = new DefaultCircuitBreaker(2, 500);
            assertEquals(CircuitState.CLOSED, cb.getState());

            assertThrows(RuntimeException.class, () -> cb.execute(() -> { throw new RuntimeException("fail 1"); }));
            assertEquals(CircuitState.CLOSED, cb.getState());

            assertThrows(RuntimeException.class, () -> cb.execute(() -> { throw new RuntimeException("fail 2"); }));
            assertEquals(CircuitState.OPEN, cb.getState());

            assertThrows(IllegalStateException.class, () -> cb.execute(() -> "success"));
        }
    }
referenceSolutions:
  - approachId: canonical-lld-circuit-breaker-resilience
    label: "Primary — State-Machine Circuit Breaker with Half-Open Transitions"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a resilient circuit breaker supporting CLOSED, OPEN, and HALF_OPEN states based on consecutive failure thresholds and cooldown windows."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.circuitbreaker;

      import java.util.function.Supplier;

      public class DefaultCircuitBreaker implements CircuitBreaker {

          private CircuitState state = CircuitState.CLOSED;
          private int consecutiveFailures = 0;
          private final int failureThreshold;
          private final long cooldownMillis;
          private long lastStateTransitionTime = System.currentTimeMillis();

          public DefaultCircuitBreaker(int failureThreshold, long cooldownMillis) {
              this.failureThreshold = failureThreshold;
              this.cooldownMillis = cooldownMillis;
          }

          @Override
          public synchronized <T> T execute(Supplier<T> action) throws Exception {
              checkStateTransition();
              if (state == CircuitState.OPEN) {
                  throw new IllegalStateException("Circuit is OPEN");
              }

              try {
                  T result = action.get();
                  onSuccess();
                  return result;
              } catch (Exception ex) {
                  onFailure();
                  throw ex;
              }
          }

          private void checkStateTransition() {
              if (state == CircuitState.OPEN && System.currentTimeMillis() - lastStateTransitionTime >= cooldownMillis) {
                  state = CircuitState.HALF_OPEN;
              }
          }

          private void onSuccess() {
              if (state == CircuitState.HALF_OPEN) {
                  state = CircuitState.CLOSED;
              }
              consecutiveFailures = 0;
          }

          private void onFailure() {
              consecutiveFailures++;
              if (consecutiveFailures >= failureThreshold || state == CircuitState.HALF_OPEN) {
                  state = CircuitState.OPEN;
                  lastStateTransitionTime = System.currentTimeMillis();
              }
          }

          @Override
          public synchronized CircuitState getState() {
              checkStateTransition();
              return state;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: State-Machine Circuit Breaker with Half-Open Transitions

Design a resilient circuit breaker supporting CLOSED, OPEN, and HALF_OPEN states based on consecutive failure thresholds and cooldown windows.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining State-Machine Circuit Breaker with Half-Open Transitions.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
