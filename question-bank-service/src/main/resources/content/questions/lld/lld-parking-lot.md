---
slug: lld-parking-lot
title: Design a Parking Lot
track: SPRING_LLD
difficulty: MEDIUM
topics: [lld]
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- strategy-pattern
- facade-pattern
- parking-lot
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the Strategy Pattern for flexible, pluggable fare calculation strategies (hourly, peak-pricing, flat-rate).
- Decouple spot allocation logic from the main ParkingLot coordinator using a ParkingManager with thread-safe queues.
- Represent spot dimensions and vehicle types using enum constants for type-safe matching.
coaching:
  presentationTips:
  - Clarify spot types (Motorcycle, Compact, Large, Electric) and matching rules before sketching classes.
  - Discuss concurrency control when two vehicles attempt to take the last remaining spot simultaneously.
  - Explain how the design adheres to the Open/Closed Principle when adding new vehicle types or spot categories.
starterCode: "public interface Vehicle {\n    String getLicensePlate();\n    VehicleSize getSize();\n}\npublic class Car\n\
  implements Vehicle {\n    private String licensePlate;\n    public Car(String licensePlate) {\n        this.licensePlate\
  \ = licensePlate;\n    }\n    @Override\n    public String getLicensePlate() {\n        return this.licensePlate;\n    }\n\
  \    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\npublic enum VehicleSize\
  \ {\n    SMALL,\n    MEDIUM,\n    LARGE\n}\n\npublic interface ParkingSpot {\n    boolean isAvailable();\n    void occupy(Vehicle\
  \ vehicle);\n    void vacate();\n    int getSpotNumber();\n    VehicleSize getSize();\n}\n\npublic class CompactSpot\nimplements\
  \ ParkingSpot {\n    private int spotNumber;\n    private Vehicle vehicle; // The vehicle currently occupying this spot\n\
  public CompactSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle = null; // No vehicle\
  \ occupying initially\n    }\n    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n\
  \    public boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle\
  \ vehicle) {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is\
  \ already occupied.\n        }\n    }\n    @Override\n    public void vacate() {\n        this.vehicle = null; // Make the\
  \ spot available\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.SMALL; // Compact\
  \ spots fit small vehicles\n    }\n}"
