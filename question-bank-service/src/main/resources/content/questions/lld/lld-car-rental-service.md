---
slug: lld-car-rental-service
title: "Vehicle Fleet Rental & Reservation Coordinator"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['fleet-management', 'rental', 'state-pattern', 'pricing']
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
        <groupId>com.interviewos.rental</groupId>
        <artifactId>car-rental</artifactId>
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
    # Vehicle Fleet Rental & Reservation Coordinator

    ## Overview
    Design a vehicle fleet rental service managing car availability, reservation bookings across branches, and dynamic daily rate calculation.
  src/main/java/com/interviewos/rental/RentalService.java: |
    package com.interviewos.rental;

    public interface RentalService {
        void addVehicle(String vehicleId, String type, double dailyRate);
        String reserveVehicle(String userId, String vehicleId, int days);
        double completeRental(String reservationId);
    }
  src/main/java/com/interviewos/rental/impl/RentalServiceImpl.java: |
    package com.interviewos.rental;

    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;
    import java.util.concurrent.atomic.AtomicInteger;

    public class DefaultRentalService implements RentalService {

        private final Map<String, Double> rates = new ConcurrentHashMap<>();
        private final Map<String, Boolean> availability = new ConcurrentHashMap<>();
        private final Map<String, Reservation> reservations = new ConcurrentHashMap<>();
        private final AtomicInteger seq = new AtomicInteger();

        private static record Reservation(String id, String vehicleId, int days, double dailyRate) {}

        @Override
        public void addVehicle(String vehicleId, String type, double dailyRate) {
            rates.put(vehicleId, dailyRate);
            availability.put(vehicleId, true);
        }

        @Override
        public synchronized String reserveVehicle(String userId, String vehicleId, int days) {
            if (!availability.getOrDefault(vehicleId, false)) return null;
            availability.put(vehicleId, false);
            String resId = "RES-" + seq.incrementAndGet();
            reservations.put(resId, new Reservation(resId, vehicleId, days, rates.get(vehicleId)));
            return resId;
        }

        @Override
        public synchronized double completeRental(String reservationId) {
            Reservation r = reservations.remove(reservationId);
            if (r == null) return 0.0;
            availability.put(r.vehicleId(), true);
            return r.days() * r.dailyRate();
        }
    }
starterCode: |
  package com.interviewos.rental;

  public interface RentalService {
      void addVehicle(String vehicleId, String type, double dailyRate);
      String reserveVehicle(String userId, String vehicleId, int days);
      double completeRental(String reservationId);
  }
solutionCode: |
  package com.interviewos.rental;

  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;
  import java.util.concurrent.atomic.AtomicInteger;

  public class DefaultRentalService implements RentalService {

      private final Map<String, Double> rates = new ConcurrentHashMap<>();
      private final Map<String, Boolean> availability = new ConcurrentHashMap<>();
      private final Map<String, Reservation> reservations = new ConcurrentHashMap<>();
      private final AtomicInteger seq = new AtomicInteger();

      private static record Reservation(String id, String vehicleId, int days, double dailyRate) {}

      @Override
      public void addVehicle(String vehicleId, String type, double dailyRate) {
          rates.put(vehicleId, dailyRate);
          availability.put(vehicleId, true);
      }

      @Override
      public synchronized String reserveVehicle(String userId, String vehicleId, int days) {
          if (!availability.getOrDefault(vehicleId, false)) return null;
          availability.put(vehicleId, false);
          String resId = "RES-" + seq.incrementAndGet();
          reservations.put(resId, new Reservation(resId, vehicleId, days, rates.get(vehicleId)));
          return resId;
      }

      @Override
      public synchronized double completeRental(String reservationId) {
          Reservation r = reservations.remove(reservationId);
          if (r == null) return 0.0;
          availability.put(r.vehicleId(), true);
          return r.days() * r.dailyRate();
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/rental/RentalServiceTest.java: |
    package com.interviewos.rental;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class RentalServiceTest {

        @Test
        @DisplayName("Reserve vehicle and compute rental total")
        void testRentalFlow() {
            RentalService service = new DefaultRentalService();
            service.addVehicle("CAR-1", "Sedan", 45.0);
            String resId = service.reserveVehicle("u1", "CAR-1", 3);
            assertNotNull(resId);
            assertNull(service.reserveVehicle("u2", "CAR-1", 2), "Vehicle already reserved");

            double total = service.completeRental(resId);
            assertEquals(135.0, total, 0.01);
        }
    }
referenceSolutions:
  - approachId: canonical-lld-car-rental-service
    label: "Primary — Vehicle Fleet Rental & Reservation Coordinator"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a vehicle fleet rental service managing car availability, reservation bookings across branches, and dynamic daily rate calculation."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.rental;

      import java.util.Map;
      import java.util.concurrent.ConcurrentHashMap;
      import java.util.concurrent.atomic.AtomicInteger;

      public class DefaultRentalService implements RentalService {

          private final Map<String, Double> rates = new ConcurrentHashMap<>();
          private final Map<String, Boolean> availability = new ConcurrentHashMap<>();
          private final Map<String, Reservation> reservations = new ConcurrentHashMap<>();
          private final AtomicInteger seq = new AtomicInteger();

          private static record Reservation(String id, String vehicleId, int days, double dailyRate) {}

          @Override
          public void addVehicle(String vehicleId, String type, double dailyRate) {
              rates.put(vehicleId, dailyRate);
              availability.put(vehicleId, true);
          }

          @Override
          public synchronized String reserveVehicle(String userId, String vehicleId, int days) {
              if (!availability.getOrDefault(vehicleId, false)) return null;
              availability.put(vehicleId, false);
              String resId = "RES-" + seq.incrementAndGet();
              reservations.put(resId, new Reservation(resId, vehicleId, days, rates.get(vehicleId)));
              return resId;
          }

          @Override
          public synchronized double completeRental(String reservationId) {
              Reservation r = reservations.remove(reservationId);
              if (r == null) return 0.0;
              availability.put(r.vehicleId(), true);
              return r.days() * r.dailyRate();
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Vehicle Fleet Rental & Reservation Coordinator

Design a vehicle fleet rental service managing car availability, reservation bookings across branches, and dynamic daily rate calculation.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Vehicle Fleet Rental & Reservation Coordinator.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
