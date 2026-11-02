---
slug: lld-movie-ticket-booking
title: Design a Movie Ticket Booking System
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
- booking-system
buildProfile: maven-workspace
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the State Pattern to model seat lifecycle (AVAILABLE -> TEMPORARILY_RESERVED -> BOOKED).
- Implement a TTL-based reservation hold (e.g., 10 minutes) before unconfirmed seats are automatically released.
- Ensure thread safety during seat selection using optimistic locking or synchronized seat blocks to prevent double-booking.
coaching:
  presentationTips:
  - 'Address concurrency head-on: what happens when 50 users select seat G12 at the same instant during a blockbuster release?'
  - Differentiate between physical Cinema/Hall entities and ephemeral Show/Booking instances.
  - Highlight how the payment flow decouples from the seat reservation engine using event notifications or reservation states.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>movie-ticket-booking</artifactId>
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
    # Movie Ticket Booking System

    ## Overview
    Implement an object-oriented Movie Ticket Booking System supporting cinema layout, temporary TTL seat reservations, and booking confirmation with pluggable pricing strategies.

    ## Key Components
    - `com.interviewos.booking.service.SeatLockManager`: TTL seat lock management to prevent race conditions and double bookings.
    - `com.interviewos.booking.service.ScreeningManager`: Scheduled showtimes, seat availability, and confirmed ticket ledger.
    - `com.interviewos.booking.service.MovieBookingSystem`: Facade for booking workflow.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/booking/service/ScreeningManager.java`
    2. `src/main/java/com/interviewos/booking/service/MovieBookingSystem.java`
    3. `src/main/java/com/interviewos/booking/service/SeatLockManager.java`
  src/main/java/com/interviewos/booking/model/Movie.java: |
    package com.interviewos.booking.model;

    import java.time.Duration;

    public class Movie {
        private final String title;
        private final String genre;
        private final int durationInMinutes;

        public Movie(String title, String genre, int durationInMinutes) {
            this.title = title;
            this.genre = genre;
            this.durationInMinutes = durationInMinutes;
        }

        public String getTitle() { return title; }
        public String getGenre() { return genre; }
        public Duration getDuration() { return Duration.ofMinutes(durationInMinutes); }
    }
  src/main/java/com/interviewos/booking/strategy/PricingStrategy.java: |
    package com.interviewos.booking.strategy;

    import java.math.BigDecimal;

    public interface PricingStrategy {
        BigDecimal getPrice();
    }
  src/main/java/com/interviewos/booking/strategy/NormalRate.java: |
    package com.interviewos.booking.strategy;

    import java.math.BigDecimal;

    public class NormalRate implements PricingStrategy {
        private final BigDecimal price;

        public NormalRate(BigDecimal price) {
            this.price = price;
        }

        @Override
        public BigDecimal getPrice() {
            return price;
        }
    }
  src/main/java/com/interviewos/booking/strategy/VIPRate.java: |
    package com.interviewos.booking.strategy;

    import java.math.BigDecimal;

    public class VIPRate implements PricingStrategy {
        private final BigDecimal price;

        public VIPRate(BigDecimal price) {
            this.price = price;
        }

        @Override
        public BigDecimal getPrice() {
            return price;
        }
    }
  src/main/java/com/interviewos/booking/model/Seat.java: |
    package com.interviewos.booking.model;

    import com.interviewos.booking.strategy.PricingStrategy;

    public class Seat {
        private final String seatNumber;
        private final PricingStrategy pricingStrategy;

        public Seat(String seatNumber, PricingStrategy pricingStrategy) {
            this.seatNumber = seatNumber;
            this.pricingStrategy = pricingStrategy;
        }

        public String getSeatNumber() { return seatNumber; }
        public PricingStrategy getPricingStrategy() { return pricingStrategy; }
    }
  src/main/java/com/interviewos/booking/model/Layout.java: |
    package com.interviewos.booking.model;

    import java.util.*;

    public class Layout {
        private final int rows;
        private final int columns;
        private final Map<String, Seat> seatsByNumber = new HashMap<>();

        public Layout(int rows, int columns) {
            this.rows = rows;
            this.columns = columns;
        }

        public void addSeat(Seat seat) {
            if (seat != null) {
                seatsByNumber.put(seat.getSeatNumber(), seat);
            }
        }

        public Seat getSeatByNumber(String seatNumber) {
            return seatsByNumber.get(seatNumber);
        }

        public List<Seat> getAllSeats() {
            return new ArrayList<>(seatsByNumber.values());
        }
    }
  src/main/java/com/interviewos/booking/model/Room.java: |
    package com.interviewos.booking.model;

    public class Room {
        private final String roomNumber;
        private final Layout layout;

        public Room(String roomNumber, Layout layout) {
            this.roomNumber = roomNumber;
            this.layout = layout;
        }

        public String getRoomNumber() { return roomNumber; }
        public Layout getLayout() { return layout; }
    }
  src/main/java/com/interviewos/booking/model/Screening.java: |
    package com.interviewos.booking.model;

    import java.time.LocalDateTime;

    public class Screening {
        private final String id;
        private final Movie movie;
        private final Room room;
        private final LocalDateTime startTime;

        public Screening(String id, Movie movie, Room room, LocalDateTime startTime) {
            this.id = id;
            this.movie = movie;
            this.room = room;
            this.startTime = startTime;
        }

        public String getId() { return id; }
        public Movie getMovie() { return movie; }
        public Room getRoom() { return room; }
        public LocalDateTime getStartTime() { return startTime; }
    }
  src/main/java/com/interviewos/booking/model/Ticket.java: |
    package com.interviewos.booking.model;

    import java.math.BigDecimal;

    public class Ticket {
        private final Screening screening;
        private final Seat seat;
        private final BigDecimal price;

        public Ticket(Screening screening, Seat seat, BigDecimal price) {
            this.screening = screening;
            this.seat = seat;
            this.price = price;
        }

        public Screening getScreening() { return screening; }
        public Seat getSeat() { return seat; }
        public BigDecimal getPrice() { return price; }
    }
  src/main/java/com/interviewos/booking/service/ScreeningManager.java: |
    package com.interviewos.booking.service;

    import com.interviewos.booking.model.*;
    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;

    public class ScreeningManager {
        private final Map<String, List<Screening>> screeningsByMovieTitle = new ConcurrentHashMap<>();
        private final Map<String, List<Ticket>> ticketsByScreeningId = new ConcurrentHashMap<>();

        public void addScreening(Screening screening) {
            if (screening != null) {
                screeningsByMovieTitle.computeIfAbsent(screening.getMovie().getTitle(), k -> new ArrayList<>()).add(screening);
            }
        }

        public List<Screening> getScreeningsForMovie(String movieTitle) {
            return screeningsByMovieTitle.getOrDefault(movieTitle, List.of());
        }

        public synchronized void addTicket(Screening screening, Ticket ticket) {
            // TODO: Record confirmed ticket for screening
            throw new UnsupportedOperationException("TODO: Implement addTicket");
        }

        public synchronized List<Seat> getAvailableSeats(Screening screening) {
            // TODO: Return all layout seats minus already booked seats
            throw new UnsupportedOperationException("TODO: Implement getAvailableSeats");
        }

        public synchronized boolean isSeatBooked(Screening screening, Seat seat) {
            // TODO: Check if seat is booked in ticketsByScreeningId
            throw new UnsupportedOperationException("TODO: Implement isSeatBooked");
        }

        public List<Ticket> getTicketsForScreening(String screeningId) {
            return ticketsByScreeningId.getOrDefault(screeningId, List.of());
        }
    }
  src/main/java/com/interviewos/booking/service/SeatLockManager.java: |
    package com.interviewos.booking.service;

    import com.interviewos.booking.model.Screening;
    import com.interviewos.booking.model.Seat;
    import java.time.Duration;
    import java.time.LocalDateTime;
    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class SeatLockManager {
        private final Map<String, LockEntry> locks = new ConcurrentHashMap<>();
        private final Duration lockDuration;

        public SeatLockManager(Duration lockDuration) {
            this.lockDuration = lockDuration != null ? lockDuration : Duration.ofMinutes(10);
        }

        public synchronized boolean lockSeat(Screening screening, Seat seat, String userId) {
            // TODO: Check if already locked and not expired. If free/expired, set new lock with userId and expiration.
            throw new UnsupportedOperationException("TODO: Implement lockSeat");
        }

        public synchronized boolean isLocked(Screening screening, Seat seat) {
            // TODO: Return true if seat has an active non-expired lock
            throw new UnsupportedOperationException("TODO: Implement isLocked");
        }

        public synchronized void unlockSeat(Screening screening, Seat seat) {
            locks.remove(getKey(screening, seat));
        }

        private String getKey(Screening screening, Seat seat) {
            return screening.getId() + "#" + seat.getSeatNumber();
        }

        private static class LockEntry {
            final String userId;
            final LocalDateTime expiry;
            LockEntry(String userId, LocalDateTime expiry) {
                this.userId = userId;
                this.expiry = expiry;
            }
            boolean isExpired() {
                return LocalDateTime.now().isAfter(expiry);
            }
        }
    }
  src/main/java/com/interviewos/booking/service/MovieBookingSystem.java: |
    package com.interviewos.booking.service;

    import com.interviewos.booking.model.*;
    import java.math.BigDecimal;
    import java.util.List;

    public class MovieBookingSystem {
        private final ScreeningManager screeningManager;
        private final SeatLockManager seatLockManager;

        public MovieBookingSystem(ScreeningManager screeningManager, SeatLockManager seatLockManager) {
            this.screeningManager = screeningManager;
            this.seatLockManager = seatLockManager;
        }

        public Ticket bookTicket(Screening screening, Seat seat, String userId) {
            // TODO: Verify seat is locked by userId or available, not booked; record ticket via screeningManager; release lock
            throw new UnsupportedOperationException("TODO: Implement bookTicket");
        }

        public List<Seat> getAvailableSeats(Screening screening) {
            return screeningManager.getAvailableSeats(screening);
        }

        public ScreeningManager getScreeningManager() { return screeningManager; }
        public SeatLockManager getSeatLockManager() { return seatLockManager; }
    }
editablePaths:
- src/main/java/com/interviewos/booking/service/ScreeningManager.java
- src/main/java/com/interviewos/booking/service/MovieBookingSystem.java
- src/main/java/com/interviewos/booking/service/SeatLockManager.java
hiddenTestFiles:
  src/test/java/com/interviewos/booking/SeatLockManagerTest.java: |
    package com.interviewos.booking;

    import com.interviewos.booking.model.*;
    import com.interviewos.booking.service.SeatLockManager;
    import com.interviewos.booking.strategy.NormalRate;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.Duration;
    import java.time.LocalDateTime;

    import static org.junit.jupiter.api.Assertions.*;

    public class SeatLockManagerTest {
        @Test
        @DisplayName("Locking a seat reserves it and prevents concurrent lock by another user")
        void testLockContention() {
            SeatLockManager lockManager = new SeatLockManager(Duration.ofMinutes(10));
            Screening screening = new Screening("S1", new Movie("Inception", "Sci-Fi", 148), new Room("R1", new Layout(5, 5)), LocalDateTime.now());
            Seat seat = new Seat("A1", new NormalRate(new BigDecimal("12.00")));

            assertTrue(lockManager.lockSeat(screening, seat, "user-101"));
            assertTrue(lockManager.isLocked(screening, seat));

            // Second user must be rejected while lock is active
            assertFalse(lockManager.lockSeat(screening, seat, "user-202"));
        }
    }
  src/test/java/com/interviewos/booking/BookingPricingTest.java: |
    package com.interviewos.booking;

    import com.interviewos.booking.strategy.NormalRate;
    import com.interviewos.booking.strategy.VIPRate;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class BookingPricingTest {
        @Test
        @DisplayName("Normal and VIP pricing strategies yield configured price tiers")
        void testPricing() {
            NormalRate normal = new NormalRate(new BigDecimal("12.50"));
            VIPRate vip = new VIPRate(new BigDecimal("25.00"));

            assertEquals(new BigDecimal("12.50"), normal.getPrice());
            assertEquals(new BigDecimal("25.00"), vip.getPrice());
            assertTrue(vip.getPrice().compareTo(normal.getPrice()) > 0);
        }
    }
  src/test/java/com/interviewos/booking/MovieBookingSystemTest.java: |
    package com.interviewos.booking;

    import com.interviewos.booking.model.*;
    import com.interviewos.booking.service.MovieBookingSystem;
    import com.interviewos.booking.service.ScreeningManager;
    import com.interviewos.booking.service.SeatLockManager;
    import com.interviewos.booking.strategy.NormalRate;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.Duration;
    import java.time.LocalDateTime;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class MovieBookingSystemTest {
        private MovieBookingSystem system;
        private Screening screening;
        private Seat seat1;
        private Seat seat2;

        @BeforeEach
        void setUp() {
            Layout layout = new Layout(2, 2);
            seat1 = new Seat("A1", new NormalRate(new BigDecimal("10.00")));
            seat2 = new Seat("A2", new NormalRate(new BigDecimal("10.00")));
            layout.addSeat(seat1);
            layout.addSeat(seat2);

            Room room = new Room("R1", layout);
            Movie movie = new Movie("Interstellar", "Sci-Fi", 169);
            screening = new Screening("SCR-1", movie, room, LocalDateTime.now().plusHours(2));

            ScreeningManager sm = new ScreeningManager();
            sm.addScreening(screening);
            SeatLockManager lm = new SeatLockManager(Duration.ofMinutes(10));
            system = new MovieBookingSystem(sm, lm);
        }

        @Test
        @DisplayName("Booking confirmed seat removes it from available seat list")
        void testBookingRemovesAvailableSeat() {
            List<Seat> initialSeats = system.getAvailableSeats(screening);
            assertEquals(2, initialSeats.size());

            Ticket ticket = system.bookTicket(screening, seat1, "user-1");
            assertNotNull(ticket);
            assertEquals("A1", ticket.getSeat().getSeatNumber());

            List<Seat> remainingSeats = system.getAvailableSeats(screening);
            assertEquals(1, remainingSeats.size());
            assertEquals("A2", remainingSeats.get(0).getSeatNumber());
        }
    }

starterCode: "public class Movie {\n    private final String title;\n    private final String genre;\n    private final int durationInMinutes;\n    public Movie(String title, String genre, int durationInMinutes) {\n        this.title = title;\n        this.genre = genre;\n        this.durationInMinutes = durationInMinutes;\n    }\n    public Duration getDuration() {\n        return Duration.ofMinutes(durationInMinutes);\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Cinema {\n    private final String name;\n    private final String location;\n    private final List<Room> rooms;\n    public Cinema(String name, String location) {\n        this.name = name;\n        this.location = location;\n        this.rooms = new ArrayList<>();\n    }\n    public void addRoom(Room room) {\n        rooms.add(room);\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Room {\n    private final String roomNumber;\n    private final Layout layout;\n \
  \   public Room(String roomNumber, Layout layout) {\n        this.roomNumber = roomNumber;\n        this.layout = layout;\n    }\n    // getter and setter methods are omitted for brevity\n}"
solutionCode: "public class Movie {\n    private final String title;\n    private final String genre;\n    private final int durationInMinutes;\n    public Movie(String title, String genre, int durationInMinutes) {\n        this.title = title;\n        this.genre = genre;\n        this.durationInMinutes = durationInMinutes;\n    }\n    public Duration getDuration() {\n        return Duration.ofMinutes(durationInMinutes);\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Cinema {\n    private final String name;\n    private final String location;\n    private final List<Room> rooms;\n    public Cinema(String name, String location) {\n        this.name = name;\n        this.location = location;\n        this.rooms = new ArrayList<>();\n    }\n    public void addRoom(Room room) {\n        rooms.add(room);\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Room {\n    private final String roomNumber;\n    private final Layout layout;\n\
  \    public Room(String roomNumber, Layout layout) {\n        this.roomNumber = roomNumber;\n        this.layout = layout;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\n// Represents the seating layout of a cinema room.\npublic class Layout {\n    private final int rows;\n    private final int columns;\n    // Maps seat numbers (e.g., \"0-0\") to Seat objects for direct access\nprivate final Map<String, Seat> seatsByNumber;\n    // Nested map for position-based access (row → column → seat)\nprivate final Map<Integer, Map<Integer, Seat>> seatsByPosition;\n    public Layout(int rows, int columns) {\n        this.rows = rows;\n        this.columns = columns;\n        this.seatsByNumber = new HashMap<>();\n        this.seatsByPosition = new HashMap<>();\n        initializeLayout();\n    }\n    // Creates seats for all positions with default null pricing\nprivate void initializeLayout() {\n        for (int i\n=\n0; i < rows; i++) {\n            for (int j\n=\n0; j <\
  \ columns; j++) {\n                String\nseatNumber\n= i + \"-\" + j;\n                addSeat(seatNumber, i, j, new Seat(seatNumber, null));\n            }\n        }\n    }\n    public void addSeat(String seatNumber, int row, int column, Seat seat) {\n        // Store seat in number-based lookup map\n        seatsByNumber.put(seatNumber, seat);\n        // Store seat in position-based lookup map\n        seatsByPosition.computeIfAbsent(row, k -> new HashMap<>()).put(column, seat);\n    }\n    public Seat getSeatByNumber(String seatNumber) {\n        return seatsByNumber.get(seatNumber);\n    }\n    // Gets a seat by its row and column position\npublic Seat getSeatByPosition(int row, int column) {\n        Map<Integer, Seat> rowSeats = seatsByPosition.get(row);\n        return (rowSeats != null) ? rowSeats.get(column) : null;\n    }\n    public List<Seat> getAllSeats() {\n        return List.copyOf(seatsByNumber.values());\n    }\n}\n\npublic class Seat {\n    private final String seatNumber;\n\
  \    private PricingStrategy pricingStrategy;\n    public Seat(String seatNumber, PricingStrategy pricingStrategy) {\n        this.seatNumber = seatNumber;\n        this.pricingStrategy = pricingStrategy;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic interface PricingStrategy {\n    BigDecimal getPrice();\n}\npublic class NormalRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public NormalRate(BigDecimal price) {\n        this.price = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n    }\n}\npublic class PremiumRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public PremiumRate(BigDecimal price) {\n        this.price = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n    }\n}\npublic class VIPRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public VIPRate(BigDecimal price) {\n        this.price\
  \ = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n    }\n}\n\n// Represents a scheduled screening of a movie in a specific cinema room.\npublic class Screening {\n    private final Movie movie;\n    private final Room room;\n    private final LocalDateTime startTime;\n    private final LocalDateTime endTime;\n    public Screening(Movie movie, Room room, LocalDateTime startTime, LocalDateTime endTime) {\n        this.movie = movie;\n        this.room = room;\n        this.startTime = startTime;\n        this.endTime = endTime;\n    }\n    public Duration getDuration() {\n        return Duration.between(startTime, endTime);\n    } // getter and setter methods are omitted for brevity\n}\n\npublic class Ticket {\n    private final Screening screening;\n    private final Seat seat;\n    private final BigDecimal price;\n    public Ticket(Screening screening, Seat seat, BigDecimal price) {\n        this.screening = screening;\n        this.seat = seat;\n\
  \        this.price = price;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Order {\n    private final List<Ticket> tickets;\n    private final LocalDateTime orderDate;\n    public Order(LocalDateTime orderDate) {\n        this.tickets = new ArrayList<>();\n        this.orderDate = orderDate;\n    }\n    public void addTicket(Ticket ticket) {\n        tickets.add(ticket);\n    }\n    // Calculates the total price of all tickets in the order\npublic BigDecimal calculateTotalPrice() {\n        return tickets.stream().map(Ticket::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // getter and setter methods are omitted for brevity\n}\n\n// Manages the relationships between movies, screenings, and tickets in the booking system\npublic class ScreeningManager {\n    // Maps movies to their scheduled screenings\nprivate final Map<Movie, List<Screening>> screeningsByMovie;\n    // Maps screenings to tickets sold for that screening\nprivate final\
  \ Map<Screening, List<Ticket>> ticketsByScreening;\n    public ScreeningManager() {\n        this.screeningsByMovie = new HashMap<>();\n        this.ticketsByScreening = new HashMap<>();\n    }\n    public void addScreening(Movie movie, Screening screening) {\n        screeningsByMovie.computeIfAbsent(movie, k -> new ArrayList<>()).add(screening);\n    }\n    // Returns all screenings for a specific movie\npublic List<Screening> getScreeningsForMovie(Movie movie) {\n        return screeningsByMovie.getOrDefault(movie, new ArrayList<>());\n    }\n    public void addTicket(Screening screening, Ticket ticket) {\n        ticketsByScreening.computeIfAbsent(screening, k -> new ArrayList<>()).add(ticket);\n    }\n    // Returns all tickets sold for a specific screening\npublic List<Ticket> getTicketsForScreening(Screening screening) {\n        return ticketsByScreening.getOrDefault(screening, new ArrayList<>());\n    }\n    // Calculates which seats are still available for a screening\npublic\
  \ List<Seat> getAvailableSeats(Screening screening) {\n        List<Seat> allSeats = screening.getRoom().getLayout().getAllSeats();\n        List<Ticket> bookedTickets = getTicketsForScreening(screening);\n        List<Seat> availableSeats = new ArrayList<>(allSeats);\n        for (Ticket ticket : bookedTickets) {\n            availableSeats.remove(ticket.getSeat());\n        }\n        return availableSeats;\n    }\n}\n\n// Manages the complete movie booking system operations\npublic class MovieBookingSystem {\n    private final List<Movie> movies;\n    private final List<Cinema> cinemas;\n    private final ScreeningManager screeningManager;\n    public MovieBookingSystem() {\n        this.movies = new ArrayList<>();\n        this.cinemas = new ArrayList<>();\n        this.screeningManager = new ScreeningManager();\n    }\n    public void addMovie(Movie movie) {\n        movies.add(movie);\n    }\n    public void addCinema(Cinema cinema) {\n        cinemas.add(cinema);\n    }\n    public\
  \ void addScreening(Movie movie, Screening screening) {\n        screeningManager.addScreening(movie, screening);\n    }\n    // Books a ticket for a specific seat at a screening\npublic void bookTicket(Screening screening, Seat seat) {\n        BigDecimal\nprice\n= seat.getPricingStrategy().getPrice();\n        Ticket\nticket\n=\nnew Ticket(screening, seat, price);\n        screeningManager.addTicket(screening, ticket);\n    }\n    // Returns all screenings for a specific movie\npublic List<Screening> getScreeningsForMovie(Movie movie) {\n        return screeningManager.getScreeningsForMovie(movie);\n    }\n    // Returns all available seats for a screening\npublic List<Seat> getAvailableSeats(Screening screening) {\n        return screeningManager.getAvailableSeats(screening);\n    }\n    // Returns the number of tickets sold for a screening\npublic int getTicketCount(Screening screening) {\n        return screeningManager.getTicketsForScreening(screening).size();\n    }\n    // Returns\
  \ the list of tickets for a screening\npublic List<Ticket> getTicketsForScreening(Screening screening) {\n        return screeningManager.getTicketsForScreening(screening);\n    } // getter and setter methods are omitted for brevity\n}\n\npublic class SeatLockManager {\n    private final Map<String, SeatLock> lockedSeats = new ConcurrentHashMap<>();\n    private final Duration lockDuration;\n    public SeatLockManager(Duration lockDuration) {\n        this.lockDuration = lockDuration;\n    }\n    public synchronized boolean lockSeat(Screening screening, Seat seat, String userId) {\n        String\nlockKey\n= generateLockKey(screening, seat);\n        // Clean up lock if expired (on-demand cleanup when another process attempts to lock)\n        cleanupLockIfExpired(lockKey);\n        // Check if a seat is already locked\nif (isLocked(screening, seat)) {\n            return false;\n        }\n        // Create a new lock with expiration time\nSeatLock\nlock\n=\nnew SeatLock(userId, LocalDateTime.now().plus(lockDuration));\n\
  \        lockedSeats.put(lockKey, lock);\n        return true;\n    }\n    public synchronized boolean isLocked(Screening screening, Seat seat) {\n        String\nlockKey\n= generateLockKey(screening, seat);\n        // Clean up lock if expired (on-demand cleanup)\n        cleanupLockIfExpired(lockKey);\n        // If we reach here, either no lock exists or it's valid\nreturn lockedSeats.containsKey(lockKey);\n    }\n    private void cleanupLockIfExpired(String lockKey) {\n        SeatLock\nlock\n= lockedSeats.get(lockKey);\n        if (lock != null && lock.isExpired()) {\n            lockedSeats.remove(lockKey);\n        }\n    }\n    private String generateLockKey(Screening screening, Seat seat) {\n        return screening.getId() + \"-\" + seat.getSeatNumber();\n    }\n    // SeatLock inner class private static class SeatLock {\n        private final String userId;\n        private final LocalDateTime expirationTime;\n        public SeatLock(String userId, LocalDateTime expirationTime)\
  \ {\n            this.userId = userId;\n            this.expirationTime = expirationTime;\n        }\n        public boolean isExpired() {\n            return LocalDateTime.now().isAfter(expirationTime);\n        }\n        public String getUserId() {\n            return userId;\n        }\n    }\n}\n\n// Simplified optimistic locking in ScreeningManager\npublic synchronized Ticket bookSeatOptimistically(Screening screening, Seat seat) {\n    // First check if a seat is available (optimistic)\nif (isSeatBooked(screening, seat)) {\n        throw new IllegalStateException(\"Seat is already booked\");\n    }\n    // Create ticket - at this point, we're optimistically assuming\n// the seat is still available\nBigDecimal\nprice\n= seat.getPricingStrategy().getPrice();\n    Ticket\nticket\n=\nnew Ticket(screening, seat, price);\n    // Add to booking system - this effectively \"reserves\" the seat\n    ticketsByScreening.computeIfAbsent(screening, k -> new ArrayList<>()).add(ticket);\n    return\
  \ ticket;\n}\n// Helper method to check if a seat is already booked\nprivate boolean isSeatBooked(Screening screening, Seat seat) {\n    List<Ticket> tickets = getTicketsForScreening(screening);\n    return tickets.stream().anyMatch(ticket -> ticket.getSeat().equals(seat));\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Movie Ticket Booking System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (Seat State Transitions), Strategy Pattern (Pricing & Discounts), Facade Pattern (Booking Engine)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-movie-ticket-booking
  label: Canonical — Design a Movie Ticket Booking System
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
  code: "public class Movie {\n    private final String title;\n    private final String genre;\n    private final int durationInMinutes;\n    public Movie(String title, String genre, int durationInMinutes) {\n        this.title = title;\n        this.genre = genre;\n        this.durationInMinutes = durationInMinutes;\n    }\n    public Duration getDuration() {\n        return Duration.ofMinutes(durationInMinutes);\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Cinema {\n    private final String name;\n    private final String location;\n    private final List<Room> rooms;\n    public Cinema(String name, String location) {\n        this.name = name;\n        this.location = location;\n        this.rooms = new ArrayList<>();\n    }\n    public void addRoom(Room room) {\n        rooms.add(room);\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Room {\n    private final String roomNumber;\n    private final Layout layout;\n    public\
    \ Room(String roomNumber, Layout layout) {\n        this.roomNumber = roomNumber;\n        this.layout = layout;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\n// Represents the seating layout of a cinema room.\npublic class Layout {\n    private final int rows;\n    private final int columns;\n    // Maps seat numbers (e.g., \"0-0\") to Seat objects for direct access\nprivate final Map<String, Seat> seatsByNumber;\n    // Nested map for position-based access (row → column → seat)\nprivate final Map<Integer, Map<Integer, Seat>> seatsByPosition;\n    public Layout(int rows, int columns) {\n        this.rows = rows;\n        this.columns = columns;\n        this.seatsByNumber = new HashMap<>();\n        this.seatsByPosition = new HashMap<>();\n        initializeLayout();\n    }\n    // Creates seats for all positions with default null pricing\nprivate void initializeLayout() {\n        for (int i\n=\n0; i < rows; i++) {\n            for (int j\n=\n0; j < columns;\
    \ j++) {\n                String\nseatNumber\n= i + \"-\" + j;\n                addSeat(seatNumber, i, j, new Seat(seatNumber, null));\n            }\n        }\n    }\n    public void addSeat(String seatNumber, int row, int column, Seat seat) {\n        // Store seat in number-based lookup map\n        seatsByNumber.put(seatNumber, seat);\n        // Store seat in position-based lookup map\n        seatsByPosition.computeIfAbsent(row, k -> new HashMap<>()).put(column, seat);\n    }\n    public Seat getSeatByNumber(String seatNumber) {\n        return seatsByNumber.get(seatNumber);\n    }\n    // Gets a seat by its row and column position\npublic Seat getSeatByPosition(int row, int column) {\n        Map<Integer, Seat> rowSeats = seatsByPosition.get(row);\n        return (rowSeats != null) ? rowSeats.get(column) : null;\n    }\n    public List<Seat> getAllSeats() {\n        return List.copyOf(seatsByNumber.values());\n    }\n}\n\npublic class Seat {\n    private final String seatNumber;\n\
    \    private PricingStrategy pricingStrategy;\n    public Seat(String seatNumber, PricingStrategy pricingStrategy) {\n        this.seatNumber = seatNumber;\n        this.pricingStrategy = pricingStrategy;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic interface PricingStrategy {\n    BigDecimal getPrice();\n}\npublic class NormalRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public NormalRate(BigDecimal price) {\n        this.price = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n    }\n}\npublic class PremiumRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public PremiumRate(BigDecimal price) {\n        this.price = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n    }\n}\npublic class VIPRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public VIPRate(BigDecimal price) {\n        this.price\
    \ = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n    }\n}\n\n// Represents a scheduled screening of a movie in a specific cinema room.\npublic class Screening {\n    private final Movie movie;\n    private final Room room;\n    private final LocalDateTime startTime;\n    private final LocalDateTime endTime;\n    public Screening(Movie movie, Room room, LocalDateTime startTime, LocalDateTime endTime) {\n        this.movie = movie;\n        this.room = room;\n        this.startTime = startTime;\n        this.endTime = endTime;\n    }\n    public Duration getDuration() {\n        return Duration.between(startTime, endTime);\n    } // getter and setter methods are omitted for brevity\n}\n\npublic class Ticket {\n    private final Screening screening;\n    private final Seat seat;\n    private final BigDecimal price;\n    public Ticket(Screening screening, Seat seat, BigDecimal price) {\n        this.screening = screening;\n        this.seat = seat;\n\
    \        this.price = price;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Order {\n    private final List<Ticket> tickets;\n    private final LocalDateTime orderDate;\n    public Order(LocalDateTime orderDate) {\n        this.tickets = new ArrayList<>();\n        this.orderDate = orderDate;\n    }\n    public void addTicket(Ticket ticket) {\n        tickets.add(ticket);\n    }\n    // Calculates the total price of all tickets in the order\npublic BigDecimal calculateTotalPrice() {\n        return tickets.stream().map(Ticket::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // getter and setter methods are omitted for brevity\n}\n\n// Manages the relationships between movies, screenings, and tickets in the booking system\npublic class ScreeningManager {\n    // Maps movies to their scheduled screenings\nprivate final Map<Movie, List<Screening>> screeningsByMovie;\n    // Maps screenings to tickets sold for that screening\nprivate final\
    \ Map<Screening, List<Ticket>> ticketsByScreening;\n    public ScreeningManager() {\n        this.screeningsByMovie = new HashMap<>();\n        this.ticketsByScreening = new HashMap<>();\n    }\n    public void addScreening(Movie movie, Screening screening) {\n        screeningsByMovie.computeIfAbsent(movie, k -> new ArrayList<>()).add(screening);\n    }\n    // Returns all screenings for a specific movie\npublic List<Screening> getScreeningsForMovie(Movie movie) {\n        return screeningsByMovie.getOrDefault(movie, new ArrayList<>());\n    }\n    public void addTicket(Screening screening, Ticket ticket) {\n        ticketsByScreening.computeIfAbsent(screening, k -> new ArrayList<>()).add(ticket);\n    }\n    // Returns all tickets sold for a specific screening\npublic List<Ticket> getTicketsForScreening(Screening screening) {\n        return ticketsByScreening.getOrDefault(screening, new ArrayList<>());\n    }\n    // Calculates which seats are still available for a screening\npublic\
    \ List<Seat> getAvailableSeats(Screening screening) {\n        List<Seat> allSeats = screening.getRoom().getLayout().getAllSeats();\n        List<Ticket> bookedTickets = getTicketsForScreening(screening);\n        List<Seat> availableSeats = new ArrayList<>(allSeats);\n        for (Ticket ticket : bookedTickets) {\n            availableSeats.remove(ticket.getSeat());\n        }\n        return availableSeats;\n    }\n}\n\n// Manages the complete movie booking system operations\npublic class MovieBookingSystem {\n    private final List<Movie> movies;\n    private final List<Cinema> cinemas;\n    private final ScreeningManager screeningManager;\n    public MovieBookingSystem() {\n        this.movies = new ArrayList<>();\n        this.cinemas = new ArrayList<>();\n        this.screeningManager = new ScreeningManager();\n    }\n    public void addMovie(Movie movie) {\n        movies.add(movie);\n    }\n    public void addCinema(Cinema cinema) {\n        cinemas.add(cinema);\n    }\n    public\
    \ void addScreening(Movie movie, Screening screening) {\n        screeningManager.addScreening(movie, screening);\n    }\n    // Books a ticket for a specific seat at a screening\npublic void bookTicket(Screening screening, Seat seat) {\n        BigDecimal\nprice\n= seat.getPricingStrategy().getPrice();\n        Ticket\nticket\n=\nnew Ticket(screening, seat, price);\n        screeningManager.addTicket(screening, ticket);\n    }\n    // Returns all screenings for a specific movie\npublic List<Screening> getScreeningsForMovie(Movie movie) {\n        return screeningManager.getScreeningsForMovie(movie);\n    }\n    // Returns all available seats for a screening\npublic List<Seat> getAvailableSeats(Screening screening) {\n        return screeningManager.getAvailableSeats(screening);\n    }\n    // Returns the number of tickets sold for a screening\npublic int getTicketCount(Screening screening) {\n        return screeningManager.getTicketsForScreening(screening).size();\n    }\n    // Returns\
    \ the list of tickets for a screening\npublic List<Ticket> getTicketsForScreening(Screening screening) {\n        return screeningManager.getTicketsForScreening(screening);\n    } // getter and setter methods are omitted for brevity\n}\n\npublic class SeatLockManager {\n    private final Map<String, SeatLock> lockedSeats = new ConcurrentHashMap<>();\n    private final Duration lockDuration;\n    public SeatLockManager(Duration lockDuration) {\n        this.lockDuration = lockDuration;\n    }\n    public synchronized boolean lockSeat(Screening screening, Seat seat, String userId) {\n        String\nlockKey\n= generateLockKey(screening, seat);\n        // Clean up lock if expired (on-demand cleanup when another process attempts to lock)\n        cleanupLockIfExpired(lockKey);\n        // Check if a seat is already locked\nif (isLocked(screening, seat)) {\n            return false;\n        }\n        // Create a new lock with expiration time\nSeatLock\nlock\n=\nnew SeatLock(userId, LocalDateTime.now().plus(lockDuration));\n\
    \        lockedSeats.put(lockKey, lock);\n        return true;\n    }\n    public synchronized boolean isLocked(Screening screening, Seat seat) {\n        String\nlockKey\n= generateLockKey(screening, seat);\n        // Clean up lock if expired (on-demand cleanup)\n        cleanupLockIfExpired(lockKey);\n        // If we reach here, either no lock exists or it's valid\nreturn lockedSeats.containsKey(lockKey);\n    }\n    private void cleanupLockIfExpired(String lockKey) {\n        SeatLock\nlock\n= lockedSeats.get(lockKey);\n        if (lock != null && lock.isExpired()) {\n            lockedSeats.remove(lockKey);\n        }\n    }\n    private String generateLockKey(Screening screening, Seat seat) {\n        return screening.getId() + \"-\" + seat.getSeatNumber();\n    }\n    // SeatLock inner class private static class SeatLock {\n        private final String userId;\n        private final LocalDateTime expirationTime;\n        public SeatLock(String userId, LocalDateTime expirationTime)\
    \ {\n            this.userId = userId;\n            this.expirationTime = expirationTime;\n        }\n        public boolean isExpired() {\n            return LocalDateTime.now().isAfter(expirationTime);\n        }\n        public String getUserId() {\n            return userId;\n        }\n    }\n}\n\n// Simplified optimistic locking in ScreeningManager\npublic synchronized Ticket bookSeatOptimistically(Screening screening, Seat seat) {\n    // First check if a seat is available (optimistic)\nif (isSeatBooked(screening, seat)) {\n        throw new IllegalStateException(\"Seat is already booked\");\n    }\n    // Create ticket - at this point, we're optimistically assuming\n// the seat is still available\nBigDecimal\nprice\n= seat.getPricingStrategy().getPrice();\n    Ticket\nticket\n=\nnew Ticket(screening, seat, price);\n    // Add to booking system - this effectively \"reserves\" the seat\n    ticketsByScreening.computeIfAbsent(screening, k -> new ArrayList<>()).add(ticket);\n   \
    \ return ticket;\n}\n// Helper method to check if a seat is already booked\nprivate boolean isSeatBooked(Screening screening, Seat seat) {\n    List<Ticket> tickets = getTicketsForScreening(screening);\n    return tickets.stream().anyMatch(ticket -> ticket.getSeat().equals(seat));\n}"
- approachId: pessimistic-seat-locking
  label: Alternate — Pessimistic Seat Locking & Tiered Pricing
  approachClass: ALTERNATE
  kind: CODE
  summary: A concurrency-focused reservation system using granular seat locking. Seats are locked atomically during checkout to prevent double-booking, and pricing is calculated using a Strategy pattern supporting matinee, weekend, and VIP seat surcharges.
  keyIdea: Utilize explicit thread-safe seat monitors with timeout leases and dynamic tiered pricing strategies.
  timeComplexity: O(K)
  spaceComplexity: O(S)
  tradeoffs:
  - Zero possibility of double-booking under extreme concurrent flash sales
  - Contention on popular seat rows requires fine-grained lock management
  whenToUse: High-concurrency ticket release platforms where inventory consistency is critical.
  code: "// Alternate Approach: Pessimistic Seat Locking & Tiered Pricing\nimport java.util.*;\nimport java.util.concurrent.ConcurrentHashMap;\nimport java.util.concurrent.locks.ReentrantLock;\n\nenum SeatTier { STANDARD, PREMIUM, VIP }\nenum BookingStatus { AVAILABLE, LOCKED, CONFIRMED }\n\nclass Seat {\n    final String seatId;\n    final SeatTier tier;\n    final ReentrantLock lock = new ReentrantLock();\n    BookingStatus status = BookingStatus.AVAILABLE;\n    long lockExpiresAt = 0;\n\n    public Seat(String seatId, SeatTier tier) {\n        this.seatId = seatId;\n        this.tier = tier;\n    }\n}\n\nclass TieredPricingCalculator {\n    public double calculatePrice(Seat seat, boolean isWeekend) {\n        double base = switch (seat.tier) {\n            case STANDARD -> 12.0;\n            case PREMIUM -> 16.0;\n            case VIP -> 22.0;\n        };\n        return isWeekend ? base * 1.25 : base;\n    }\n}\n\nclass PessimisticBookingManager {\n    private final Map<String, Seat>\
    \ seats = new ConcurrentHashMap<>();\n    private final TieredPricingCalculator pricing = new TieredPricingCalculator();\n\n    public void addSeat(String seatId, SeatTier tier) {\n        seats.put(seatId, new Seat(seatId, tier));\n    }\n\n    public boolean reserveSeats(List<String> seatIds, String userId, long timeoutMs) {\n        List<Seat> acquiredSeats = new ArrayList<>();\n        // Sort seat IDs to prevent deadlock across concurrent multi-seat requests\n        List<String> sortedIds = new ArrayList<>(seatIds);\n        Collections.sort(sortedIds);\n\n        try {\n            for (String id : sortedIds) {\n                Seat seat = seats.get(id);\n                if (seat == null) return false;\n                seat.lock.lock();\n                acquiredSeats.add(seat);\n\n                long now = System.currentTimeMillis();\n                if (seat.status == BookingStatus.CONFIRMED ||\n                   (seat.status == BookingStatus.LOCKED && seat.lockExpiresAt >\
    \ now)) {\n                    return false; // Seat unavailable\n                }\n            }\n\n            // All locks acquired successfully\n            long expiresAt = System.currentTimeMillis() + timeoutMs;\n            for (Seat seat : acquiredSeats) {\n                seat.status = BookingStatus.LOCKED;\n                seat.lockExpiresAt = expiresAt;\n            }\n            return true;\n        } finally {\n            for (Seat seat : acquiredSeats) {\n                seat.lock.unlock();\n            }\n        }\n    }\n\n    public boolean confirmBooking(List<String> seatIds) {\n        for (String id : seatIds) {\n            Seat seat = seats.get(id);\n            if (seat == null) return false;\n            seat.lock.lock();\n            try {\n                if (seat.status != BookingStatus.LOCKED) return false;\n                seat.status = BookingStatus.CONFIRMED;\n            } finally {\n                seat.lock.unlock();\n            }\n        }\n\
    \        return true;\n    }\n}\n"
---

### Problem Statement: Design a Movie Ticket Booking System

Design an online Movie Ticket Booking platform (e.g. BookMyShow / Fandango) managing theaters, halls, movies, shows, seat reservations with hold timeouts, and transactional payments.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Movie Ticket Booking System.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage State Pattern (Seat State Transitions), Strategy Pattern (Pricing & Discounts), Facade Pattern (Booking Engine).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
