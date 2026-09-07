---
slug: lld-restaurant-management-system
title: Design a Restaurant Management System
track: SPRING_LLD
difficulty: SENIOR
tags:
- object-oriented-design
- lld
- java
- design-patterns
- observer-pattern
- strategy-pattern
- restaurant
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the Observer Pattern to notify Kitchen display stations and Waitstaff when an order is placed, prepared, or served.
- Model tables with state (Vacant, Reserved, Occupied, CleanUpNeeded) and capacity for party seating.
- Use the Strategy Pattern for bill settlement (split equally, split by item, service charge, and tip calculations).
coaching:
  presentationTips:
  - 'Trace the end-to-end customer journey: Table Reservation -> Seated -> Order Placement -> Kitchen Cooking -> Food Delivery
    -> Billing.'
  - Demonstrate how the Menu entity supports modifiers (e.g. extra cheese, gluten-free) using the Decorator or Composite pattern.
  - Discuss concurrency when multiple waitstaff attempt to assign walk-in parties to tables.
starterCode: "public class Menu {\n    private final Map<String, MenuItem> menuItems = new HashMap<>();\n    // Adds a new\
  \ item to the menu\npublic void addItem(MenuItem item) {\n        menuItems.put(item.getName(), item);\n    }\n    public\
  \ MenuItem getItem(String name) {\n        return menuItems.get(name);\n    }\n    public Map<String, MenuItem> getMenuItems()\
  \ {\n        return Collections.unmodifiableMap(menuItems);\n    }\n}\n\n// Represents a single item available on the restaurant\
  \ menu\npublic class MenuItem {\n    private final String name;\n    private final String description;\n    private final\
  \ BigDecimal price;\n    private final Category category;\n    public MenuItem(String name, String description, BigDecimal\
  \ price, Category category) {\n        this.name = name;\n        this.description = description;\n        this.price =\
  \ price;\n        this.category = category;\n    }\n    // Enumeration of possible menu item categories\npublic enum Category\
  \ {\n        MAIN,\n        APPETIZER,\n        DESSERT\n    } // getter methods are omitted for brevity\n}\n\n// Represents\
  \ a table in the restaurant with its properties and current state\npublic class Table {\n    // immutable properties\nprivate\
  \ final int tableId;\n    private final int capacity;\n    // current state\nprivate final Map<LocalDateTime, Reservation>\
  \ reservations = new HashMap<>();\n    private final Map<MenuItem, List<OrderItem>> orderedItems = new HashMap<>();\n  \
  \  public Table(int tableId, int capacity) {\n        this.tableId = tableId;\n        this.capacity = capacity;\n    }\n\
  \    // Calculates the total bill amount for all ordered items at this table\npublic BigDecimal calculateBillAmount() {\n\
  \        return orderedItems.values().stream()\n                .flatMap(List::stream)\n                .map(OrderItem::getItem)\n\
  \                .map(MenuItem::getPrice)\n                .reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // Adds\
  \ multiple orders of the same menu item to the table\npublic void addOrder(MenuItem item, int quantity) {\n        for (int\
  \ i\n=\n0; i < quantity; i++) {\n            addOrder(item);\n        }\n    }\n    // Adds a single menu item to the table's\
  \ order\npublic void addOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if\
  \ (orderItems == null) {\n            orderItems = new ArrayList<>();\n            orderedItems.put(item, orderItems);\n\
  \            orderItems.add(new OrderItem(item));\n        } else {\n            orderItems.add(new OrderItem(item));\n\
  \        }\n    }\n    // Removes a menu item from the table's order\npublic void removeOrder(MenuItem item) {\n       \
  \ List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems != null) {\n            orderItems.remove(0);\n\
  \            if (orderItems.isEmpty()) {\n                orderedItems.remove(item);\n            }\n        }\n    }\n\
  \    // Checks if the table is available at a specific time\npublic boolean isAvailableAt(LocalDateTime reservationTime)\
  \ {\n        return !reservations.containsKey(reservationTime);\n    }\n    // Adds a reservation to this table\npublic\
  \ void addReservation(Reservation reservation) {\n        reservations.put(reservation.getTime(), reservation);\n    }\n\
  \    // Removes a reservation from this table for a specific time\npublic void removeReservation(LocalDateTime reservationTime)\
  \ {\n        reservations.remove(reservationTime);\n    }\n    // getter methods are omitted for brevity\n}"
