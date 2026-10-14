---
slug: lld-notification-service-fanout
title: "Multi-Channel Notification Dispatcher"
track: SPRING_LLD
difficulty: EASY
topics:
  - lld
est_minutes: 35
tags: ['observer-pattern', 'strategy-pattern', 'notifications', 'dispatch']
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
        <groupId>com.interviewos.notification</groupId>
        <artifactId>notification-service</artifactId>
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
    # Multi-Channel Notification Dispatcher

    ## Overview
    Design a notification engine supporting multiple channels (EMAIL, SMS, PUSH) with dynamic channel selection and observer callbacks.
  src/main/java/com/interviewos/notification/NotificationService.java: |
    package com.interviewos.notification;

    public interface NotificationService {
        void sendNotification(String userId, String message, ChannelType channel);
        int getDeliveredCount(ChannelType channel);
    }

    enum ChannelType { EMAIL, SMS, PUSH }
  src/main/java/com/interviewos/notification/impl/NotificationServiceImpl.java: |
    package com.interviewos.notification;

    import java.util.EnumMap;
    import java.util.Map;
    import java.util.concurrent.atomic.AtomicInteger;

    public class DefaultNotificationService implements NotificationService {

        private final Map<ChannelType, AtomicInteger> deliveryCounters = new EnumMap<>(ChannelType.class);

        public DefaultNotificationService() {
            for (ChannelType c : ChannelType.values()) {
                deliveryCounters.put(c, new AtomicInteger());
            }
        }

        @Override
        public void sendNotification(String userId, String message, ChannelType channel) {
            if (channel == null) throw new IllegalArgumentException("Channel required");
            // Simulated delivery logic
            deliveryCounters.get(channel).incrementAndGet();
        }

        @Override
        public int getDeliveredCount(ChannelType channel) {
            return deliveryCounters.get(channel).get();
        }
    }
starterCode: |
  package com.interviewos.notification;

  public interface NotificationService {
      void sendNotification(String userId, String message, ChannelType channel);
      int getDeliveredCount(ChannelType channel);
  }

  enum ChannelType { EMAIL, SMS, PUSH }
solutionCode: |
  package com.interviewos.notification;

  import java.util.EnumMap;
  import java.util.Map;
  import java.util.concurrent.atomic.AtomicInteger;

  public class DefaultNotificationService implements NotificationService {

      private final Map<ChannelType, AtomicInteger> deliveryCounters = new EnumMap<>(ChannelType.class);

      public DefaultNotificationService() {
          for (ChannelType c : ChannelType.values()) {
              deliveryCounters.put(c, new AtomicInteger());
          }
      }

      @Override
      public void sendNotification(String userId, String message, ChannelType channel) {
          if (channel == null) throw new IllegalArgumentException("Channel required");
          // Simulated delivery logic
          deliveryCounters.get(channel).incrementAndGet();
      }

      @Override
      public int getDeliveredCount(ChannelType channel) {
          return deliveryCounters.get(channel).get();
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/notification/NotificationServiceTest.java: |
    package com.interviewos.notification;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class NotificationServiceTest {

        @Test
        @DisplayName("Send notification tracks channel counts accurately")
        void testChannelDelivery() {
            NotificationService service = new DefaultNotificationService();
            service.sendNotification("u1", "Welcome", ChannelType.EMAIL);
            service.sendNotification("u1", "Security OTP", ChannelType.SMS);
            service.sendNotification("u2", "Reminder", ChannelType.EMAIL);

            assertEquals(2, service.getDeliveredCount(ChannelType.EMAIL));
            assertEquals(1, service.getDeliveredCount(ChannelType.SMS));
            assertEquals(0, service.getDeliveredCount(ChannelType.PUSH));
        }
    }
referenceSolutions:
  - approachId: canonical-lld-notification-service-fanout
    label: "Primary — Multi-Channel Notification Dispatcher"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a notification engine supporting multiple channels (EMAIL, SMS, PUSH) with dynamic channel selection and observer callbacks."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.notification;

      import java.util.EnumMap;
      import java.util.Map;
      import java.util.concurrent.atomic.AtomicInteger;

      public class DefaultNotificationService implements NotificationService {

          private final Map<ChannelType, AtomicInteger> deliveryCounters = new EnumMap<>(ChannelType.class);

          public DefaultNotificationService() {
              for (ChannelType c : ChannelType.values()) {
                  deliveryCounters.put(c, new AtomicInteger());
              }
          }

          @Override
          public void sendNotification(String userId, String message, ChannelType channel) {
              if (channel == null) throw new IllegalArgumentException("Channel required");
              // Simulated delivery logic
              deliveryCounters.get(channel).incrementAndGet();
          }

          @Override
          public int getDeliveredCount(ChannelType channel) {
              return deliveryCounters.get(channel).get();
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Multi-Channel Notification Dispatcher

Design a notification engine supporting multiple channels (EMAIL, SMS, PUSH) with dynamic channel selection and observer callbacks.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Multi-Channel Notification Dispatcher.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
