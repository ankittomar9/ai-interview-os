---
slug: lld-movie-ticket-booking
title: Design a Movie Ticket Booking System
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
- booking-system
buildProfile: judge0
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
starterCode: "public class Movie {\n    private final String title;\n    private final String genre;\n    private final int\
  \ durationInMinutes;\n    public Movie(String title, String genre, int durationInMinutes) {\n        this.title = title;\n\
  \        this.genre = genre;\n        this.durationInMinutes = durationInMinutes;\n    }\n    public Duration getDuration()\
  \ {\n        return Duration.ofMinutes(durationInMinutes);\n    }\n    // getter methods are omitted for brevity\n}\n\n\
  public class Cinema {\n    private final String name;\n    private final String location;\n    private final List<Room>\
  \ rooms;\n    public Cinema(String name, String location) {\n        this.name = name;\n        this.location = location;\n\
  \        this.rooms = new ArrayList<>();\n    }\n    public void addRoom(Room room) {\n        rooms.add(room);\n    }\n\
  \    // getter and setter methods are omitted for brevity\n}\n\npublic class Room {\n    private final String roomNumber;\n\
  \    private final Layout layout;\n    public Room(String roomNumber, Layout layout) {\n        this.roomNumber = roomNumber;\n\
  \        this.layout = layout;\n    }\n    // getter and setter methods are omitted for brevity\n}"
