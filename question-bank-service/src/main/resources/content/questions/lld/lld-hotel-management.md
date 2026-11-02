---
slug: lld-hotel-management
title: Hotel Management System
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
- factory-pattern
- hotel-management
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/hotel-management
status: PUBLISHED
hints:
- Use Strategy pattern to decouple total stay tariff calculation from the booking facade.
- Enforce atomic room reservation transitions to prevent race conditions during high-demand inventory queries.
- Synchronize state transitions between the Reservation lifecycle and the physical Room occupancy state.
coaching:
  presentationTips:
  - Clarify the room state machine: AVAILABLE -> RESERVED -> OCCUPIED -> AVAILABLE.
  - Explain how check-in and check-out operations maintain consistency between reservation status and room availability.
  - Discuss handling edge cases like booking when room inventory is completely exhausted.
  commonMistakes:
  - Failing to release room status back to AVAILABLE upon reservation cancellation.
  - Allowing double-bookings by checking room availability without synchronization.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>hotel-management</artifactId>
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
    # Hotel Management System

    ## Overview
    Implement an object-oriented Hotel Management and Room Reservation system supporting room inventory tracking, guest bookings, check-in/check-out lifecycle states, and pluggable pricing calculation strategies.

    ## Key Components
    - `com.interviewos.hotel.service.RoomInventoryManager`: Manages hotel rooms, category categorizations, and real-time occupancy states.
    - `com.interviewos.hotel.service.HotelBookingService`: Facade coordinating reservations, guest check-in, check-out, and cancellation.
    - `com.interviewos.hotel.strategy.PricingStrategy`: Strategy interface calculating stay costs based on room tier and duration.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/hotel/service/RoomInventoryManager.java`
    2. `src/main/java/com/interviewos/hotel/service/HotelBookingService.java`
  src/main/java/com/interviewos/hotel/model/RoomType.java: |
    package com.interviewos.hotel.model;

    public enum RoomType {
        SINGLE,
        DOUBLE,
        DELUXE,
        SUITE
    }
  src/main/java/com/interviewos/hotel/model/RoomStatus.java: |
    package com.interviewos.hotel.model;

    public enum RoomStatus {
        AVAILABLE,
        RESERVED,
        OCCUPIED,
        MAINTENANCE
    }
  src/main/java/com/interviewos/hotel/model/ReservationStatus.java: |
    package com.interviewos.hotel.model;

    public enum ReservationStatus {
        CONFIRMED,
        CHECKED_IN,
        CHECKED_OUT,
        CANCELLED
    }
  src/main/java/com/interviewos/hotel/model/Room.java: |
    package com.interviewos.hotel.model;

    import java.math.BigDecimal;

    public class Room {
        private final String roomNumber;
        private final RoomType type;
        private final BigDecimal basePricePerNight;
        private volatile RoomStatus status;

        public Room(String roomNumber, RoomType type, BigDecimal basePricePerNight) {
            this(roomNumber, type, basePricePerNight, RoomStatus.AVAILABLE);
        }

        public Room(String roomNumber, RoomType type, BigDecimal basePricePerNight, RoomStatus status) {
            this.roomNumber = roomNumber;
            this.type = type;
            this.basePricePerNight = basePricePerNight;
            this.status = status != null ? status : RoomStatus.AVAILABLE;
        }

        public String getRoomNumber() { return roomNumber; }
        public RoomType getType() { return type; }
        public BigDecimal getBasePricePerNight() { return basePricePerNight; }
        public RoomStatus getStatus() { return status; }
        public void setStatus(RoomStatus status) { this.status = status; }
    }
  src/main/java/com/interviewos/hotel/model/Guest.java: |
    package com.interviewos.hotel.model;

    public class Guest {
        private final String guestId;
        private final String name;
        private final String email;

        public Guest(String guestId, String name, String email) {
            this.guestId = guestId;
            this.name = name;
            this.email = email;
        }

        public String getGuestId() { return guestId; }
        public String getName() { return name; }
        public String getEmail() { return email; }
    }
  src/main/java/com/interviewos/hotel/model/Reservation.java: |
    package com.interviewos.hotel.model;

    import java.math.BigDecimal;
    import java.time.LocalDate;

    public class Reservation {
        private final String reservationId;
        private final Guest guest;
        private final Room room;
        private final LocalDate checkInDate;
        private final LocalDate checkOutDate;
        private final BigDecimal totalPrice;
        private volatile ReservationStatus status;

        public Reservation(String reservationId, Guest guest, Room room, LocalDate checkInDate, LocalDate checkOutDate, BigDecimal totalPrice) {
            this(reservationId, guest, room, checkInDate, checkOutDate, totalPrice, ReservationStatus.CONFIRMED);
        }

        public Reservation(String reservationId, Guest guest, Room room, LocalDate checkInDate, LocalDate checkOutDate, BigDecimal totalPrice, ReservationStatus status) {
            this.reservationId = reservationId;
            this.guest = guest;
            this.room = room;
            this.checkInDate = checkInDate;
            this.checkOutDate = checkOutDate;
            this.totalPrice = totalPrice;
            this.status = status != null ? status : ReservationStatus.CONFIRMED;
        }

        public String getReservationId() { return reservationId; }
        public Guest getGuest() { return guest; }
        public Room getRoom() { return room; }
        public LocalDate getCheckInDate() { return checkInDate; }
        public LocalDate getCheckOutDate() { return checkOutDate; }
        public BigDecimal getTotalPrice() { return totalPrice; }
        public ReservationStatus getStatus() { return status; }
        public void setStatus(ReservationStatus status) { this.status = status; }
    }
  src/main/java/com/interviewos/hotel/strategy/PricingStrategy.java: |
    package com.interviewos.hotel.strategy;

    import com.interviewos.hotel.model.Room;
    import java.math.BigDecimal;

    public interface PricingStrategy {
        BigDecimal calculateTotal(Room room, int numberOfNights);
    }
  src/main/java/com/interviewos/hotel/strategy/StandardPricingStrategy.java: |
    package com.interviewos.hotel.strategy;

    import com.interviewos.hotel.model.Room;
    import java.math.BigDecimal;

    public class StandardPricingStrategy implements PricingStrategy {
        @Override
        public BigDecimal calculateTotal(Room room, int numberOfNights) {
            if (room == null || numberOfNights <= 0) return BigDecimal.ZERO;
            return room.getBasePricePerNight().multiply(BigDecimal.valueOf(numberOfNights));
        }
    }
  src/main/java/com/interviewos/hotel/service/RoomInventoryManager.java: |
    package com.interviewos.hotel.service;

    import com.interviewos.hotel.model.Room;
    import com.interviewos.hotel.model.RoomStatus;
    import com.interviewos.hotel.model.RoomType;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class RoomInventoryManager {
        private final Map<String, Room> inventory = new ConcurrentHashMap<>();

        public void addRoom(Room room) {
            // TODO: Store room in inventory
            throw new UnsupportedOperationException("TODO: Implement RoomInventoryManager.addRoom");
        }

        public Room getRoom(String roomNumber) {
            return inventory.get(roomNumber);
        }

        public List<Room> getAvailableRooms(RoomType type) {
            // TODO: Filter rooms matching type with status AVAILABLE
            throw new UnsupportedOperationException("TODO: Implement RoomInventoryManager.getAvailableRooms");
        }

        public synchronized void updateRoomStatus(String roomNumber, RoomStatus status) {
            // TODO: Update room status in inventory
            throw new UnsupportedOperationException("TODO: Implement RoomInventoryManager.updateRoomStatus");
        }
    }
  src/main/java/com/interviewos/hotel/service/HotelBookingService.java: |
    package com.interviewos.hotel.service;

    import com.interviewos.hotel.model.*;
    import com.interviewos.hotel.strategy.PricingStrategy;
    import com.interviewos.hotel.strategy.StandardPricingStrategy;

    import java.math.BigDecimal;
    import java.time.LocalDate;
    import java.time.temporal.ChronoUnit;
    import java.util.Map;
    import java.util.UUID;
    import java.util.concurrent.ConcurrentHashMap;

    public class HotelBookingService {
        private final RoomInventoryManager inventoryManager;
        private final PricingStrategy pricingStrategy;
        private final Map<String, Reservation> reservations = new ConcurrentHashMap<>();

        public HotelBookingService(RoomInventoryManager inventoryManager) {
            this(inventoryManager, new StandardPricingStrategy());
        }

        public HotelBookingService(RoomInventoryManager inventoryManager, PricingStrategy pricingStrategy) {
            this.inventoryManager = inventoryManager != null ? inventoryManager : new RoomInventoryManager();
            this.pricingStrategy = pricingStrategy != null ? pricingStrategy : new StandardPricingStrategy();
        }

        public synchronized Reservation bookRoom(Guest guest, RoomType type, LocalDate checkIn, LocalDate checkOut) {
            // TODO: Find available room, calculate price, transition room to RESERVED, create and store Reservation
            throw new UnsupportedOperationException("TODO: Implement HotelBookingService.bookRoom");
        }

        public synchronized boolean checkIn(String reservationId) {
            // TODO: Validate reservation is CONFIRMED, transition reservation to CHECKED_IN and room to OCCUPIED
            throw new UnsupportedOperationException("TODO: Implement HotelBookingService.checkIn");
        }

        public synchronized boolean checkOut(String reservationId) {
            // TODO: Validate reservation is CHECKED_IN, transition reservation to CHECKED_OUT and room to AVAILABLE
            throw new UnsupportedOperationException("TODO: Implement HotelBookingService.checkOut");
        }

        public synchronized boolean cancelReservation(String reservationId) {
            // TODO: Validate reservation can be cancelled, transition reservation to CANCELLED and room to AVAILABLE
            throw new UnsupportedOperationException("TODO: Implement HotelBookingService.cancelReservation");
        }

        public Reservation getReservation(String reservationId) {
            return reservations.get(reservationId);
        }
    }
  src/test/java/com/interviewos/hotel/HotelRoomAllocationTest.java: |
    package com.interviewos.hotel;

    import com.interviewos.hotel.model.*;
    import com.interviewos.hotel.service.RoomInventoryManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class HotelRoomAllocationTest {

        @Test
        @DisplayName("Inventory manager filters available rooms by category")
        void testAvailableRoomFiltering() {
            RoomInventoryManager manager = new RoomInventoryManager();
            manager.addRoom(new Room("101", RoomType.SINGLE, new BigDecimal("100.00")));
            manager.addRoom(new Room("102", RoomType.SINGLE, new BigDecimal("100.00"), RoomStatus.OCCUPIED));
            manager.addRoom(new Room("201", RoomType.SUITE, new BigDecimal("350.00")));

            List<Room> singleRooms = manager.getAvailableRooms(RoomType.SINGLE);
            assertEquals(1, singleRooms.size());
            assertEquals("101", singleRooms.get(0).getRoomNumber());

            List<Room> suites = manager.getAvailableRooms(RoomType.SUITE);
            assertEquals(1, suites.size());
            assertEquals("201", suites.get(0).getRoomNumber());
        }

        @Test
        @DisplayName("Updating room status reflects immediately in inventory")
        void testRoomStatusUpdate() {
            RoomInventoryManager manager = new RoomInventoryManager();
            manager.addRoom(new Room("301", RoomType.DELUXE, new BigDecimal("200.00")));

            manager.updateRoomStatus("301", RoomStatus.MAINTENANCE);
            assertEquals(RoomStatus.MAINTENANCE, manager.getRoom("301").getStatus());
            assertEquals(0, manager.getAvailableRooms(RoomType.DELUXE).size());
        }
    }
  src/test/java/com/interviewos/hotel/HotelReservationLifecycleTest.java: |
    package com.interviewos.hotel;

    import com.interviewos.hotel.model.*;
    import com.interviewos.hotel.service.HotelBookingService;
    import com.interviewos.hotel.service.RoomInventoryManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.LocalDate;

    import static org.junit.jupiter.api.Assertions.*;

    public class HotelReservationLifecycleTest {

        @Test
        @DisplayName("Complete booking lifecycle: book -> checkIn -> checkOut frees room")
        void testFullStayLifecycle() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            inventory.addRoom(new Room("101", RoomType.SINGLE, new BigDecimal("120.00")));
            HotelBookingService service = new HotelBookingService(inventory);

            Guest guest = new Guest("G-1", "John Doe", "john@example.com");
            LocalDate in = LocalDate.now();
            LocalDate out = in.plusDays(2);

            Reservation res = service.bookRoom(guest, RoomType.SINGLE, in, out);
            assertNotNull(res);
            assertEquals(ReservationStatus.CONFIRMED, res.getStatus());
            assertEquals(RoomStatus.RESERVED, inventory.getRoom("101").getStatus());

            boolean checkedIn = service.checkIn(res.getReservationId());
            assertTrue(checkedIn);
            assertEquals(ReservationStatus.CHECKED_IN, res.getStatus());
            assertEquals(RoomStatus.OCCUPIED, inventory.getRoom("101").getStatus());

            boolean checkedOut = service.checkOut(res.getReservationId());
            assertTrue(checkedOut);
            assertEquals(ReservationStatus.CHECKED_OUT, res.getStatus());
            assertEquals(RoomStatus.AVAILABLE, inventory.getRoom("101").getStatus());
        }

        @Test
        @DisplayName("Cancelling reservation restores room to AVAILABLE")
        void testCancellationFreesRoom() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            inventory.addRoom(new Room("201", RoomType.DELUXE, new BigDecimal("250.00")));
            HotelBookingService service = new HotelBookingService(inventory);

            Guest guest = new Guest("G-2", "Jane Smith", "jane@example.com");
            Reservation res = service.bookRoom(guest, RoomType.DELUXE, LocalDate.now(), LocalDate.now().plusDays(1));
            assertNotNull(res);

            boolean cancelled = service.cancelReservation(res.getReservationId());
            assertTrue(cancelled);
            assertEquals(ReservationStatus.CANCELLED, res.getStatus());
            assertEquals(RoomStatus.AVAILABLE, inventory.getRoom("201").getStatus());
        }
    }
  src/test/java/com/interviewos/hotel/HotelPricingCalculationTest.java: |
    package com.interviewos.hotel;

    import com.interviewos.hotel.model.*;
    import com.interviewos.hotel.service.HotelBookingService;
    import com.interviewos.hotel.service.RoomInventoryManager;
    import com.interviewos.hotel.strategy.StandardPricingStrategy;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.LocalDate;

    import static org.junit.jupiter.api.Assertions.*;

    public class HotelPricingCalculationTest {

        @Test
        @DisplayName("Reservation price calculated proportionally to duration and nightly rate")
        void testPriceCalculation() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            inventory.addRoom(new Room("501", RoomType.SUITE, new BigDecimal("300.00")));
            HotelBookingService service = new HotelBookingService(inventory, new StandardPricingStrategy());

            Guest guest = new Guest("G-3", "Alice VIP", "alice@example.com");
            LocalDate checkIn = LocalDate.now();
            LocalDate checkOut = checkIn.plusDays(3);

            Reservation res = service.bookRoom(guest, RoomType.SUITE, checkIn, checkOut);
            assertNotNull(res);
            // 3 nights * 300.00 = 900.00
            assertEquals(new BigDecimal("900.00"), res.getTotalPrice());
        }

        @Test
        @DisplayName("Booking fails when no room of requested type is available")
        void testBookingExhaustion() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            HotelBookingService service = new HotelBookingService(inventory);

            Guest guest = new Guest("G-4", "Bob", "bob@example.com");
            Reservation res = service.bookRoom(guest, RoomType.SUITE, LocalDate.now(), LocalDate.now().plusDays(1));
            assertNull(res, "Booking must return null when requested category is sold out");
        }
    }
editablePaths:
- src/main/java/com/interviewos/hotel/service/RoomInventoryManager.java
- src/main/java/com/interviewos/hotel/service/HotelBookingService.java
hiddenTestFiles:
  src/test/java/com/interviewos/hotel/HotelRoomAllocationTest.java: |
    package com.interviewos.hotel;

    import com.interviewos.hotel.model.*;
    import com.interviewos.hotel.service.RoomInventoryManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class HotelRoomAllocationTest {

        @Test
        @DisplayName("Inventory manager filters available rooms by category")
        void testAvailableRoomFiltering() {
            RoomInventoryManager manager = new RoomInventoryManager();
            manager.addRoom(new Room("101", RoomType.SINGLE, new BigDecimal("100.00")));
            manager.addRoom(new Room("102", RoomType.SINGLE, new BigDecimal("100.00"), RoomStatus.OCCUPIED));
            manager.addRoom(new Room("201", RoomType.SUITE, new BigDecimal("350.00")));

            List<Room> singleRooms = manager.getAvailableRooms(RoomType.SINGLE);
            assertEquals(1, singleRooms.size());
            assertEquals("101", singleRooms.get(0).getRoomNumber());

            List<Room> suites = manager.getAvailableRooms(RoomType.SUITE);
            assertEquals(1, suites.size());
            assertEquals("201", suites.get(0).getRoomNumber());
        }

        @Test
        @DisplayName("Updating room status reflects immediately in inventory")
        void testRoomStatusUpdate() {
            RoomInventoryManager manager = new RoomInventoryManager();
            manager.addRoom(new Room("301", RoomType.DELUXE, new BigDecimal("200.00")));

            manager.updateRoomStatus("301", RoomStatus.MAINTENANCE);
            assertEquals(RoomStatus.MAINTENANCE, manager.getRoom("301").getStatus());
            assertEquals(0, manager.getAvailableRooms(RoomType.DELUXE).size());
        }
    }
  src/test/java/com/interviewos/hotel/HotelReservationLifecycleTest.java: |
    package com.interviewos.hotel;

    import com.interviewos.hotel.model.*;
    import com.interviewos.hotel.service.HotelBookingService;
    import com.interviewos.hotel.service.RoomInventoryManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.LocalDate;

    import static org.junit.jupiter.api.Assertions.*;

    public class HotelReservationLifecycleTest {

        @Test
        @DisplayName("Complete booking lifecycle: book -> checkIn -> checkOut frees room")
        void testFullStayLifecycle() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            inventory.addRoom(new Room("101", RoomType.SINGLE, new BigDecimal("120.00")));
            HotelBookingService service = new HotelBookingService(inventory);

            Guest guest = new Guest("G-1", "John Doe", "john@example.com");
            LocalDate in = LocalDate.now();
            LocalDate out = in.plusDays(2);

            Reservation res = service.bookRoom(guest, RoomType.SINGLE, in, out);
            assertNotNull(res);
            assertEquals(ReservationStatus.CONFIRMED, res.getStatus());
            assertEquals(RoomStatus.RESERVED, inventory.getRoom("101").getStatus());

            boolean checkedIn = service.checkIn(res.getReservationId());
            assertTrue(checkedIn);
            assertEquals(ReservationStatus.CHECKED_IN, res.getStatus());
            assertEquals(RoomStatus.OCCUPIED, inventory.getRoom("101").getStatus());

            boolean checkedOut = service.checkOut(res.getReservationId());
            assertTrue(checkedOut);
            assertEquals(ReservationStatus.CHECKED_OUT, res.getStatus());
            assertEquals(RoomStatus.AVAILABLE, inventory.getRoom("101").getStatus());
        }

        @Test
        @DisplayName("Cancelling reservation restores room to AVAILABLE")
        void testCancellationFreesRoom() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            inventory.addRoom(new Room("201", RoomType.DELUXE, new BigDecimal("250.00")));
            HotelBookingService service = new HotelBookingService(inventory);

            Guest guest = new Guest("G-2", "Jane Smith", "jane@example.com");
            Reservation res = service.bookRoom(guest, RoomType.DELUXE, LocalDate.now(), LocalDate.now().plusDays(1));
            assertNotNull(res);

            boolean cancelled = service.cancelReservation(res.getReservationId());
            assertTrue(cancelled);
            assertEquals(ReservationStatus.CANCELLED, res.getStatus());
            assertEquals(RoomStatus.AVAILABLE, inventory.getRoom("201").getStatus());
        }
    }
  src/test/java/com/interviewos/hotel/HotelPricingCalculationTest.java: |
    package com.interviewos.hotel;

    import com.interviewos.hotel.model.*;
    import com.interviewos.hotel.service.HotelBookingService;
    import com.interviewos.hotel.service.RoomInventoryManager;
    import com.interviewos.hotel.strategy.StandardPricingStrategy;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.LocalDate;

    import static org.junit.jupiter.api.Assertions.*;

    public class HotelPricingCalculationTest {

        @Test
        @DisplayName("Reservation price calculated proportionally to duration and nightly rate")
        void testPriceCalculation() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            inventory.addRoom(new Room("501", RoomType.SUITE, new BigDecimal("300.00")));
            HotelBookingService service = new HotelBookingService(inventory, new StandardPricingStrategy());

            Guest guest = new Guest("G-3", "Alice VIP", "alice@example.com");
            LocalDate checkIn = LocalDate.now();
            LocalDate checkOut = checkIn.plusDays(3);

            Reservation res = service.bookRoom(guest, RoomType.SUITE, checkIn, checkOut);
            assertNotNull(res);
            // 3 nights * 300.00 = 900.00
            assertEquals(new BigDecimal("900.00"), res.getTotalPrice());
        }

        @Test
        @DisplayName("Booking fails when no room of requested type is available")
        void testBookingExhaustion() {
            RoomInventoryManager inventory = new RoomInventoryManager();
            HotelBookingService service = new HotelBookingService(inventory);

            Guest guest = new Guest("G-4", "Bob", "bob@example.com");
            Reservation res = service.bookRoom(guest, RoomType.SUITE, LocalDate.now(), LocalDate.now().plusDays(1));
            assertNull(res, "Booking must return null when requested category is sold out");
        }
    }
starterCode: |
  package com.interviewos.hotel.service;

  import com.interviewos.hotel.model.Room;
  import com.interviewos.hotel.model.RoomStatus;
  import com.interviewos.hotel.model.RoomType;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class RoomInventoryManager {
      private final Map<String, Room> inventory = new ConcurrentHashMap<>();

      public void addRoom(Room room) {
          // TODO: Store room in inventory
          throw new UnsupportedOperationException("TODO: Implement RoomInventoryManager.addRoom");
      }

      public Room getRoom(String roomNumber) {
          return inventory.get(roomNumber);
      }

      public List<Room> getAvailableRooms(RoomType type) {
          // TODO: Filter rooms matching type with status AVAILABLE
          throw new UnsupportedOperationException("TODO: Implement RoomInventoryManager.getAvailableRooms");
      }

      public synchronized void updateRoomStatus(String roomNumber, RoomStatus status) {
          // TODO: Update room status in inventory
          throw new UnsupportedOperationException("TODO: Implement RoomInventoryManager.updateRoomStatus");
      }
  }
solutionCode: |
  package com.interviewos.hotel.service;

  import com.interviewos.hotel.model.Room;
  import com.interviewos.hotel.model.RoomStatus;
  import com.interviewos.hotel.model.RoomType;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class RoomInventoryManager {
      private final Map<String, Room> inventory = new ConcurrentHashMap<>();

      public void addRoom(Room room) {
          if (room != null) {
              inventory.put(room.getRoomNumber(), room);
          }
      }

      public Room getRoom(String roomNumber) {
          return inventory.get(roomNumber);
      }

      public List<Room> getAvailableRooms(RoomType type) {
          List<Room> result = new ArrayList<>();
          for (Room r : inventory.values()) {
              if ((type == null || r.getType() == type) && r.getStatus() == RoomStatus.AVAILABLE) {
                  result.add(r);
              }
          }
          return result;
      }

      public synchronized void updateRoomStatus(String roomNumber, RoomStatus status) {
          Room r = inventory.get(roomNumber);
          if (r != null && status != null) {
              r.setStatus(status);
          }
      }
  }
---

### Problem Statement: Hotel Management System

You are tasked with designing and implementing an object-oriented Hotel Management and Room Reservation system in Java. Hospitality platforms require structured inventory controllers that manage multi-category accommodations, prevent double-bookings, coordinate multi-day reservation states, and calculate stay pricing based on flexible policies. Your goal is to construct a domain model that manages rooms across statuses (AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE), governs the reservation lifecycle (CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED), and calculates dynamic stay pricing.

#### Functional Requirements:
1. **Room Inventory Modeling**: Support various room categories (SINGLE, DOUBLE, DELUXE, SUITE) with assigned room numbers and nightly base tariffs.
2. **Room Status Invariants**: Track room occupancy states (AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE) ensuring mutual exclusivity of room access.
3. **Reservation State Machine**: Enforce valid booking transitions: CONFIRMED upon creation, CHECKED_IN upon arrival, CHECKED_OUT upon departure, and CANCELLED if withdrawn.
4. **Inventory Search & Allocation**: Query available rooms matching requested categories, allocating eligible rooms atomically during reservation creation.
5. **Pluggable Pricing Strategies**: Implement a PricingStrategy interface capable of evaluating total billing amounts based on room tariff and number of nights.
6. **Guest Check-In Workflow**: Verify confirmed reservations upon arrival and transition the allocated room from RESERVED to OCCUPIED.
7. **Guest Check-Out Workflow**: Complete departure transitions by closing the reservation to CHECKED_OUT and immediately restoring the room to AVAILABLE.
8. **Reservation Cancellation**: Support booking cancellation, releasing any held room allocations back to AVAILABLE for subsequent guest reservations.

#### Non-goals:
- Room service billing, in-room minibar inventory audits, and laundry ticketing are deferred to ancillary hospitality subsystems.
- Credit card payment gateway network integration and PCI-DSS vaulting are out of scope for this core lodging orchestration engine.