solutionCode: "public class Menu {\n    private final Map<String, MenuItem> menuItems = new HashMap<>();\n    // Adds a new\
  \ item to the menu\npublic void addItem(MenuItem item) {\n        menuItems.put(item.getName(), item);\n    }\n    public\
  \ MenuItem getItem(String name) {\n        return menuItems.get(name);\n    }\n    public Map<String, MenuItem> getMenuItems()\
  \ {\n        return Collections.unmodifiableMap(menuItems);\n    }\n}\n\n// Represents a single item available on the restaurant\
  \ menu\npublic class MenuItem {\n    private final String name;\n    private final String description;\n    private final\
  \ BigDecimal price;\n    private final Category category;\n    public MenuItem(String name, String description, BigDecimal\
  \ price, Category category) {\n        this.name = name;\n        this.description = description;\n        this.price =\
  \ price;\n        this.category = category;\n    }\n    // Enumeration of possible menu item categories\npublic enum Category\
  \ {\n        MAIN,\n        APPETIZER,\n        DESSERT\n    } // getter methods are omitted for brevity\n}\n\n// Represents\
  \ a table in the restaurant with its properties and current state\npublic class Table {\n    // immutable properties\nprivate\
  \ final int tableId;\n    private final int capacity;\n    // current state\nprivate final Map<LocalDateTime, Reservation>\
  \ reservations = new HashMap<>();\n    private final Map<MenuItem, List<OrderItem>> orderedItems = new HashMap<>();\n  \
  \  public Table(int tableId, int capacity) {\n        this.tableId = tableId;\n        this.capacity = capacity;\n    }\n\
  \    // Calculates the total bill amount for all ordered items at this table\npublic BigDecimal calculateBillAmount() {\n\
  \        return orderedItems.values().stream()\n                .flatMap(List::stream)\n                .map(OrderItem::getItem)\n\
  \                .map(MenuItem::getPrice)\n                .reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // Adds\
  \ multiple orders of the same menu item to the table\npublic void addOrder(MenuItem item, int quantity) {\n        for (int\
  \ i\n=\n0; i < quantity; i++) {\n            addOrder(item);\n        }\n    }\n    // Adds a single menu item to the table's\
  \ order\npublic void addOrder(MenuItem item) {\n        List<OrderItem> orderItems = orderedItems.get(item);\n        if\
  \ (orderItems == null) {\n            orderItems = new ArrayList<>();\n            orderedItems.put(item, orderItems);\n\
  \            orderItems.add(new OrderItem(item));\n        } else {\n            orderItems.add(new OrderItem(item));\n\
  \        }\n    }\n    // Removes a menu item from the table's order\npublic void removeOrder(MenuItem item) {\n       \
  \ List<OrderItem> orderItems = orderedItems.get(item);\n        if (orderItems != null) {\n            orderItems.remove(0);\n\
  \            if (orderItems.isEmpty()) {\n                orderedItems.remove(item);\n            }\n        }\n    }\n\
  \    // Checks if the table is available at a specific time\npublic boolean isAvailableAt(LocalDateTime reservationTime)\
  \ {\n        return !reservations.containsKey(reservationTime);\n    }\n    // Adds a reservation to this table\npublic\
  \ void addReservation(Reservation reservation) {\n        reservations.put(reservation.getTime(), reservation);\n    }\n\
  \    // Removes a reservation from this table for a specific time\npublic void removeReservation(LocalDateTime reservationTime)\
  \ {\n        reservations.remove(reservationTime);\n    }\n    // getter methods are omitted for brevity\n}\n\n// Manages\
  \ the collection of tables in the restaurant and their arrangement\npublic class Layout {\n    private final Map<Integer,\
  \ Table> tablesById = new HashMap<>();\n    // Groups tables by their capacity for efficient table assignment, sorted from\
  \ smallest to\n// largest capacity\nprivate final SortedMap<Integer, Set<Table>> tablesByCapacity = new TreeMap<>();\n \
  \   public Layout(List<Integer> tableCapacities) {\n        for (int i\n=\n0; i < tableCapacities.size(); i++) {\n     \
  \       int capacity\n= tableCapacities.get(i);\n            Table\ntable\n=\nnew Table(i, capacity);\n            tablesById.put(i,\
  \ table);\n            tablesByCapacity.computeIfAbsent(capacity, k -> new HashSet<>()).add(table);\n        }\n    }\n\
  \    // Finds the smallest available table that can accommodate a party of the given size at the\n// given time\npublic\
  \ Table findAvailableTable(int partySize, LocalDateTime reservationTime) {\n        for (Set<Table> tables : tablesByCapacity.tailMap(partySize).values())\
  \ {\n            for (Table table : tables) {\n                if (table.isAvailableAt(reservationTime)) {\n           \
  \         return table;\n                }\n            }\n        }\n        return null;\n    }\n}\n\n// Represents a\
  \ food item ordered by a customer with its current status in the order process\npublic class OrderItem {\n    private final\
  \ MenuItem item;\n    private Status\nstatus\n= Status.PENDING;\n    public OrderItem(MenuItem item) {\n        this.item\
  \ = item;\n    }\n    // Updates the status to indicate the item has been sent to the kitchen\npublic void sendToKitchen()\
  \ {\n        if (status == Status.PENDING) status = Status.SENT_TO_KITCHEN;\n    }\n    // Updates the status to indicate\
  \ the item has been delivered to the customer\npublic void deliverToCustomer() {\n        if (status == Status.SENT_TO_KITCHEN)\
  \ status = Status.DELIVERED;\n    }\n    // Updates the status to indicate the item has been canceled\npublic void cancel()\
  \ {\n        if (status == Status.PENDING || status == Status.SENT_TO_KITCHEN) {\n            status = Status.CANCELED;\n\
  \        }\n    }\n    // getter methods are omitted for brevity\n}\n\n// Manages all reservations for the restaurant and\
  \ handles table assignments\npublic class ReservationManager {\n    private final Layout layout;\n    private final Set<Reservation>\
  \ reservations = new HashSet<>();\n    // Constructor that takes the restaurant's table layout\npublic ReservationManager(Layout\
  \ layout) {\n        this.layout = layout;\n    }\n    // Finds potential time slots for a reservation within the given\
  \ time range and party size\npublic LocalDateTime[] findAvailableTimeSlots(\n            LocalDateTime rangeStart, LocalDateTime\
  \ rangeEnd, int partySize) {\n        // checking every hour in the time range\nLocalDateTime\ncurrent\n= rangeStart;\n\
  \        List<LocalDateTime> possibleReservations = new ArrayList<>();\n        while (!current.isAfter(rangeEnd)) {\n \
  \           Table\navailableTable\n= layout.findAvailableTable(partySize, current);\n            if (availableTable != null)\
  \ {\n                possibleReservations.add(current);\n            }\n            current = current.plusHours(1);\n  \
  \      }\n        return possibleReservations.toArray(new LocalDateTime[0]);\n    }\n    // Creates a reservation for a\
  \ specific time, party size and name\npublic Reservation createReservation(\n            String partyName, int partySize,\
  \ LocalDateTime desiredTime) {\n        desiredTime = desiredTime.truncatedTo(ChronoUnit.HOURS);\n        Table\ntable\n\
  = layout.findAvailableTable(partySize, desiredTime);\n        Reservation\nreservation\n=\nnew Reservation(partyName, partySize,\
  \ desiredTime, table);\n        table.addReservation(reservation);\n        reservations.add(reservation);\n        return\
  \ reservation;\n    }\n    // Removes an existing reservation\npublic void removeReservation(\n            String partyName,\
  \ int partySize, LocalDateTime reservationTime) {\n        // Find matching reservation before removing it\nfor (Reservation\
  \ reservation : new HashSet<>(reservations)) {\n            if (reservation.getTime().equals(reservationTime)\n        \
  \            && reservation.getPartySize() == partySize\n                    && reservation.getPartyName().equals(partyName))\
  \ {\n                // Clear the reservation from the table first\nTable\ntable\n= reservation.getAssignedTable();\n  \
  \              table.removeReservation(reservationTime);\n                // Then remove from the reservation collection\n\
  \                reservations.remove(reservation);\n                return;\n            }\n        }\n    }\n    // getter\
  \ methods are omitted for brevity\n}\n\n// Represents a reservation made at the restaurant for a specific party, time and\
  \ table\npublic class Reservation {\n    private final String partyName;\n    private final int partySize;\n    private\
  \ final LocalDateTime time;\n    private final Table assignedTable;\n    public Reservation(\n            String partyName,\
  \ int partySize, LocalDateTime time, Table assignedTable) {\n        this.partyName = partyName;\n        this.partySize\
  \ = partySize;\n        this.time = time;\n        this.assignedTable = assignedTable;\n    }\n    // getter methods are\
  \ omitted for brevity\n}\n\n// Main restaurant class that manages reservations, orders, and tables\npublic class Restaurant\
  \ {\n    private final String name;\n    private final Menu menu;\n    private final Layout layout;\n    private final ReservationManager\
  \ reservationManager;\n    public Restaurant(String name, Menu menu, Layout layout) {\n        this.name = name;\n     \
  \   this.menu = menu;\n        this.layout = layout;\n        this.reservationManager = new ReservationManager(layout);\n\
  \    }\n    // Finds possible reservation times within a time range for a party of specified size\npublic LocalDateTime[]\
  \ findAvailableTimeSlots(\n            LocalDateTime rangeStart, LocalDateTime rangeEnd, int partySize) {\n        return\
  \ reservationManager.findAvailableTimeSlots(rangeStart, rangeEnd, partySize);\n    }\n    // Creates a reservation for a\
  \ party at the specified time\npublic Reservation createScheduledReservation(\n            String partyName, int partySize,\
  \ LocalDateTime time) {\n        return reservationManager.createReservation(partyName, partySize, time);\n    }\n    //\
  \ Removes an existing reservation\npublic void removeReservation(\n            String partyName, int partySize, LocalDateTime\
  \ reservationTime) {\n        reservationManager.removeReservation(partyName, partySize, reservationTime);\n    }\n    //\
  \ Creates a reservation for a party without prior reservation\npublic Reservation createWalkInReservation(String partyName,\
  \ int partySize) {\n        return reservationManager.createReservation(partyName, partySize, LocalDateTime.now());\n  \
  \  }\n    // Adds an item to a table's order\npublic void orderItem(Table table, MenuItem item) {\n        table.addOrder(item);\n\
  \    }\n    // Removes an item from a table's order\npublic void cancelItem(Table table, MenuItem item) {\n        table.removeOrder(item);\n\
  \    }\n    // Calculates the bill amount for a table\npublic BigDecimal calculateTableBill(Table table) {\n        return\
  \ table.calculateBillAmount();\n    }\n    // getter methods are omitted for brevity\n}\n\npublic interface OrderCommand\
  \ {\n    void execute();\n}\n\n// Command that handles sending order items to the Kitchen\npublic class SendToKitchenCommand\n\
  implements OrderCommand {\n    private final OrderItem orderItem;\n    public SendToKitchenCommand(OrderItem orderItem)\
  \ {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public void execute() {\n        orderItem.sendToKitchen();\n\
  \    }\n} // Command that handles delivery of order items\npublic class DeliverCommand\nimplements OrderCommand {\n    private\
  \ final OrderItem orderItem;\n    public DeliverCommand(OrderItem orderItem) {\n        this.orderItem = orderItem;\n  \
  \  }\n    @Override\n    public void execute() {\n        orderItem.deliverToCustomer();\n    }\n} // Command that handles\
  \ cancellations of order items\npublic class CancelCommand\nimplements OrderCommand {\n    private final OrderItem orderItem;\n\
  \    public CancelCommand(OrderItem orderItem) {\n        this.orderItem = orderItem;\n    }\n    @Override\n    public\
  \ void execute() {\n        orderItem.cancel();\n    }\n}\n\npublic class OrderManager {\n    private final List<OrderCommand>\
  \ commandQueue = new ArrayList<>();\n    // Adds a command to the queue for later execution\npublic void addCommand(OrderCommand\
  \ command) {\n        commandQueue.add(command);\n    }\n    // Executes all commands in the queue and clears it\npublic\
  \ void executeCommands() {\n        for (OrderCommand command : commandQueue) {\n            command.execute();\n      \
  \  }\n        commandQueue.clear();\n    }\n}\n\npublic class Restaurant {\n    // ... fields unchanged ...\nprivate final\
  \ OrderManager orderManager;\n    public Restaurant(String name, Menu menu, Layout layout) {\n        // ... fields unchanged\
  \ ...\nthis.orderManager = new OrderManager();\n    }\n    // Adds an item to a table's order and sends it to the kitchen\n\
  public void orderItem(Table table, MenuItem item) {\n        table.addOrder(item);\n        // Get the last added order\
  \ item\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty())\
  \ {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\nsendToKitchen\n\
  =\nnew SendToKitchenCommand(lastOrder);\n            orderManager.addCommand(sendToKitchen);\n            orderManager.executeCommands();\n\
  \        }\n    }\n    // Removes an item from a table's order and cancels it\npublic void cancelItem(Table table, MenuItem\
  \ item) {\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems != null && !orderItems.isEmpty())\
  \ {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n            OrderCommand\ncancelOrder\n\
  =\nnew CancelCommand(lastOrder);\n            orderManager.addCommand(cancelOrder);\n            orderManager.executeCommands();\n\
  \            table.removeOrder(item);\n        }\n    }\n    // Delivers an item to the customer\npublic void deliverItem(Table\
  \ table, MenuItem item) {\n        List<OrderItem> orderItems = table.getOrderedItems().get(item);\n        if (orderItems\
  \ != null && !orderItems.isEmpty()) {\n            OrderItem\nlastOrder\n= orderItems.get(orderItems.size() - 1);\n    \
  \        OrderCommand\ndeliverOrder\n=\nnew DeliverCommand(lastOrder);\n            orderManager.addCommand(deliverOrder);\n\
  \            orderManager.executeCommands();\n        }\n    }\n    // ... other methods unchanged ...\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Restaurant Management System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Observer Pattern (Kitchen & Waiter Event Notifications), Strategy Pattern (Bill Splitting & Tip Calculation), State
  Pattern (Table State)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
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
