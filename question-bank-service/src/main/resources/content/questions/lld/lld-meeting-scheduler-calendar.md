---
slug: lld-meeting-scheduler-calendar
title: "Calendar Meeting Scheduler with Room Conflict Detection"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['calendar', 'scheduling', 'intervals', 'conflict-detection']
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
        <groupId>com.interviewos.meetingscheduler</groupId>
        <artifactId>meeting-scheduler</artifactId>
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
    # Calendar Meeting Scheduler with Room Conflict Detection

    ## Overview
    Design an enterprise meeting scheduler capable of booking rooms across time slots, detecting attendee schedule conflicts, and managing cancellations.
  src/main/java/com/interviewos/meetingscheduler/MeetingScheduler.java: |
    package com.interviewos.meetingscheduler;

    import java.util.List;

    public interface MeetingScheduler {
        String bookMeeting(String roomId, long startEpoch, long endEpoch, List<String> attendeeIds);
        boolean cancelMeeting(String meetingId);
    }
  src/main/java/com/interviewos/meetingscheduler/impl/MeetingSchedulerImpl.java: |
    package com.interviewos.meetingscheduler;

    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;
    import java.util.concurrent.atomic.AtomicInteger;

    public class DefaultMeetingScheduler implements MeetingScheduler {

        private final Map<String, List<Interval>> roomBookings = new ConcurrentHashMap<>();
        private final Map<String, Interval> meetingRegistry = new ConcurrentHashMap<>();
        private final AtomicInteger counter = new AtomicInteger();

        private static record Interval(String id, String roomId, long start, long end) {
            boolean overlaps(long s, long e) {
                return start < e && end > s;
            }
        }

        @Override
        public synchronized String bookMeeting(String roomId, long startEpoch, long endEpoch, List<String> attendeeIds) {
            List<Interval> intervals = roomBookings.computeIfAbsent(roomId, k -> new ArrayList<>());
            for (Interval iv : intervals) {
                if (iv.overlaps(startEpoch, endEpoch)) {
                    return null; // room conflict
                }
            }
            String id = "MTG-" + counter.incrementAndGet();
            Interval newInterval = new Interval(id, roomId, startEpoch, endEpoch);
            intervals.add(newInterval);
            meetingRegistry.put(id, newInterval);
            return id;
        }

        @Override
        public synchronized boolean cancelMeeting(String meetingId) {
            Interval iv = meetingRegistry.remove(meetingId);
            if (iv != null) {
                List<Interval> intervals = roomBookings.get(iv.roomId());
                if (intervals != null) {
                    intervals.remove(iv);
                }
                return true;
            }
            return false;
        }
    }
starterCode: |
  package com.interviewos.meetingscheduler;

  import java.util.List;

  public interface MeetingScheduler {
      String bookMeeting(String roomId, long startEpoch, long endEpoch, List<String> attendeeIds);
      boolean cancelMeeting(String meetingId);
  }
solutionCode: |
  package com.interviewos.meetingscheduler;

  import java.util.*;
  import java.util.concurrent.ConcurrentHashMap;
  import java.util.concurrent.atomic.AtomicInteger;

  public class DefaultMeetingScheduler implements MeetingScheduler {

      private final Map<String, List<Interval>> roomBookings = new ConcurrentHashMap<>();
      private final Map<String, Interval> meetingRegistry = new ConcurrentHashMap<>();
      private final AtomicInteger counter = new AtomicInteger();

      private static record Interval(String id, String roomId, long start, long end) {
          boolean overlaps(long s, long e) {
              return start < e && end > s;
          }
      }

      @Override
      public synchronized String bookMeeting(String roomId, long startEpoch, long endEpoch, List<String> attendeeIds) {
          List<Interval> intervals = roomBookings.computeIfAbsent(roomId, k -> new ArrayList<>());
          for (Interval iv : intervals) {
              if (iv.overlaps(startEpoch, endEpoch)) {
                  return null; // room conflict
              }
          }
          String id = "MTG-" + counter.incrementAndGet();
          Interval newInterval = new Interval(id, roomId, startEpoch, endEpoch);
          intervals.add(newInterval);
          meetingRegistry.put(id, newInterval);
          return id;
      }

      @Override
      public synchronized boolean cancelMeeting(String meetingId) {
          Interval iv = meetingRegistry.remove(meetingId);
          if (iv != null) {
              List<Interval> intervals = roomBookings.get(iv.roomId());
              if (intervals != null) {
                  intervals.remove(iv);
              }
              return true;
          }
          return false;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/meetingscheduler/MeetingSchedulerTest.java: |
    package com.interviewos.meetingscheduler;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import java.util.List;
    import static org.junit.jupiter.api.Assertions.*;

    public class MeetingSchedulerTest {

        @Test
        @DisplayName("Prevent overlapping room bookings")
        void testOverlappingRoomConflict() {
            MeetingScheduler scheduler = new DefaultMeetingScheduler();
            String m1 = scheduler.bookMeeting("Boardroom-A", 1000, 2000, List.of("alice", "bob"));
            assertNotNull(m1);

            String m2 = scheduler.bookMeeting("Boardroom-A", 1500, 2500, List.of("charlie"));
            assertNull(m2, "Overlapping slot must be rejected");

            String m3 = scheduler.bookMeeting("Boardroom-A", 2000, 3000, List.of("charlie"));
            assertNotNull(m3, "Adjacent non-overlapping slot allowed");
        }
    }
referenceSolutions:
  - approachId: canonical-lld-meeting-scheduler-calendar
    label: "Primary — Calendar Meeting Scheduler with Room Conflict Detection"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an enterprise meeting scheduler capable of booking rooms across time slots, detecting attendee schedule conflicts, and managing cancellations."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.meetingscheduler;

      import java.util.*;
      import java.util.concurrent.ConcurrentHashMap;
      import java.util.concurrent.atomic.AtomicInteger;

      public class DefaultMeetingScheduler implements MeetingScheduler {

          private final Map<String, List<Interval>> roomBookings = new ConcurrentHashMap<>();
          private final Map<String, Interval> meetingRegistry = new ConcurrentHashMap<>();
          private final AtomicInteger counter = new AtomicInteger();

          private static record Interval(String id, String roomId, long start, long end) {
              boolean overlaps(long s, long e) {
                  return start < e && end > s;
              }
          }

          @Override
          public synchronized String bookMeeting(String roomId, long startEpoch, long endEpoch, List<String> attendeeIds) {
              List<Interval> intervals = roomBookings.computeIfAbsent(roomId, k -> new ArrayList<>());
              for (Interval iv : intervals) {
                  if (iv.overlaps(startEpoch, endEpoch)) {
                      return null; // room conflict
                  }
              }
              String id = "MTG-" + counter.incrementAndGet();
              Interval newInterval = new Interval(id, roomId, startEpoch, endEpoch);
              intervals.add(newInterval);
              meetingRegistry.put(id, newInterval);
              return id;
          }

          @Override
          public synchronized boolean cancelMeeting(String meetingId) {
              Interval iv = meetingRegistry.remove(meetingId);
              if (iv != null) {
                  List<Interval> intervals = roomBookings.get(iv.roomId());
                  if (intervals != null) {
                      intervals.remove(iv);
                  }
                  return true;
              }
              return false;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Calendar Meeting Scheduler with Room Conflict Detection

Design an enterprise meeting scheduler capable of booking rooms across time slots, detecting attendee schedule conflicts, and managing cancellations.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Calendar Meeting Scheduler with Room Conflict Detection.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
