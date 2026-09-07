---
slug: lld-elevator-system
title: Design an Elevator System
track: SPRING_LLD
difficulty: HARD
topics: [lld]
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- state-pattern
- concurrency
- dispatcher
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the State Pattern to model elevator car dynamics (IDLE, MOVING_UP, MOVING_DOWN, MAINTENANCE).
- Separate the ElevatorCar state from the ElevatorController / Dispatcher algorithm (e.g. SCAN / LOOK elevator algorithm).
- Use PriorityQueues or sorted tree sets to track pending floor requests in current travel direction versus reverse direction.
coaching:
  presentationTips:
  - Differentiate between external hall calls (source floor + desired direction UP/DOWN) and internal car requests (destination
    floor).
  - 'Explain the dispatching policy: how does the system pick which elevator car services an external request to minimize
    wait time?'
  - Address thread safety and synchronization when concurrent button presses register from both inside and outside the car.
starterCode: "public class ElevatorSystem {\n    private final List<ElevatorCar> elevators;\n    private final ElevatorDispatch\
  \ dispatchController;\n    public ElevatorSystem(List<ElevatorCar> elevators, DispatchingStrategy strategy) {\n        this.elevators\
  \ = elevators;\n        this.dispatchController = new ElevatorDispatch(strategy);\n    }\n    // Returns the current status\
  \ of all elevators in the system\npublic List<ElevatorStatus> getAllElevatorStatuses() {\n        List<ElevatorStatus> statuses\
  \ = new ArrayList<>();\n        for (ElevatorCar elevator : elevators) {\n            statuses.add(elevator.getStatus());\n\
  \        }\n        return statuses;\n    }\n    // Handles a request for an elevator from a specific floor and direction\n\
  public void requestElevator(int currentFloor, Direction direction) {\n        dispatchController.dispatchElevatorCar(currentFloor,\
  \ direction, elevators);\n    }\n    // Handles a floor selection request from inside an elevator\npublic void selectFloor(ElevatorCar\
  \ car, int destinationFloor) {\n        car.addFloorRequest(destinationFloor);\n    }\n}\n\npublic class ElevatorCar {\n\
  \    private ElevatorStatus status;\n    private final Queue<Integer> targetFloors;\n    public ElevatorCar(int startingFloor)\
  \ {\n        this.status = new ElevatorStatus(startingFloor, Direction.IDLE);\n        this.targetFloors = new LinkedList<>();\n\
  \    }\n    // Returns the current state of the elevator\npublic ElevatorStatus getStatus() {\n        return status;\n\
  \    }\n    // Adds a new floor request if it's not already in the queue\npublic void addFloorRequest(int floor) {\n   \
  \     if (!targetFloors.contains(floor)) {\n            targetFloors.offer(floor);\n            updateDirection(floor);\n\
  \        }\n    }\n    // Checks if elevator has no pending floor requests\npublic boolean isIdle() {\n        return targetFloors.isEmpty();\n\
  \    }\n    // Updates elevator direction based on target floor position\nprivate void updateDirection(int targetFloor)\
  \ {\n        if (status.getCurrentFloor() < targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(),\
  \ Direction.UP);\n        } else\nif (status.getCurrentFloor() > targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(),\
  \ Direction.DOWN);\n        }\n    }\n    // getters are omitted for brevity\n}\n\npublic class ElevatorDispatch {\n   \
  \ private final DispatchingStrategy strategy;\n    public ElevatorDispatch(DispatchingStrategy strategy) {\n        this.strategy\
  \ = strategy;\n    }\n    // Handles requests from the hallway button and assigns an elevator based on the dispatching\n\
  // strategy.\npublic void dispatchElevatorCar(int floor, Direction direction, List<ElevatorCar> elevators) {\n        ElevatorCar\n\
  selectedElevator\n= strategy.selectElevator(elevators, floor, direction);\n        if (selectedElevator != null) {\n   \
  \         selectedElevator.addFloorRequest(floor);\n        }\n    }\n}"