solutionCode: "public class Movie {\n    private final String title;\n    private final String genre;\n    private final int\
  \ durationInMinutes;\n    public Movie(String title, String genre, int durationInMinutes) {\n        this.title = title;\n\
  \        this.genre = genre;\n        this.durationInMinutes = durationInMinutes;\n    }\n    public Duration getDuration()\
  \ {\n        return Duration.ofMinutes(durationInMinutes);\n    }\n    // getter methods are omitted for brevity\n}\n\n\
  public class Cinema {\n    private final String name;\n    private final String location;\n    private final List<Room>\
  \ rooms;\n    public Cinema(String name, String location) {\n        this.name = name;\n        this.location = location;\n\
  \        this.rooms = new ArrayList<>();\n    }\n    public void addRoom(Room room) {\n        rooms.add(room);\n    }\n\
  \    // getter and setter methods are omitted for brevity\n}\n\npublic class Room {\n    private final String roomNumber;\n\
  \    private final Layout layout;\n    public Room(String roomNumber, Layout layout) {\n        this.roomNumber = roomNumber;\n\
  \        this.layout = layout;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\n// Represents the\
  \ seating layout of a cinema room.\npublic class Layout {\n    private final int rows;\n    private final int columns;\n\
  \    // Maps seat numbers (e.g., \"0-0\") to Seat objects for direct access\nprivate final Map<String, Seat> seatsByNumber;\n\
  \    // Nested map for position-based access (row \u2192 column \u2192 seat)\nprivate final Map<Integer, Map<Integer, Seat>>\
  \ seatsByPosition;\n    public Layout(int rows, int columns) {\n        this.rows = rows;\n        this.columns = columns;\n\
  \        this.seatsByNumber = new HashMap<>();\n        this.seatsByPosition = new HashMap<>();\n        initializeLayout();\n\
  \    }\n    // Creates seats for all positions with default null pricing\nprivate void initializeLayout() {\n        for\
  \ (int i\n=\n0; i < rows; i++) {\n            for (int j\n=\n0; j < columns; j++) {\n                String\nseatNumber\n\
  = i + \"-\" + j;\n                addSeat(seatNumber, i, j, new Seat(seatNumber, null));\n            }\n        }\n   \
  \ }\n    public void addSeat(String seatNumber, int row, int column, Seat seat) {\n        // Store seat in number-based\
  \ lookup map\n        seatsByNumber.put(seatNumber, seat);\n        // Store seat in position-based lookup map\n       \
  \ seatsByPosition.computeIfAbsent(row, k -> new HashMap<>()).put(column, seat);\n    }\n    public Seat getSeatByNumber(String\
  \ seatNumber) {\n        return seatsByNumber.get(seatNumber);\n    }\n    // Gets a seat by its row and column position\n\
  public Seat getSeatByPosition(int row, int column) {\n        Map<Integer, Seat> rowSeats = seatsByPosition.get(row);\n\
  \        return (rowSeats != null) ? rowSeats.get(column) : null;\n    }\n    public List<Seat> getAllSeats() {\n      \
  \  return List.copyOf(seatsByNumber.values());\n    }\n}\n\npublic class Seat {\n    private final String seatNumber;\n\
  \    private PricingStrategy pricingStrategy;\n    public Seat(String seatNumber, PricingStrategy pricingStrategy) {\n \
  \       this.seatNumber = seatNumber;\n        this.pricingStrategy = pricingStrategy;\n    }\n    // getter and setter\
  \ methods are omitted for brevity\n}\n\npublic interface PricingStrategy {\n    BigDecimal getPrice();\n}\npublic class\
  \ NormalRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public NormalRate(BigDecimal price)\
  \ {\n        this.price = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n    }\n\
  }\npublic class PremiumRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public PremiumRate(BigDecimal\
  \ price) {\n        this.price = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n\
  \    }\n}\npublic class VIPRate\nimplements PricingStrategy {\n    private final BigDecimal price;\n    public VIPRate(BigDecimal\
  \ price) {\n        this.price = price;\n    }\n    @Override\n    public BigDecimal getPrice() {\n        return price;\n\
  \    }\n}\n\n// Represents a scheduled screening of a movie in a specific cinema room.\npublic class Screening {\n    private\
  \ final Movie movie;\n    private final Room room;\n    private final LocalDateTime startTime;\n    private final LocalDateTime\
  \ endTime;\n    public Screening(Movie movie, Room room, LocalDateTime startTime, LocalDateTime endTime) {\n        this.movie\
  \ = movie;\n        this.room = room;\n        this.startTime = startTime;\n        this.endTime = endTime;\n    }\n   \
  \ public Duration getDuration() {\n        return Duration.between(startTime, endTime);\n    } // getter and setter methods\
  \ are omitted for brevity\n}\n\npublic class Ticket {\n    private final Screening screening;\n    private final Seat seat;\n\
  \    private final BigDecimal price;\n    public Ticket(Screening screening, Seat seat, BigDecimal price) {\n        this.screening\
  \ = screening;\n        this.seat = seat;\n        this.price = price;\n    }\n    // getter and setter methods are omitted\
  \ for brevity\n}\n\npublic class Order {\n    private final List<Ticket> tickets;\n    private final LocalDateTime orderDate;\n\
  \    public Order(LocalDateTime orderDate) {\n        this.tickets = new ArrayList<>();\n        this.orderDate = orderDate;\n\
  \    }\n    public void addTicket(Ticket ticket) {\n        tickets.add(ticket);\n    }\n    // Calculates the total price\
  \ of all tickets in the order\npublic BigDecimal calculateTotalPrice() {\n        return tickets.stream().map(Ticket::getPrice).reduce(BigDecimal.ZERO,\
  \ BigDecimal::add);\n    }\n    // getter and setter methods are omitted for brevity\n}\n\n// Manages the relationships\
  \ between movies, screenings, and tickets in the booking system\npublic class ScreeningManager {\n    // Maps movies to\
  \ their scheduled screenings\nprivate final Map<Movie, List<Screening>> screeningsByMovie;\n    // Maps screenings to tickets\
  \ sold for that screening\nprivate final Map<Screening, List<Ticket>> ticketsByScreening;\n    public ScreeningManager()\
  \ {\n        this.screeningsByMovie = new HashMap<>();\n        this.ticketsByScreening = new HashMap<>();\n    }\n    public\
  \ void addScreening(Movie movie, Screening screening) {\n        screeningsByMovie.computeIfAbsent(movie, k -> new ArrayList<>()).add(screening);\n\
  \    }\n    // Returns all screenings for a specific movie\npublic List<Screening> getScreeningsForMovie(Movie movie) {\n\
  \        return screeningsByMovie.getOrDefault(movie, new ArrayList<>());\n    }\n    public void addTicket(Screening screening,\
  \ Ticket ticket) {\n        ticketsByScreening.computeIfAbsent(screening, k -> new ArrayList<>()).add(ticket);\n    }\n\
  \    // Returns all tickets sold for a specific screening\npublic List<Ticket> getTicketsForScreening(Screening screening)\
  \ {\n        return ticketsByScreening.getOrDefault(screening, new ArrayList<>());\n    }\n    // Calculates which seats\
  \ are still available for a screening\npublic List<Seat> getAvailableSeats(Screening screening) {\n        List<Seat> allSeats\
  \ = screening.getRoom().getLayout().getAllSeats();\n        List<Ticket> bookedTickets = getTicketsForScreening(screening);\n\
  \        List<Seat> availableSeats = new ArrayList<>(allSeats);\n        for (Ticket ticket : bookedTickets) {\n       \
  \     availableSeats.remove(ticket.getSeat());\n        }\n        return availableSeats;\n    }\n}\n\n// Manages the complete\
  \ movie booking system operations\npublic class MovieBookingSystem {\n    private final List<Movie> movies;\n    private\
  \ final List<Cinema> cinemas;\n    private final ScreeningManager screeningManager;\n    public MovieBookingSystem() {\n\
  \        this.movies = new ArrayList<>();\n        this.cinemas = new ArrayList<>();\n        this.screeningManager = new\
  \ ScreeningManager();\n    }\n    public void addMovie(Movie movie) {\n        movies.add(movie);\n    }\n    public void\
  \ addCinema(Cinema cinema) {\n        cinemas.add(cinema);\n    }\n    public void addScreening(Movie movie, Screening screening)\
  \ {\n        screeningManager.addScreening(movie, screening);\n    }\n    // Books a ticket for a specific seat at a screening\n\
  public void bookTicket(Screening screening, Seat seat) {\n        BigDecimal\nprice\n= seat.getPricingStrategy().getPrice();\n\
  \        Ticket\nticket\n=\nnew Ticket(screening, seat, price);\n        screeningManager.addTicket(screening, ticket);\n\
  \    }\n    // Returns all screenings for a specific movie\npublic List<Screening> getScreeningsForMovie(Movie movie) {\n\
  \        return screeningManager.getScreeningsForMovie(movie);\n    }\n    // Returns all available seats for a screening\n\
  public List<Seat> getAvailableSeats(Screening screening) {\n        return screeningManager.getAvailableSeats(screening);\n\
  \    }\n    // Returns the number of tickets sold for a screening\npublic int getTicketCount(Screening screening) {\n  \
  \      return screeningManager.getTicketsForScreening(screening).size();\n    }\n    // Returns the list of tickets for\
  \ a screening\npublic List<Ticket> getTicketsForScreening(Screening screening) {\n        return screeningManager.getTicketsForScreening(screening);\n\
  \    } // getter and setter methods are omitted for brevity\n}\n\npublic class SeatLockManager {\n    private final Map<String,\
  \ SeatLock> lockedSeats = new ConcurrentHashMap<>();\n    private final Duration lockDuration;\n    public SeatLockManager(Duration\
  \ lockDuration) {\n        this.lockDuration = lockDuration;\n    }\n    public synchronized boolean lockSeat(Screening\
  \ screening, Seat seat, String userId) {\n        String\nlockKey\n= generateLockKey(screening, seat);\n        // Clean\
  \ up lock if expired (on-demand cleanup when another process attempts to lock)\n        cleanupLockIfExpired(lockKey);\n\
  \        // Check if a seat is already locked\nif (isLocked(screening, seat)) {\n            return false;\n        }\n\
  \        // Create a new lock with expiration time\nSeatLock\nlock\n=\nnew SeatLock(userId, LocalDateTime.now().plus(lockDuration));\n\
  \        lockedSeats.put(lockKey, lock);\n        return true;\n    }\n    public synchronized boolean isLocked(Screening\
  \ screening, Seat seat) {\n        String\nlockKey\n= generateLockKey(screening, seat);\n        // Clean up lock if expired\
  \ (on-demand cleanup)\n        cleanupLockIfExpired(lockKey);\n        // If we reach here, either no lock exists or it's\
  \ valid\nreturn lockedSeats.containsKey(lockKey);\n    }\n    private void cleanupLockIfExpired(String lockKey) {\n    \
  \    SeatLock\nlock\n= lockedSeats.get(lockKey);\n        if (lock != null && lock.isExpired()) {\n            lockedSeats.remove(lockKey);\n\
  \        }\n    }\n    private String generateLockKey(Screening screening, Seat seat) {\n        return screening.getId()\
  \ + \"-\" + seat.getSeatNumber();\n    }\n    // SeatLock inner class private static class SeatLock {\n        private final\
  \ String userId;\n        private final LocalDateTime expirationTime;\n        public SeatLock(String userId, LocalDateTime\
  \ expirationTime) {\n            this.userId = userId;\n            this.expirationTime = expirationTime;\n        }\n \
  \       public boolean isExpired() {\n            return LocalDateTime.now().isAfter(expirationTime);\n        }\n     \
  \   public String getUserId() {\n            return userId;\n        }\n    }\n}\n\n// Simplified optimistic locking in\
  \ ScreeningManager\npublic synchronized Ticket bookSeatOptimistically(Screening screening, Seat seat) {\n    // First check\
  \ if a seat is available (optimistic)\nif (isSeatBooked(screening, seat)) {\n        throw new IllegalStateException(\"\
  Seat is already booked\");\n    }\n    // Create ticket - at this point, we're optimistically assuming\n// the seat is still\
  \ available\nBigDecimal\nprice\n= seat.getPricingStrategy().getPrice();\n    Ticket\nticket\n=\nnew Ticket(screening, seat,\
  \ price);\n    // Add to booking system - this effectively \"reserves\" the seat\n    ticketsByScreening.computeIfAbsent(screening,\
  \ k -> new ArrayList<>()).add(ticket);\n    return ticket;\n}\n// Helper method to check if a seat is already booked\nprivate\
  \ boolean isSeatBooked(Screening screening, Seat seat) {\n    List<Ticket> tickets = getTicketsForScreening(screening);\n\
  \    return tickets.stream().anyMatch(ticket -> ticket.getSeat().equals(seat));\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Movie Ticket Booking System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (Seat State Transitions), Strategy Pattern (Pricing & Discounts), Facade Pattern (Booking Engine)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
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
