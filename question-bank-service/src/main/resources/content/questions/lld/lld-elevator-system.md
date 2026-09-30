---
slug: lld-elevator-system
title: Design an Elevator System
track: SPRING_LLD
difficulty: HARD
topics:
- lld
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- state-pattern
- concurrency
- dispatcher
buildProfile: maven-workspace
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the State Pattern to model elevator car dynamics (IDLE, MOVING_UP, MOVING_DOWN, MAINTENANCE).
- Separate the ElevatorCar state from the ElevatorController / Dispatcher algorithm (e.g. SCAN / LOOK elevator algorithm).
- Use PriorityQueues or sorted tree sets to track pending floor requests in current travel direction versus reverse direction.
coaching:
  presentationTips:
  - Differentiate between external hall calls (source floor + desired direction UP/DOWN) and internal car requests (destination floor).
  - 'Explain the dispatching policy: how does the system pick which elevator car services an external request to minimize wait time?'
  - Address thread safety and synchronization when concurrent button presses register from both inside and outside the car.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>elevator-system</artifactId>
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
    # Elevator System

    ## Overview
    Implement an object-oriented Elevator System with configurable dispatching algorithms (Shortest Seek Time First / FCFS) and car motion state management.

    ## Key Components
    - `com.interviewos.elevator.model.ElevatorCar`: Tracks floor positions, queue of target floors, and direction.
    - `com.interviewos.elevator.strategy.DispatchingStrategy`: Strategy interface for elevator selection.
    - `com.interviewos.elevator.service.ElevatorSystem`: Primary controller handling hall calls and floor selections.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/elevator/service/ElevatorSystem.java`
    2. `src/main/java/com/interviewos/elevator/strategy/ShortestSeekTimeFirstStrategy.java`
    3. `src/main/java/com/interviewos/elevator/model/ElevatorCar.java`
  src/main/java/com/interviewos/elevator/model/Direction.java: |
    package com.interviewos.elevator.model;

    public enum Direction {
        UP,
        DOWN,
        IDLE
    }
  src/main/java/com/interviewos/elevator/model/ElevatorStatus.java: |
    package com.interviewos.elevator.model;

    public class ElevatorStatus {
        private final int currentFloor;
        private final Direction direction;

        public ElevatorStatus(int currentFloor, Direction direction) {
            this.currentFloor = currentFloor;
            this.direction = direction;
        }

        public int getCurrentFloor() { return currentFloor; }
        public Direction getDirection() { return direction; }
    }
  src/main/java/com/interviewos/elevator/model/ElevatorCar.java: |
    package com.interviewos.elevator.model;

    import java.util.LinkedList;
    import java.util.Queue;

    public class ElevatorCar {
        private final int id;
        private int currentFloor;
        private Direction direction;
        private final Queue<Integer> targetFloors;

        public ElevatorCar(int id, int startingFloor) {
            this.id = id;
            this.currentFloor = startingFloor;
            this.direction = Direction.IDLE;
            this.targetFloors = new LinkedList<>();
        }

        public synchronized void addFloorRequest(int floor) {
            // TODO: Enqueue floor if not present, update direction
            throw new UnsupportedOperationException("TODO: Implement addFloorRequest");
        }

        public synchronized void step() {
            // TODO: Move towards head target floor, pop when reached, set IDLE if queue empty
            throw new UnsupportedOperationException("TODO: Implement step");
        }

        public synchronized boolean isIdle() {
            return targetFloors.isEmpty();
        }

        public synchronized int getId() { return id; }
        public synchronized int getCurrentFloor() { return currentFloor; }
        public synchronized Direction getDirection() { return direction; }
        public synchronized ElevatorStatus getStatus() { return new ElevatorStatus(currentFloor, direction); }
        public synchronized Queue<Integer> getTargetFloors() { return new LinkedList<>(targetFloors); }
    }
  src/main/java/com/interviewos/elevator/strategy/DispatchingStrategy.java: |
    package com.interviewos.elevator.strategy;

    import com.interviewos.elevator.model.Direction;
    import com.interviewos.elevator.model.ElevatorCar;
    import java.util.List;

    public interface DispatchingStrategy {
        ElevatorCar selectElevator(List<ElevatorCar> elevators, int requestedFloor, Direction requestedDirection);
    }
  src/main/java/com/interviewos/elevator/strategy/ShortestSeekTimeFirstStrategy.java: |
    package com.interviewos.elevator.strategy;

    import com.interviewos.elevator.model.Direction;
    import com.interviewos.elevator.model.ElevatorCar;
    import java.util.List;

    public class ShortestSeekTimeFirstStrategy implements DispatchingStrategy {
        @Override
        public ElevatorCar selectElevator(List<ElevatorCar> elevators, int requestedFloor, Direction requestedDirection) {
            // TODO: Pick closest elevator that is either idle or moving in requested direction towards requestedFloor
            throw new UnsupportedOperationException("TODO: Implement selectElevator in ShortestSeekTimeFirstStrategy");
        }
    }
  src/main/java/com/interviewos/elevator/service/ElevatorDispatch.java: |
    package com.interviewos.elevator.service;

    import com.interviewos.elevator.model.Direction;
    import com.interviewos.elevator.model.ElevatorCar;
    import com.interviewos.elevator.strategy.DispatchingStrategy;
    import java.util.List;

    public class ElevatorDispatch {
        private final DispatchingStrategy strategy;

        public ElevatorDispatch(DispatchingStrategy strategy) {
            this.strategy = strategy;
        }

        public ElevatorCar dispatchElevatorCar(int floor, Direction direction, List<ElevatorCar> elevators) {
            ElevatorCar selected = strategy.selectElevator(elevators, floor, direction);
            if (selected != null) {
                selected.addFloorRequest(floor);
            }
            return selected;
        }
    }
  src/main/java/com/interviewos/elevator/service/ElevatorSystem.java: |
    package com.interviewos.elevator.service;

    import com.interviewos.elevator.model.Direction;
    import com.interviewos.elevator.model.ElevatorCar;
    import com.interviewos.elevator.model.ElevatorStatus;
    import com.interviewos.elevator.strategy.DispatchingStrategy;
    import java.util.ArrayList;
    import java.util.List;

    public class ElevatorSystem {
        private final List<ElevatorCar> elevators;
        private final ElevatorDispatch dispatchController;

        public ElevatorSystem(List<ElevatorCar> elevators, DispatchingStrategy strategy) {
            this.elevators = elevators != null ? elevators : new ArrayList<>();
            this.dispatchController = new ElevatorDispatch(strategy);
        }

        public List<ElevatorStatus> getAllElevatorStatuses() {
            List<ElevatorStatus> statuses = new ArrayList<>();
            for (ElevatorCar car : elevators) {
                statuses.add(car.getStatus());
            }
            return statuses;
        }

        public ElevatorCar requestElevator(int currentFloor, Direction direction) {
            // TODO: Delegate to dispatchController
            throw new UnsupportedOperationException("TODO: Implement requestElevator");
        }

        public void selectFloor(ElevatorCar car, int destinationFloor) {
            // TODO: Enqueue destination floor on car
            throw new UnsupportedOperationException("TODO: Implement selectFloor");
        }

        public List<ElevatorCar> getElevators() { return elevators; }
    }
editablePaths:
- src/main/java/com/interviewos/elevator/service/ElevatorSystem.java
- src/main/java/com/interviewos/elevator/strategy/ShortestSeekTimeFirstStrategy.java
- src/main/java/com/interviewos/elevator/model/ElevatorCar.java
hiddenTestFiles:
  src/test/java/com/interviewos/elevator/ElevatorDispatchTest.java: |
    package com.interviewos.elevator;

    import com.interviewos.elevator.model.Direction;
    import com.interviewos.elevator.model.ElevatorCar;
    import com.interviewos.elevator.strategy.ShortestSeekTimeFirstStrategy;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class ElevatorDispatchTest {
        @Test
        @DisplayName("SSTF strategy selects closest idle elevator")
        void testSelectClosestIdle() {
            ElevatorCar car1 = new ElevatorCar(1, 1);
            ElevatorCar car2 = new ElevatorCar(2, 8);
            ElevatorCar car3 = new ElevatorCar(3, 15);

            ShortestSeekTimeFirstStrategy strategy = new ShortestSeekTimeFirstStrategy();
            ElevatorCar selected = strategy.selectElevator(List.of(car1, car2, car3), 7, Direction.UP);

            assertNotNull(selected);
            assertEquals(2, selected.getId(), "Car 2 at floor 8 is closest to floor 7");
        }
    }
  src/test/java/com/interviewos/elevator/ElevatorCarMovementTest.java: |
    package com.interviewos.elevator;

    import com.interviewos.elevator.model.Direction;
    import com.interviewos.elevator.model.ElevatorCar;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class ElevatorCarMovementTest {
        @Test
        @DisplayName("ElevatorCar sets direction and steps toward destination")
        void testCarStepping() {
            ElevatorCar car = new ElevatorCar(1, 0);
            assertTrue(car.isIdle());

            car.addFloorRequest(2);
            assertFalse(car.isIdle());
            assertEquals(Direction.UP, car.getDirection());

            car.step();
            assertEquals(1, car.getCurrentFloor());
            assertEquals(Direction.UP, car.getDirection());

            car.step();
            assertEquals(2, car.getCurrentFloor());
            assertTrue(car.isIdle());
            assertEquals(Direction.IDLE, car.getDirection());
        }
    }
  src/test/java/com/interviewos/elevator/ElevatorSystemIntegrationTest.java: |
    package com.interviewos.elevator;

    import com.interviewos.elevator.model.Direction;
    import com.interviewos.elevator.model.ElevatorCar;
    import com.interviewos.elevator.service.ElevatorSystem;
    import com.interviewos.elevator.strategy.ShortestSeekTimeFirstStrategy;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class ElevatorSystemIntegrationTest {
        @Test
        @DisplayName("Elevator system coordinates hall request and internal floor selection")
        void testSystemIntegration() {
            ElevatorCar car1 = new ElevatorCar(1, 1);
            ElevatorCar car2 = new ElevatorCar(2, 10);
            ElevatorSystem system = new ElevatorSystem(List.of(car1, car2), new ShortestSeekTimeFirstStrategy());

            ElevatorCar dispatched = system.requestElevator(2, Direction.UP);
            assertNotNull(dispatched);
            assertEquals(1, dispatched.getId());

            system.selectFloor(dispatched, 6);
            assertEquals(2, dispatched.getTargetFloors().size());
            assertEquals(2, system.getAllElevatorStatuses().size());
        }
    }

starterCode: "public class ElevatorSystem {\n    private final List<ElevatorCar> elevators;\n    private final ElevatorDispatch dispatchController;\n    public ElevatorSystem(List<ElevatorCar> elevators, DispatchingStrategy strategy) {\n        this.elevators = elevators;\n        this.dispatchController = new ElevatorDispatch(strategy);\n    }\n    // Returns the current status of all elevators in the system\npublic List<ElevatorStatus> getAllElevatorStatuses() {\n        List<ElevatorStatus> statuses = new ArrayList<>();\n        for (ElevatorCar elevator : elevators) {\n            statuses.add(elevator.getStatus());\n        }\n        return statuses;\n    }\n    // Handles a request for an elevator from a specific floor and direction\npublic void requestElevator(int currentFloor, Direction direction) {\n        dispatchController.dispatchElevatorCar(currentFloor, direction, elevators);\n    }\n    // Handles a floor selection request from inside an elevator\npublic void selectFloor(ElevatorCar\
  \ car, int destinationFloor) {\n        car.addFloorRequest(destinationFloor);\n    }\n}\n\npublic class ElevatorCar {\n    private ElevatorStatus status;\n    private final Queue<Integer> targetFloors;\n    public ElevatorCar(int startingFloor) {\n        this.status = new ElevatorStatus(startingFloor, Direction.IDLE);\n        this.targetFloors = new LinkedList<>();\n    }\n    // Returns the current state of the elevator\npublic ElevatorStatus getStatus() {\n        return status;\n    }\n    // Adds a new floor request if it's not already in the queue\npublic void addFloorRequest(int floor) {\n        if (!targetFloors.contains(floor)) {\n            targetFloors.offer(floor);\n            updateDirection(floor);\n        }\n    }\n    // Checks if elevator has no pending floor requests\npublic boolean isIdle() {\n        return targetFloors.isEmpty();\n    }\n    // Updates elevator direction based on target floor position\nprivate void updateDirection(int targetFloor) {\n       \
  \ if (status.getCurrentFloor() < targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(), Direction.UP);\n        } else\nif (status.getCurrentFloor() > targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(), Direction.DOWN);\n        }\n    }\n    // getters are omitted for brevity\n}\n\npublic class ElevatorDispatch {\n    private final DispatchingStrategy strategy;\n    public ElevatorDispatch(DispatchingStrategy strategy) {\n        this.strategy = strategy;\n    }\n    // Handles requests from the hallway button and assigns an elevator based on the dispatching\n// strategy.\npublic void dispatchElevatorCar(int floor, Direction direction, List<ElevatorCar> elevators) {\n        ElevatorCar\nselectedElevator\n= strategy.selectElevator(elevators, floor, direction);\n        if (selectedElevator != null) {\n            selectedElevator.addFloorRequest(floor);\n        }\n    }\n}"
solutionCode: "public class ElevatorSystem {\n    private final List<ElevatorCar> elevators;\n    private final ElevatorDispatch dispatchController;\n    public ElevatorSystem(List<ElevatorCar> elevators, DispatchingStrategy strategy) {\n        this.elevators = elevators;\n        this.dispatchController = new ElevatorDispatch(strategy);\n    }\n    // Returns the current status of all elevators in the system\npublic List<ElevatorStatus> getAllElevatorStatuses() {\n        List<ElevatorStatus> statuses = new ArrayList<>();\n        for (ElevatorCar elevator : elevators) {\n            statuses.add(elevator.getStatus());\n        }\n        return statuses;\n    }\n    // Handles a request for an elevator from a specific floor and direction\npublic void requestElevator(int currentFloor, Direction direction) {\n        dispatchController.dispatchElevatorCar(currentFloor, direction, elevators);\n    }\n    // Handles a floor selection request from inside an elevator\npublic void selectFloor(ElevatorCar\
  \ car, int destinationFloor) {\n        car.addFloorRequest(destinationFloor);\n    }\n}\n\npublic class ElevatorCar {\n    private ElevatorStatus status;\n    private final Queue<Integer> targetFloors;\n    public ElevatorCar(int startingFloor) {\n        this.status = new ElevatorStatus(startingFloor, Direction.IDLE);\n        this.targetFloors = new LinkedList<>();\n    }\n    // Returns the current state of the elevator\npublic ElevatorStatus getStatus() {\n        return status;\n    }\n    // Adds a new floor request if it's not already in the queue\npublic void addFloorRequest(int floor) {\n        if (!targetFloors.contains(floor)) {\n            targetFloors.offer(floor);\n            updateDirection(floor);\n        }\n    }\n    // Checks if elevator has no pending floor requests\npublic boolean isIdle() {\n        return targetFloors.isEmpty();\n    }\n    // Updates elevator direction based on target floor position\nprivate void updateDirection(int targetFloor) {\n       \
  \ if (status.getCurrentFloor() < targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(), Direction.UP);\n        } else\nif (status.getCurrentFloor() > targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(), Direction.DOWN);\n        }\n    }\n    // getters are omitted for brevity\n}\n\npublic class ElevatorDispatch {\n    private final DispatchingStrategy strategy;\n    public ElevatorDispatch(DispatchingStrategy strategy) {\n        this.strategy = strategy;\n    }\n    // Handles requests from the hallway button and assigns an elevator based on the dispatching\n// strategy.\npublic void dispatchElevatorCar(int floor, Direction direction, List<ElevatorCar> elevators) {\n        ElevatorCar\nselectedElevator\n= strategy.selectElevator(elevators, floor, direction);\n        if (selectedElevator != null) {\n            selectedElevator.addFloorRequest(floor);\n        }\n    }\n}\n\npublic class FirstComeFirstServeStrategy\nimplements\
  \ DispatchingStrategy {\n    // Selects the first available elevator that is either idle or moving in the same direction\n@Override\n    public ElevatorCar selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        for (ElevatorCar elevator : elevators) {\n            // Return first elevator that is idle or moving in the same direction\nif (elevator.isIdle() || elevator.getCurrentDirection() == direction) {\n                return elevator;\n            }\n        }\n        // If no suitable elevator is found, randomly select one\nreturn elevators.get((int) (Math.random() * elevators.size()));\n    }\n}\n\npublic class ShortestSeekTimeFirstStrategy\nimplements DispatchingStrategy {\n    // Selects the elevator that is closest to the requested floor and moving in the same direction\n@Override\n    public ElevatorCar selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        ElevatorCar\nbestElevator\n=\nnull;\n        int shortestDistance\n\
  = Integer.MAX_VALUE;\n        for (ElevatorCar elevator : elevators) {\n            // Calculate distance between elevator and requested floor\nint distance\n= Math.abs(elevator.getCurrentFloor() - floor);\n            // Select elevator if it's idle or moving in the same direction and closer than the\n// current best\nif ((elevator.isIdle() || elevator.getCurrentDirection() == direction)\n                    && distance < shortestDistance) {\n                bestElevator = elevator;\n                shortestDistance = distance;\n            }\n        }\n        return bestElevator;\n    }\n}\n\n// Observable Subject: HallwayButtonPanel\npublic class HallwayButtonPanel {\n    private final int floor;\n    private final List<ElevatorObserver> observers;\n    public HallwayButtonPanel(int floor) {\n        this.floor = floor;\n        this.observers = new ArrayList<>();\n    }\n    // Handles button press event and notifies all registered observers\npublic void pressButton(Direction direction)\
  \ {\n        notifyObservers(direction);\n    }\n    // Registers a new observer to receive button press notifications\npublic void addObserver(ElevatorObserver observer) {\n        observers.add(observer);\n    }\n    // Notifies all registered observers about the button press\nprivate void notifyObservers(Direction direction) {\n        for (ElevatorObserver observer : observers) {\n            observer.update(floor, direction);\n        }\n    }\n}\n// Observer Interface\npublic interface ElevatorObserver {\n    void update(int floor, Direction direction);\n}\n// Observer Implementation: ElevatorDispatchController\npublic class ElevatorDispatchController\nimplements ElevatorObserver {\n    @Override\n    public void update(int floor, Direction direction) {\n        // Logic to handle the floor request\n    }\n}\n\n// Set of floors this elevator can service\nprivate final Set<Integer> accessibleFloors;\n\npublic void addFloorRequest(int floor) {\n    // Only add the request if the floor\
  \ is accessible by this elevator and not already in the\n// queue\nif (accessibleFloors.contains(floor) && !targetFloors.contains(floor)) {\n        targetFloors.offer(floor);\n        updateDirection(floor);\n    }\n}\n\npublic class ShortestSeekTimeFirstStrategy\nimplements DispatchingStrategy {\n    @Override\n    public ElevatorCar selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        ElevatorCar\nbestElevator\n=\nnull;\n        int shortestDistance\n= Integer.MAX_VALUE;\n        for (ElevatorCar elevator : elevators) {\n            // Calculate distance between elevator and requested floor\nint distance\n= Math.abs(elevator.getCurrentFloor() - floor);\n            // Select elevator if it's idle or moving in the same direction and closer than the\n// current best\nif ((elevator.isIdle() || elevator.getCurrentDirection() == direction)\n                    // Only consider elevators that can actually reach the requested floor\n                    &&\
  \ elevator.getAccessibleFloors().contains(floor)\n                    && distance < shortestDistance) {\n                bestElevator = elevator;\n                shortestDistance = distance;\n            }\n        }\n        return bestElevator;\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design an Elevator System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (Car Motion State), Strategy Pattern (Dispatching Algorithm), Observer Pattern (Floor Arrival Notifications)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-elevator-system
  label: Canonical — Design an Elevator System
  approachClass: PRIMARY
  kind: CODE
  summary: Standard modular object-oriented architecture accepted in technical interviews.
  keyIdea: Optimal separation of concerns with domain entities and state orchestration.
  timeComplexity: O(1)
  spaceComplexity: O(N)
  tradeoffs:
  - Clean encapsulation and single-responsibility principles
  - High maintainability and readability during interview walkthrough
  whenToUse: Default expected interview-grade solution for this problem statement.
  code: "public class ElevatorSystem {\n    private final List<ElevatorCar> elevators;\n    private final ElevatorDispatch dispatchController;\n    public ElevatorSystem(List<ElevatorCar> elevators, DispatchingStrategy strategy) {\n        this.elevators = elevators;\n        this.dispatchController = new ElevatorDispatch(strategy);\n    }\n    // Returns the current status of all elevators in the system\npublic List<ElevatorStatus> getAllElevatorStatuses() {\n        List<ElevatorStatus> statuses = new ArrayList<>();\n        for (ElevatorCar elevator : elevators) {\n            statuses.add(elevator.getStatus());\n        }\n        return statuses;\n    }\n    // Handles a request for an elevator from a specific floor and direction\npublic void requestElevator(int currentFloor, Direction direction) {\n        dispatchController.dispatchElevatorCar(currentFloor, direction, elevators);\n    }\n    // Handles a floor selection request from inside an elevator\npublic void selectFloor(ElevatorCar\
    \ car, int destinationFloor) {\n        car.addFloorRequest(destinationFloor);\n    }\n}\n\npublic class ElevatorCar {\n    private ElevatorStatus status;\n    private final Queue<Integer> targetFloors;\n    public ElevatorCar(int startingFloor) {\n        this.status = new ElevatorStatus(startingFloor, Direction.IDLE);\n        this.targetFloors = new LinkedList<>();\n    }\n    // Returns the current state of the elevator\npublic ElevatorStatus getStatus() {\n        return status;\n    }\n    // Adds a new floor request if it's not already in the queue\npublic void addFloorRequest(int floor) {\n        if (!targetFloors.contains(floor)) {\n            targetFloors.offer(floor);\n            updateDirection(floor);\n        }\n    }\n    // Checks if elevator has no pending floor requests\npublic boolean isIdle() {\n        return targetFloors.isEmpty();\n    }\n    // Updates elevator direction based on target floor position\nprivate void updateDirection(int targetFloor) {\n     \
    \   if (status.getCurrentFloor() < targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(), Direction.UP);\n        } else\nif (status.getCurrentFloor() > targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(), Direction.DOWN);\n        }\n    }\n    // getters are omitted for brevity\n}\n\npublic class ElevatorDispatch {\n    private final DispatchingStrategy strategy;\n    public ElevatorDispatch(DispatchingStrategy strategy) {\n        this.strategy = strategy;\n    }\n    // Handles requests from the hallway button and assigns an elevator based on the dispatching\n// strategy.\npublic void dispatchElevatorCar(int floor, Direction direction, List<ElevatorCar> elevators) {\n        ElevatorCar\nselectedElevator\n= strategy.selectElevator(elevators, floor, direction);\n        if (selectedElevator != null) {\n            selectedElevator.addFloorRequest(floor);\n        }\n    }\n}\n\npublic class FirstComeFirstServeStrategy\nimplements\
    \ DispatchingStrategy {\n    // Selects the first available elevator that is either idle or moving in the same direction\n@Override\n    public ElevatorCar selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        for (ElevatorCar elevator : elevators) {\n            // Return first elevator that is idle or moving in the same direction\nif (elevator.isIdle() || elevator.getCurrentDirection() == direction) {\n                return elevator;\n            }\n        }\n        // If no suitable elevator is found, randomly select one\nreturn elevators.get((int) (Math.random() * elevators.size()));\n    }\n}\n\npublic class ShortestSeekTimeFirstStrategy\nimplements DispatchingStrategy {\n    // Selects the elevator that is closest to the requested floor and moving in the same direction\n@Override\n    public ElevatorCar selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        ElevatorCar\nbestElevator\n=\nnull;\n        int shortestDistance\n\
    = Integer.MAX_VALUE;\n        for (ElevatorCar elevator : elevators) {\n            // Calculate distance between elevator and requested floor\nint distance\n= Math.abs(elevator.getCurrentFloor() - floor);\n            // Select elevator if it's idle or moving in the same direction and closer than the\n// current best\nif ((elevator.isIdle() || elevator.getCurrentDirection() == direction)\n                    && distance < shortestDistance) {\n                bestElevator = elevator;\n                shortestDistance = distance;\n            }\n        }\n        return bestElevator;\n    }\n}\n\n// Observable Subject: HallwayButtonPanel\npublic class HallwayButtonPanel {\n    private final int floor;\n    private final List<ElevatorObserver> observers;\n    public HallwayButtonPanel(int floor) {\n        this.floor = floor;\n        this.observers = new ArrayList<>();\n    }\n    // Handles button press event and notifies all registered observers\npublic void pressButton(Direction direction)\
    \ {\n        notifyObservers(direction);\n    }\n    // Registers a new observer to receive button press notifications\npublic void addObserver(ElevatorObserver observer) {\n        observers.add(observer);\n    }\n    // Notifies all registered observers about the button press\nprivate void notifyObservers(Direction direction) {\n        for (ElevatorObserver observer : observers) {\n            observer.update(floor, direction);\n        }\n    }\n}\n// Observer Interface\npublic interface ElevatorObserver {\n    void update(int floor, Direction direction);\n}\n// Observer Implementation: ElevatorDispatchController\npublic class ElevatorDispatchController\nimplements ElevatorObserver {\n    @Override\n    public void update(int floor, Direction direction) {\n        // Logic to handle the floor request\n    }\n}\n\n// Set of floors this elevator can service\nprivate final Set<Integer> accessibleFloors;\n\npublic void addFloorRequest(int floor) {\n    // Only add the request if the\
    \ floor is accessible by this elevator and not already in the\n// queue\nif (accessibleFloors.contains(floor) && !targetFloors.contains(floor)) {\n        targetFloors.offer(floor);\n        updateDirection(floor);\n    }\n}\n\npublic class ShortestSeekTimeFirstStrategy\nimplements DispatchingStrategy {\n    @Override\n    public ElevatorCar selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        ElevatorCar\nbestElevator\n=\nnull;\n        int shortestDistance\n= Integer.MAX_VALUE;\n        for (ElevatorCar elevator : elevators) {\n            // Calculate distance between elevator and requested floor\nint distance\n= Math.abs(elevator.getCurrentFloor() - floor);\n            // Select elevator if it's idle or moving in the same direction and closer than the\n// current best\nif ((elevator.isIdle() || elevator.getCurrentDirection() == direction)\n                    // Only consider elevators that can actually reach the requested floor\n              \
    \      && elevator.getAccessibleFloors().contains(floor)\n                    && distance < shortestDistance) {\n                bestElevator = elevator;\n                shortestDistance = distance;\n            }\n        }\n        return bestElevator;\n    }\n}"
- approachId: fsm-nearest-car-elevator
  label: Alternate — Finite State Machine & Proximity Dispatcher
  approachClass: ALTERNATE
  kind: CODE
  summary: An explicit state machine approach where cars manage their own door and movement state transitions. A central Dispatcher assigns hall calls to the nearest compatible car based on Manhattan distance, directional alignment, and remaining capacity.
  keyIdea: Model individual elevator cars with an explicit state machine (IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN) coupled with a proximity-based call allocator.
  timeComplexity: O(C)
  spaceComplexity: O(R)
  tradeoffs:
  - Deterministic state flow and simple hardware controller binding
  - Can be less efficient than global SCAN/LOOK under high directional congestion
  whenToUse: Standard for residential buildings and mid-rise offices with moderate traffic.
  code: "// Alternate Approach: Finite State Machine & Proximity Dispatcher\nimport java.util.*;\n\nenum ElevatorState { IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN }\nenum Direction { UP, DOWN, NONE }\n\nclass HallCall {\n    final int floor;\n    final Direction direction;\n    public HallCall(int floor, Direction direction) { this.floor = floor; this.direction = direction; }\n}\n\nclass ElevatorCar {\n    private final int id;\n    private int currentFloor = 1;\n    private ElevatorState state = ElevatorState.IDLE;\n    private final TreeSet<Integer> destinationFloors = new TreeSet<>();\n\n    public ElevatorCar(int id) { this.id = id; }\n\n    public synchronized void addDestination(int floor) {\n        destinationFloors.add(floor);\n        updateState();\n    }\n\n    public synchronized void step() {\n        if (destinationFloors.isEmpty()) {\n            state = ElevatorState.IDLE;\n            return;\n        }\n        int nextFloor = destinationFloors.first();\n        if (currentFloor\
    \ < nextFloor) {\n            currentFloor++;\n            state = ElevatorState.MOVING_UP;\n        } else if (currentFloor > nextFloor) {\n            currentFloor--;\n            state = ElevatorState.MOVING_DOWN;\n        } else {\n            destinationFloors.remove(currentFloor);\n            state = ElevatorState.DOOR_OPEN;\n        }\n    }\n\n    private void updateState() {\n        if (destinationFloors.isEmpty()) state = ElevatorState.IDLE;\n        else if (destinationFloors.first() > currentFloor) state = ElevatorState.MOVING_UP;\n        else if (destinationFloors.first() < currentFloor) state = ElevatorState.MOVING_DOWN;\n    }\n\n    public int getCost(HallCall call) {\n        int distance = Math.abs(currentFloor - call.floor);\n        if (state == ElevatorState.IDLE) return distance;\n        boolean sameDirection = (state == ElevatorState.MOVING_UP && call.direction == Direction.UP && call.floor >= currentFloor)\n                || (state == ElevatorState.MOVING_DOWN\
    \ && call.direction == Direction.DOWN && call.floor <= currentFloor);\n        return sameDirection ? distance : distance + 20; // Penalty for opposite movement\n    }\n\n    public int getId() { return id; }\n    public int getCurrentFloor() { return currentFloor; }\n    public ElevatorState getState() { return state; }\n}\n\nclass NearestCarDispatcher {\n    private final List<ElevatorCar> cars;\n\n    public NearestCarDispatcher(List<ElevatorCar> cars) { this.cars = cars; }\n\n    public ElevatorCar dispatch(HallCall call) {\n        ElevatorCar bestCar = null;\n        int minCost = Integer.MAX_VALUE;\n        for (ElevatorCar car : cars) {\n            int cost = car.getCost(call);\n            if (cost < minCost) {\n                minCost = cost;\n                bestCar = car;\n            }\n        }\n        if (bestCar != null) {\n            bestCar.addDestination(call.floor);\n        }\n        return bestCar;\n    }\n}\n"
---

### Problem Statement: Design an Elevator System

Design a multi-car Elevator Control System for a high-rise building with internal and external call dispatching, optimal floor scheduling (SCAN/LOOK algorithm), and door safety interlocks.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design an Elevator System.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage State Pattern (Car Motion State), Strategy Pattern (Dispatching Algorithm), Observer Pattern (Floor Arrival Notifications).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