solutionCode: "public interface Vehicle {\n    String getLicensePlate();\n    VehicleSize getSize();\n}\npublic class Car\n\
  implements Vehicle {\n    private String licensePlate;\n    public Car(String licensePlate) {\n        this.licensePlate\
  \ = licensePlate;\n    }\n    @Override\n    public String getLicensePlate() {\n        return this.licensePlate;\n    }\n\
  \    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\npublic enum VehicleSize\
  \ {\n    SMALL,\n    MEDIUM,\n    LARGE\n}\n\npublic interface ParkingSpot {\n    boolean isAvailable();\n    void occupy(Vehicle\
  \ vehicle);\n    void vacate();\n    int getSpotNumber();\n    VehicleSize getSize();\n}\n\npublic class CompactSpot\nimplements\
  \ ParkingSpot {\n    private int spotNumber;\n    private Vehicle vehicle; // The vehicle currently occupying this spot\n\
  public CompactSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle = null; // No vehicle\
  \ occupying initially\n    }\n    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n\
  \    public boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle\
  \ vehicle) {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is\
  \ already occupied.\n        }\n    }\n    @Override\n    public void vacate() {\n        this.vehicle = null; // Make the\
  \ spot available\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.SMALL; // Compact\
  \ spots fit small vehicles\n    }\n}\n\npublic class ParkingManager {\n    private final Map<VehicleSize, List<ParkingSpot>>\
  \ availableSpots;\n    private final Map<Vehicle, ParkingSpot> vehicleToSpotMap;\n    // Create Parking Manager based on\
  \ a given map of available spots\npublic ParkingManager(Map<VehicleSize, List<ParkingSpot>> availableSpots) {\n        this.availableSpots\
  \ = availableSpots;\n        this.vehicleToSpotMap = new HashMap<>();\n    }\n    public ParkingSpot findSpotForVehicle(Vehicle\
  \ vehicle) {\n        VehicleSize\nvehicleSize\n= vehicle.getSize();\n        // Start looking for the smallest spot that\
  \ can fit the vehicle\nfor (VehicleSize size : VehicleSize.values()) {\n            if (size.ordinal() >= vehicleSize.ordinal())\
  \ {\n                List<ParkingSpot> spots = availableSpots.get(size);\n                for (ParkingSpot spot : spots)\
  \ {\n                    if (spot.isAvailable()) {\n                        return spot; // Return the first available spot\n\
  \                    }\n                }\n            }\n        }\n        return null; // No suitable spot found\n  \
  \  }\n    public ParkingSpot parkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= findSpotForVehicle(vehicle);\n\
  \        if (spot != null) {\n            spot.occupy(vehicle); // Record the parking spot for the vehicle\n           \
  \ vehicleToSpotMap.put(vehicle, spot); // Remove the spot from the available list\n            availableSpots.get(spot.getSize()).remove(spot);\n\
  \            return spot; // Parking successful\n        }\n        return null; // No spot found for this vehicle\n   \
  \ }\n    public void unparkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= vehicleToSpotMap.remove(vehicle);\n\
  \        if (spot != null) {\n            spot.vacate();\n            availableSpots.get(spot.getSize()).add(spot);\n  \
  \      }\n    }\n}\n\npublic class Ticket {\n    private final String ticketId; // Unique ticket identifier\nprivate final\
  \ Vehicle vehicle; // The vehicle associated with the ticket\n// The parking spot where the vehicle is parked     private\
  \ final ParkingSpot parkingSpot;\n// // The time the vehicle entered the parking lot\nprivate final LocalDateTime entryTime;\
  \ // The time the vehicle exited the parking lot\nprivate LocalDateTime exitTime;\n    public Ticket(\n            String\
  \ ticketId, Vehicle vehicle, ParkingSpot parkingSpot, LocalDateTime entryTime) {\n        this.ticketId = ticketId;\n  \
  \      this.vehicle = vehicle;\n        this.parkingSpot = parkingSpot;\n        this.entryTime = entryTime;\n        //\
  \ Initially, exitTime is null because the vehicle is still parked         this.exitTime =\n// null;\n    }\n    public BigDecimal\
  \ calculateParkingDuration() {\n        return new BigDecimal(\n                Duration.between(\n                    \
  \            entryTime,\n                                Objects.requireNonNullElseGet(exitTime, LocalDateTime::now))\n\
  \                        .toMinutes());\n    } // getter and setter methods are omitted for brevity\n}\n\npublic interface\
  \ FareStrategy {\n    BigDecimal calculateFare(Ticket ticket, BigDecimal inputFare);\n}\n\npublic class BaseFareStrategy\n\
  implements FareStrategy {\n    private static final BigDecimal\nSMALL_VEHICLE_RATE\n=\nnew BigDecimal(\"1.0\");\n    private\
  \ static final BigDecimal\nMEDIUM_VEHICLE_RATE\n=\nnew BigDecimal(\"2.0\");\n    private static final BigDecimal\nLARGE_VEHICLE_RATE\n\
  =\nnew BigDecimal(\"3.0\");\n    // Calculate fare based on the duration and add it to the input fare to return a new total\n\
  @Override\n    public BigDecimal calculateFare(Ticket ticket, BigDecimal inputFare) {\n        BigDecimal\nfare\n= inputFare;\n\
  \        BigDecimal rate;\n        switch (ticket.getVehicle().getSize()) {\n            case MEDIUM:\n                rate\
  \ = MEDIUM_VEHICLE_RATE;\n                break;\n            case LARGE:\n                rate = LARGE_VEHICLE_RATE;\n\
  \                break;\n            default:\n                rate = SMALL_VEHICLE_RATE;\n        }\n        fare = fare.add(rate.multiply(ticket.calculateParkingDuration()));\n\
  \        return fare;\n    }\n}\n\npublic class PeakHoursFareStrategy\nimplements FareStrategy {\n    // 50% higher during\
  \ peak hours     private static final BigDecimal PEAK_HOURS_MULTIPLIER = new // BigDecimal(\"1.5\");\npublic PeakHoursFareStrategy()\
  \ {}\n    @Override\n    public BigDecimal calculateFare(Ticket ticket, BigDecimal inputFare) {\n        BigDecimal\nfare\n\
  = inputFare;\n        if (isPeakHours(ticket.getEntryTime())) {\n            fare = fare.multiply(PEAK_HOURS_MULTIPLIER);\n\
  \        }\n        return fare;\n    }\n    private boolean isPeakHours(LocalDateTime time) {\n        int hour\n= time.getHour();\n\
  \        return (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19);\n    }\n}\n\npublic class FareCalculator {\n  \
  \  private final List<FareStrategy> fareStrategies;\n    public FareCalculator(List<FareStrategy> fareStrategies) {\n  \
  \      this.fareStrategies = fareStrategies;\n    }\n    public BigDecimal calculateFare(Ticket ticket) {\n        BigDecimal\n\
  fare\n= BigDecimal.ZERO;\n        for (FareStrategy strategy : fareStrategies) {\n            fare = strategy.calculateFare(ticket,\
  \ fare);\n        }\n        return fare;\n    }\n}\n\npublic class ParkingLot {\n    // Manages parking spots and vehicle\
  \ assignments     private final ParkingManager\n// parkingManager;\n// Calculates fare for parking sessions     private\
  \ final FareCalculator fareCalculator;\npublic ParkingLot(ParkingManager parkingManager, FareCalculator fareCalculator)\
  \ {\n        this.parkingManager = parkingManager;\n        this.fareCalculator = fareCalculator;\n    }\n    // Method\
  \ to handle vehicle entry into the parking lot\npublic Ticket enterVehicle(Vehicle vehicle) {\n        // Delegate parking\
  \ logic to ParkingManager\nParkingSpot\nspot\n= parkingManager.parkVehicle(vehicle);\n        if (spot != null) {\n    \
  \        // Create ticket with entry time\nTicket\nticket\n=\nnew Ticket(generateTicketId(), vehicle, spot, LocalDateTime.now());\n\
  \            return ticket;\n        } else {\n            return null; // No spot available\n        }\n    }\n    // Method\
  \ to handle vehicle exit from the parking lot\npublic void leaveVehicle(Ticket ticket) {\n        // Ensure the ticket is\
  \ valid and the vehicle hasn't already left\nif (ticket != null && ticket.getExitTime() == null) {\n            // Set exit\
  \ time\n            ticket.setExitTime(LocalDateTime.now());\n            // Delegate unparking logic to ParkingManager\n\
  \            parkingManager.unparkVehicle(ticket.getVehicle());\n            // Calculate the fare\nBigDecimal\nfare\n=\
  \ fareCalculator.calculateFare(ticket);\n        } else {\n            // Invalid ticket or vehicle already exited.\n  \
  \      }\n    }\n}\n\npublic class HandicappedSpot\nimplements ParkingSpot {\n    private int spotNumber;\n    private Vehicle\
  \ vehicle;\n    public HandicappedSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle =\
  \ null;\n    }\n    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n    public\
  \ boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle vehicle)\
  \ {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is already\
  \ occupied.\n        }\n    }\n    @Override\n    public void vacate() {\n        this.vehicle = null;\n    }\n    @Override\n\
  \    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\n\npublic class ParkingManager {\n   \
  \ private final Map<VehicleSize, List<ParkingSpot>> availableSpots;\n    private final Map<Vehicle, ParkingSpot> vehicleToSpotMap;\n\
  \    private final Map<ParkingSpot, Vehicle> spotToVehicleMap;\n    // Create Parking Manager based on a given map of available\
  \ spots\npublic ParkingManager(Map<VehicleSize, List<ParkingSpot>> availableSpots) {\n        this.availableSpots = availableSpots;\n\
  \        this.vehicleToSpotMap = new HashMap<>();\n        this.spotToVehicleMap = new HashMap<>();\n    }\n    public ParkingSpot\
  \ findSpotForVehicle(Vehicle vehicle) {\n        // No change in the method\n    }\n    public ParkingSpot parkVehicle(Vehicle\
  \ vehicle) {\n        ParkingSpot\nspot\n= findSpotForVehicle(vehicle);\n        if (spot != null) {\n            spot.occupy(vehicle);\n\
  \            // Record bidirectional mapping\n            vehicleToSpotMap.put(vehicle, spot);\n            spotToVehicleMap.put(spot,\
  \ vehicle);\n            // Remove the spot from the available list\n            availableSpots.get(spot.getSize()).remove(spot);\n\
  \            return spot; // Parking successful\n        }\n        return null; // No spot found for this vehicle\n   \
  \ }\n    public void unparkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= vehicleToSpotMap.remove(vehicle);\n\
  \        if (spot != null) {\n            spotToVehicleMap.remove(spot);\n            spot.vacate();\n            availableSpots.get(spot.getSize()).add(spot);\n\
  \        }\n    }\n    // Find vehicle's parking spot\npublic ParkingSpot findVehicleBySpot(Vehicle vehicle) {\n       \
  \ return vehicleToSpotMap.get(vehicle);\n    }\n    // Find which vehicle is parked in a spot\npublic Vehicle findSpotByVehicle(ParkingSpot\
  \ spot) {\n        return spotToVehicleMap.get(spot);\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Parking Lot


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Strategy Pattern (Fare Calculation), Facade Pattern (ParkingLot Coordinator)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
---
### Problem Statement: Design a Parking Lot

Design an Object-Oriented Parking Lot management system supporting multiple vehicle types, dynamic parking spot assignment, ticket issuance, and automated fare calculation.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Parking Lot.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage Strategy Pattern (Fare Calculation), Facade Pattern (ParkingLot Coordinator).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
