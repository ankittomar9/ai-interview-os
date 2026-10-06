---
slug: lld-ride-booking
title: Ride Booking Application
track: SPRING_LLD
difficulty: HARD
topics:
- lld
est_minutes: 45
tags:
- object-oriented-design
- lld
- java
- design-patterns
- strategy-pattern
- observer-pattern
- ride-booking
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/ride-booking
status: PUBLISHED
hints:
- Use the Strategy pattern to isolate driver matching heuristics (e.g. proximity, rating) from booking flows.
- Atomically mark matched drivers as unavailable to avoid concurrent dispatch conflicts.
- Ensure cancellation frees the assigned driver back to the active available pool immediately.
coaching:
  presentationTips:
  - Clarify the lifecycle state transitions: REQUESTED -> ACCEPTED -> IN_PROGRESS -> COMPLETED / CANCELLED.
  - Discuss how the DriverFleetManager handles spatial location updates without blocking concurrent matching queries.
  - Explain the behavior when no driver is available: does the system queue the request or fail fast?
  commonMistakes:
  - Matching unavailable drivers due to stale fleet cache reads.
  - Failing to update driver coordinates to the dropoff location upon ride completion.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>ride-booking</artifactId>
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
    # Ride Booking Application

    ## Overview
    Implement an object-oriented Ride Booking dispatch system supporting rider ride requests, nearest available driver matching, vehicle category filtering, and ride lifecycle states.

    ## Key Components
    - `com.interviewos.ride.service.DriverFleetManager`: Manages driver registrations, geospatial coordinates, and availability statuses.
    - `com.interviewos.ride.service.RideBookingService`: Coordinates ride requests, driver dispatch, trip execution, and completions.
    - `com.interviewos.ride.strategy.MatchingStrategy`: Pluggable driver matching algorithm selecting optimal driver for trip.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/ride/service/DriverFleetManager.java`
    2. `src/main/java/com/interviewos/ride/service/RideBookingService.java`
  src/main/java/com/interviewos/ride/model/RideStatus.java: |
    package com.interviewos.ride.model;

    public enum RideStatus {
        REQUESTED,
        ACCEPTED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
  src/main/java/com/interviewos/ride/model/VehicleType.java: |
    package com.interviewos.ride.model;

    public enum VehicleType {
        SEDAN,
        SUV,
        HATCHBACK
    }
  src/main/java/com/interviewos/ride/model/Location.java: |
    package com.interviewos.ride.model;

    public class Location {
        private final double latitude;
        private final double longitude;

        public Location(double latitude, double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public double getLatitude() { return latitude; }
        public double getLongitude() { return longitude; }

        public double distanceTo(Location other) {
            if (other == null) return Double.MAX_VALUE;
            double dLat = this.latitude - other.latitude;
            double dLon = this.longitude - other.longitude;
            return Math.sqrt(dLat * dLat + dLon * dLon);
        }
    }
  src/main/java/com/interviewos/ride/model/Rider.java: |
    package com.interviewos.ride.model;

    public class Rider {
        private final String riderId;
        private final String name;

        public Rider(String riderId, String name) {
            this.riderId = riderId;
            this.name = name;
        }

        public String getRiderId() { return riderId; }
        public String getName() { return name; }
    }
  src/main/java/com/interviewos/ride/model/Driver.java: |
    package com.interviewos.ride.model;

    public class Driver {
        private final String driverId;
        private final String name;
        private final VehicleType vehicleType;
        private volatile Location currentLocation;
        private volatile boolean available;

        public Driver(String driverId, String name, VehicleType vehicleType, Location currentLocation) {
            this(driverId, name, vehicleType, currentLocation, true);
        }

        public Driver(String driverId, String name, VehicleType vehicleType, Location currentLocation, boolean available) {
            this.driverId = driverId;
            this.name = name;
            this.vehicleType = vehicleType;
            this.currentLocation = currentLocation;
            this.available = available;
        }

        public String getDriverId() { return driverId; }
        public String getName() { return name; }
        public VehicleType getVehicleType() { return vehicleType; }
        public Location getCurrentLocation() { return currentLocation; }
        public void setCurrentLocation(Location currentLocation) { this.currentLocation = currentLocation; }
        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }
    }
  src/main/java/com/interviewos/ride/model/Ride.java: |
    package com.interviewos.ride.model;

    import java.math.BigDecimal;

    public class Ride {
        private final String rideId;
        private final Rider rider;
        private volatile Driver driver;
        private final Location pickupLocation;
        private final Location dropoffLocation;
        private final BigDecimal fare;
        private volatile RideStatus status;

        public Ride(String rideId, Rider rider, Driver driver, Location pickupLocation, Location dropoffLocation, BigDecimal fare) {
            this(rideId, rider, driver, pickupLocation, dropoffLocation, fare, RideStatus.REQUESTED);
        }

        public Ride(String rideId, Rider rider, Driver driver, Location pickupLocation, Location dropoffLocation, BigDecimal fare, RideStatus status) {
            this.rideId = rideId;
            this.rider = rider;
            this.driver = driver;
            this.pickupLocation = pickupLocation;
            this.dropoffLocation = dropoffLocation;
            this.fare = fare != null ? fare : BigDecimal.ZERO;
            this.status = status != null ? status : RideStatus.REQUESTED;
        }

        public String getRideId() { return rideId; }
        public Rider getRider() { return rider; }
        public Driver getDriver() { return driver; }
        public void setDriver(Driver driver) { this.driver = driver; }
        public Location getPickupLocation() { return pickupLocation; }
        public Location getDropoffLocation() { return dropoffLocation; }
        public BigDecimal getFare() { return fare; }
        public RideStatus getStatus() { return status; }
        public void setStatus(RideStatus status) { this.status = status; }
    }
  src/main/java/com/interviewos/ride/strategy/MatchingStrategy.java: |
    package com.interviewos.ride.strategy;

    import com.interviewos.ride.model.Driver;
    import com.interviewos.ride.model.Location;
    import com.interviewos.ride.model.VehicleType;

    import java.util.List;

    public interface MatchingStrategy {
        Driver findDriver(Location pickup, VehicleType type, List<Driver> availableDrivers);
    }
  src/main/java/com/interviewos/ride/strategy/NearestDriverMatchingStrategy.java: |
    package com.interviewos.ride.strategy;

    import com.interviewos.ride.model.Driver;
    import com.interviewos.ride.model.Location;
    import com.interviewos.ride.model.VehicleType;

    import java.util.List;

    public class NearestDriverMatchingStrategy implements MatchingStrategy {
        @Override
        public Driver findDriver(Location pickup, VehicleType type, List<Driver> availableDrivers) {
            if (pickup == null || availableDrivers == null || availableDrivers.isEmpty()) return null;

            Driver nearest = null;
            double minDistance = Double.MAX_VALUE;

            for (Driver d : availableDrivers) {
                if (d.isAvailable() && (type == null || d.getVehicleType() == type)) {
                    double dist = pickup.distanceTo(d.getCurrentLocation());
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearest = d;
                    }
                }
            }
            return nearest;
        }
    }
  src/main/java/com/interviewos/ride/service/DriverFleetManager.java: |
    package com.interviewos.ride.service;

    import com.interviewos.ride.model.Driver;
    import com.interviewos.ride.model.Location;
    import com.interviewos.ride.model.VehicleType;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class DriverFleetManager {
        private final Map<String, Driver> drivers = new ConcurrentHashMap<>();

        public void registerDriver(Driver driver) {
            // TODO: Store driver in map
            throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.registerDriver");
        }

        public Driver getDriver(String driverId) {
            return drivers.get(driverId);
        }

        public synchronized void updateLocation(String driverId, Location location) {
            // TODO: Update driver location
            throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.updateLocation");
        }

        public synchronized void setAvailability(String driverId, boolean available) {
            // TODO: Update driver availability
            throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.setAvailability");
        }

        public List<Driver> getAvailableDrivers(VehicleType type) {
            // TODO: Return available drivers matching vehicle type
            throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.getAvailableDrivers");
        }
    }
  src/main/java/com/interviewos/ride/service/RideBookingService.java: |
    package com.interviewos.ride.service;

    import com.interviewos.ride.model.*;
    import com.interviewos.ride.strategy.MatchingStrategy;
    import com.interviewos.ride.strategy.NearestDriverMatchingStrategy;

    import java.math.BigDecimal;
    import java.util.List;
    import java.util.Map;
    import java.util.UUID;
    import java.util.concurrent.ConcurrentHashMap;

    public class RideBookingService {
        private final DriverFleetManager fleetManager;
        private final MatchingStrategy matchingStrategy;
        private final Map<String, Ride> rides = new ConcurrentHashMap<>();

        public RideBookingService(DriverFleetManager fleetManager) {
            this(fleetManager, new NearestDriverMatchingStrategy());
        }

        public RideBookingService(DriverFleetManager fleetManager, MatchingStrategy matchingStrategy) {
            this.fleetManager = fleetManager != null ? fleetManager : new DriverFleetManager();
            this.matchingStrategy = matchingStrategy != null ? matchingStrategy : new NearestDriverMatchingStrategy();
        }

        public synchronized Ride requestRide(Rider rider, Location pickup, Location dropoff, VehicleType type) {
            // TODO: Find matching driver, calculate fare, create Ride, mark driver unavailable if matched
            throw new UnsupportedOperationException("TODO: Implement RideBookingService.requestRide");
        }

        public synchronized boolean startRide(String rideId) {
            // TODO: Validate ride is ACCEPTED, transition to IN_PROGRESS
            throw new UnsupportedOperationException("TODO: Implement RideBookingService.startRide");
        }

        public synchronized boolean completeRide(String rideId) {
            // TODO: Validate ride is IN_PROGRESS, transition to COMPLETED, free driver, update driver location to dropoff
            throw new UnsupportedOperationException("TODO: Implement RideBookingService.completeRide");
        }

        public synchronized boolean cancelRide(String rideId) {
            // TODO: Validate ride, transition to CANCELLED, free driver if assigned
            throw new UnsupportedOperationException("TODO: Implement RideBookingService.cancelRide");
        }

        public Ride getRide(String rideId) {
            return rides.get(rideId);
        }
    }
  src/test/java/com/interviewos/ride/RideDriverMatchingTest.java: |
    package com.interviewos.ride;

    import com.interviewos.ride.model.*;
    import com.interviewos.ride.service.DriverFleetManager;
    import com.interviewos.ride.strategy.NearestDriverMatchingStrategy;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class RideDriverMatchingTest {

        @Test
        @DisplayName("Matching strategy selects nearest driver matching vehicle type")
        void testNearestDriverSelection() {
            NearestDriverMatchingStrategy strategy = new NearestDriverMatchingStrategy();

            Driver d1 = new Driver("D1", "Dave", VehicleType.SEDAN, new Location(10.0, 10.0));
            Driver d2 = new Driver("D2", "Dan", VehicleType.SEDAN, new Location(10.1, 10.1));
            Driver d3 = new Driver("D3", "Sam", VehicleType.SUV, new Location(10.01, 10.01));

            Location pickup = new Location(10.02, 10.02);

            Driver matchedSedan = strategy.findDriver(pickup, VehicleType.SEDAN, List.of(d1, d2, d3));
            assertNotNull(matchedSedan);
            assertEquals("D1", matchedSedan.getDriverId(), "D1 is closer to pickup than D2 among SEDANs");

            Driver matchedSuv = strategy.findDriver(pickup, VehicleType.SUV, List.of(d1, d2, d3));
            assertNotNull(matchedSuv);
            assertEquals("D3", matchedSuv.getDriverId());
        }

        @Test
        @DisplayName("Unavailable drivers are excluded during dispatch search")
        void testUnavailableDriversExcluded() {
            NearestDriverMatchingStrategy strategy = new NearestDriverMatchingStrategy();
            Driver d1 = new Driver("D1", "Dave", VehicleType.SEDAN, new Location(1.0, 1.0), false);

            Driver matched = strategy.findDriver(new Location(1.0, 1.0), VehicleType.SEDAN, List.of(d1));
            assertNull(matched, "Unavailable driver must not be selected");
        }
    }
  src/test/java/com/interviewos/ride/RideLifecycleStateTest.java: |
    package com.interviewos.ride;

    import com.interviewos.ride.model.*;
    import com.interviewos.ride.service.DriverFleetManager;
    import com.interviewos.ride.service.RideBookingService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class RideLifecycleStateTest {

        @Test
        @DisplayName("Complete ride lifecycle: request -> start -> complete updates driver and status")
        void testRideLifecycleProgression() {
            DriverFleetManager fleet = new DriverFleetManager();
            Driver driver = new Driver("DRV-10", "Tom", VehicleType.SEDAN, new Location(0.0, 0.0));
            fleet.registerDriver(driver);

            RideBookingService service = new RideBookingService(fleet);
            Rider rider = new Rider("RDR-1", "Sarah");
            Location pickup = new Location(0.1, 0.1);
            Location dropoff = new Location(5.0, 5.0);

            Ride ride = service.requestRide(rider, pickup, dropoff, VehicleType.SEDAN);
            assertNotNull(ride);
            assertEquals(RideStatus.ACCEPTED, ride.getStatus());
            assertFalse(driver.isAvailable(), "Driver must be marked unavailable upon booking");

            boolean started = service.startRide(ride.getRideId());
            assertTrue(started);
            assertEquals(RideStatus.IN_PROGRESS, ride.getStatus());

            boolean completed = service.completeRide(ride.getRideId());
            assertTrue(completed);
            assertEquals(RideStatus.COMPLETED, ride.getStatus());
            assertTrue(driver.isAvailable(), "Driver must become available again after trip completion");
            assertEquals(dropoff.getLatitude(), driver.getCurrentLocation().getLatitude());
        }

        @Test
        @DisplayName("Cancelling ride resets assigned driver to available")
        void testRideCancellationFreesDriver() {
            DriverFleetManager fleet = new DriverFleetManager();
            Driver driver = new Driver("DRV-20", "Leo", VehicleType.SUV, new Location(2.0, 2.0));
            fleet.registerDriver(driver);

            RideBookingService service = new RideBookingService(fleet);
            Rider rider = new Rider("RDR-2", "Emma");

            Ride ride = service.requestRide(rider, new Location(2.1, 2.1), new Location(3.0, 3.0), VehicleType.SUV);
            assertNotNull(ride);
            assertFalse(driver.isAvailable());

            boolean cancelled = service.cancelRide(ride.getRideId());
            assertTrue(cancelled);
            assertEquals(RideStatus.CANCELLED, ride.getStatus());
            assertTrue(driver.isAvailable(), "Driver must be freed after cancellation");
        }
    }
  src/test/java/com/interviewos/ride/RideFleetManagementTest.java: |
    package com.interviewos.ride;

    import com.interviewos.ride.model.Driver;
    import com.interviewos.ride.model.Location;
    import com.interviewos.ride.model.VehicleType;
    import com.interviewos.ride.service.DriverFleetManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class RideFleetManagementTest {

        @Test
        @DisplayName("DriverFleetManager filters available drivers by vehicle type")
        void testFleetFiltering() {
            DriverFleetManager fleet = new DriverFleetManager();
            fleet.registerDriver(new Driver("D1", "A", VehicleType.SEDAN, new Location(0, 0)));
            fleet.registerDriver(new Driver("D2", "B", VehicleType.SEDAN, new Location(0, 0), false));
            fleet.registerDriver(new Driver("D3", "C", VehicleType.HATCHBACK, new Location(0, 0)));

            List<Driver> sedans = fleet.getAvailableDrivers(VehicleType.SEDAN);
            assertEquals(1, sedans.size());
            assertEquals("D1", sedans.get(0).getDriverId());

            List<Driver> hatchbacks = fleet.getAvailableDrivers(VehicleType.HATCHBACK);
            assertEquals(1, hatchbacks.size());
            assertEquals("D3", hatchbacks.get(0).getDriverId());
        }

        @Test
        @DisplayName("Updating driver location updates live spatial state")
        void testDriverLocationUpdate() {
            DriverFleetManager fleet = new DriverFleetManager();
            fleet.registerDriver(new Driver("D4", "D", VehicleType.SUV, new Location(1.0, 1.0)));

            fleet.updateLocation("D4", new Location(4.5, 9.2));
            Driver updated = fleet.getDriver("D4");
            assertEquals(4.5, updated.getCurrentLocation().getLatitude());
            assertEquals(9.2, updated.getCurrentLocation().getLongitude());
        }
    }
editablePaths:
- src/main/java/com/interviewos/ride/service/DriverFleetManager.java
- src/main/java/com/interviewos/ride/service/RideBookingService.java
hiddenTestFiles:
  src/test/java/com/interviewos/ride/RideDriverMatchingTest.java: |
    package com.interviewos.ride;

    import com.interviewos.ride.model.*;
    import com.interviewos.ride.service.DriverFleetManager;
    import com.interviewos.ride.strategy.NearestDriverMatchingStrategy;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class RideDriverMatchingTest {

        @Test
        @DisplayName("Matching strategy selects nearest driver matching vehicle type")
        void testNearestDriverSelection() {
            NearestDriverMatchingStrategy strategy = new NearestDriverMatchingStrategy();

            Driver d1 = new Driver("D1", "Dave", VehicleType.SEDAN, new Location(10.0, 10.0));
            Driver d2 = new Driver("D2", "Dan", VehicleType.SEDAN, new Location(10.1, 10.1));
            Driver d3 = new Driver("D3", "Sam", VehicleType.SUV, new Location(10.01, 10.01));

            Location pickup = new Location(10.02, 10.02);

            Driver matchedSedan = strategy.findDriver(pickup, VehicleType.SEDAN, List.of(d1, d2, d3));
            assertNotNull(matchedSedan);
            assertEquals("D1", matchedSedan.getDriverId(), "D1 is closer to pickup than D2 among SEDANs");

            Driver matchedSuv = strategy.findDriver(pickup, VehicleType.SUV, List.of(d1, d2, d3));
            assertNotNull(matchedSuv);
            assertEquals("D3", matchedSuv.getDriverId());
        }

        @Test
        @DisplayName("Unavailable drivers are excluded during dispatch search")
        void testUnavailableDriversExcluded() {
            NearestDriverMatchingStrategy strategy = new NearestDriverMatchingStrategy();
            Driver d1 = new Driver("D1", "Dave", VehicleType.SEDAN, new Location(1.0, 1.0), false);

            Driver matched = strategy.findDriver(new Location(1.0, 1.0), VehicleType.SEDAN, List.of(d1));
            assertNull(matched, "Unavailable driver must not be selected");
        }
    }
  src/test/java/com/interviewos/ride/RideLifecycleStateTest.java: |
    package com.interviewos.ride;

    import com.interviewos.ride.model.*;
    import com.interviewos.ride.service.DriverFleetManager;
    import com.interviewos.ride.service.RideBookingService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class RideLifecycleStateTest {

        @Test
        @DisplayName("Complete ride lifecycle: request -> start -> complete updates driver and status")
        void testRideLifecycleProgression() {
            DriverFleetManager fleet = new DriverFleetManager();
            Driver driver = new Driver("DRV-10", "Tom", VehicleType.SEDAN, new Location(0.0, 0.0));
            fleet.registerDriver(driver);

            RideBookingService service = new RideBookingService(fleet);
            Rider rider = new Rider("RDR-1", "Sarah");
            Location pickup = new Location(0.1, 0.1);
            Location dropoff = new Location(5.0, 5.0);

            Ride ride = service.requestRide(rider, pickup, dropoff, VehicleType.SEDAN);
            assertNotNull(ride);
            assertEquals(RideStatus.ACCEPTED, ride.getStatus());
            assertFalse(driver.isAvailable(), "Driver must be marked unavailable upon booking");

            boolean started = service.startRide(ride.getRideId());
            assertTrue(started);
            assertEquals(RideStatus.IN_PROGRESS, ride.getStatus());

            boolean completed = service.completeRide(ride.getRideId());
            assertTrue(completed);
            assertEquals(RideStatus.COMPLETED, ride.getStatus());
            assertTrue(driver.isAvailable(), "Driver must become available again after trip completion");
            assertEquals(dropoff.getLatitude(), driver.getCurrentLocation().getLatitude());
        }

        @Test
        @DisplayName("Cancelling ride resets assigned driver to available")
        void testRideCancellationFreesDriver() {
            DriverFleetManager fleet = new DriverFleetManager();
            Driver driver = new Driver("DRV-20", "Leo", VehicleType.SUV, new Location(2.0, 2.0));
            fleet.registerDriver(driver);

            RideBookingService service = new RideBookingService(fleet);
            Rider rider = new Rider("RDR-2", "Emma");

            Ride ride = service.requestRide(rider, new Location(2.1, 2.1), new Location(3.0, 3.0), VehicleType.SUV);
            assertNotNull(ride);
            assertFalse(driver.isAvailable());

            boolean cancelled = service.cancelRide(ride.getRideId());
            assertTrue(cancelled);
            assertEquals(RideStatus.CANCELLED, ride.getStatus());
            assertTrue(driver.isAvailable(), "Driver must be freed after cancellation");
        }
    }
  src/test/java/com/interviewos/ride/RideFleetManagementTest.java: |
    package com.interviewos.ride;

    import com.interviewos.ride.model.Driver;
    import com.interviewos.ride.model.Location;
    import com.interviewos.ride.model.VehicleType;
    import com.interviewos.ride.service.DriverFleetManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class RideFleetManagementTest {

        @Test
        @DisplayName("DriverFleetManager filters available drivers by vehicle type")
        void testFleetFiltering() {
            DriverFleetManager fleet = new DriverFleetManager();
            fleet.registerDriver(new Driver("D1", "A", VehicleType.SEDAN, new Location(0, 0)));
            fleet.registerDriver(new Driver("D2", "B", VehicleType.SEDAN, new Location(0, 0), false));
            fleet.registerDriver(new Driver("D3", "C", VehicleType.HATCHBACK, new Location(0, 0)));

            List<Driver> sedans = fleet.getAvailableDrivers(VehicleType.SEDAN);
            assertEquals(1, sedans.size());
            assertEquals("D1", sedans.get(0).getDriverId());

            List<Driver> hatchbacks = fleet.getAvailableDrivers(VehicleType.HATCHBACK);
            assertEquals(1, hatchbacks.size());
            assertEquals("D3", hatchbacks.get(0).getDriverId());
        }

        @Test
        @DisplayName("Updating driver location updates live spatial state")
        void testDriverLocationUpdate() {
            DriverFleetManager fleet = new DriverFleetManager();
            fleet.registerDriver(new Driver("D4", "D", VehicleType.SUV, new Location(1.0, 1.0)));

            fleet.updateLocation("D4", new Location(4.5, 9.2));
            Driver updated = fleet.getDriver("D4");
            assertEquals(4.5, updated.getCurrentLocation().getLatitude());
            assertEquals(9.2, updated.getCurrentLocation().getLongitude());
        }
    }
starterCode: |
  package com.interviewos.ride.service;

  import com.interviewos.ride.model.Driver;
  import com.interviewos.ride.model.Location;
  import com.interviewos.ride.model.VehicleType;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class DriverFleetManager {
      private final Map<String, Driver> drivers = new ConcurrentHashMap<>();

      public void registerDriver(Driver driver) {
          // TODO: Store driver in map
          throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.registerDriver");
      }

      public Driver getDriver(String driverId) {
          return drivers.get(driverId);
      }

      public synchronized void updateLocation(String driverId, Location location) {
          // TODO: Update driver location
          throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.updateLocation");
      }

      public synchronized void setAvailability(String driverId, boolean available) {
          // TODO: Update driver availability
          throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.setAvailability");
      }

      public List<Driver> getAvailableDrivers(VehicleType type) {
          // TODO: Return available drivers matching vehicle type
          throw new UnsupportedOperationException("TODO: Implement DriverFleetManager.getAvailableDrivers");
      }
  }
solutionCode: |
  package com.interviewos.ride.service;

  import com.interviewos.ride.model.Driver;
  import com.interviewos.ride.model.Location;
  import com.interviewos.ride.model.VehicleType;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class DriverFleetManager {
      private final Map<String, Driver> drivers = new ConcurrentHashMap<>();

      public void registerDriver(Driver driver) {
          if (driver != null) {
              drivers.put(driver.getDriverId(), driver);
          }
      }

      public Driver getDriver(String driverId) {
          return drivers.get(driverId);
      }

      public synchronized void updateLocation(String driverId, Location location) {
          Driver d = drivers.get(driverId);
          if (d != null && location != null) {
              d.setCurrentLocation(location);
          }
      }

      public synchronized void setAvailability(String driverId, boolean available) {
          Driver d = drivers.get(driverId);
          if (d != null) {
              d.setAvailable(available);
          }
      }

      public List<Driver> getAvailableDrivers(VehicleType type) {
          List<Driver> result = new ArrayList<>();
          for (Driver d : drivers.values()) {
              if (d.isAvailable() && (type == null || d.getVehicleType() == type)) {
                  result.add(d);
              }
          }
          return result;
      }
  }
---

### Problem Statement: Ride Booking Application

You are tasked with designing and implementing an object-oriented Ride Booking dispatch system in Java. On-demand urban transportation platforms connect riders needing transit with nearby available drivers in real-time. Your objective is to build a cohesive dispatch engine that tracks driver fleet locations and availability, selects optimal drivers via pluggable matching strategies, calculates trip fares, and manages the complete lifecycle state transitions of each ride from request to dropoff.

#### Functional Requirements:
1. **Geospatial & Entity Modeling**: Model locations with latitude/longitude coordinates and Euclidean distance measurement, drivers with vehicle categories, and riders with unique profiles.
2. **Vehicle Category Segregation**: Support discrete vehicle categories (SEDAN, SUV, HATCHBACK) matching rider preferences.
3. **Driver Fleet Administration**: Maintain driver records, real-time location updates, and toggleable availability statuses within a dedicated DriverFleetManager.
4. **Pluggable Matching Strategy**: Implement a MatchingStrategy interface (such as NearestDriverMatchingStrategy) that identifies the closest available driver matching the requested vehicle tier.
5. **Ride Dispatch & Acceptance**: Allow riders to request rides; if a compatible driver is identified, atomically assign the driver, mark the driver unavailable, and transition the ride to ACCEPTED.
6. **Trip Progression Workflow**: Support stepping through ride states: transitioning an ACCEPTED ride to IN_PROGRESS upon pickup.
7. **Trip Completion & Driver Re-availability**: Support completing a ride, transitioning status to COMPLETED, updating the driver's location to the dropoff point, and restoring driver availability.
8. **Trip Cancellation Safeguards**: Support ride cancellation, setting status to CANCELLED and immediately freeing any assigned driver back to the active fleet.

#### Non-goals:
- Dynamic surge pricing heatmaps, turn-by-turn road topography routing, and toll-bridge billing integrations are omitted in favor of direct coordinate distance calculations.
- SMS customer communications, in-app push notifications, and driver payment disbursements are outside this module's scope.
