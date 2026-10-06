---
slug: lld-traffic-signal
title: Traffic Signal Control System
track: SPRING_LLD
difficulty: MEDIUM
topics:
- lld
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- state-pattern
- observer-pattern
- traffic-control
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/traffic-signal
status: PUBLISHED
hints:
- Maintain an explicit active green direction to ensure exactly one direction has right-of-way during standard cycles.
- Use an EnumMap to store traffic lights indexed by Cardinal direction for high efficiency.
- Emergency overrides must preempt the standard phase rotation and restore state safely upon resolution.
coaching:
  presentationTips:
  - Clarify safety invariants first: how to guarantee two conflicting routes never show green simultaneously.
  - Discuss how the State or Strategy pattern decouples signal timings from hardware controllers.
  - Explain the recovery strategy when an emergency vehicle leaves the intersection.
  commonMistakes:
  - Allowing emergency mode transitions to corrupt the baseline clockwise sequence pointer.
  - Failing to synchronize state changes across concurrent sensor and operator threads.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>traffic-signal</artifactId>
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
    # Traffic Signal Control System

    ## Overview
    Implement an automated, object-oriented traffic signal control system for a 4-way road intersection supporting scheduled signal cycling, state transitions, and high-priority emergency vehicle overrides.

    ## Key Components
    - `com.interviewos.traffic.service.TrafficController`: Manages individual signal lights and orchestrates transition cycles.
    - `com.interviewos.traffic.service.IntersectionManager`: Higher-level coordinator monitoring intersection health and handling emergency services.
    - `com.interviewos.traffic.policy.SignalTransitionPolicy`: Configures signal sequencing and color duration rules.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/traffic/service/TrafficController.java`
    2. `src/main/java/com/interviewos/traffic/service/IntersectionManager.java`
  src/main/java/com/interviewos/traffic/model/SignalColor.java: |
    package com.interviewos.traffic.model;

    public enum SignalColor {
        RED,
        YELLOW,
        GREEN
    }
  src/main/java/com/interviewos/traffic/model/Direction.java: |
    package com.interviewos.traffic.model;

    public enum Direction {
        NORTH,
        EAST,
        SOUTH,
        WEST;

        public Direction next() {
            Direction[] values = values();
            return values[(this.ordinal() + 1) % values.length];
        }
    }
  src/main/java/com/interviewos/traffic/model/TrafficLight.java: |
    package com.interviewos.traffic.model;

    public class TrafficLight {
        private final Direction direction;
        private volatile SignalColor currentColor;
        private volatile int durationSeconds;

        public TrafficLight(Direction direction, SignalColor initialColor, int durationSeconds) {
            this.direction = direction;
            this.currentColor = initialColor;
            this.durationSeconds = durationSeconds;
        }

        public Direction getDirection() { return direction; }
        public SignalColor getCurrentColor() { return currentColor; }
        public void setCurrentColor(SignalColor currentColor) { this.currentColor = currentColor; }
        public int getDurationSeconds() { return durationSeconds; }
        public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
    }
  src/main/java/com/interviewos/traffic/model/EmergencyOverride.java: |
    package com.interviewos.traffic.model;

    public class EmergencyOverride {
        private final Direction priorityDirection;
        private final boolean active;

        public EmergencyOverride(Direction priorityDirection, boolean active) {
            this.priorityDirection = priorityDirection;
            this.active = active;
        }

        public Direction getPriorityDirection() { return priorityDirection; }
        public boolean isActive() { return active; }
    }
  src/main/java/com/interviewos/traffic/policy/SignalTransitionPolicy.java: |
    package com.interviewos.traffic.policy;

    import com.interviewos.traffic.model.SignalColor;

    public interface SignalTransitionPolicy {
        SignalColor getNextColor(SignalColor current);
        int getDefaultDuration(SignalColor color);
    }
  src/main/java/com/interviewos/traffic/policy/StandardTransitionPolicy.java: |
    package com.interviewos.traffic.policy;

    import com.interviewos.traffic.model.SignalColor;

    public class StandardTransitionPolicy implements SignalTransitionPolicy {
        @Override
        public SignalColor getNextColor(SignalColor current) {
            if (current == null) return SignalColor.RED;
            return switch (current) {
                case GREEN -> SignalColor.YELLOW;
                case YELLOW -> SignalColor.RED;
                case RED -> SignalColor.GREEN;
            };
        }

        @Override
        public int getDefaultDuration(SignalColor color) {
            if (color == null) return 60;
            return switch (color) {
                case GREEN -> 60;
                case YELLOW -> 5;
                case RED -> 60;
            };
        }
    }
  src/main/java/com/interviewos/traffic/service/TrafficController.java: |
    package com.interviewos.traffic.service;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;
    import com.interviewos.traffic.model.TrafficLight;
    import com.interviewos.traffic.policy.SignalTransitionPolicy;
    import com.interviewos.traffic.policy.StandardTransitionPolicy;

    import java.util.EnumMap;
    import java.util.Map;

    public class TrafficController {
        private final Map<Direction, TrafficLight> lights = new EnumMap<>(Direction.class);
        private final SignalTransitionPolicy policy;
        private volatile Direction activeGreenDirection = Direction.NORTH;
        private volatile boolean emergencyActive = false;
        private volatile Direction emergencyDirection = null;

        public TrafficController() {
            this(new StandardTransitionPolicy());
        }

        public TrafficController(SignalTransitionPolicy policy) {
            this.policy = policy != null ? policy : new StandardTransitionPolicy();
            for (Direction dir : Direction.values()) {
                SignalColor color = (dir == Direction.NORTH) ? SignalColor.GREEN : SignalColor.RED;
                lights.put(dir, new TrafficLight(dir, color, this.policy.getDefaultDuration(color)));
            }
        }

        public TrafficLight getLight(Direction direction) {
            return lights.get(direction);
        }

        public Direction getActiveGreenDirection() {
            return activeGreenDirection;
        }

        public boolean isEmergencyActive() {
            return emergencyActive;
        }

        public synchronized void transitionNext() {
            // TODO: Transition current green direction to red, advance active direction clockwise to green
            throw new UnsupportedOperationException("TODO: Implement TrafficController.transitionNext");
        }

        public synchronized void triggerEmergency(Direction direction) {
            // TODO: Immediately set specified direction to GREEN, and all other directions to RED
            throw new UnsupportedOperationException("TODO: Implement TrafficController.triggerEmergency");
        }

        public synchronized void clearEmergency() {
            // TODO: Clear emergency flag and restore valid single-green state
            throw new UnsupportedOperationException("TODO: Implement TrafficController.clearEmergency");
        }
    }
  src/main/java/com/interviewos/traffic/service/IntersectionManager.java: |
    package com.interviewos.traffic.service;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;

    import java.util.EnumMap;
    import java.util.Map;

    public class IntersectionManager {
        private final String intersectionId;
        private final TrafficController controller;

        public IntersectionManager(String intersectionId) {
            this(intersectionId, new TrafficController());
        }

        public IntersectionManager(String intersectionId, TrafficController controller) {
            this.intersectionId = intersectionId;
            this.controller = controller != null ? controller : new TrafficController();
        }

        public String getIntersectionId() {
            return intersectionId;
        }

        public TrafficController getController() {
            return controller;
        }

        public Map<Direction, SignalColor> reportStatus() {
            // TODO: Aggregate and return current signal colors for all directions
            throw new UnsupportedOperationException("TODO: Implement IntersectionManager.reportStatus");
        }

        public void handleEmergencyVehicle(Direction direction) {
            // TODO: Notify controller to prioritize emergency direction
            throw new UnsupportedOperationException("TODO: Implement IntersectionManager.handleEmergencyVehicle");
        }

        public void resumeNormalOperations() {
            // TODO: Clear controller emergency
            throw new UnsupportedOperationException("TODO: Implement IntersectionManager.resumeNormalOperations");
        }
    }
  src/test/java/com/interviewos/traffic/TrafficSignalStateTest.java: |
    package com.interviewos.traffic;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;
    import com.interviewos.traffic.service.TrafficController;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class TrafficSignalStateTest {

        @Test
        @DisplayName("Initial traffic state has exactly one green light")
        void testInitialStateSafety() {
            TrafficController controller = new TrafficController();
            assertEquals(SignalColor.GREEN, controller.getLight(Direction.NORTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.EAST).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.SOUTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.WEST).getCurrentColor());
        }

        @Test
        @DisplayName("transitionNext rotates green light clockwise")
        void testSignalRotation() {
            TrafficController controller = new TrafficController();
            controller.transitionNext();

            assertEquals(SignalColor.RED, controller.getLight(Direction.NORTH).getCurrentColor());
            assertEquals(SignalColor.GREEN, controller.getLight(Direction.EAST).getCurrentColor());
            assertEquals(Direction.EAST, controller.getActiveGreenDirection());
        }
    }
  src/test/java/com/interviewos/traffic/TrafficEmergencyOverrideTest.java: |
    package com.interviewos.traffic;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;
    import com.interviewos.traffic.service.TrafficController;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class TrafficEmergencyOverrideTest {

        @Test
        @DisplayName("Emergency override sets designated route to green and blocks others")
        void testEmergencyOverrideForcesPriority() {
            TrafficController controller = new TrafficController();
            controller.triggerEmergency(Direction.SOUTH);

            assertTrue(controller.isEmergencyActive());
            assertEquals(SignalColor.GREEN, controller.getLight(Direction.SOUTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.NORTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.EAST).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.WEST).getCurrentColor());
        }

        @Test
        @DisplayName("Clearing emergency restores normal operational status")
        void testClearEmergencyRestoresOperation() {
            TrafficController controller = new TrafficController();
            controller.triggerEmergency(Direction.WEST);
            controller.clearEmergency();

            assertFalse(controller.isEmergencyActive());
            assertEquals(SignalColor.GREEN, controller.getLight(controller.getActiveGreenDirection()).getCurrentColor());
        }
    }
  src/test/java/com/interviewos/traffic/TrafficIntersectionLifecycleTest.java: |
    package com.interviewos.traffic;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;
    import com.interviewos.traffic.service.IntersectionManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.Map;

    import static org.junit.jupiter.api.Assertions.*;

    public class TrafficIntersectionLifecycleTest {

        @Test
        @DisplayName("IntersectionManager reports comprehensive status map")
        void testReportStatusCompleteness() {
            IntersectionManager manager = new IntersectionManager("INT-401");
            Map<Direction, SignalColor> status = manager.reportStatus();

            assertNotNull(status);
            assertEquals(4, status.size());
            assertEquals(SignalColor.GREEN, status.get(Direction.NORTH));
        }

        @Test
        @DisplayName("IntersectionManager coordinates emergency routing through controller")
        void testEmergencyDelegation() {
            IntersectionManager manager = new IntersectionManager("INT-402");
            manager.handleEmergencyVehicle(Direction.EAST);

            assertTrue(manager.getController().isEmergencyActive());
            assertEquals(SignalColor.GREEN, manager.getController().getLight(Direction.EAST).getCurrentColor());

            manager.resumeNormalOperations();
            assertFalse(manager.getController().isEmergencyActive());
        }
    }
editablePaths:
- src/main/java/com/interviewos/traffic/service/TrafficController.java
- src/main/java/com/interviewos/traffic/service/IntersectionManager.java
hiddenTestFiles:
  src/test/java/com/interviewos/traffic/TrafficSignalStateTest.java: |
    package com.interviewos.traffic;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;
    import com.interviewos.traffic.service.TrafficController;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class TrafficSignalStateTest {

        @Test
        @DisplayName("Initial traffic state has exactly one green light")
        void testInitialStateSafety() {
            TrafficController controller = new TrafficController();
            assertEquals(SignalColor.GREEN, controller.getLight(Direction.NORTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.EAST).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.SOUTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.WEST).getCurrentColor());
        }

        @Test
        @DisplayName("transitionNext rotates green light clockwise")
        void testSignalRotation() {
            TrafficController controller = new TrafficController();
            controller.transitionNext();

            assertEquals(SignalColor.RED, controller.getLight(Direction.NORTH).getCurrentColor());
            assertEquals(SignalColor.GREEN, controller.getLight(Direction.EAST).getCurrentColor());
            assertEquals(Direction.EAST, controller.getActiveGreenDirection());
        }
    }
  src/test/java/com/interviewos/traffic/TrafficEmergencyOverrideTest.java: |
    package com.interviewos.traffic;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;
    import com.interviewos.traffic.service.TrafficController;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class TrafficEmergencyOverrideTest {

        @Test
        @DisplayName("Emergency override sets designated route to green and blocks others")
        void testEmergencyOverrideForcesPriority() {
            TrafficController controller = new TrafficController();
            controller.triggerEmergency(Direction.SOUTH);

            assertTrue(controller.isEmergencyActive());
            assertEquals(SignalColor.GREEN, controller.getLight(Direction.SOUTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.NORTH).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.EAST).getCurrentColor());
            assertEquals(SignalColor.RED, controller.getLight(Direction.WEST).getCurrentColor());
        }

        @Test
        @DisplayName("Clearing emergency restores normal operational status")
        void testClearEmergencyRestoresOperation() {
            TrafficController controller = new TrafficController();
            controller.triggerEmergency(Direction.WEST);
            controller.clearEmergency();

            assertFalse(controller.isEmergencyActive());
            assertEquals(SignalColor.GREEN, controller.getLight(controller.getActiveGreenDirection()).getCurrentColor());
        }
    }
  src/test/java/com/interviewos/traffic/TrafficIntersectionLifecycleTest.java: |
    package com.interviewos.traffic;

    import com.interviewos.traffic.model.Direction;
    import com.interviewos.traffic.model.SignalColor;
    import com.interviewos.traffic.service.IntersectionManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.Map;

    import static org.junit.jupiter.api.Assertions.*;

    public class TrafficIntersectionLifecycleTest {

        @Test
        @DisplayName("IntersectionManager reports comprehensive status map")
        void testReportStatusCompleteness() {
            IntersectionManager manager = new IntersectionManager("INT-401");
            Map<Direction, SignalColor> status = manager.reportStatus();

            assertNotNull(status);
            assertEquals(4, status.size());
            assertEquals(SignalColor.GREEN, status.get(Direction.NORTH));
        }

        @Test
        @DisplayName("IntersectionManager coordinates emergency routing through controller")
        void testEmergencyDelegation() {
            IntersectionManager manager = new IntersectionManager("INT-402");
            manager.handleEmergencyVehicle(Direction.EAST);

            assertTrue(manager.getController().isEmergencyActive());
            assertEquals(SignalColor.GREEN, manager.getController().getLight(Direction.EAST).getCurrentColor());

            manager.resumeNormalOperations();
            assertFalse(manager.getController().isEmergencyActive());
        }
    }
starterCode: |
  package com.interviewos.traffic.service;

  import com.interviewos.traffic.model.Direction;
  import com.interviewos.traffic.model.SignalColor;
  import com.interviewos.traffic.model.TrafficLight;
  import com.interviewos.traffic.policy.SignalTransitionPolicy;
  import com.interviewos.traffic.policy.StandardTransitionPolicy;

  import java.util.EnumMap;
  import java.util.Map;

  public class TrafficController {
      private final Map<Direction, TrafficLight> lights = new EnumMap<>(Direction.class);
      private final SignalTransitionPolicy policy;
      private volatile Direction activeGreenDirection = Direction.NORTH;
      private volatile boolean emergencyActive = false;
      private volatile Direction emergencyDirection = null;

      public TrafficController() {
          this(new StandardTransitionPolicy());
      }

      public TrafficController(SignalTransitionPolicy policy) {
          this.policy = policy != null ? policy : new StandardTransitionPolicy();
          for (Direction dir : Direction.values()) {
              SignalColor color = (dir == Direction.NORTH) ? SignalColor.GREEN : SignalColor.RED;
              lights.put(dir, new TrafficLight(dir, color, this.policy.getDefaultDuration(color)));
          }
      }

      public TrafficLight getLight(Direction direction) {
          return lights.get(direction);
      }

      public Direction getActiveGreenDirection() {
          return activeGreenDirection;
      }

      public boolean isEmergencyActive() {
          return emergencyActive;
      }

      public synchronized void transitionNext() {
          // TODO: Transition current green direction to red, advance active direction clockwise to green
          throw new UnsupportedOperationException("TODO: Implement TrafficController.transitionNext");
      }

      public synchronized void triggerEmergency(Direction direction) {
          // TODO: Immediately set specified direction to GREEN, and all other directions to RED
          throw new UnsupportedOperationException("TODO: Implement TrafficController.triggerEmergency");
      }

      public synchronized void clearEmergency() {
          // TODO: Clear emergency flag and restore valid single-green state
          throw new UnsupportedOperationException("TODO: Implement TrafficController.clearEmergency");
      }
  }
solutionCode: |
  package com.interviewos.traffic.service;

  import com.interviewos.traffic.model.Direction;
  import com.interviewos.traffic.model.SignalColor;
  import com.interviewos.traffic.model.TrafficLight;
  import com.interviewos.traffic.policy.SignalTransitionPolicy;
  import com.interviewos.traffic.policy.StandardTransitionPolicy;

  import java.util.EnumMap;
  import java.util.Map;

  public class TrafficController {
      private final Map<Direction, TrafficLight> lights = new EnumMap<>(Direction.class);
      private final SignalTransitionPolicy policy;
      private volatile Direction activeGreenDirection = Direction.NORTH;
      private volatile boolean emergencyActive = false;
      private volatile Direction emergencyDirection = null;

      public TrafficController() {
          this(new StandardTransitionPolicy());
      }

      public TrafficController(SignalTransitionPolicy policy) {
          this.policy = policy != null ? policy : new StandardTransitionPolicy();
          for (Direction dir : Direction.values()) {
              SignalColor color = (dir == Direction.NORTH) ? SignalColor.GREEN : SignalColor.RED;
              lights.put(dir, new TrafficLight(dir, color, this.policy.getDefaultDuration(color)));
          }
      }

      public TrafficLight getLight(Direction direction) {
          return lights.get(direction);
      }

      public Direction getActiveGreenDirection() {
          return activeGreenDirection;
      }

      public boolean isEmergencyActive() {
          return emergencyActive;
      }

      public synchronized void transitionNext() {
          if (emergencyActive) return;
          TrafficLight currentGreen = lights.get(activeGreenDirection);
          currentGreen.setCurrentColor(SignalColor.RED);

          activeGreenDirection = activeGreenDirection.next();
          TrafficLight nextGreen = lights.get(activeGreenDirection);
          nextGreen.setCurrentColor(SignalColor.GREEN);
      }

      public synchronized void triggerEmergency(Direction direction) {
          if (direction == null) return;
          this.emergencyActive = true;
          this.emergencyDirection = direction;
          for (Map.Entry<Direction, TrafficLight> entry : lights.entrySet()) {
              if (entry.getKey() == direction) {
                  entry.getValue().setCurrentColor(SignalColor.GREEN);
              } else {
                  entry.getValue().setCurrentColor(SignalColor.RED);
              }
          }
      }

      public synchronized void clearEmergency() {
          this.emergencyActive = false;
          this.emergencyDirection = null;
          for (Map.Entry<Direction, TrafficLight> entry : lights.entrySet()) {
              if (entry.getKey() == activeGreenDirection) {
                  entry.getValue().setCurrentColor(SignalColor.GREEN);
              } else {
                  entry.getValue().setCurrentColor(SignalColor.RED);
              }
          }
      }
  }
---

### Problem Statement: Traffic Signal Control System

You are tasked with designing and implementing an object-oriented Traffic Signal Control System for a busy municipal roadway intersection in Java. Urban intersections demand strict safety invariants: at no point may opposing or conflicting traffic directions display green lights simultaneously, and emergency first responders must be given immediate, preemptive right-of-way without deadlocking the control hardware.

#### Functional Requirements:
1. **Signal State Modeling**: Represent the primary signal colors (RED, YELLOW, GREEN) and four cardinal intersection approaches (NORTH, EAST, SOUTH, WEST).
2. **Safety Invariants**: Enforce that during normal cyclical operation, exactly one direction is granted a GREEN signal while all competing directions remain RED.
3. **Sequential Phase Rotation**: Provide a clockwise rotational progression (North -> East -> South -> West -> North) when stepping through intersection phases.
4. **Configurable Transition Policies**: Support pluggable duration and transition policies through a dedicated SignalTransitionPolicy interface.
5. **Emergency Vehicle Preemption**: Implement an emergency override trigger that immediately forces a designated approach to GREEN while turning all competing approaches RED.
6. **Preemption Clearing**: Provide a clean rollback mechanism that clears emergency overrides and returns the intersection to a safe, valid operational cycle.
7. **Intersection Management Coordinator**: Expose an IntersectionManager coordinator capable of tracking intersection identifiers, delegating signal commands, and querying real-time light status.
8. **Real-time Status Reporting**: Produce a complete snapshot mapping all directions to their respective active signal colors upon request.

#### Non-goals:
- Pedestrian crosswalk buttons, countdown timers, and physical inductive roadway loop sensors are outside the scope of this core control model.
- Multi-intersection green-wave network synchronization and city-wide telemetry brokers are omitted in favor of self-contained local intersection logic.
