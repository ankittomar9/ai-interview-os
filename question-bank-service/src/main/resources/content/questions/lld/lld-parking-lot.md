---
slug: lld-parking-lot
title: Design a Parking Lot
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
- strategy-pattern
- facade-pattern
- parking-lot
buildProfile: maven-workspace
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
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>parking-lot</artifactId>
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
    # Parking Lot System

    ## Overview
    Implement an object-oriented Parking Lot system supporting multi-tier vehicle parking, spot allocation, ticket issuance, and pluggable fare calculation strategies.

    ## Key Components
    - `com.interviewos.parkinglot.service.ParkingManager`: Manages spots, vehicle allocations, and lookup.
    - `com.interviewos.parkinglot.service.ParkingLot`: Facade handling vehicle entry and exit workflows.
    - `com.interviewos.parkinglot.strategy.FareStrategy`: Strategy interface for pricing.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/parkinglot/service/ParkingManager.java`
    2. `src/main/java/com/interviewos/parkinglot/service/ParkingLot.java`
    3. `src/main/java/com/interviewos/parkinglot/strategy/BaseFareStrategy.java`
  src/main/java/com/interviewos/parkinglot/model/VehicleSize.java: |
    package com.interviewos.parkinglot.model;

    public enum VehicleSize {
        SMALL,
        MEDIUM,
        LARGE
    }
  src/main/java/com/interviewos/parkinglot/model/Vehicle.java: |
    package com.interviewos.parkinglot.model;

    public interface Vehicle {
        String getLicensePlate();
        VehicleSize getSize();
    }
  src/main/java/com/interviewos/parkinglot/model/Car.java: |
    package com.interviewos.parkinglot.model;

    public class Car implements Vehicle {
        private final String licensePlate;

        public Car(String licensePlate) {
            this.licensePlate = licensePlate;
        }

        @Override
        public String getLicensePlate() {
            return licensePlate;
        }

        @Override
        public VehicleSize getSize() {
            return VehicleSize.MEDIUM;
        }
    }
  src/main/java/com/interviewos/parkinglot/model/Motorcycle.java: |
    package com.interviewos.parkinglot.model;

    public class Motorcycle implements Vehicle {
        private final String licensePlate;

        public Motorcycle(String licensePlate) {
            this.licensePlate = licensePlate;
        }

        @Override
        public String getLicensePlate() {
            return licensePlate;
        }

        @Override
        public VehicleSize getSize() {
            return VehicleSize.SMALL;
        }
    }
  src/main/java/com/interviewos/parkinglot/model/Truck.java: |
    package com.interviewos.parkinglot.model;

    public class Truck implements Vehicle {
        private final String licensePlate;

        public Truck(String licensePlate) {
            this.licensePlate = licensePlate;
        }

        @Override
        public String getLicensePlate() {
            return licensePlate;
        }

        @Override
        public VehicleSize getSize() {
            return VehicleSize.LARGE;
        }
    }
  src/main/java/com/interviewos/parkinglot/model/ParkingSpot.java: |
    package com.interviewos.parkinglot.model;

    public interface ParkingSpot {
        int getSpotNumber();
        VehicleSize getSize();
        boolean isAvailable();
        void occupy(Vehicle vehicle);
        void vacate();
        Vehicle getOccupyingVehicle();
    }
  src/main/java/com/interviewos/parkinglot/model/CompactSpot.java: |
    package com.interviewos.parkinglot.model;

    public class CompactSpot implements ParkingSpot {
        private final int spotNumber;
        private Vehicle vehicle;

        public CompactSpot(int spotNumber) {
            this.spotNumber = spotNumber;
        }

        @Override
        public int getSpotNumber() { return spotNumber; }

        @Override
        public VehicleSize getSize() { return VehicleSize.MEDIUM; }

        @Override
        public synchronized boolean isAvailable() { return vehicle == null; }

        @Override
        public synchronized void occupy(Vehicle vehicle) {
            this.vehicle = vehicle;
        }

        @Override
        public synchronized void vacate() {
            this.vehicle = null;
        }

        @Override
        public synchronized Vehicle getOccupyingVehicle() {
            return vehicle;
        }
    }
  src/main/java/com/interviewos/parkinglot/model/MotorcycleSpot.java: |
    package com.interviewos.parkinglot.model;

    public class MotorcycleSpot implements ParkingSpot {
        private final int spotNumber;
        private Vehicle vehicle;

        public MotorcycleSpot(int spotNumber) {
            this.spotNumber = spotNumber;
        }

        @Override
        public int getSpotNumber() { return spotNumber; }

        @Override
        public VehicleSize getSize() { return VehicleSize.SMALL; }

        @Override
        public synchronized boolean isAvailable() { return vehicle == null; }

        @Override
        public synchronized void occupy(Vehicle vehicle) {
            this.vehicle = vehicle;
        }

        @Override
        public synchronized void vacate() {
            this.vehicle = null;
        }

        @Override
        public synchronized Vehicle getOccupyingVehicle() {
            return vehicle;
        }
    }
  src/main/java/com/interviewos/parkinglot/model/LargeSpot.java: |
    package com.interviewos.parkinglot.model;

    public class LargeSpot implements ParkingSpot {
        private final int spotNumber;
        private Vehicle vehicle;

        public LargeSpot(int spotNumber) {
            this.spotNumber = spotNumber;
        }

        @Override
        public int getSpotNumber() { return spotNumber; }

        @Override
        public VehicleSize getSize() { return VehicleSize.LARGE; }

        @Override
        public synchronized boolean isAvailable() { return vehicle == null; }

        @Override
        public synchronized void occupy(Vehicle vehicle) {
            this.vehicle = vehicle;
        }

        @Override
        public synchronized void vacate() {
            this.vehicle = null;
        }

        @Override
        public synchronized Vehicle getOccupyingVehicle() {
            return vehicle;
        }
    }
  src/main/java/com/interviewos/parkinglot/model/Ticket.java: |
    package com.interviewos.parkinglot.model;

    import java.math.BigDecimal;
    import java.time.Duration;
    import java.time.LocalDateTime;
    import java.util.Objects;

    public class Ticket {
        private final String ticketId;
        private final Vehicle vehicle;
        private final ParkingSpot parkingSpot;
        private final LocalDateTime entryTime;
        private LocalDateTime exitTime;

        public Ticket(String ticketId, Vehicle vehicle, ParkingSpot parkingSpot, LocalDateTime entryTime) {
            this.ticketId = ticketId;
            this.vehicle = vehicle;
            this.parkingSpot = parkingSpot;
            this.entryTime = entryTime;
        }

        public BigDecimal calculateDurationMinutes() {
            LocalDateTime end = Objects.requireNonNullElseGet(exitTime, LocalDateTime::now);
            long minutes = Math.max(1, Duration.between(entryTime, end).toMinutes());
            return BigDecimal.valueOf(minutes);
        }

        public String getTicketId() { return ticketId; }
        public Vehicle getVehicle() { return vehicle; }
        public ParkingSpot getParkingSpot() { return parkingSpot; }
        public LocalDateTime getEntryTime() { return entryTime; }
        public LocalDateTime getExitTime() { return exitTime; }
        public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }
    }
  src/main/java/com/interviewos/parkinglot/strategy/FareStrategy.java: |
    package com.interviewos.parkinglot.strategy;

    import com.interviewos.parkinglot.model.Ticket;
    import java.math.BigDecimal;

    public interface FareStrategy {
        BigDecimal calculateFare(Ticket ticket, BigDecimal baseFare);
    }
  src/main/java/com/interviewos/parkinglot/strategy/BaseFareStrategy.java: |
    package com.interviewos.parkinglot.strategy;

    import com.interviewos.parkinglot.model.Ticket;
    import java.math.BigDecimal;

    public class BaseFareStrategy implements FareStrategy {
        public static final BigDecimal SMALL_RATE = new BigDecimal("1.00");
        public static final BigDecimal MEDIUM_RATE = new BigDecimal("2.00");
        public static final BigDecimal LARGE_RATE = new BigDecimal("3.00");

        @Override
        public BigDecimal calculateFare(Ticket ticket, BigDecimal baseFare) {
            // TODO: Calculate rate based on vehicle size and duration, add to baseFare
            throw new UnsupportedOperationException("TODO: Implement BaseFareStrategy.calculateFare");
        }
    }
  src/main/java/com/interviewos/parkinglot/service/ParkingManager.java: |
    package com.interviewos.parkinglot.service;

    import com.interviewos.parkinglot.model.ParkingSpot;
    import com.interviewos.parkinglot.model.Vehicle;
    import com.interviewos.parkinglot.model.VehicleSize;
    import java.util.*;

    public class ParkingManager {
        private final Map<VehicleSize, List<ParkingSpot>> availableSpots = new EnumMap<>(VehicleSize.class);
        private final Map<String, ParkingSpot> activeAllocations = new HashMap<>();

        public ParkingManager(Map<VehicleSize, List<ParkingSpot>> initialSpots) {
            for (VehicleSize size : VehicleSize.values()) {
                availableSpots.put(size, new ArrayList<>());
            }
            if (initialSpots != null) {
                initialSpots.forEach((k, v) -> availableSpots.get(k).addAll(v));
            }
        }

        public synchronized ParkingSpot findSpotForVehicle(Vehicle vehicle) {
            // TODO: Find first available spot matching or exceeding vehicle size
            throw new UnsupportedOperationException("TODO: Implement findSpotForVehicle");
        }

        public synchronized ParkingSpot parkVehicle(Vehicle vehicle) {
            // TODO: Find spot, occupy it, record allocation
            throw new UnsupportedOperationException("TODO: Implement parkVehicle");
        }

        public synchronized boolean unparkVehicle(Vehicle vehicle) {
            // TODO: Free spot and remove allocation
            throw new UnsupportedOperationException("TODO: Implement unparkVehicle");
        }

        public synchronized ParkingSpot getSpotForVehicle(String licensePlate) {
            return activeAllocations.get(licensePlate);
        }
    }
  src/main/java/com/interviewos/parkinglot/service/ParkingLot.java: |
    package com.interviewos.parkinglot.service;

    import com.interviewos.parkinglot.model.ParkingSpot;
    import com.interviewos.parkinglot.model.Ticket;
    import com.interviewos.parkinglot.model.Vehicle;
    import com.interviewos.parkinglot.strategy.FareStrategy;
    import java.math.BigDecimal;
    import java.time.LocalDateTime;
    import java.util.Map;
    import java.util.UUID;
    import java.util.concurrent.ConcurrentHashMap;

    public class ParkingLot {
        private final ParkingManager parkingManager;
        private final FareStrategy fareStrategy;
        private final Map<String, Ticket> activeTickets = new ConcurrentHashMap<>();

        public ParkingLot(ParkingManager parkingManager, FareStrategy fareStrategy) {
            this.parkingManager = parkingManager;
            this.fareStrategy = fareStrategy;
        }

        public Ticket enterVehicle(Vehicle vehicle) {
            // TODO: Delegate to parkingManager, generate Ticket, store active ticket
            throw new UnsupportedOperationException("TODO: Implement enterVehicle");
        }

        public BigDecimal leaveVehicle(String ticketId) {
            // TODO: Validate ticket, unpark vehicle, calculate fare via strategy, remove ticket
            throw new UnsupportedOperationException("TODO: Implement leaveVehicle");
        }

        public ParkingManager getParkingManager() { return parkingManager; }
        public FareStrategy getFareStrategy() { return fareStrategy; }
    }
editablePaths:
- src/main/java/com/interviewos/parkinglot/service/ParkingManager.java
- src/main/java/com/interviewos/parkinglot/service/ParkingLot.java
- src/main/java/com/interviewos/parkinglot/strategy/BaseFareStrategy.java
hiddenTestFiles:
  src/test/java/com/interviewos/parkinglot/SpotAllocationTest.java: |
    package com.interviewos.parkinglot;

    import com.interviewos.parkinglot.model.*;
    import com.interviewos.parkinglot.service.ParkingManager;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.*;

    import static org.junit.jupiter.api.Assertions.*;

    public class SpotAllocationTest {
        private ParkingManager manager;

        @BeforeEach
        void setUp() {
            Map<VehicleSize, List<ParkingSpot>> spots = new EnumMap<>(VehicleSize.class);
            spots.put(VehicleSize.SMALL, new ArrayList<>(List.of(new MotorcycleSpot(1))));
            spots.put(VehicleSize.MEDIUM, new ArrayList<>(List.of(new CompactSpot(2))));
            spots.put(VehicleSize.LARGE, new ArrayList<>(List.of(new LargeSpot(3))));
            manager = new ParkingManager(spots);
        }

        @Test
        @DisplayName("Allocate spot for Car, Motorcycle, Truck based on size compatibility")
        void testAllocationBySize() {
            Vehicle moto = new Motorcycle("M-1");
            Vehicle car = new Car("C-1");
            Vehicle truck = new Truck("T-1");

            ParkingSpot s1 = manager.parkVehicle(moto);
            assertNotNull(s1);
            assertEquals(1, s1.getSpotNumber());

            ParkingSpot s2 = manager.parkVehicle(car);
            assertNotNull(s2);
            assertEquals(2, s2.getSpotNumber());

            ParkingSpot s3 = manager.parkVehicle(truck);
            assertNotNull(s3);
            assertEquals(3, s3.getSpotNumber());
        }

        @Test
        @DisplayName("Full lot returns null when no matching size spots remain")
        void testFullLotRejection() {
            Vehicle truck1 = new Truck("T-1");
            Vehicle truck2 = new Truck("T-2");

            assertNotNull(manager.parkVehicle(truck1));
            assertNull(manager.parkVehicle(truck2), "Second truck must be rejected when single LARGE spot occupied");
        }
    }
  src/test/java/com/interviewos/parkinglot/FareCalculationTest.java: |
    package com.interviewos.parkinglot;

    import com.interviewos.parkinglot.model.*;
    import com.interviewos.parkinglot.strategy.BaseFareStrategy;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.LocalDateTime;

    import static org.junit.jupiter.api.Assertions.*;

    public class FareCalculationTest {
        @Test
        @DisplayName("Base fare strategy calculates cost proportionally to vehicle rate and duration")
        void testFareCalculation() {
            BaseFareStrategy strategy = new BaseFareStrategy();
            Vehicle car = new Car("CAR-99");
            ParkingSpot spot = new CompactSpot(10);
            LocalDateTime entry = LocalDateTime.now().minusMinutes(60);
            Ticket ticket = new Ticket("TKT-1", car, spot, entry);
            ticket.setExitTime(entry.plusMinutes(60));

            BigDecimal fare = strategy.calculateFare(ticket, BigDecimal.ZERO);
            // 60 minutes * 2.00 = 120.00
            assertEquals(new BigDecimal("120.00"), fare);
        }

        @Test
        @DisplayName("Large vehicle has higher fare multiplier than small vehicle")
        void testVehicleMultiplier() {
            BaseFareStrategy strategy = new BaseFareStrategy();
            LocalDateTime entry = LocalDateTime.now().minusMinutes(30);

            Ticket truckTicket = new Ticket("T1", new Truck("TRK-1"), new LargeSpot(1), entry);
            truckTicket.setExitTime(entry.plusMinutes(30));

            Ticket motoTicket = new Ticket("T2", new Motorcycle("MOT-1"), new MotorcycleSpot(2), entry);
            motoTicket.setExitTime(entry.plusMinutes(30));

            BigDecimal truckFare = strategy.calculateFare(truckTicket, BigDecimal.ZERO);
            BigDecimal motoFare = strategy.calculateFare(motoTicket, BigDecimal.ZERO);

            assertTrue(truckFare.compareTo(motoFare) > 0);
        }
    }
  src/test/java/com/interviewos/parkinglot/ParkingLifecycleTest.java: |
    package com.interviewos.parkinglot;

    import com.interviewos.parkinglot.model.*;
    import com.interviewos.parkinglot.service.ParkingLot;
    import com.interviewos.parkinglot.service.ParkingManager;
    import com.interviewos.parkinglot.strategy.BaseFareStrategy;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.util.*;

    import static org.junit.jupiter.api.Assertions.*;

    public class ParkingLifecycleTest {
        private ParkingLot lot;

        @BeforeEach
        void setUp() {
            Map<VehicleSize, List<ParkingSpot>> spots = new EnumMap<>(VehicleSize.class);
            spots.put(VehicleSize.MEDIUM, new ArrayList<>(List.of(new CompactSpot(101))));
            ParkingManager manager = new ParkingManager(spots);
            lot = new ParkingLot(manager, new BaseFareStrategy());
        }

        @Test
        @DisplayName("Complete parking lifecycle: enter -> park -> leave -> spot freed")
        void testEndToEndLifecycle() {
            Car car = new Car("NYC-4455");
            Ticket ticket = lot.enterVehicle(car);
            assertNotNull(ticket);
            assertEquals(101, ticket.getParkingSpot().getSpotNumber());

            BigDecimal fare = lot.leaveVehicle(ticket.getTicketId());
            assertNotNull(fare);
            assertTrue(fare.compareTo(BigDecimal.ZERO) >= 0);

            // Spot should now be freed and available for next car
            Car car2 = new Car("BOS-9988");
            Ticket ticket2 = lot.enterVehicle(car2);
            assertNotNull(ticket2, "Spot 101 should be available again after unparking");
            assertEquals(101, ticket2.getParkingSpot().getSpotNumber());
        }
    }

starterCode: "public interface Vehicle {\n    String getLicensePlate();\n    VehicleSize getSize();\n}\npublic class Car\nimplements Vehicle {\n    private String licensePlate;\n    public Car(String licensePlate) {\n        this.licensePlate = licensePlate;\n    }\n    @Override\n    public String getLicensePlate() {\n        return this.licensePlate;\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\npublic enum VehicleSize {\n    SMALL,\n    MEDIUM,\n    LARGE\n}\n\npublic interface ParkingSpot {\n    boolean isAvailable();\n    void occupy(Vehicle vehicle);\n    void vacate();\n    int getSpotNumber();\n    VehicleSize getSize();\n}\n\npublic class CompactSpot\nimplements ParkingSpot {\n    private int spotNumber;\n    private Vehicle vehicle; // The vehicle currently occupying this spot\npublic CompactSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle = null; // No vehicle occupying initially\n  \
  \  }\n    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n    public boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle vehicle) {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is already occupied.\n        }\n    }\n    @Override\n    public void vacate() {\n        this.vehicle = null; // Make the spot available\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.SMALL; // Compact spots fit small vehicles\n    }\n}"
solutionCode: "public interface Vehicle {\n    String getLicensePlate();\n    VehicleSize getSize();\n}\npublic class Car\nimplements Vehicle {\n    private String licensePlate;\n    public Car(String licensePlate) {\n        this.licensePlate = licensePlate;\n    }\n    @Override\n    public String getLicensePlate() {\n        return this.licensePlate;\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\npublic enum VehicleSize {\n    SMALL,\n    MEDIUM,\n    LARGE\n}\n\npublic interface ParkingSpot {\n    boolean isAvailable();\n    void occupy(Vehicle vehicle);\n    void vacate();\n    int getSpotNumber();\n    VehicleSize getSize();\n}\n\npublic class CompactSpot\nimplements ParkingSpot {\n    private int spotNumber;\n    private Vehicle vehicle; // The vehicle currently occupying this spot\npublic CompactSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle = null; // No vehicle occupying initially\n \
  \   }\n    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n    public boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle vehicle) {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is already occupied.\n        }\n    }\n    @Override\n    public void vacate() {\n        this.vehicle = null; // Make the spot available\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.SMALL; // Compact spots fit small vehicles\n    }\n}\n\npublic class ParkingManager {\n    private final Map<VehicleSize, List<ParkingSpot>> availableSpots;\n    private final Map<Vehicle, ParkingSpot> vehicleToSpotMap;\n    // Create Parking Manager based on a given map of available spots\npublic ParkingManager(Map<VehicleSize, List<ParkingSpot>> availableSpots) {\n        this.availableSpots = availableSpots;\n        this.vehicleToSpotMap\
  \ = new HashMap<>();\n    }\n    public ParkingSpot findSpotForVehicle(Vehicle vehicle) {\n        VehicleSize\nvehicleSize\n= vehicle.getSize();\n        // Start looking for the smallest spot that can fit the vehicle\nfor (VehicleSize size : VehicleSize.values()) {\n            if (size.ordinal() >= vehicleSize.ordinal()) {\n                List<ParkingSpot> spots = availableSpots.get(size);\n                for (ParkingSpot spot : spots) {\n                    if (spot.isAvailable()) {\n                        return spot; // Return the first available spot\n                    }\n                }\n            }\n        }\n        return null; // No suitable spot found\n    }\n    public ParkingSpot parkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= findSpotForVehicle(vehicle);\n        if (spot != null) {\n            spot.occupy(vehicle); // Record the parking spot for the vehicle\n            vehicleToSpotMap.put(vehicle, spot); // Remove the spot from the available list\n\
  \            availableSpots.get(spot.getSize()).remove(spot);\n            return spot; // Parking successful\n        }\n        return null; // No spot found for this vehicle\n    }\n    public void unparkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= vehicleToSpotMap.remove(vehicle);\n        if (spot != null) {\n            spot.vacate();\n            availableSpots.get(spot.getSize()).add(spot);\n        }\n    }\n}\n\npublic class Ticket {\n    private final String ticketId; // Unique ticket identifier\nprivate final Vehicle vehicle; // The vehicle associated with the ticket\n// The parking spot where the vehicle is parked     private final ParkingSpot parkingSpot;\n// // The time the vehicle entered the parking lot\nprivate final LocalDateTime entryTime; // The time the vehicle exited the parking lot\nprivate LocalDateTime exitTime;\n    public Ticket(\n            String ticketId, Vehicle vehicle, ParkingSpot parkingSpot, LocalDateTime entryTime) {\n        this.ticketId\
  \ = ticketId;\n        this.vehicle = vehicle;\n        this.parkingSpot = parkingSpot;\n        this.entryTime = entryTime;\n        // Initially, exitTime is null because the vehicle is still parked         this.exitTime =\n// null;\n    }\n    public BigDecimal calculateParkingDuration() {\n        return new BigDecimal(\n                Duration.between(\n                                entryTime,\n                                Objects.requireNonNullElseGet(exitTime, LocalDateTime::now))\n                        .toMinutes());\n    } // getter and setter methods are omitted for brevity\n}\n\npublic interface FareStrategy {\n    BigDecimal calculateFare(Ticket ticket, BigDecimal inputFare);\n}\n\npublic class BaseFareStrategy\nimplements FareStrategy {\n    private static final BigDecimal\nSMALL_VEHICLE_RATE\n=\nnew BigDecimal(\"1.0\");\n    private static final BigDecimal\nMEDIUM_VEHICLE_RATE\n=\nnew BigDecimal(\"2.0\");\n    private static final BigDecimal\nLARGE_VEHICLE_RATE\n\
  =\nnew BigDecimal(\"3.0\");\n    // Calculate fare based on the duration and add it to the input fare to return a new total\n@Override\n    public BigDecimal calculateFare(Ticket ticket, BigDecimal inputFare) {\n        BigDecimal\nfare\n= inputFare;\n        BigDecimal rate;\n        switch (ticket.getVehicle().getSize()) {\n            case MEDIUM:\n                rate = MEDIUM_VEHICLE_RATE;\n                break;\n            case LARGE:\n                rate = LARGE_VEHICLE_RATE;\n                break;\n            default:\n                rate = SMALL_VEHICLE_RATE;\n        }\n        fare = fare.add(rate.multiply(ticket.calculateParkingDuration()));\n        return fare;\n    }\n}\n\npublic class PeakHoursFareStrategy\nimplements FareStrategy {\n    // 50% higher during peak hours     private static final BigDecimal PEAK_HOURS_MULTIPLIER = new // BigDecimal(\"1.5\");\npublic PeakHoursFareStrategy() {}\n    @Override\n    public BigDecimal calculateFare(Ticket ticket, BigDecimal\
  \ inputFare) {\n        BigDecimal\nfare\n= inputFare;\n        if (isPeakHours(ticket.getEntryTime())) {\n            fare = fare.multiply(PEAK_HOURS_MULTIPLIER);\n        }\n        return fare;\n    }\n    private boolean isPeakHours(LocalDateTime time) {\n        int hour\n= time.getHour();\n        return (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19);\n    }\n}\n\npublic class FareCalculator {\n    private final List<FareStrategy> fareStrategies;\n    public FareCalculator(List<FareStrategy> fareStrategies) {\n        this.fareStrategies = fareStrategies;\n    }\n    public BigDecimal calculateFare(Ticket ticket) {\n        BigDecimal\nfare\n= BigDecimal.ZERO;\n        for (FareStrategy strategy : fareStrategies) {\n            fare = strategy.calculateFare(ticket, fare);\n        }\n        return fare;\n    }\n}\n\npublic class ParkingLot {\n    // Manages parking spots and vehicle assignments     private final ParkingManager\n// parkingManager;\n// Calculates fare for\
  \ parking sessions     private final FareCalculator fareCalculator;\npublic ParkingLot(ParkingManager parkingManager, FareCalculator fareCalculator) {\n        this.parkingManager = parkingManager;\n        this.fareCalculator = fareCalculator;\n    }\n    // Method to handle vehicle entry into the parking lot\npublic Ticket enterVehicle(Vehicle vehicle) {\n        // Delegate parking logic to ParkingManager\nParkingSpot\nspot\n= parkingManager.parkVehicle(vehicle);\n        if (spot != null) {\n            // Create ticket with entry time\nTicket\nticket\n=\nnew Ticket(generateTicketId(), vehicle, spot, LocalDateTime.now());\n            return ticket;\n        } else {\n            return null; // No spot available\n        }\n    }\n    // Method to handle vehicle exit from the parking lot\npublic void leaveVehicle(Ticket ticket) {\n        // Ensure the ticket is valid and the vehicle hasn't already left\nif (ticket != null && ticket.getExitTime() == null) {\n            // Set exit\
  \ time\n            ticket.setExitTime(LocalDateTime.now());\n            // Delegate unparking logic to ParkingManager\n            parkingManager.unparkVehicle(ticket.getVehicle());\n            // Calculate the fare\nBigDecimal\nfare\n= fareCalculator.calculateFare(ticket);\n        } else {\n            // Invalid ticket or vehicle already exited.\n        }\n    }\n}\n\npublic class HandicappedSpot\nimplements ParkingSpot {\n    private int spotNumber;\n    private Vehicle vehicle;\n    public HandicappedSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle = null;\n    }\n    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n    public boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle vehicle) {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is already occupied.\n        }\n    }\n    @Override\n\
  \    public void vacate() {\n        this.vehicle = null;\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\n\npublic class ParkingManager {\n    private final Map<VehicleSize, List<ParkingSpot>> availableSpots;\n    private final Map<Vehicle, ParkingSpot> vehicleToSpotMap;\n    private final Map<ParkingSpot, Vehicle> spotToVehicleMap;\n    // Create Parking Manager based on a given map of available spots\npublic ParkingManager(Map<VehicleSize, List<ParkingSpot>> availableSpots) {\n        this.availableSpots = availableSpots;\n        this.vehicleToSpotMap = new HashMap<>();\n        this.spotToVehicleMap = new HashMap<>();\n    }\n    public ParkingSpot findSpotForVehicle(Vehicle vehicle) {\n        // No change in the method\n    }\n    public ParkingSpot parkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= findSpotForVehicle(vehicle);\n        if (spot != null) {\n            spot.occupy(vehicle);\n            // Record\
  \ bidirectional mapping\n            vehicleToSpotMap.put(vehicle, spot);\n            spotToVehicleMap.put(spot, vehicle);\n            // Remove the spot from the available list\n            availableSpots.get(spot.getSize()).remove(spot);\n            return spot; // Parking successful\n        }\n        return null; // No spot found for this vehicle\n    }\n    public void unparkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= vehicleToSpotMap.remove(vehicle);\n        if (spot != null) {\n            spotToVehicleMap.remove(spot);\n            spot.vacate();\n            availableSpots.get(spot.getSize()).add(spot);\n        }\n    }\n    // Find vehicle's parking spot\npublic ParkingSpot findVehicleBySpot(Vehicle vehicle) {\n        return vehicleToSpotMap.get(vehicle);\n    }\n    // Find which vehicle is parked in a spot\npublic Vehicle findSpotByVehicle(ParkingSpot spot) {\n        return spotToVehicleMap.get(spot);\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Parking Lot


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Strategy Pattern (Fare Calculation), Facade Pattern (ParkingLot Coordinator)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-parking-lot
  label: Canonical — Design a Parking Lot
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
  code: "public interface Vehicle {\n    String getLicensePlate();\n    VehicleSize getSize();\n}\npublic class Car\nimplements Vehicle {\n    private String licensePlate;\n    public Car(String licensePlate) {\n        this.licensePlate = licensePlate;\n    }\n    @Override\n    public String getLicensePlate() {\n        return this.licensePlate;\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\npublic enum VehicleSize {\n    SMALL,\n    MEDIUM,\n    LARGE\n}\n\npublic interface ParkingSpot {\n    boolean isAvailable();\n    void occupy(Vehicle vehicle);\n    void vacate();\n    int getSpotNumber();\n    VehicleSize getSize();\n}\n\npublic class CompactSpot\nimplements ParkingSpot {\n    private int spotNumber;\n    private Vehicle vehicle; // The vehicle currently occupying this spot\npublic CompactSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle = null; // No vehicle occupying initially\n    }\n\
    \    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n    public boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle vehicle) {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is already occupied.\n        }\n    }\n    @Override\n    public void vacate() {\n        this.vehicle = null; // Make the spot available\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.SMALL; // Compact spots fit small vehicles\n    }\n}\n\npublic class ParkingManager {\n    private final Map<VehicleSize, List<ParkingSpot>> availableSpots;\n    private final Map<Vehicle, ParkingSpot> vehicleToSpotMap;\n    // Create Parking Manager based on a given map of available spots\npublic ParkingManager(Map<VehicleSize, List<ParkingSpot>> availableSpots) {\n        this.availableSpots = availableSpots;\n        this.vehicleToSpotMap\
    \ = new HashMap<>();\n    }\n    public ParkingSpot findSpotForVehicle(Vehicle vehicle) {\n        VehicleSize\nvehicleSize\n= vehicle.getSize();\n        // Start looking for the smallest spot that can fit the vehicle\nfor (VehicleSize size : VehicleSize.values()) {\n            if (size.ordinal() >= vehicleSize.ordinal()) {\n                List<ParkingSpot> spots = availableSpots.get(size);\n                for (ParkingSpot spot : spots) {\n                    if (spot.isAvailable()) {\n                        return spot; // Return the first available spot\n                    }\n                }\n            }\n        }\n        return null; // No suitable spot found\n    }\n    public ParkingSpot parkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= findSpotForVehicle(vehicle);\n        if (spot != null) {\n            spot.occupy(vehicle); // Record the parking spot for the vehicle\n            vehicleToSpotMap.put(vehicle, spot); // Remove the spot from the available\
    \ list\n            availableSpots.get(spot.getSize()).remove(spot);\n            return spot; // Parking successful\n        }\n        return null; // No spot found for this vehicle\n    }\n    public void unparkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= vehicleToSpotMap.remove(vehicle);\n        if (spot != null) {\n            spot.vacate();\n            availableSpots.get(spot.getSize()).add(spot);\n        }\n    }\n}\n\npublic class Ticket {\n    private final String ticketId; // Unique ticket identifier\nprivate final Vehicle vehicle; // The vehicle associated with the ticket\n// The parking spot where the vehicle is parked     private final ParkingSpot parkingSpot;\n// // The time the vehicle entered the parking lot\nprivate final LocalDateTime entryTime; // The time the vehicle exited the parking lot\nprivate LocalDateTime exitTime;\n    public Ticket(\n            String ticketId, Vehicle vehicle, ParkingSpot parkingSpot, LocalDateTime entryTime) {\n        this.ticketId\
    \ = ticketId;\n        this.vehicle = vehicle;\n        this.parkingSpot = parkingSpot;\n        this.entryTime = entryTime;\n        // Initially, exitTime is null because the vehicle is still parked         this.exitTime =\n// null;\n    }\n    public BigDecimal calculateParkingDuration() {\n        return new BigDecimal(\n                Duration.between(\n                                entryTime,\n                                Objects.requireNonNullElseGet(exitTime, LocalDateTime::now))\n                        .toMinutes());\n    } // getter and setter methods are omitted for brevity\n}\n\npublic interface FareStrategy {\n    BigDecimal calculateFare(Ticket ticket, BigDecimal inputFare);\n}\n\npublic class BaseFareStrategy\nimplements FareStrategy {\n    private static final BigDecimal\nSMALL_VEHICLE_RATE\n=\nnew BigDecimal(\"1.0\");\n    private static final BigDecimal\nMEDIUM_VEHICLE_RATE\n=\nnew BigDecimal(\"2.0\");\n    private static final BigDecimal\nLARGE_VEHICLE_RATE\n\
    =\nnew BigDecimal(\"3.0\");\n    // Calculate fare based on the duration and add it to the input fare to return a new total\n@Override\n    public BigDecimal calculateFare(Ticket ticket, BigDecimal inputFare) {\n        BigDecimal\nfare\n= inputFare;\n        BigDecimal rate;\n        switch (ticket.getVehicle().getSize()) {\n            case MEDIUM:\n                rate = MEDIUM_VEHICLE_RATE;\n                break;\n            case LARGE:\n                rate = LARGE_VEHICLE_RATE;\n                break;\n            default:\n                rate = SMALL_VEHICLE_RATE;\n        }\n        fare = fare.add(rate.multiply(ticket.calculateParkingDuration()));\n        return fare;\n    }\n}\n\npublic class PeakHoursFareStrategy\nimplements FareStrategy {\n    // 50% higher during peak hours     private static final BigDecimal PEAK_HOURS_MULTIPLIER = new // BigDecimal(\"1.5\");\npublic PeakHoursFareStrategy() {}\n    @Override\n    public BigDecimal calculateFare(Ticket ticket, BigDecimal\
    \ inputFare) {\n        BigDecimal\nfare\n= inputFare;\n        if (isPeakHours(ticket.getEntryTime())) {\n            fare = fare.multiply(PEAK_HOURS_MULTIPLIER);\n        }\n        return fare;\n    }\n    private boolean isPeakHours(LocalDateTime time) {\n        int hour\n= time.getHour();\n        return (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19);\n    }\n}\n\npublic class FareCalculator {\n    private final List<FareStrategy> fareStrategies;\n    public FareCalculator(List<FareStrategy> fareStrategies) {\n        this.fareStrategies = fareStrategies;\n    }\n    public BigDecimal calculateFare(Ticket ticket) {\n        BigDecimal\nfare\n= BigDecimal.ZERO;\n        for (FareStrategy strategy : fareStrategies) {\n            fare = strategy.calculateFare(ticket, fare);\n        }\n        return fare;\n    }\n}\n\npublic class ParkingLot {\n    // Manages parking spots and vehicle assignments     private final ParkingManager\n// parkingManager;\n// Calculates fare for\
    \ parking sessions     private final FareCalculator fareCalculator;\npublic ParkingLot(ParkingManager parkingManager, FareCalculator fareCalculator) {\n        this.parkingManager = parkingManager;\n        this.fareCalculator = fareCalculator;\n    }\n    // Method to handle vehicle entry into the parking lot\npublic Ticket enterVehicle(Vehicle vehicle) {\n        // Delegate parking logic to ParkingManager\nParkingSpot\nspot\n= parkingManager.parkVehicle(vehicle);\n        if (spot != null) {\n            // Create ticket with entry time\nTicket\nticket\n=\nnew Ticket(generateTicketId(), vehicle, spot, LocalDateTime.now());\n            return ticket;\n        } else {\n            return null; // No spot available\n        }\n    }\n    // Method to handle vehicle exit from the parking lot\npublic void leaveVehicle(Ticket ticket) {\n        // Ensure the ticket is valid and the vehicle hasn't already left\nif (ticket != null && ticket.getExitTime() == null) {\n            // Set exit\
    \ time\n            ticket.setExitTime(LocalDateTime.now());\n            // Delegate unparking logic to ParkingManager\n            parkingManager.unparkVehicle(ticket.getVehicle());\n            // Calculate the fare\nBigDecimal\nfare\n= fareCalculator.calculateFare(ticket);\n        } else {\n            // Invalid ticket or vehicle already exited.\n        }\n    }\n}\n\npublic class HandicappedSpot\nimplements ParkingSpot {\n    private int spotNumber;\n    private Vehicle vehicle;\n    public HandicappedSpot(int spotNumber) {\n        this.spotNumber = spotNumber;\n        this.vehicle = null;\n    }\n    @Override\n    public int getSpotNumber() {\n        return spotNumber;\n    }\n    @Override\n    public boolean isAvailable() {\n        return vehicle == null;\n    }\n    @Override\n    public void occupy(Vehicle vehicle) {\n        if (isAvailable()) {\n            this.vehicle = vehicle;\n        } else {\n            // Spot is already occupied.\n        }\n    }\n    @Override\n\
    \    public void vacate() {\n        this.vehicle = null;\n    }\n    @Override\n    public VehicleSize getSize() {\n        return VehicleSize.MEDIUM;\n    }\n}\n\npublic class ParkingManager {\n    private final Map<VehicleSize, List<ParkingSpot>> availableSpots;\n    private final Map<Vehicle, ParkingSpot> vehicleToSpotMap;\n    private final Map<ParkingSpot, Vehicle> spotToVehicleMap;\n    // Create Parking Manager based on a given map of available spots\npublic ParkingManager(Map<VehicleSize, List<ParkingSpot>> availableSpots) {\n        this.availableSpots = availableSpots;\n        this.vehicleToSpotMap = new HashMap<>();\n        this.spotToVehicleMap = new HashMap<>();\n    }\n    public ParkingSpot findSpotForVehicle(Vehicle vehicle) {\n        // No change in the method\n    }\n    public ParkingSpot parkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= findSpotForVehicle(vehicle);\n        if (spot != null) {\n            spot.occupy(vehicle);\n            // Record\
    \ bidirectional mapping\n            vehicleToSpotMap.put(vehicle, spot);\n            spotToVehicleMap.put(spot, vehicle);\n            // Remove the spot from the available list\n            availableSpots.get(spot.getSize()).remove(spot);\n            return spot; // Parking successful\n        }\n        return null; // No spot found for this vehicle\n    }\n    public void unparkVehicle(Vehicle vehicle) {\n        ParkingSpot\nspot\n= vehicleToSpotMap.remove(vehicle);\n        if (spot != null) {\n            spotToVehicleMap.remove(spot);\n            spot.vacate();\n            availableSpots.get(spot.getSize()).add(spot);\n        }\n    }\n    // Find vehicle's parking spot\npublic ParkingSpot findVehicleBySpot(Vehicle vehicle) {\n        return vehicleToSpotMap.get(vehicle);\n    }\n    // Find which vehicle is parked in a spot\npublic Vehicle findSpotByVehicle(ParkingSpot spot) {\n        return spotToVehicleMap.get(spot);\n    }\n}"
- approachId: object-pool-parking-gates
  label: Alternate — Object Pool Pattern with Dedicated Category Pools
  approachClass: ALTERNATE
  kind: CODE
  summary: Treats parking spots as reusable pooled resources. Entry gates allocate spots in O(1) time from the appropriate pool, while exit gates return spots to the pool upon payment receipt. Provides blazing fast gate throughput during rush hours.
  keyIdea: Maintain dedicated ConcurrentLinkedQueue object pools for Compact, Large, and Electric spots with independent entry and exit gate controllers.
  timeComplexity: O(1)
  spaceComplexity: O(C)
  tradeoffs:
  - Constant time O(1) slot allocation eliminates search overhead
  - Less flexible for multi-floor navigational guidance compared to spatial map tracking
  whenToUse: Airport and commercial venue parking facilities requiring rapid throughput at entry/exit gates.
  code: "// Alternate Approach: Object Pool Pattern with Dedicated Category Pools\nimport java.util.*;\nimport java.util.concurrent.ConcurrentHashMap;\nimport java.util.concurrent.ConcurrentLinkedQueue;\n\nenum VehicleType { MOTORCYCLE, COMPACT, LARGE }\n\nclass ParkingTicket {\n    final String ticketId;\n    final String spotId;\n    final VehicleType vehicleType;\n    final long entryTimestamp;\n\n    public ParkingTicket(String ticketId, String spotId, VehicleType vehicleType) {\n        this.ticketId = ticketId;\n        this.spotId = spotId;\n        this.vehicleType = vehicleType;\n        this.entryTimestamp = System.currentTimeMillis();\n    }\n}\n\nclass FastParkingPool {\n    private final Map<VehicleType, ConcurrentLinkedQueue<String>> pools = new EnumMap<>(VehicleType.class);\n    private final Map<String, ParkingTicket> activeTickets = new ConcurrentHashMap<>();\n\n    public FastParkingPool(int compactCount, int largeCount, int motoCount) {\n        pools.put(VehicleType.COMPACT,\
    \ new ConcurrentLinkedQueue<>());\n        pools.put(VehicleType.LARGE, new ConcurrentLinkedQueue<>());\n        pools.put(VehicleType.MOTORCYCLE, new ConcurrentLinkedQueue<>());\n\n        for (int i = 1; i <= compactCount; i++) pools.get(VehicleType.COMPACT).add(\"C-\" + i);\n        for (int i = 1; i <= largeCount; i++) pools.get(VehicleType.LARGE).add(\"L-\" + i);\n        for (int i = 1; i <= motoCount; i++) pools.get(VehicleType.MOTORCYCLE).add(\"M-\" + i);\n    }\n\n    public ParkingTicket parkVehicle(VehicleType type) {\n        ConcurrentLinkedQueue<String> pool = pools.get(type);\n        String spot = pool.poll();\n        if (spot == null) {\n            System.out.println(\"No available spot for vehicle type: \" + type);\n            return null;\n        }\n        String ticketId = UUID.randomUUID().toString();\n        ParkingTicket ticket = new ParkingTicket(ticketId, spot, type);\n        activeTickets.put(ticketId, ticket);\n        return ticket;\n    }\n\n    public\
    \ double exitVehicle(String ticketId, double hourlyRate) {\n        ParkingTicket ticket = activeTickets.remove(ticketId);\n        if (ticket == null) throw new IllegalArgumentException(\"Invalid ticket ID.\");\n\n        pools.get(ticket.vehicleType).offer(ticket.spotId);\n        long durationMs = Math.max(1000, System.currentTimeMillis() - ticket.entryTimestamp);\n        double hours = Math.ceil(durationMs / 3600000.0);\n        return hours * hourlyRate;\n    }\n}\n"
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
