---
slug: lld-rate-limiter-token-bucket
title: "In-Memory Rate Limiter using Token Bucket Strategy"
track: SPRING_LLD
difficulty: EASY
topics:
  - lld
est_minutes: 35
tags: ['token-bucket', 'rate-limiter', 'concurrency', 'algorithms']
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
        <groupId>com.interviewos.ratelimiter</groupId>
        <artifactId>rate-limiter</artifactId>
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
    # In-Memory Rate Limiter using Token Bucket Strategy

    ## Overview
    Design an extensible rate limiter enforcing per-client request limits using Token Bucket and Leaky Bucket strategies.
  src/main/java/com/interviewos/ratelimiter/RateLimiter.java: |
    package com.interviewos.ratelimiter;

    public interface RateLimiter {
        boolean allowRequest(String clientId);
    }
  src/main/java/com/interviewos/ratelimiter/impl/RateLimiterImpl.java: |
    package com.interviewos.ratelimiter;

    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class TokenBucketRateLimiter implements RateLimiter {

        private final long capacity;
        private final double refillRatePerSecond;
        private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

        public TokenBucketRateLimiter(long capacity, double refillRatePerSecond) {
            this.capacity = capacity;
            this.refillRatePerSecond = refillRatePerSecond;
        }

        private static class Bucket {
            double tokens;
            long lastRefillTimestamp;

            Bucket(long capacity) {
                this.tokens = capacity;
                this.lastRefillTimestamp = System.currentTimeMillis();
            }

            synchronized boolean tryConsume(long capacity, double refillRate) {
                long now = System.currentTimeMillis();
                double seconds = (now - lastRefillTimestamp) / 1000.0;
                tokens = Math.min(capacity, tokens + seconds * refillRate);
                lastRefillTimestamp = now;

                if (tokens >= 1.0) {
                    tokens -= 1.0;
                    return true;
                }
                return false;
            }
        }

        @Override
        public boolean allowRequest(String clientId) {
            Bucket bucket = buckets.computeIfAbsent(clientId, k -> new Bucket(capacity));
            return bucket.tryConsume(capacity, refillRatePerSecond);
        }
    }
starterCode: |
  package com.interviewos.ratelimiter;

  public interface RateLimiter {
      boolean allowRequest(String clientId);
  }
solutionCode: |
  package com.interviewos.ratelimiter;

  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class TokenBucketRateLimiter implements RateLimiter {

      private final long capacity;
      private final double refillRatePerSecond;
      private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

      public TokenBucketRateLimiter(long capacity, double refillRatePerSecond) {
          this.capacity = capacity;
          this.refillRatePerSecond = refillRatePerSecond;
      }

      private static class Bucket {
          double tokens;
          long lastRefillTimestamp;

          Bucket(long capacity) {
              this.tokens = capacity;
              this.lastRefillTimestamp = System.currentTimeMillis();
          }

          synchronized boolean tryConsume(long capacity, double refillRate) {
              long now = System.currentTimeMillis();
              double seconds = (now - lastRefillTimestamp) / 1000.0;
              tokens = Math.min(capacity, tokens + seconds * refillRate);
              lastRefillTimestamp = now;

              if (tokens >= 1.0) {
                  tokens -= 1.0;
                  return true;
              }
              return false;
          }
      }

      @Override
      public boolean allowRequest(String clientId) {
          Bucket bucket = buckets.computeIfAbsent(clientId, k -> new Bucket(capacity));
          return bucket.tryConsume(capacity, refillRatePerSecond);
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/ratelimiter/RateLimiterTest.java: |
    package com.interviewos.ratelimiter;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class RateLimiterTest {

        @Test
        @DisplayName("Token bucket allows requests up to capacity")
        void testCapacityAllowance() {
            RateLimiter limiter = new TokenBucketRateLimiter(3, 1.0);
            assertTrue(limiter.allowRequest("c1"));
            assertTrue(limiter.allowRequest("c1"));
            assertTrue(limiter.allowRequest("c1"));
            assertFalse(limiter.allowRequest("c1"));
        }

        @Test
        @DisplayName("Different clients have isolated rate limits")
        void testClientIsolation() {
            RateLimiter limiter = new TokenBucketRateLimiter(1, 0.5);
            assertTrue(limiter.allowRequest("alice"));
            assertFalse(limiter.allowRequest("alice"));
            assertTrue(limiter.allowRequest("bob"));
        }
    }
referenceSolutions:
  - approachId: canonical-lld-rate-limiter-token-bucket
    label: "Primary — In-Memory Rate Limiter using Token Bucket Strategy"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an extensible rate limiter enforcing per-client request limits using Token Bucket and Leaky Bucket strategies."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.ratelimiter;

      import java.util.Map;
      import java.util.concurrent.ConcurrentHashMap;

      public class TokenBucketRateLimiter implements RateLimiter {

          private final long capacity;
          private final double refillRatePerSecond;
          private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

          public TokenBucketRateLimiter(long capacity, double refillRatePerSecond) {
              this.capacity = capacity;
              this.refillRatePerSecond = refillRatePerSecond;
          }

          private static class Bucket {
              double tokens;
              long lastRefillTimestamp;

              Bucket(long capacity) {
                  this.tokens = capacity;
                  this.lastRefillTimestamp = System.currentTimeMillis();
              }

              synchronized boolean tryConsume(long capacity, double refillRate) {
                  long now = System.currentTimeMillis();
                  double seconds = (now - lastRefillTimestamp) / 1000.0;
                  tokens = Math.min(capacity, tokens + seconds * refillRate);
                  lastRefillTimestamp = now;

                  if (tokens >= 1.0) {
                      tokens -= 1.0;
                      return true;
                  }
                  return false;
              }
          }

          @Override
          public boolean allowRequest(String clientId) {
              Bucket bucket = buckets.computeIfAbsent(clientId, k -> new Bucket(capacity));
              return bucket.tryConsume(capacity, refillRatePerSecond);
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: In-Memory Rate Limiter using Token Bucket Strategy

Design an extensible rate limiter enforcing per-client request limits using Token Bucket and Leaky Bucket strategies.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining In-Memory Rate Limiter using Token Bucket Strategy.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