solutionCode: "public class ElevatorSystem {\n    private final List<ElevatorCar> elevators;\n    private final ElevatorDispatch\
  \ dispatchController;\n    public ElevatorSystem(List<ElevatorCar> elevators, DispatchingStrategy strategy) {\n        this.elevators\
  \ = elevators;\n        this.dispatchController = new ElevatorDispatch(strategy);\n    }\n    // Returns the current status\
  \ of all elevators in the system\npublic List<ElevatorStatus> getAllElevatorStatuses() {\n        List<ElevatorStatus> statuses\
  \ = new ArrayList<>();\n        for (ElevatorCar elevator : elevators) {\n            statuses.add(elevator.getStatus());\n\
  \        }\n        return statuses;\n    }\n    // Handles a request for an elevator from a specific floor and direction\n\
  public void requestElevator(int currentFloor, Direction direction) {\n        dispatchController.dispatchElevatorCar(currentFloor,\
  \ direction, elevators);\n    }\n    // Handles a floor selection request from inside an elevator\npublic void selectFloor(ElevatorCar\
  \ car, int destinationFloor) {\n        car.addFloorRequest(destinationFloor);\n    }\n}\n\npublic class ElevatorCar {\n\
  \    private ElevatorStatus status;\n    private final Queue<Integer> targetFloors;\n    public ElevatorCar(int startingFloor)\
  \ {\n        this.status = new ElevatorStatus(startingFloor, Direction.IDLE);\n        this.targetFloors = new LinkedList<>();\n\
  \    }\n    // Returns the current state of the elevator\npublic ElevatorStatus getStatus() {\n        return status;\n\
  \    }\n    // Adds a new floor request if it's not already in the queue\npublic void addFloorRequest(int floor) {\n   \
  \     if (!targetFloors.contains(floor)) {\n            targetFloors.offer(floor);\n            updateDirection(floor);\n\
  \        }\n    }\n    // Checks if elevator has no pending floor requests\npublic boolean isIdle() {\n        return targetFloors.isEmpty();\n\
  \    }\n    // Updates elevator direction based on target floor position\nprivate void updateDirection(int targetFloor)\
  \ {\n        if (status.getCurrentFloor() < targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(),\
  \ Direction.UP);\n        } else\nif (status.getCurrentFloor() > targetFloor) {\n            status = new ElevatorStatus(status.getCurrentFloor(),\
  \ Direction.DOWN);\n        }\n    }\n    // getters are omitted for brevity\n}\n\npublic class ElevatorDispatch {\n   \
  \ private final DispatchingStrategy strategy;\n    public ElevatorDispatch(DispatchingStrategy strategy) {\n        this.strategy\
  \ = strategy;\n    }\n    // Handles requests from the hallway button and assigns an elevator based on the dispatching\n\
  // strategy.\npublic void dispatchElevatorCar(int floor, Direction direction, List<ElevatorCar> elevators) {\n        ElevatorCar\n\
  selectedElevator\n= strategy.selectElevator(elevators, floor, direction);\n        if (selectedElevator != null) {\n   \
  \         selectedElevator.addFloorRequest(floor);\n        }\n    }\n}\n\npublic class FirstComeFirstServeStrategy\nimplements\
  \ DispatchingStrategy {\n    // Selects the first available elevator that is either idle or moving in the same direction\n\
  @Override\n    public ElevatorCar selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n      \
  \  for (ElevatorCar elevator : elevators) {\n            // Return first elevator that is idle or moving in the same direction\n\
  if (elevator.isIdle() || elevator.getCurrentDirection() == direction) {\n                return elevator;\n            }\n\
  \        }\n        // If no suitable elevator is found, randomly select one\nreturn elevators.get((int) (Math.random()\
  \ * elevators.size()));\n    }\n}\n\npublic class ShortestSeekTimeFirstStrategy\nimplements DispatchingStrategy {\n    //\
  \ Selects the elevator that is closest to the requested floor and moving in the same direction\n@Override\n    public ElevatorCar\
  \ selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        ElevatorCar\nbestElevator\n=\n\
  null;\n        int shortestDistance\n= Integer.MAX_VALUE;\n        for (ElevatorCar elevator : elevators) {\n          \
  \  // Calculate distance between elevator and requested floor\nint distance\n= Math.abs(elevator.getCurrentFloor() - floor);\n\
  \            // Select elevator if it's idle or moving in the same direction and closer than the\n// current best\nif ((elevator.isIdle()\
  \ || elevator.getCurrentDirection() == direction)\n                    && distance < shortestDistance) {\n             \
  \   bestElevator = elevator;\n                shortestDistance = distance;\n            }\n        }\n        return bestElevator;\n\
  \    }\n}\n\n// Observable Subject: HallwayButtonPanel\npublic class HallwayButtonPanel {\n    private final int floor;\n\
  \    private final List<ElevatorObserver> observers;\n    public HallwayButtonPanel(int floor) {\n        this.floor = floor;\n\
  \        this.observers = new ArrayList<>();\n    }\n    // Handles button press event and notifies all registered observers\n\
  public void pressButton(Direction direction) {\n        notifyObservers(direction);\n    }\n    // Registers a new observer\
  \ to receive button press notifications\npublic void addObserver(ElevatorObserver observer) {\n        observers.add(observer);\n\
  \    }\n    // Notifies all registered observers about the button press\nprivate void notifyObservers(Direction direction)\
  \ {\n        for (ElevatorObserver observer : observers) {\n            observer.update(floor, direction);\n        }\n\
  \    }\n}\n// Observer Interface\npublic interface ElevatorObserver {\n    void update(int floor, Direction direction);\n\
  }\n// Observer Implementation: ElevatorDispatchController\npublic class ElevatorDispatchController\nimplements ElevatorObserver\
  \ {\n    @Override\n    public void update(int floor, Direction direction) {\n        // Logic to handle the floor request\n\
  \    }\n}\n\n// Set of floors this elevator can service\nprivate final Set<Integer> accessibleFloors;\n\npublic void addFloorRequest(int\
  \ floor) {\n    // Only add the request if the floor is accessible by this elevator and not already in the\n// queue\nif\
  \ (accessibleFloors.contains(floor) && !targetFloors.contains(floor)) {\n        targetFloors.offer(floor);\n        updateDirection(floor);\n\
  \    }\n}\n\npublic class ShortestSeekTimeFirstStrategy\nimplements DispatchingStrategy {\n    @Override\n    public ElevatorCar\
  \ selectElevator(List<ElevatorCar> elevators, int floor, Direction direction) {\n        ElevatorCar\nbestElevator\n=\n\
  null;\n        int shortestDistance\n= Integer.MAX_VALUE;\n        for (ElevatorCar elevator : elevators) {\n          \
  \  // Calculate distance between elevator and requested floor\nint distance\n= Math.abs(elevator.getCurrentFloor() - floor);\n\
  \            // Select elevator if it's idle or moving in the same direction and closer than the\n// current best\nif ((elevator.isIdle()\
  \ || elevator.getCurrentDirection() == direction)\n                    // Only consider elevators that can actually reach\
  \ the requested floor\n                    && elevator.getAccessibleFloors().contains(floor)\n                    && distance\
  \ < shortestDistance) {\n                bestElevator = elevator;\n                shortestDistance = distance;\n      \
  \      }\n        }\n        return bestElevator;\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design an Elevator System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (Car Motion State), Strategy Pattern (Dispatching Algorithm), Observer Pattern (Floor Arrival Notifications)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
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
