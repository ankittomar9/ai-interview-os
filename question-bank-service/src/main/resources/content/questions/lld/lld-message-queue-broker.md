---
slug: lld-message-queue-broker
title: "Partitioned In-Memory Message Broker"
track: SPRING_LLD
difficulty: HARD
topics:
  - lld
est_minutes: 35
tags: ['message-broker', 'pubsub', 'concurrency', 'queue']
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
        <groupId>com.interviewos.broker</groupId>
        <artifactId>queue-broker</artifactId>
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
    # Partitioned In-Memory Message Broker

    ## Overview
    Design an in-memory partitioned message broker supporting topic creation, sequential message append, consumer group offset management, and at-least-once delivery.
  src/main/java/com/interviewos/broker/MessageBroker.java: |
    package com.interviewos.broker;

    import java.util.List;

    public interface MessageBroker {
        void publish(String topic, String message);
        List<String> consume(String topic, String consumerGroup, int maxMessages);
    }
  src/main/java/com/interviewos/broker/impl/MessageBrokerImpl.java: |
    package com.interviewos.broker;

    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;

    public class DefaultMessageBroker implements MessageBroker {

        private final Map<String, List<String>> topicLogs = new ConcurrentHashMap<>();
        private final Map<String, Map<String, Integer>> consumerOffsets = new ConcurrentHashMap<>();

        @Override
        public synchronized void publish(String topic, String message) {
            topicLogs.computeIfAbsent(topic, k -> new ArrayList<>()).add(message);
        }

        @Override
        public synchronized List<String> consume(String topic, String consumerGroup, int maxMessages) {
            List<String> logs = topicLogs.getOrDefault(topic, Collections.emptyList());
            Map<String, Integer> offsets = consumerOffsets.computeIfAbsent(topic, k -> new HashMap<>());
            int currentOffset = offsets.getOrDefault(consumerGroup, 0);

            List<String> result = new ArrayList<>();
            while (currentOffset < logs.size() && result.size() < maxMessages) {
                result.add(logs.get(currentOffset));
                currentOffset++;
            }
            offsets.put(consumerGroup, currentOffset);
            return result;
        }
    }
starterCode: |
  package com.interviewos.broker;

  import java.util.List;

  public interface MessageBroker {
      void publish(String topic, String message);
      List<String> consume(String topic, String consumerGroup, int maxMessages);
  }
solutionCode: |
  package com.interviewos.broker;

  import java.util.*;
  import java.util.concurrent.ConcurrentHashMap;

  public class DefaultMessageBroker implements MessageBroker {

      private final Map<String, List<String>> topicLogs = new ConcurrentHashMap<>();
      private final Map<String, Map<String, Integer>> consumerOffsets = new ConcurrentHashMap<>();

      @Override
      public synchronized void publish(String topic, String message) {
          topicLogs.computeIfAbsent(topic, k -> new ArrayList<>()).add(message);
      }

      @Override
      public synchronized List<String> consume(String topic, String consumerGroup, int maxMessages) {
          List<String> logs = topicLogs.getOrDefault(topic, Collections.emptyList());
          Map<String, Integer> offsets = consumerOffsets.computeIfAbsent(topic, k -> new HashMap<>());
          int currentOffset = offsets.getOrDefault(consumerGroup, 0);

          List<String> result = new ArrayList<>();
          while (currentOffset < logs.size() && result.size() < maxMessages) {
              result.add(logs.get(currentOffset));
              currentOffset++;
          }
          offsets.put(consumerGroup, currentOffset);
          return result;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/broker/MessageBrokerTest.java: |
    package com.interviewos.broker;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import java.util.List;
    import static org.junit.jupiter.api.Assertions.*;

    public class MessageBrokerTest {

        @Test
        @DisplayName("Publish and consume with consumer group offset tracking")
        void testMessageQueueOffsets() {
            MessageBroker broker = new DefaultMessageBroker();
            broker.publish("orders", "order-1");
            broker.publish("orders", "order-2");
            broker.publish("orders", "order-3");

            List<String> batch1 = broker.consume("orders", "grp-A", 2);
            assertEquals(List.of("order-1", "order-2"), batch1);

            List<String> batch2 = broker.consume("orders", "grp-A", 2);
            assertEquals(List.of("order-3"), batch2);

            // Independent consumer group starts from beginning
            List<String> batchB = broker.consume("orders", "grp-B", 2);
            assertEquals(List.of("order-1", "order-2"), batchB);
        }
    }
referenceSolutions:
  - approachId: canonical-lld-message-queue-broker
    label: "Primary — Partitioned In-Memory Message Broker"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an in-memory partitioned message broker supporting topic creation, sequential message append, consumer group offset management, and at-least-once delivery."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.broker;

      import java.util.*;
      import java.util.concurrent.ConcurrentHashMap;

      public class DefaultMessageBroker implements MessageBroker {

          private final Map<String, List<String>> topicLogs = new ConcurrentHashMap<>();
          private final Map<String, Map<String, Integer>> consumerOffsets = new ConcurrentHashMap<>();

          @Override
          public synchronized void publish(String topic, String message) {
              topicLogs.computeIfAbsent(topic, k -> new ArrayList<>()).add(message);
          }

          @Override
          public synchronized List<String> consume(String topic, String consumerGroup, int maxMessages) {
              List<String> logs = topicLogs.getOrDefault(topic, Collections.emptyList());
              Map<String, Integer> offsets = consumerOffsets.computeIfAbsent(topic, k -> new HashMap<>());
              int currentOffset = offsets.getOrDefault(consumerGroup, 0);

              List<String> result = new ArrayList<>();
              while (currentOffset < logs.size() && result.size() < maxMessages) {
                  result.add(logs.get(currentOffset));
                  currentOffset++;
              }
              offsets.put(consumerGroup, currentOffset);
              return result;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Partitioned In-Memory Message Broker

Design an in-memory partitioned message broker supporting topic creation, sequential message append, consumer group offset management, and at-least-once delivery.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Partitioned In-Memory Message Broker.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
