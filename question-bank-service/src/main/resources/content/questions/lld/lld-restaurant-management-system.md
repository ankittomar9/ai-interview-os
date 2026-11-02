---
slug: lld-restaurant-management-system
title: Design a Restaurant Management System
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
- observer-pattern
- strategy-pattern
- restaurant
buildProfile: maven-workspace
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the Observer Pattern to notify Kitchen display stations and Waitstaff when an order is placed, prepared, or served.
- Model tables with state (Vacant, Reserved, Occupied, CleanUpNeeded) and capacity for party seating.
- Use the Strategy Pattern for bill settlement (split equally, split by item, service charge, and tip calculations).
coaching:
  presentationTips:
  - 'Trace the end-to-end customer journey: Table Reservation -> Seated -> Order Placement -> Kitchen Cooking -> Food Delivery -> Billing.'
  - Demonstrate how the Menu entity supports modifiers (e.g. extra cheese, gluten-free) using the Decorator or Composite pattern.
  - Discuss concurrency when multiple waitstaff attempt to assign walk-in parties to tables.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>restaurant-management</artifactId>
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
    # Restaurant Management System

    ## Overview
    Implement an object-oriented Restaurant Management System managing table reservations, party seating, menu orders, kitchen command workflows, and billing.

    ## Key Components
    - `com.interviewos.restaurant.model.Table`: Table capacity, time-based reservations, and active order ledger.
    - `com.interviewos.restaurant.service.ReservationManager`: Slot search and table assignment.
    - `com.interviewos.restaurant.service.Restaurant`: Facade coordinating reservations, dining orders, and bill calculation.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/restaurant/service/Restaurant.java`
    2. `src/main/java/com/interviewos/restaurant/service/ReservationManager.java`
    3. `src/main/java/com/interviewos/restaurant/model/Table.java`
  src/main/java/com/interviewos/restaurant/model/Category.java: |
    package com.interviewos.restaurant.model;

    public enum Category {
        MAIN,
        APPETIZER,
        DESSERT
    }
  src/main/java/com/interviewos/restaurant/model/MenuItem.java: |
    package com.interviewos.restaurant.model;

    import java.math.BigDecimal;

    public class MenuItem {
        private final String name;
        private final String description;
        private final BigDecimal price;
        private final Category category;

        public MenuItem(String name, String description, BigDecimal price, Category category) {
            this.name = name;
            this.description = description;
            this.price = price;
            this.category = category;
        }

        public String getName() { return name; }
        public String getDescription() { return description; }
        public BigDecimal getPrice() { return price; }
        public Category getCategory() { return category; }
    }
  src/main/java/com/interviewos/restaurant/model/Menu.java: |
    package com.interviewos.restaurant.model;

    import java.util.Collections;
    import java.util.HashMap;
    import java.util.Map;

    public class Menu {
        private final Map<String, MenuItem> items = new HashMap<>();

        public void addItem(MenuItem item) {
            if (item != null) {
                items.put(item.getName(), item);
            }
        }

        public MenuItem getItem(String name) {
            return items.get(name);
        }

        public Map<String, MenuItem> getItems() {
            return Collections.unmodifiableMap(items);
        }
    }
  src/main/java/com/interviewos/restaurant/model/OrderStatus.java: |
    package com.interviewos.restaurant.model;

    public enum OrderStatus {
        PENDING,
        SENT_TO_KITCHEN,
        DELIVERED,
        CANCELED
    }
  src/main/java/com/interviewos/restaurant/model/OrderItem.java: |
    package com.interviewos.restaurant.model;

    public class OrderItem {
        private final MenuItem item;
        private OrderStatus status = OrderStatus.PENDING;

        public OrderItem(MenuItem item) {
            this.item = item;
        }

        public void sendToKitchen() {
            if (status == OrderStatus.PENDING) status = OrderStatus.SENT_TO_KITCHEN;
        }

        public void deliver() {
            if (status == OrderStatus.SENT_TO_KITCHEN) status = OrderStatus.DELIVERED;
        }

        public void cancel() {
            status = OrderStatus.CANCELED;
        }

        public MenuItem getItem() { return item; }
        public OrderStatus getStatus() { return status; }
    }
  src/main/java/com/interviewos/restaurant/model/Reservation.java: |
    package com.interviewos.restaurant.model;

    import java.time.LocalDateTime;

    public class Reservation {
        private final String partyName;
        private final int partySize;
        private final LocalDateTime time;
        private final Table assignedTable;

        public Reservation(String partyName, int partySize, LocalDateTime time, Table assignedTable) {
            this.partyName = partyName;
            this.partySize = partySize;
            this.time = time;
            this.assignedTable = assignedTable;
        }

        public String getPartyName() { return partyName; }
        public int getPartySize() { return partySize; }
        public LocalDateTime getTime() { return time; }
        public Table getAssignedTable() { return assignedTable; }
    }
  src/main/java/com/interviewos/restaurant/model/Table.java: |
    package com.interviewos.restaurant.model;

    import java.math.BigDecimal;
    import java.time.LocalDateTime;
    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;

    public class Table {
        private final int tableId;
        private final int capacity;
        private final Map<LocalDateTime, Reservation> reservations = new ConcurrentHashMap<>();
        private final List<OrderItem> orderedItems = new ArrayList<>();

        public Table(int tableId, int capacity) {
            this.tableId = tableId;
            this.capacity = capacity;
        }

        public synchronized void addOrder(MenuItem item) {
            // TODO: Record order item
            throw new UnsupportedOperationException("TODO: Implement addOrder");
        }

        public synchronized BigDecimal calculateBillAmount() {
            // TODO: Sum price of non-canceled order items
            throw new UnsupportedOperationException("TODO: Implement calculateBillAmount");
        }

        public synchronized boolean isAvailableAt(LocalDateTime time) {
            return !reservations.containsKey(time);
        }

        public synchronized void addReservation(Reservation reservation) {
            reservations.put(reservation.getTime(), reservation);
        }

        public synchronized void removeReservation(LocalDateTime time) {
            reservations.remove(time);
        }

        public int getTableId() { return tableId; }
        public int getCapacity() { return capacity; }
        public List<OrderItem> getOrderedItems() { return Collections.unmodifiableList(orderedItems); }
    }
  src/main/java/com/interviewos/restaurant/model/Layout.java: |
    package com.interviewos.restaurant.model;

    import java.time.LocalDateTime;
    import java.util.*;

    public class Layout {
        private final List<Table> tables = new ArrayList<>();

        public Layout(List<Integer> capacities) {
            for (int i = 0; i < capacities.size(); i++) {
                tables.add(new Table(i + 1, capacities.get(i)));
            }
        }

        public Table findAvailableTable(int partySize, LocalDateTime time) {
            Table best = null;
            for (Table t : tables) {
                if (t.getCapacity() >= partySize && t.isAvailableAt(time)) {
                    if (best == null || t.getCapacity() < best.getCapacity()) {
                        best = t;
                    }
                }
            }
            return best;
        }

        public List<Table> getTables() { return tables; }
    }
  src/main/java/com/interviewos/restaurant/service/ReservationManager.java: |
    package com.interviewos.restaurant.service;

    import com.interviewos.restaurant.model.Layout;
    import com.interviewos.restaurant.model.Reservation;
    import com.interviewos.restaurant.model.Table;
    import java.time.LocalDateTime;
    import java.util.ArrayList;
    import java.util.List;

    public class ReservationManager {
        private final Layout layout;
        private final List<Reservation> reservations = new ArrayList<>();

        public ReservationManager(Layout layout) {
            this.layout = layout;
        }

        public synchronized Reservation createReservation(String partyName, int partySize, LocalDateTime time) {
            // TODO: Find table via layout, create reservation, assign to table, record in list
            throw new UnsupportedOperationException("TODO: Implement createReservation");
        }

        public synchronized boolean cancelReservation(String partyName, LocalDateTime time) {
            // TODO: Cancel and remove reservation from table and list
            throw new UnsupportedOperationException("TODO: Implement cancelReservation");
        }

        public Layout getLayout() { return layout; }
        public List<Reservation> getReservations() { return reservations; }
    }
  src/main/java/com/interviewos/restaurant/service/Restaurant.java: |
    package com.interviewos.restaurant.service;

    import com.interviewos.restaurant.model.*;
    import java.math.BigDecimal;
    import java.time.LocalDateTime;

    public class Restaurant {
        private final String name;
        private final Menu menu;
        private final Layout layout;
        private final ReservationManager reservationManager;

        public Restaurant(String name, Menu menu, Layout layout) {
            this.name = name;
            this.menu = menu;
            this.layout = layout;
            this.reservationManager = new ReservationManager(layout);
        }

        public Reservation reserveTable(String partyName, int partySize, LocalDateTime time) {
            // TODO: Delegate to reservationManager
            throw new UnsupportedOperationException("TODO: Implement reserveTable");
        }

        public void orderItem(Table table, MenuItem item) {
            // TODO: Delegate to table
            throw new UnsupportedOperationException("TODO: Implement orderItem");
        }

        public BigDecimal calculateBill(Table table) {
            // TODO: Delegate to table
            throw new UnsupportedOperationException("TODO: Implement calculateBill");
        }

        public String getName() { return name; }
        public Menu getMenu() { return menu; }
        public Layout getLayout() { return layout; }
        public ReservationManager getReservationManager() { return reservationManager; }
    }
editablePaths:
- src/main/java/com/interviewos/restaurant/service/Restaurant.java
- src/main/java/com/interviewos/restaurant/service/ReservationManager.java
- src/main/java/com/interviewos/restaurant/model/Table.java
hiddenTestFiles:
  src/test/java/com/interviewos/restaurant/TableReservationTest.java: |
    package com.interviewos.restaurant;

    import com.interviewos.restaurant.model.*;
    import com.interviewos.restaurant.service.ReservationManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.time.LocalDateTime;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class TableReservationTest {
        @Test
        @DisplayName("Reservation allocates best-fit table and rejects when party exceeds capacity")
        void testReservationAllocation() {
            Layout layout = new Layout(List.of(2, 4, 8));
            ReservationManager manager = new ReservationManager(layout);
            LocalDateTime time = LocalDateTime.now().plusHours(1);

            Reservation r1 = manager.createReservation("Smith", 3, time);
            assertNotNull(r1);
            assertEquals(4, r1.getAssignedTable().getCapacity(), "Party of 3 should get table with capacity 4");

            // Party of 10 exceeds all tables
            Reservation r2 = manager.createReservation("LargeParty", 10, time);
            assertNull(r2);
        }
    }
  src/test/java/com/interviewos/restaurant/OrderManagementTest.java: |
    package com.interviewos.restaurant;

    import com.interviewos.restaurant.model.*;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class OrderManagementTest {
        @Test
        @DisplayName("Table accumulates orders and calculates correct total sum")
        void testOrderBilling() {
            Table table = new Table(1, 4);
            MenuItem burger = new MenuItem("Burger", "Beef burger", new BigDecimal("15.50"), Category.MAIN);
            MenuItem fries = new MenuItem("Fries", "Crispy fries", new BigDecimal("4.50"), Category.APPETIZER);

            table.addOrder(burger);
            table.addOrder(fries);

            assertEquals(new BigDecimal("20.00"), table.calculateBillAmount());
        }
    }
  src/test/java/com/interviewos/restaurant/RestaurantLifecycleTest.java: |
    package com.interviewos.restaurant;

    import com.interviewos.restaurant.model.*;
    import com.interviewos.restaurant.service.Restaurant;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.time.LocalDateTime;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class RestaurantLifecycleTest {
        @Test
        @DisplayName("Full dining flow: reserve -> order -> bill calculation")
        void testFullDiningFlow() {
            Menu menu = new Menu();
            MenuItem steak = new MenuItem("Steak", "Sirloin", new BigDecimal("30.00"), Category.MAIN);
            menu.addItem(steak);
            Layout layout = new Layout(List.of(2, 4));
            Restaurant restaurant = new Restaurant("Bistro", menu, layout);

            LocalDateTime now = LocalDateTime.now();
            Reservation res = restaurant.reserveTable("Miller", 2, now);
            assertNotNull(res);

            Table table = res.getAssignedTable();
            restaurant.orderItem(table, steak);

            BigDecimal bill = restaurant.calculateBill(table);
            assertEquals(new BigDecimal("30.00"), bill);
        }
    }

starterCode: "public class Menu {\n    private final Map<String, MenuItem> menuItems = new HashMap<>();\n    // Adds a new item to the menu\npublic void addItem(MenuItem item) {\n        menuItems.put(item.getName(), item);\n    }\n    public MenuItem getItem(String name) {\n        return menuItems.get(name);\n    }\n    public Map<String, MenuItem> getMenuItems() {\n        return Collections.unmodifiableMap(menuItems);\n    }\n}\n\n// Represents a single item available on the restaurant menu\npublic class MenuItem {\n    private final String name;\n    private final String description;\n    private final BigDecimal price;\n    private final Category category;\n    public MenuItem(String name, String description, BigDecimal price, Category category) {\n        this.name = name;\n        this.description = description;\n        this.price = price;\n        this.category = category;\n    }\n    // Enumeration of possible menu item categories\npublic enum Category {\n        MAIN,\n     \
  \   APPETIZER,\n        DESSERT\n    } // getter methods are omitted for brevity\n}\n\n// Represents a table in the restaurant with its properties and current state\npublic class Table {\n    // immutable properties\nprivate final int tableId;\n    private final int capacity;\n    // current state\nprivate final Map<LocalDateTime, Reservation> reservations = new HashMap<>();\n    private final Map<MenuItem, List<OrderItem>> orderedItems = new HashMap<>();\n    public Table(int tableId, int capacity) {\n        this.tableId = tableId;\n        this.capacity = capacity;\n    }\n    // Calculates the total bill amount for all ordered items at this table\npublic BigDecimal calculateBillAmount() {\n        return orderedItems.values().stream()\n                .flatMap(List::stream)\n                .map(OrderItem::getItem)\n                .map(MenuItem::getPrice)\n                .reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // Adds multiple orders of the same menu item to the table\n\
  public void addOrder(MenuItem item, int quantity) {\n        for (int i\n=\n0; i < quantity; i++) {\n            addOrder(item);\n        }\n    }\n    // Adds a single menu item to the table's order\npublic void addOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems == null) {\n            orderItems = new ArrayList<>();\n            orderedItems.put(item, orderItems);\n            orderItems.add(new OrderItem(item));\n        } else {\n            orderItems.add(new OrderItem(item));\n        }\n    }\n    // Removes a menu item from the table's order\npublic void removeOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems != null) {\n            orderItems.remove(0);\n            if (orderItems.isEmpty()) {\n                orderedItems.remove(item);\n            }\n        }\n    }\n    // Checks if the table is available at a specific time\npublic boolean isAvailableAt(LocalDateTime\
  \ reservationTime) {\n        return !reservations.containsKey(reservationTime);\n    }\n    // Adds a reservation to this table\npublic void addReservation(Reservation reservation) {\n        reservations.put(reservation.getTime(), reservation);\n    }\n    // Removes a reservation from this table for a specific time\npublic void removeReservation(LocalDateTime reservationTime) {\n        reservations.remove(reservationTime);\n    }\n    // getter methods are omitted for brevity\n}"
solutionCode: "public class Menu {\n    private final Map<String, MenuItem> menuItems = new HashMap<>();\n    // Adds a new item to the menu\npublic void addItem(MenuItem item) {\n        menuItems.put(item.getName(), item);\n    }\n    public MenuItem getItem(String name) {\n        return menuItems.get(name);\n    }\n    public Map<String, MenuItem> getMenuItems() {\n        return Collections.unmodifiableMap(menuItems);\n    }\n}\n\n// Represents a single item available on the restaurant menu\npublic class MenuItem {\n    private final String name;\n    private final String description;\n    private final BigDecimal price;\n    private final Category category;\n    public MenuItem(String name, String description, BigDecimal price, Category category) {\n        this.name = name;\n        this.description = description;\n        this.price = price;\n        this.category = category;\n    }\n    // Enumeration of possible menu item categories\npublic enum Category {\n        MAIN,\n    \
  \    APPETIZER,\n        DESSERT\n    } // getter methods are omitted for brevity\n}\n\n// Represents a table in the restaurant with its properties and current state\npublic class Table {\n    // immutable properties\nprivate final int tableId;\n    private final int capacity;\n    // current state\nprivate final Map<LocalDateTime, Reservation> reservations = new HashMap<>();\n    private final Map<MenuItem, List<OrderItem>> orderedItems = new HashMap<>();\n    public Table(int tableId, int capacity) {\n        this.tableId = tableId;\n        this.capacity = capacity;\n    }\n    // Calculates the total bill amount for all ordered items at this table\npublic BigDecimal calculateBillAmount() {\n        return orderedItems.values().stream()\n                .flatMap(List::stream)\n                .map(OrderItem::getItem)\n                .map(MenuItem::getPrice)\n                .reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // Adds multiple orders of the same menu item to the table\n\
  public void addOrder(MenuItem item, int quantity) {\n        for (int i\n=\n0; i < quantity; i++) {\n            addOrder(item);\n        }\n    }\n    // Adds a single menu item to the table's order\npublic void addOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems == null) {\n            orderItems = new ArrayList<>();\n            orderedItems.put(item, orderItems);\n            orderItems.add(new OrderItem(item));\n        } else {\n            orderItems.add(new OrderItem(item));\n        }\n    }\n    // Removes a menu item from the table's order\npublic void removeOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems != null) {\n            orderItems.remove(0);\n            if (orderItems.isEmpty()) {\n                orderedItems.remove(item);\n            }\n        }\n    }\n    // Checks if the table is available at a specific time\npublic boolean isAvailableAt(LocalDateTime\
  \ reservationTime) {\n        return !reservations.containsKey(reservationTime);\n    }\n    // Adds a reservation to this table\npublic void addReservation(Reservation reservation) {\n        reservations.put(reservation.getTime(), reservation);\n    }\n    // Removes a reservation from this table for a specific time\npublic void removeReservation(LocalDateTime reservationTime) {\n        reservations.remove(reservationTime);\n    }\n    // getter methods are omitted for brevity\n}\n\n// Manages the collection of tables in the restaurant and their arrangement\npublic class Layout {\n    private final Map<Integer, Table> tablesById = new HashMap<>();\n    // Groups tables by their capacity for efficient table assignment, sorted from smallest to\n// largest capacity\nprivate final SortedMap<Integer, Set<Table>> tablesByCapacity = new TreeMap<>();\n    public Layout(List<Integer> tableCapacities) {\n        for (int i\n=\n0; i < tableCapacities.size(); i++) {\n            int capacity\n\
  = tableCapacities.get(i);\n            Table\ntable\n=\nnew Table(i, capacity);\n            tablesById.put(i, table);\n            tablesByCapacity.computeIfAbsent(capacity, k -> new HashSet<>()).add(table);\n        }\n    }\n    // Finds the smallest available table that can accommodate a party of the given size at the\n// given time\npublic Table findAvailableTable(int partySize, LocalDateTime reservationTime) {\n        for (Set<Table> tables : tablesByCapacity.tailMap(partySize).values()) {\n            for (Table table : tables) {\n                if (table.isAvailableAt(reservationTime)) {\n                    return table;\n                }\n            }\n        }\n        return null;\n    }\n}\n\n// Represents a food item ordered by a customer with its current status in the order process\npublic class OrderItem {\n    private final MenuItem item;\n    private Status\nstatus\n= Status.PENDING;\n    public OrderItem(MenuItem item) {\n        this.item = item;\n    }\n    //\
  \ Updates the status to indicate the item has been sent to the kitchen\npublic void sendToKitchen() {\n        if (status == Status.PENDING) status = Status.SENT_TO_KITCHEN;\n    }\n    // Updates the status to indicate the item has been delivered to the customer\npublic void deliverToCustomer() {\n        if (status == Status.SENT_TO_KITCHEN) status = Status.DELIVERED;\n    }\n    // Updates the status to indicate the item has been canceled\npublic void cancel() {\n        if (status == Status.PENDING || status == Status.SENT_TO_KITCHEN) {\n            status = Status.CANCELED;\n        }\n    }\n    // getter methods are omitted for brevity\n}\n\n// Manages all reservations for the restaurant and handles table assignments\npublic class ReservationManager {\n    private final Layout layout;\n    private final Set<Reservation> reservations = new HashSet<>();\n    // Constructor that takes the restaurant's table layout\npublic ReservationManager(Layout layout) {\n        this.layout = layout;\n\
  \    }\n    // Finds potential time slots for a reservation within the given time range and party size\npublic LocalDateTime[] findAvailableTimeSlots(\n            LocalDateTime rangeStart, LocalDateTime rangeEnd, int partySize) {\n        // checking every hour in the time range\nLocalDateTime\ncurrent\n= rangeStart;\n        List<LocalDateTime> possibleReservations = new ArrayList<>();\n        while (!current.isAfter(rangeEnd)) {\n            Table\navailableTable\n= layout.findAvailableTable(partySize, current);\n            if (availableTable != null) {\n                possibleReservations.add(current);\n            }\n            current = current.plusHours(1);\n        }\n        return possibleReservations.toArray(new LocalDateTime[0]);\n    }\n    // Creates a reservation for a specific time, party size and name\npublic Reservation createReservation(\n            String partyName, int partySize, LocalDateTime desiredTime) {\n        desiredTime = desiredTime.truncatedTo(ChronoUnit.HOURS);\n\
  \        Table\ntable\n= layout.findAvailableTable(partySize, desiredTime);\n        Reservation\nreservation\n=\nnew Reservation(partyName, partySize, desiredTime, table);\n        table.addReservation(reservation);\n        reservations.add(reservation);\n        return reservation;\n    }\n    // Removes an existing reservation\npublic void removeReservation(\n            String partyName, int partySize, LocalDateTime reservationTime) {\n        // Find matching reservation before removing it\nfor (Reservation reservation : new HashSet<>(reservations)) {\n            if (reservation.getTime().equals(reservationTime)\n                    && reservation.getPartySize() == partySize\n                    && reservation.getPartyName().equals(partyName)) {\n                // Clear the reservation from the table first\nTable\ntable\n= reservation.getAssignedTable();\n                table.removeReservation(reservationTime);\n                // Then remove from the reservation collection\n\
  \                reservations.remove(reservation);\n                return;\n            }\n        }\n    }\n    // getter methods are omitted for brevity\n}\n\n// Represents a reservation made at the restaurant for a specific party, time and table\npublic class Reservation {\n    private final String partyName;\n    private final int partySize;\n    private final LocalDateTime time;\n    private final Table assignedTable;\n    public Reservation(\n            String partyName, int partySize, LocalDateTime time, Table assignedTable) {\n        this.partyName = partyName;\n        this.partySize = partySize;\n        this.time = time;\n        this.assignedTable = assignedTable;\n    }\n    // getter methods are omitted for brevity\n}\n\n// Main restaurant class that manages reservations, orders, and tables\npublic class Restaurant {\n    private final String name;\n    private final Menu menu;\n    private final Layout layout;\n    private final ReservationManager reservationManager;\n\
  \    public Restaurant(String name, Menu menu, Layout layout) {\n        this.name = name;\n        this.menu = menu;\n        this.layout = layout;\n        this.reservationManager = new ReservationManager(layout);\n    }\n    // Finds possible reservation times within a time range for a party of specified size\npublic LocalDateTime[] findAvailableTimeSlots(\n            LocalDateTime rangeStart, LocalDateTime rangeEnd, int partySize) {\n        return reservationManager.findAvailableTimeSlots(rangeStart, rangeEnd, partySize);\n    }\n    // Creates a reservation for a party at the specified time\npublic Reservation createScheduledReservation(\n            String partyName, int partySize, LocalDateTime time) {\n        return reservationManager.createReservation(partyName, partySize, time);\n    }\n    // Removes an existing reservation\npublic void removeReservation(\n            String partyName, int partySize, LocalDateTime reservationTime) {\n        reservationManager.removeReservation(partyName,\
  \ partySize, reservationTime);\n    }\n    // Creates a reservation for a party without prior reservation\npublic Reservation createWalkInReservation(String partyName, int partySize) {\n        return reservationManager.createReservation(partyName, partySize, LocalDateTime.now());\n    }\n    // Adds an item to a table's order\npublic void orderItem(Table table, MenuItem item) {\n        table.addOrder(item);\n    }\n    // Removes an item from a table's order\npublic void cancelItem(Table table, MenuItem item) {\n        table.removeOrder(item);\n    }\n    // Calculates the bill amount for a table\npublic BigDecimal calculateTableBill(Table table) {\n        return table.calculateBillAmount();\n    }\n    // getter methods are omitted for brevity\n}\n\npublic interface OrderCommand {\n    void execute();\n}\n\n// Command that handles sending order items to the Kitchen\npublic class SendToKitchenCommand\nimplements OrderCommand {\n    private final OrderItem orderItem;\n    public SendToKitchenCommand(OrderItem\
  \ orderItem) {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public void execute() {\n        orderItem.sendToKitchen();\n    }\n} // Command that handles delivery of order items\npublic class DeliverCommand\nimplements OrderCommand {\n    private final OrderItem orderItem;\n    public DeliverCommand(OrderItem orderItem) {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public void execute() {\n        orderItem.deliverToCustomer();\n    }\n} // Command that handles cancellations of order items\npublic class CancelCommand\nimplements OrderCommand {\n    private final OrderItem orderItem;\n    public CancelCommand(OrderItem orderItem) {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public void execute() {\n        orderItem.cancel();\n    }\n}\n\npublic class OrderManager {\n    private final List<OrderCommand> commandQueue = new ArrayList<>();\n    // Adds a command to the queue for later execution\npublic void addCommand(OrderCommand\
  \ command) {\n        commandQueue.add(command);\n    }\n    // Executes all commands in the queue and clears it\npublic void executeCommands() {\n        for (OrderCommand command : commandQueue) {\n            command.execute();\n        }\n        commandQueue.clear();\n    }\n}\n\npublic class Restaurant {\n    // ... fields unchanged ...\nprivate final OrderManager orderManager;\n    public Restaurant(String name, Menu menu, Layout layout) {\n        // ... fields unchanged ...\nthis.orderManager = new OrderManager();\n    }\n    // Adds an item to a table's order and sends it to the kitchen\npublic void orderItem(Table table, MenuItem item) {\n        table.addOrder(item);\n        // Get the last added order item\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty()) {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\nsendToKitchen\n=\nnew SendToKitchenCommand(lastOrder);\n\
  \            orderManager.addCommand(sendToKitchen);\n            orderManager.executeCommands();\n        }\n    }\n    // Removes an item from a table's order and cancels it\npublic void cancelItem(Table table, MenuItem item) {\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty()) {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\ncancelOrder\n=\nnew CancelCommand(lastOrder);\n            orderManager.addCommand(cancelOrder);\n            orderManager.executeCommands();\n            table.removeOrder(item);\n        }\n    }\n    // Delivers an item to the customer\npublic void deliverItem(Table table, MenuItem item) {\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty()) {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\ndeliverOrder\n\
  =\nnew DeliverCommand(lastOrder);\n            orderManager.addCommand(deliverOrder);\n            orderManager.executeCommands();\n        }\n    }\n    // ... other methods unchanged ...\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Restaurant Management System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Observer Pattern (Kitchen & Waiter Event Notifications), Strategy Pattern (Bill Splitting & Tip Calculation), State Pattern (Table State)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-restaurant-management-system
  label: Canonical — Design a Restaurant Management System
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
  code: "public class Menu {\n    private final Map<String, MenuItem> menuItems = new HashMap<>();\n    // Adds a new item to the menu\npublic void addItem(MenuItem item) {\n        menuItems.put(item.getName(), item);\n    }\n    public MenuItem getItem(String name) {\n        return menuItems.get(name);\n    }\n    public Map<String, MenuItem> getMenuItems() {\n        return Collections.unmodifiableMap(menuItems);\n    }\n}\n\n// Represents a single item available on the restaurant menu\npublic class MenuItem {\n    private final String name;\n    private final String description;\n    private final BigDecimal price;\n    private final Category category;\n    public MenuItem(String name, String description, BigDecimal price, Category category) {\n        this.name = name;\n        this.description = description;\n        this.price = price;\n        this.category = category;\n    }\n    // Enumeration of possible menu item categories\npublic enum Category {\n        MAIN,\n        APPETIZER,\n\
    \        DESSERT\n    } // getter methods are omitted for brevity\n}\n\n// Represents a table in the restaurant with its properties and current state\npublic class Table {\n    // immutable properties\nprivate final int tableId;\n    private final int capacity;\n    // current state\nprivate final Map<LocalDateTime, Reservation> reservations = new HashMap<>();\n    private final Map<MenuItem, List<OrderItem>> orderedItems = new HashMap<>();\n    public Table(int tableId, int capacity) {\n        this.tableId = tableId;\n        this.capacity = capacity;\n    }\n    // Calculates the total bill amount for all ordered items at this table\npublic BigDecimal calculateBillAmount() {\n        return orderedItems.values().stream()\n                .flatMap(List::stream)\n                .map(OrderItem::getItem)\n                .map(MenuItem::getPrice)\n                .reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // Adds multiple orders of the same menu item to the table\npublic void\
    \ addOrder(MenuItem item, int quantity) {\n        for (int i\n=\n0; i < quantity; i++) {\n            addOrder(item);\n        }\n    }\n    // Adds a single menu item to the table's order\npublic void addOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems == null) {\n            orderItems = new ArrayList<>();\n            orderedItems.put(item, orderItems);\n            orderItems.add(new OrderItem(item));\n        } else {\n            orderItems.add(new OrderItem(item));\n        }\n    }\n    // Removes a menu item from the table's order\npublic void removeOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems != null) {\n            orderItems.remove(0);\n            if (orderItems.isEmpty()) {\n                orderedItems.remove(item);\n            }\n        }\n    }\n    // Checks if the table is available at a specific time\npublic boolean isAvailableAt(LocalDateTime\
    \ reservationTime) {\n        return !reservations.containsKey(reservationTime);\n    }\n    // Adds a reservation to this table\npublic void addReservation(Reservation reservation) {\n        reservations.put(reservation.getTime(), reservation);\n    }\n    // Removes a reservation from this table for a specific time\npublic void removeReservation(LocalDateTime reservationTime) {\n        reservations.remove(reservationTime);\n    }\n    // getter methods are omitted for brevity\n}\n\n// Manages the collection of tables in the restaurant and their arrangement\npublic class Layout {\n    private final Map<Integer, Table> tablesById = new HashMap<>();\n    // Groups tables by their capacity for efficient table assignment, sorted from smallest to\n// largest capacity\nprivate final SortedMap<Integer, Set<Table>> tablesByCapacity = new TreeMap<>();\n    public Layout(List<Integer> tableCapacities) {\n        for (int i\n=\n0; i < tableCapacities.size(); i++) {\n            int capacity\n\
    = tableCapacities.get(i);\n            Table\ntable\n=\nnew Table(i, capacity);\n            tablesById.put(i, table);\n            tablesByCapacity.computeIfAbsent(capacity, k -> new HashSet<>()).add(table);\n        }\n    }\n    // Finds the smallest available table that can accommodate a party of the given size at the\n// given time\npublic Table findAvailableTable(int partySize, LocalDateTime reservationTime) {\n        for (Set<Table> tables : tablesByCapacity.tailMap(partySize).values()) {\n            for (Table table : tables) {\n                if (table.isAvailableAt(reservationTime)) {\n                    return table;\n                }\n            }\n        }\n        return null;\n    }\n}\n\n// Represents a food item ordered by a customer with its current status in the order process\npublic class OrderItem {\n    private final MenuItem item;\n    private Status\nstatus\n= Status.PENDING;\n    public OrderItem(MenuItem item) {\n        this.item = item;\n    }\n   \
    \ // Updates the status to indicate the item has been sent to the kitchen\npublic void sendToKitchen() {\n        if (status == Status.PENDING) status = Status.SENT_TO_KITCHEN;\n    }\n    // Updates the status to indicate the item has been delivered to the customer\npublic void deliverToCustomer() {\n        if (status == Status.SENT_TO_KITCHEN) status = Status.DELIVERED;\n    }\n    // Updates the status to indicate the item has been canceled\npublic void cancel() {\n        if (status == Status.PENDING || status == Status.SENT_TO_KITCHEN) {\n            status = Status.CANCELED;\n        }\n    }\n    // getter methods are omitted for brevity\n}\n\n// Manages all reservations for the restaurant and handles table assignments\npublic class ReservationManager {\n    private final Layout layout;\n    private final Set<Reservation> reservations = new HashSet<>();\n    // Constructor that takes the restaurant's table layout\npublic ReservationManager(Layout layout) {\n        this.layout\
    \ = layout;\n    }\n    // Finds potential time slots for a reservation within the given time range and party size\npublic LocalDateTime[] findAvailableTimeSlots(\n            LocalDateTime rangeStart, LocalDateTime rangeEnd, int partySize) {\n        // checking every hour in the time range\nLocalDateTime\ncurrent\n= rangeStart;\n        List<LocalDateTime> possibleReservations = new ArrayList<>();\n        while (!current.isAfter(rangeEnd)) {\n            Table\navailableTable\n= layout.findAvailableTable(partySize, current);\n            if (availableTable != null) {\n                possibleReservations.add(current);\n            }\n            current = current.plusHours(1);\n        }\n        return possibleReservations.toArray(new LocalDateTime[0]);\n    }\n    // Creates a reservation for a specific time, party size and name\npublic Reservation createReservation(\n            String partyName, int partySize, LocalDateTime desiredTime) {\n        desiredTime = desiredTime.truncatedTo(ChronoUnit.HOURS);\n\
    \        Table\ntable\n= layout.findAvailableTable(partySize, desiredTime);\n        Reservation\nreservation\n=\nnew Reservation(partyName, partySize, desiredTime, table);\n        table.addReservation(reservation);\n        reservations.add(reservation);\n        return reservation;\n    }\n    // Removes an existing reservation\npublic void removeReservation(\n            String partyName, int partySize, LocalDateTime reservationTime) {\n        // Find matching reservation before removing it\nfor (Reservation reservation : new HashSet<>(reservations)) {\n            if (reservation.getTime().equals(reservationTime)\n                    && reservation.getPartySize() == partySize\n                    && reservation.getPartyName().equals(partyName)) {\n                // Clear the reservation from the table first\nTable\ntable\n= reservation.getAssignedTable();\n                table.removeReservation(reservationTime);\n                // Then remove from the reservation collection\n\
    \                reservations.remove(reservation);\n                return;\n            }\n        }\n    }\n    // getter methods are omitted for brevity\n}\n\n// Represents a reservation made at the restaurant for a specific party, time and table\npublic class Reservation {\n    private final String partyName;\n    private final int partySize;\n    private final LocalDateTime time;\n    private final Table assignedTable;\n    public Reservation(\n            String partyName, int partySize, LocalDateTime time, Table assignedTable) {\n        this.partyName = partyName;\n        this.partySize = partySize;\n        this.time = time;\n        this.assignedTable = assignedTable;\n    }\n    // getter methods are omitted for brevity\n}\n\n// Main restaurant class that manages reservations, orders, and tables\npublic class Restaurant {\n    private final String name;\n    private final Menu menu;\n    private final Layout layout;\n    private final ReservationManager reservationManager;\n\
    \    public Restaurant(String name, Menu menu, Layout layout) {\n        this.name = name;\n        this.menu = menu;\n        this.layout = layout;\n        this.reservationManager = new ReservationManager(layout);\n    }\n    // Finds possible reservation times within a time range for a party of specified size\npublic LocalDateTime[] findAvailableTimeSlots(\n            LocalDateTime rangeStart, LocalDateTime rangeEnd, int partySize) {\n        return reservationManager.findAvailableTimeSlots(rangeStart, rangeEnd, partySize);\n    }\n    // Creates a reservation for a party at the specified time\npublic Reservation createScheduledReservation(\n            String partyName, int partySize, LocalDateTime time) {\n        return reservationManager.createReservation(partyName, partySize, time);\n    }\n    // Removes an existing reservation\npublic void removeReservation(\n            String partyName, int partySize, LocalDateTime reservationTime) {\n        reservationManager.removeReservation(partyName,\
    \ partySize, reservationTime);\n    }\n    // Creates a reservation for a party without prior reservation\npublic Reservation createWalkInReservation(String partyName, int partySize) {\n        return reservationManager.createReservation(partyName, partySize, LocalDateTime.now());\n    }\n    // Adds an item to a table's order\npublic void orderItem(Table table, MenuItem item) {\n        table.addOrder(item);\n    }\n    // Removes an item from a table's order\npublic void cancelItem(Table table, MenuItem item) {\n        table.removeOrder(item);\n    }\n    // Calculates the bill amount for a table\npublic BigDecimal calculateTableBill(Table table) {\n        return table.calculateBillAmount();\n    }\n    // getter methods are omitted for brevity\n}\n\npublic interface OrderCommand {\n    void execute();\n}\n\n// Command that handles sending order items to the Kitchen\npublic class SendToKitchenCommand\nimplements OrderCommand {\n    private final OrderItem orderItem;\n    public SendToKitchenCommand(OrderItem\
    \ orderItem) {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public void execute() {\n        orderItem.sendToKitchen();\n    }\n} // Command that handles delivery of order items\npublic class DeliverCommand\nimplements OrderCommand {\n    private final OrderItem orderItem;\n    public DeliverCommand(OrderItem orderItem) {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public void execute() {\n        orderItem.deliverToCustomer();\n    }\n} // Command that handles cancellations of order items\npublic class CancelCommand\nimplements OrderCommand {\n    private final OrderItem orderItem;\n    public CancelCommand(OrderItem orderItem) {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public void execute() {\n        orderItem.cancel();\n    }\n}\n\npublic class OrderManager {\n    private final List<OrderCommand> commandQueue = new ArrayList<>();\n    // Adds a command to the queue for later execution\npublic void addCommand(OrderCommand\
    \ command) {\n        commandQueue.add(command);\n    }\n    // Executes all commands in the queue and clears it\npublic void executeCommands() {\n        for (OrderCommand command : commandQueue) {\n            command.execute();\n        }\n        commandQueue.clear();\n    }\n}\n\npublic class Restaurant {\n    // ... fields unchanged ...\nprivate final OrderManager orderManager;\n    public Restaurant(String name, Menu menu, Layout layout) {\n        // ... fields unchanged ...\nthis.orderManager = new OrderManager();\n    }\n    // Adds an item to a table's order and sends it to the kitchen\npublic void orderItem(Table table, MenuItem item) {\n        table.addOrder(item);\n        // Get the last added order item\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty()) {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\nsendToKitchen\n=\nnew SendToKitchenCommand(lastOrder);\n\
    \            orderManager.addCommand(sendToKitchen);\n            orderManager.executeCommands();\n        }\n    }\n    // Removes an item from a table's order and cancels it\npublic void cancelItem(Table table, MenuItem item) {\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty()) {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\ncancelOrder\n=\nnew CancelCommand(lastOrder);\n            orderManager.addCommand(cancelOrder);\n            orderManager.executeCommands();\n            table.removeOrder(item);\n        }\n    }\n    // Delivers an item to the customer\npublic void deliverItem(Table table, MenuItem item) {\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty()) {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\ndeliverOrder\n\
    =\nnew DeliverCommand(lastOrder);\n            orderManager.addCommand(deliverOrder);\n            orderManager.executeCommands();\n        }\n    }\n    // ... other methods unchanged ...\n}"
- approachId: command-station-kitchen-dispatch
  label: Alternate — Command Pattern with Specialized Station Queues
  approachClass: ALTERNATE
  kind: CODE
  summary: A command-driven architecture that routes orders to specialized kitchen stations. Supports order adjustments, item cancellations, and cooking status notifications asynchronously, with full audit trail capabilities.
  keyIdea: Encapsulate food and beverage line-items as executable Command objects dispatched to dedicated kitchen station queues (Grill, Cold/Salad, Bar).
  timeComplexity: O(I)
  spaceComplexity: O(I)
  tradeoffs:
  - Enables clean undo, modification, and station-specific routing
  - Requires synchronization when assembling multi-station orders for table delivery
  whenToUse: Large fine-dining and multi-station kitchen operations with independent preparation timelines.
  code: "// Alternate Approach: Command Pattern with Specialized Station Queues\nimport java.util.*;\nimport java.util.concurrent.ConcurrentLinkedQueue;\n\nenum KitchenStationType { GRILL, SALAD, BAR }\n\ninterface OrderCommand {\n    void execute();\n    void cancel();\n    String getItemName();\n    int getTableNumber();\n}\n\nclass CookItemCommand implements OrderCommand {\n    private final String itemName;\n    private final int tableNumber;\n    private boolean isCancelled = false;\n\n    public CookItemCommand(String itemName, int tableNumber) {\n        this.itemName = itemName;\n        this.tableNumber = tableNumber;\n    }\n\n    @Override\n    public void execute() {\n        if (!isCancelled) {\n            System.out.printf(\"Kitchen Station preparing [%s] for Table %d%n\", itemName, tableNumber);\n        }\n    }\n\n    @Override\n    public void cancel() {\n        isCancelled = true;\n        System.out.printf(\"Cancelled preparation of [%s] for Table %d%n\", itemName,\
    \ tableNumber);\n    }\n\n    @Override public String getItemName() { return itemName; }\n    @Override public int getTableNumber() { return tableNumber; }\n}\n\nclass StationQueue {\n    private final KitchenStationType stationType;\n    private final Queue<OrderCommand> queue = new ConcurrentLinkedQueue<>();\n\n    public StationQueue(KitchenStationType stationType) { this.stationType = stationType; }\n    public void submit(OrderCommand cmd) { queue.offer(cmd); }\n    public void processNext() {\n        OrderCommand cmd = queue.poll();\n        if (cmd != null) cmd.execute();\n    }\n}\n\nclass RestaurantOrderDispatcher {\n    private final Map<KitchenStationType, StationQueue> stations = new EnumMap<>(KitchenStationType.class);\n\n    public RestaurantOrderDispatcher() {\n        stations.put(KitchenStationType.GRILL, new StationQueue(KitchenStationType.GRILL));\n        stations.put(KitchenStationType.SALAD, new StationQueue(KitchenStationType.SALAD));\n        stations.put(KitchenStationType.BAR,\
    \ new StationQueue(KitchenStationType.BAR));\n    }\n\n    public void routeOrder(KitchenStationType station, String item, int table) {\n        CookItemCommand cmd = new CookItemCommand(item, table);\n        stations.get(station).submit(cmd);\n    }\n\n    public void processAll() {\n        stations.values().forEach(StationQueue::processNext);\n    }\n}\n"
---

### Problem Statement: Design a Restaurant Management System

Design an end-to-end Restaurant Management System coordinating table reservations, dine-in seating, order routing to kitchen display systems (KDS), bill splitting, and inventory tracking.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Restaurant Management System.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage Observer Pattern (Kitchen & Waiter Event Notifications), Strategy Pattern (Bill Splitting & Tip Calculation), State Pattern (Table State).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
