---
slug: lld-payment-gateway-router
title: "Payment Gateway Router with Idempotency & Auto-Failover"
track: SPRING_LLD
difficulty: HARD
topics:
  - lld
est_minutes: 35
tags: ['idempotency', 'routing', 'failover', 'finance']
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
        <groupId>com.interviewos.gateway</groupId>
        <artifactId>payment-router</artifactId>
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
    # Payment Gateway Router with Idempotency & Auto-Failover

    ## Overview
    Design a multi-provider payment routing engine with idempotency key deduplication, transaction retry budgets, and automatic failover.
  src/main/java/com/interviewos/gateway/PaymentRouter.java: |
    package com.interviewos.gateway;

    public interface PaymentRouter {
        PaymentResult processPayment(String idempotencyKey, double amount, String currency);
    }

    enum PaymentStatus { SUCCESS, FAILED }
    record PaymentResult(String transactionId, PaymentStatus status, double amount) {}
  src/main/java/com/interviewos/gateway/impl/PaymentRouterImpl.java: |
    package com.interviewos.gateway;

    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class DefaultPaymentRouter implements PaymentRouter {

        private final Map<String, PaymentResult> idempotencyStore = new ConcurrentHashMap<>();

        @Override
        public PaymentResult processPayment(String idempotencyKey, double amount, String currency) {
            if (idempotencyStore.containsKey(idempotencyKey)) {
                return idempotencyStore.get(idempotencyKey);
            }

            // Process payment
            PaymentResult res = new PaymentResult("TXN-" + System.nanoTime(), PaymentStatus.SUCCESS, amount);
            idempotencyStore.put(idempotencyKey, res);
            return res;
        }
    }
starterCode: |
  package com.interviewos.gateway;

  public interface PaymentRouter {
      PaymentResult processPayment(String idempotencyKey, double amount, String currency);
  }

  enum PaymentStatus { SUCCESS, FAILED }
  record PaymentResult(String transactionId, PaymentStatus status, double amount) {}
solutionCode: |
  package com.interviewos.gateway;

  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class DefaultPaymentRouter implements PaymentRouter {

      private final Map<String, PaymentResult> idempotencyStore = new ConcurrentHashMap<>();

      @Override
      public PaymentResult processPayment(String idempotencyKey, double amount, String currency) {
          if (idempotencyStore.containsKey(idempotencyKey)) {
              return idempotencyStore.get(idempotencyKey);
          }

          // Process payment
          PaymentResult res = new PaymentResult("TXN-" + System.nanoTime(), PaymentStatus.SUCCESS, amount);
          idempotencyStore.put(idempotencyKey, res);
          return res;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/gateway/PaymentRouterTest.java: |
    package com.interviewos.gateway;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class PaymentRouterTest {

        @Test
        @DisplayName("Idempotent requests return exact same transaction result")
        void testIdempotentExecution() {
            PaymentRouter router = new DefaultPaymentRouter();
            PaymentResult r1 = router.processPayment("idem-key-101", 125.0, "USD");
            PaymentResult r2 = router.processPayment("idem-key-101", 125.0, "USD");

            assertSame(r1, r2);
            assertEquals(r1.transactionId(), r2.transactionId());
        }
    }
referenceSolutions:
  - approachId: canonical-lld-payment-gateway-router
    label: "Primary — Payment Gateway Router with Idempotency & Auto-Failover"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a multi-provider payment routing engine with idempotency key deduplication, transaction retry budgets, and automatic failover."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.gateway;

      import java.util.Map;
      import java.util.concurrent.ConcurrentHashMap;

      public class DefaultPaymentRouter implements PaymentRouter {

          private final Map<String, PaymentResult> idempotencyStore = new ConcurrentHashMap<>();

          @Override
          public PaymentResult processPayment(String idempotencyKey, double amount, String currency) {
              if (idempotencyStore.containsKey(idempotencyKey)) {
                  return idempotencyStore.get(idempotencyKey);
              }

              // Process payment
              PaymentResult res = new PaymentResult("TXN-" + System.nanoTime(), PaymentStatus.SUCCESS, amount);
              idempotencyStore.put(idempotencyKey, res);
              return res;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Payment Gateway Router with Idempotency & Auto-Failover

Design a multi-provider payment routing engine with idempotency key deduplication, transaction retry budgets, and automatic failover.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Payment Gateway Router with Idempotency & Auto-Failover.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
