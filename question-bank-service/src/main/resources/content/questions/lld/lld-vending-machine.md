---
slug: lld-vending-machine
title: Design a Vending Machine
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
- state-pattern
- state-machine
buildProfile: maven-workspace
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the State Pattern to manage transitions between IdleState, HasMoneyState, DispensingState, and SoldOutState.
- Encapsulate state-specific behaviors inside State subclasses so the VendingMachine context delegates without nested switch statements.
- Maintain an Inventory manager that tracks item counts and denominations of coins/bills for exact change calculation.
coaching:
  presentationTips:
  - 'Walk through the state transition diagram clearly: insert money -> select product -> dispense -> return change -> idle.'
  - Demonstrate how invalid actions in a state (e.g., pressing dispense before inserting coins) throw clean domain exceptions.
  - Discuss greedy coin change calculation versus inventory-aware denomination dispense.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>vending-machine</artifactId>
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
    # Vending Machine System

    ## Overview
    Implement an object-oriented Vending Machine system using the State Pattern, supporting coin/cash insertion, product rack inventory management, dispensing, and change calculation.

    ## Key Components
    - `com.interviewos.vending.service.VendingMachine`: Context manager holding state, inventory, and payment processor.
    - `com.interviewos.vending.model.InventoryManager`: Rack management, inventory stock checks, and dispensing.
    - `com.interviewos.vending.model.PaymentProcessor`: Balance tracking and exact change return.
    - `com.interviewos.vending.state.*`: State pattern implementations (`NoMoneyInsertedState`, `MoneyInsertedState`, `DispensingState`).

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/vending/service/VendingMachine.java`
    2. `src/main/java/com/interviewos/vending/model/InventoryManager.java`
    3. `src/main/java/com/interviewos/vending/state/NoMoneyInsertedState.java`
    4. `src/main/java/com/interviewos/vending/state/MoneyInsertedState.java`
  src/main/java/com/interviewos/vending/model/Product.java: |
    package com.interviewos.vending.model;

    import java.math.BigDecimal;

    public class Product {
        private final String productCode;
        private final String name;
        private final BigDecimal price;

        public Product(String productCode, String name, BigDecimal price) {
            this.productCode = productCode;
            this.name = name;
            this.price = price;
        }

        public String getProductCode() { return productCode; }
        public String getName() { return name; }
        public BigDecimal getPrice() { return price; }
    }
  src/main/java/com/interviewos/vending/model/Rack.java: |
    package com.interviewos.vending.model;

    public class Rack {
        private final String rackCode;
        private final Product product;
        private int count;

        public Rack(String rackCode, Product product, int initialCount) {
            this.rackCode = rackCode;
            this.product = product;
            this.count = initialCount;
        }

        public String getRackCode() { return rackCode; }
        public Product getProduct() { return product; }
        public synchronized int getCount() { return count; }
        public synchronized void decrementCount() {
            if (count > 0) count--;
        }
        public synchronized void setCount(int count) {
            this.count = count;
        }
    }
  src/main/java/com/interviewos/vending/model/InventoryManager.java: |
    package com.interviewos.vending.model;

    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class InventoryManager {
        private final Map<String, Rack> racks = new ConcurrentHashMap<>();

        public void addRack(Rack rack) {
            if (rack != null) {
                racks.put(rack.getRackCode(), rack);
            }
        }

        public Rack getRack(String rackCode) {
            return racks.get(rackCode);
        }

        public Product getProduct(String rackCode) {
            Rack r = getRack(rackCode);
            return r != null ? r.getProduct() : null;
        }

        public boolean isAvailable(String rackCode) {
            // TODO: Check if rack exists and has count > 0
            throw new UnsupportedOperationException("TODO: Implement isAvailable");
        }

        public boolean dispenseProduct(String rackCode) {
            // TODO: Decrement rack inventory if available
            throw new UnsupportedOperationException("TODO: Implement dispenseProduct");
        }
    }
  src/main/java/com/interviewos/vending/model/PaymentProcessor.java: |
    package com.interviewos.vending.model;

    import java.math.BigDecimal;

    public class PaymentProcessor {
        private BigDecimal currentBalance = BigDecimal.ZERO;

        public synchronized void insertMoney(BigDecimal amount) {
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                this.currentBalance = this.currentBalance.add(amount);
            }
        }

        public synchronized boolean hasSufficientBalance(BigDecimal price) {
            return price != null && currentBalance.compareTo(price) >= 0;
        }

        public synchronized void charge(BigDecimal amount) {
            if (amount != null && currentBalance.compareTo(amount) >= 0) {
                currentBalance = currentBalance.subtract(amount);
            } else {
                throw new IllegalStateException("Insufficient balance to charge");
            }
        }

        public synchronized BigDecimal refund() {
            BigDecimal refundAmount = currentBalance;
            currentBalance = BigDecimal.ZERO;
            return refundAmount;
        }

        public synchronized BigDecimal getCurrentBalance() {
            return currentBalance;
        }
    }
  src/main/java/com/interviewos/vending/state/VendingMachineState.java: |
    package com.interviewos.vending.state;

    import com.interviewos.vending.service.VendingMachine;
    import java.math.BigDecimal;

    public interface VendingMachineState {
        void insertMoney(VendingMachine vm, BigDecimal amount);
        void selectProduct(VendingMachine vm, String rackCode);
        void dispenseProduct(VendingMachine vm);
        BigDecimal cancelTransaction(VendingMachine vm);
        String getStateName();
    }
  src/main/java/com/interviewos/vending/state/NoMoneyInsertedState.java: |
    package com.interviewos.vending.state;

    import com.interviewos.vending.service.VendingMachine;
    import java.math.BigDecimal;

    public class NoMoneyInsertedState implements VendingMachineState {
        @Override
        public void insertMoney(VendingMachine vm, BigDecimal amount) {
            // TODO: Add money to payment processor, transition to MoneyInsertedState
            throw new UnsupportedOperationException("TODO: Implement insertMoney in NoMoneyInsertedState");
        }

        @Override
        public void selectProduct(VendingMachine vm, String rackCode) {
            throw new IllegalStateException("Insert money before selecting a product.");
        }

        @Override
        public void dispenseProduct(VendingMachine vm) {
            throw new IllegalStateException("Insert money before dispensing.");
        }

        @Override
        public BigDecimal cancelTransaction(VendingMachine vm) {
            return BigDecimal.ZERO;
        }

        @Override
        public String getStateName() {
            return "NO_MONEY_INSERTED";
        }
    }
  src/main/java/com/interviewos/vending/state/MoneyInsertedState.java: |
    package com.interviewos.vending.state;

    import com.interviewos.vending.model.Product;
    import com.interviewos.vending.service.VendingMachine;
    import java.math.BigDecimal;

    public class MoneyInsertedState implements VendingMachineState {
        @Override
        public void insertMoney(VendingMachine vm, BigDecimal amount) {
            vm.getPaymentProcessor().insertMoney(amount);
        }

        @Override
        public void selectProduct(VendingMachine vm, String rackCode) {
            // TODO: Validate rack exists, product is in stock, and balance >= price
            throw new UnsupportedOperationException("TODO: Implement selectProduct in MoneyInsertedState");
        }

        @Override
        public void dispenseProduct(VendingMachine vm) {
            throw new IllegalStateException("Select a product first.");
        }

        @Override
        public BigDecimal cancelTransaction(VendingMachine vm) {
            // TODO: Refund balance and transition to NoMoneyInsertedState
            throw new UnsupportedOperationException("TODO: Implement cancelTransaction");
        }

        @Override
        public String getStateName() {
            return "MONEY_INSERTED";
        }
    }
  src/main/java/com/interviewos/vending/service/VendingMachine.java: |
    package com.interviewos.vending.service;

    import com.interviewos.vending.model.InventoryManager;
    import com.interviewos.vending.model.PaymentProcessor;
    import com.interviewos.vending.model.Product;
    import com.interviewos.vending.state.NoMoneyInsertedState;
    import com.interviewos.vending.state.VendingMachineState;
    import java.math.BigDecimal;

    public class VendingMachine {
        private VendingMachineState currentState;
        private final InventoryManager inventoryManager;
        private final PaymentProcessor paymentProcessor;
        private String selectedRackCode;

        public VendingMachine() {
            this.inventoryManager = new InventoryManager();
            this.paymentProcessor = new PaymentProcessor();
            this.currentState = new NoMoneyInsertedState();
        }

        public void insertMoney(BigDecimal amount) {
            // TODO: Delegate to currentState
            throw new UnsupportedOperationException("TODO: Implement insertMoney");
        }

        public void selectProduct(String rackCode) {
            // TODO: Delegate to currentState
            throw new UnsupportedOperationException("TODO: Implement selectProduct");
        }

        public Product dispense() {
            // TODO: Dispense product, charge payment, return item
            throw new UnsupportedOperationException("TODO: Implement dispense");
        }

        public BigDecimal cancel() {
            // TODO: Delegate to currentState
            throw new UnsupportedOperationException("TODO: Implement cancel");
        }

        public void transitionToState(VendingMachineState nextState) {
            this.currentState = nextState;
        }

        public VendingMachineState getCurrentState() { return currentState; }
        public InventoryManager getInventoryManager() { return inventoryManager; }
        public PaymentProcessor getPaymentProcessor() { return paymentProcessor; }
        public String getSelectedRackCode() { return selectedRackCode; }
        public void setSelectedRackCode(String rackCode) { this.selectedRackCode = rackCode; }
    }
editablePaths:
- src/main/java/com/interviewos/vending/service/VendingMachine.java
- src/main/java/com/interviewos/vending/model/InventoryManager.java
- src/main/java/com/interviewos/vending/state/NoMoneyInsertedState.java
- src/main/java/com/interviewos/vending/state/MoneyInsertedState.java
hiddenTestFiles:
  src/test/java/com/interviewos/vending/VendingPaymentTest.java: |
    package com.interviewos.vending;

    import com.interviewos.vending.model.PaymentProcessor;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class VendingPaymentTest {
        @Test
        @DisplayName("Payment processor accumulates inserted money and refunds exact balance")
        void testPaymentAccumulationAndRefund() {
            PaymentProcessor processor = new PaymentProcessor();
            processor.insertMoney(new BigDecimal("1.00"));
            processor.insertMoney(new BigDecimal("0.50"));

            assertEquals(new BigDecimal("1.50"), processor.getCurrentBalance());
            assertTrue(processor.hasSufficientBalance(new BigDecimal("1.25")));
            assertFalse(processor.hasSufficientBalance(new BigDecimal("2.00")));

            processor.charge(new BigDecimal("1.25"));
            assertEquals(new BigDecimal("0.25"), processor.getCurrentBalance());

            BigDecimal change = processor.refund();
            assertEquals(new BigDecimal("0.25"), change);
            assertEquals(BigDecimal.ZERO, processor.getCurrentBalance());
        }
    }
  src/test/java/com/interviewos/vending/VendingDispenseTest.java: |
    package com.interviewos.vending;

    import com.interviewos.vending.model.InventoryManager;
    import com.interviewos.vending.model.Product;
    import com.interviewos.vending.model.Rack;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class VendingDispenseTest {
        private InventoryManager inventory;

        @BeforeEach
        void setUp() {
            inventory = new InventoryManager();
            Product soda = new Product("P1", "Sparkling Water", new BigDecimal("1.50"));
            inventory.addRack(new Rack("A1", soda, 2));
        }

        @Test
        @DisplayName("Dispensing decrements rack stock until sold out")
        void testDispenseStock() {
            assertTrue(inventory.isAvailable("A1"));
            assertTrue(inventory.dispenseProduct("A1"));
            assertEquals(1, inventory.getRack("A1").getCount());

            assertTrue(inventory.dispenseProduct("A1"));
            assertEquals(0, inventory.getRack("A1").getCount());

            assertFalse(inventory.isAvailable("A1"));
            assertFalse(inventory.dispenseProduct("A1"));
        }
    }
  src/test/java/com/interviewos/vending/VendingStateLifecycleTest.java: |
    package com.interviewos.vending;

    import com.interviewos.vending.model.Product;
    import com.interviewos.vending.model.Rack;
    import com.interviewos.vending.service.VendingMachine;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class VendingStateLifecycleTest {
        private VendingMachine vm;

        @BeforeEach
        void setUp() {
            vm = new VendingMachine();
            Product chips = new Product("CHIP", "Potato Chips", new BigDecimal("2.00"));
            vm.getInventoryManager().addRack(new Rack("R1", chips, 3));
        }

        @Test
        @DisplayName("Lifecycle: insert money -> select -> dispense returns product and change")
        void testSuccessfulPurchaseLifecycle() {
            assertEquals("NO_MONEY_INSERTED", vm.getCurrentState().getStateName());

            vm.insertMoney(new BigDecimal("3.00"));
            assertEquals("MONEY_INSERTED", vm.getCurrentState().getStateName());

            vm.selectProduct("R1");
            Product p = vm.dispense();
            assertNotNull(p);
            assertEquals("Potato Chips", p.getName());

            BigDecimal change = vm.cancel();
            assertEquals(new BigDecimal("1.00"), change);
            assertEquals("NO_MONEY_INSERTED", vm.getCurrentState().getStateName());
        }

        @Test
        @DisplayName("Cancelling after money insertion refunds full amount and returns to idle")
        void testCancellationRefund() {
            vm.insertMoney(new BigDecimal("5.00"));
            BigDecimal refunded = vm.cancel();
            assertEquals(new BigDecimal("5.00"), refunded);
            assertEquals("NO_MONEY_INSERTED", vm.getCurrentState().getStateName());
        }
    }

starterCode: "class Product {\n    final String productCode;\n    final String description;\n    final BigDecimal unitPrice;\n    public Product(String productCode, String description, BigDecimal unitPrice) {\n        this.productCode = productCode;\n        this.description = description;\n        this.unitPrice = unitPrice;\n    }\n}\n\npublic class InventoryManager {\n    // Maps rack codes to their corresponding rack objects\nprivate Map<String, Rack> racks;\n    public InventoryManager() {\n        racks = new HashMap<>();\n    }\n    // Retrieves the product from a specific rack using its code\npublic Product getProductInRack(String rackCode) {\n        return racks.get(rackCode).getProduct();\n    }\n    // Dispenses a product from the specified rack and decrements its count\npublic void dispenseProductFromRack(Rack rack) {\n        if (rack.getProductCount() > 0) {\n            rack.setCount(rack.getProductCount() - 1);\n        } else {\n            throw new IllegalStateException(\"\
  Cannot dispense product. Rack is empty.\");\n        }\n    }\n    public void updateRack(Map<String, Rack> racks) {\n        this.racks = racks;\n    }\n    public Rack getRack(String name) {\n        return racks.get(name);\n    }\n}\n\npublic class Rack {\n    private final String rackCode;\n    private final Product product;\n    private int count;\n    public Rack(final String rackCode, final Product product, final int count) {\n        this.rackCode = rackCode;\n        this.product = product;\n        this.count = count;\n    }\n    public Product getProduct() {\n        return product;\n    }\n    public int getProductCount() {\n        return count;\n    }\n}"
solutionCode: "class Product {\n    final String productCode;\n    final String description;\n    final BigDecimal unitPrice;\n    public Product(String productCode, String description, BigDecimal unitPrice) {\n        this.productCode = productCode;\n        this.description = description;\n        this.unitPrice = unitPrice;\n    }\n}\n\npublic class InventoryManager {\n    // Maps rack codes to their corresponding rack objects\nprivate Map<String, Rack> racks;\n    public InventoryManager() {\n        racks = new HashMap<>();\n    }\n    // Retrieves the product from a specific rack using its code\npublic Product getProductInRack(String rackCode) {\n        return racks.get(rackCode).getProduct();\n    }\n    // Dispenses a product from the specified rack and decrements its count\npublic void dispenseProductFromRack(Rack rack) {\n        if (rack.getProductCount() > 0) {\n            rack.setCount(rack.getProductCount() - 1);\n        } else {\n            throw new IllegalStateException(\"\
  Cannot dispense product. Rack is empty.\");\n        }\n    }\n    public void updateRack(Map<String, Rack> racks) {\n        this.racks = racks;\n    }\n    public Rack getRack(String name) {\n        return racks.get(name);\n    }\n}\n\npublic class Rack {\n    private final String rackCode;\n    private final Product product;\n    private int count;\n    public Rack(final String rackCode, final Product product, final int count) {\n        this.rackCode = rackCode;\n        this.product = product;\n        this.count = count;\n    }\n    public Product getProduct() {\n        return product;\n    }\n    public int getProductCount() {\n        return count;\n    }\n}\n\npublic class PaymentProcessor {\n    // Tracks the current balance in the payment processor\nprivate BigDecimal\ncurrentBalance\n= BigDecimal.ZERO;\n    // Adds the specified amount to the current balance\npublic void addBalance(BigDecimal amount) {\n        currentBalance = currentBalance.add(amount);\n    }\n    // Deducts\
  \ the specified amount from the current balance\npublic void charge(BigDecimal amount) {\n        currentBalance = currentBalance.subtract(amount);\n    }\n    // Returns the current balance as change and resets the balance to zero\npublic BigDecimal returnChange() {\n        BigDecimal\nchange\n= currentBalance;\n        currentBalance = BigDecimal.ZERO;\n        return change;\n    }\n    // Returns the current balance\npublic BigDecimal getCurrentBalance() {\n        return currentBalance;\n    }\n}\n\nclass VendingMachine {\n    // Stores the history of all completed transactions\nprivate final List<Transaction> transactionHistory;\n    // Manages the inventory of products in the vending machine\nprivate final InventoryManager inventoryManager;\n    // Handles all payment-related operations\nprivate final PaymentProcessor paymentProcessor;\n    // Tracks the current ongoing transaction\nprivate Transaction currentTransaction;\n    // Represents the current state of the vending machine\n\
  private VendingMachineState currentState;\n    // Tracks the current balance in the machine\nprivate double balance;\n    // Stores the currently selected product code\nprivate String selectedProduct;\n    public VendingMachine() {\n        transactionHistory = new ArrayList<>();\n        currentTransaction = new Transaction();\n        inventoryManager = new InventoryManager();\n        paymentProcessor = new PaymentProcessor();\n        this.currentState = new NoMoneyInsertedState();\n        this.balance = 0.0;\n        this.selectedProduct = null;\n    }\n    // Updates the rack configuration with new product racks\nvoid setRack(Map<String, Rack> rack) {\n        inventoryManager.updateRack(rack);\n    }\n    // Adds money to the payment processor\nvoid insertMoney(final BigDecimal amount) {\n        paymentProcessor.addBalance(amount);\n    }\n    // Selects a product from a specific rack\nvoid chooseProduct(String rackId) {\n        final Product\nproduct\n= inventoryManager.getProductInRack(rackId);\n\
  \        currentTransaction.setRack(inventoryManager.getRack(rackId));\n        currentTransaction.setProduct(product);\n    }\n    // Processes and completes the current transaction\n    Transaction confirmTransaction()\nthrows InvalidTransactionException {\n        // Step 1: Validate the transaction before processing\n        validateTransaction();\n        // Step 2: Charge the customer for the product\n        paymentProcessor.charge(currentTransaction.getProduct().getUnitPrice());\n        // Step 3: Dispense the product from the rack\n        inventoryManager.dispenseProductFromRack(currentTransaction.getRack());\n        // Step 4: Return the change to the customer\n        currentTransaction.setTotalAmount(paymentProcessor.returnChange());\n        // Step 5: Add the completed transaction to the history\n        transactionHistory.add(currentTransaction);\n        Transaction\ncompletedTransaction\n= currentTransaction;\n        // Reset the current transaction for the next purchase.\n\
  \        currentTransaction = new Transaction();\n        return completedTransaction;\n    }\n    // Validates the current transaction for product availability and sufficient funds\nprivate void validateTransaction()\nthrows InvalidTransactionException {\n        if (currentTransaction.getProduct() == null) {\n            throw new InvalidTransactionException(\"Invalid product selection\");\n        } else\nif (currentTransaction.getRack().getProductCount() == 0) {\n            throw new InvalidTransactionException(\"Insufficient inventory for product.\");\n        } else\nif (paymentProcessor\n                        .getCurrentBalance()\n                        .compareTo(currentTransaction.getProduct().getUnitPrice())\n                < 0) {\n            throw new InvalidTransactionException(\"Insufficient fund\");\n        }\n    }\n    // Returns an unmodifiable list of all completed transactions\npublic List<Transaction> getTransactionHistory() {\n        return Collections.unmodifiableList(transactionHistory);\n\
  \    }\n    // Cancels the current transaction and returns any inserted money\npublic void cancelTransaction() {\n        paymentProcessor.returnChange();\n        currentTransaction =\n                new Transaction(); // Reset the current transaction for the next purchase.\n    }\n    // Returns the inventory manager instance\npublic InventoryManager getInventoryManager() {\n        return inventoryManager;\n    }\n}\n\npublic interface VendingMachineState {\n    // Handles money insertion in the current state\nvoid insertMoney(VendingMachine VM, double amount);\n    // Handles product selection in the current state\nvoid selectProductByCode(VendingMachine VM, String productCode)\nthrows InvalidStateException;\n    // Handles product dispensing in the current state\nvoid dispenseProduct(VendingMachine VM)\nthrows InvalidStateException;\n    // Returns a description of the current state\n    String getStateDescription();\n}\n\npublic class NoMoneyInsertedState\nimplements VendingMachineState\
  \ {\n    // Adds money to the machine and transitions to MoneyInsertedState\n@Override\n    public void insertMoney(VendingMachine VM, double amount) {\n        VM.addBalance(amount);\n        VM.setState(new MoneyInsertedState());\n    }\n    // Throws exception as product selection is not allowed without money\n@Override\n    public void selectProductByCode(VendingMachine VM, String productCode)\nthrows InvalidStateException {\n        throw new InvalidStateException(\"Cannot select a product without inserting money.\");\n    }\n    // Throws exception as product dispensing is not allowed without money\n@Override\n    public void dispenseProduct(VendingMachine VM)\nthrows InvalidStateException {\n        throw new InvalidStateException(\"Cannot dispense product without inserting money.\");\n    }\n    // Returns a description of the current state\n@Override\n    public String getStateDescription() {\n        return \"No Money Inserted State - Please insert money to proceed\";\n    }\n\
  }"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Vending Machine


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (Machine Lifecycle States), Factory Pattern (Product & Coin Creation)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-vending-machine
  label: Canonical — Design a Vending Machine
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
  code: "class Product {\n    final String productCode;\n    final String description;\n    final BigDecimal unitPrice;\n    public Product(String productCode, String description, BigDecimal unitPrice) {\n        this.productCode = productCode;\n        this.description = description;\n        this.unitPrice = unitPrice;\n    }\n}\n\npublic class InventoryManager {\n    // Maps rack codes to their corresponding rack objects\nprivate Map<String, Rack> racks;\n    public InventoryManager() {\n        racks = new HashMap<>();\n    }\n    // Retrieves the product from a specific rack using its code\npublic Product getProductInRack(String rackCode) {\n        return racks.get(rackCode).getProduct();\n    }\n    // Dispenses a product from the specified rack and decrements its count\npublic void dispenseProductFromRack(Rack rack) {\n        if (rack.getProductCount() > 0) {\n            rack.setCount(rack.getProductCount() - 1);\n        } else {\n            throw new IllegalStateException(\"\
    Cannot dispense product. Rack is empty.\");\n        }\n    }\n    public void updateRack(Map<String, Rack> racks) {\n        this.racks = racks;\n    }\n    public Rack getRack(String name) {\n        return racks.get(name);\n    }\n}\n\npublic class Rack {\n    private final String rackCode;\n    private final Product product;\n    private int count;\n    public Rack(final String rackCode, final Product product, final int count) {\n        this.rackCode = rackCode;\n        this.product = product;\n        this.count = count;\n    }\n    public Product getProduct() {\n        return product;\n    }\n    public int getProductCount() {\n        return count;\n    }\n}\n\npublic class PaymentProcessor {\n    // Tracks the current balance in the payment processor\nprivate BigDecimal\ncurrentBalance\n= BigDecimal.ZERO;\n    // Adds the specified amount to the current balance\npublic void addBalance(BigDecimal amount) {\n        currentBalance = currentBalance.add(amount);\n    }\n    //\
    \ Deducts the specified amount from the current balance\npublic void charge(BigDecimal amount) {\n        currentBalance = currentBalance.subtract(amount);\n    }\n    // Returns the current balance as change and resets the balance to zero\npublic BigDecimal returnChange() {\n        BigDecimal\nchange\n= currentBalance;\n        currentBalance = BigDecimal.ZERO;\n        return change;\n    }\n    // Returns the current balance\npublic BigDecimal getCurrentBalance() {\n        return currentBalance;\n    }\n}\n\nclass VendingMachine {\n    // Stores the history of all completed transactions\nprivate final List<Transaction> transactionHistory;\n    // Manages the inventory of products in the vending machine\nprivate final InventoryManager inventoryManager;\n    // Handles all payment-related operations\nprivate final PaymentProcessor paymentProcessor;\n    // Tracks the current ongoing transaction\nprivate Transaction currentTransaction;\n    // Represents the current state of the vending\
    \ machine\nprivate VendingMachineState currentState;\n    // Tracks the current balance in the machine\nprivate double balance;\n    // Stores the currently selected product code\nprivate String selectedProduct;\n    public VendingMachine() {\n        transactionHistory = new ArrayList<>();\n        currentTransaction = new Transaction();\n        inventoryManager = new InventoryManager();\n        paymentProcessor = new PaymentProcessor();\n        this.currentState = new NoMoneyInsertedState();\n        this.balance = 0.0;\n        this.selectedProduct = null;\n    }\n    // Updates the rack configuration with new product racks\nvoid setRack(Map<String, Rack> rack) {\n        inventoryManager.updateRack(rack);\n    }\n    // Adds money to the payment processor\nvoid insertMoney(final BigDecimal amount) {\n        paymentProcessor.addBalance(amount);\n    }\n    // Selects a product from a specific rack\nvoid chooseProduct(String rackId) {\n        final Product\nproduct\n= inventoryManager.getProductInRack(rackId);\n\
    \        currentTransaction.setRack(inventoryManager.getRack(rackId));\n        currentTransaction.setProduct(product);\n    }\n    // Processes and completes the current transaction\n    Transaction confirmTransaction()\nthrows InvalidTransactionException {\n        // Step 1: Validate the transaction before processing\n        validateTransaction();\n        // Step 2: Charge the customer for the product\n        paymentProcessor.charge(currentTransaction.getProduct().getUnitPrice());\n        // Step 3: Dispense the product from the rack\n        inventoryManager.dispenseProductFromRack(currentTransaction.getRack());\n        // Step 4: Return the change to the customer\n        currentTransaction.setTotalAmount(paymentProcessor.returnChange());\n        // Step 5: Add the completed transaction to the history\n        transactionHistory.add(currentTransaction);\n        Transaction\ncompletedTransaction\n= currentTransaction;\n        // Reset the current transaction for the next\
    \ purchase.\n        currentTransaction = new Transaction();\n        return completedTransaction;\n    }\n    // Validates the current transaction for product availability and sufficient funds\nprivate void validateTransaction()\nthrows InvalidTransactionException {\n        if (currentTransaction.getProduct() == null) {\n            throw new InvalidTransactionException(\"Invalid product selection\");\n        } else\nif (currentTransaction.getRack().getProductCount() == 0) {\n            throw new InvalidTransactionException(\"Insufficient inventory for product.\");\n        } else\nif (paymentProcessor\n                        .getCurrentBalance()\n                        .compareTo(currentTransaction.getProduct().getUnitPrice())\n                < 0) {\n            throw new InvalidTransactionException(\"Insufficient fund\");\n        }\n    }\n    // Returns an unmodifiable list of all completed transactions\npublic List<Transaction> getTransactionHistory() {\n        return Collections.unmodifiableList(transactionHistory);\n\
    \    }\n    // Cancels the current transaction and returns any inserted money\npublic void cancelTransaction() {\n        paymentProcessor.returnChange();\n        currentTransaction =\n                new Transaction(); // Reset the current transaction for the next purchase.\n    }\n    // Returns the inventory manager instance\npublic InventoryManager getInventoryManager() {\n        return inventoryManager;\n    }\n}\n\npublic interface VendingMachineState {\n    // Handles money insertion in the current state\nvoid insertMoney(VendingMachine VM, double amount);\n    // Handles product selection in the current state\nvoid selectProductByCode(VendingMachine VM, String productCode)\nthrows InvalidStateException;\n    // Handles product dispensing in the current state\nvoid dispenseProduct(VendingMachine VM)\nthrows InvalidStateException;\n    // Returns a description of the current state\n    String getStateDescription();\n}\n\npublic class NoMoneyInsertedState\nimplements VendingMachineState\
    \ {\n    // Adds money to the machine and transitions to MoneyInsertedState\n@Override\n    public void insertMoney(VendingMachine VM, double amount) {\n        VM.addBalance(amount);\n        VM.setState(new MoneyInsertedState());\n    }\n    // Throws exception as product selection is not allowed without money\n@Override\n    public void selectProductByCode(VendingMachine VM, String productCode)\nthrows InvalidStateException {\n        throw new InvalidStateException(\"Cannot select a product without inserting money.\");\n    }\n    // Throws exception as product dispensing is not allowed without money\n@Override\n    public void dispenseProduct(VendingMachine VM)\nthrows InvalidStateException {\n        throw new InvalidStateException(\"Cannot dispense product without inserting money.\");\n    }\n    // Returns a description of the current state\n@Override\n    public String getStateDescription() {\n        return \"No Money Inserted State - Please insert money to proceed\";\n   \
    \ }\n}"
- approachId: fsm-controller-vending-machine
  label: Alternate — Finite State Machine with Central Inventory & Price Controller
  approachClass: ALTERNATE
  kind: CODE
  summary: A pragmatic state machine architecture using an explicit State enum and central controller. Simplifies state transitions, reduces class explosion, and ensures transactional consistency during coin insertion, item dispensing, and change return.
  keyIdea: Consolidate state transitions and money accounting into a single robust VendingController with transactional rollback.
  timeComplexity: O(1)
  spaceComplexity: O(P)
  tradeoffs:
  - Fewer classes and simple state serializability for persistence
  - Central controller class grows larger as more states and peripherals are added
  whenToUse: Embedded systems, IoT vending hardware, and straightforward interview discussions.
  code: "// Alternate Approach: Finite State Machine with Central Inventory & Price Controller\nimport java.util.*;\n\nenum VendingMachineState { IDLE, ACCEPTING_COINS, DISPENSING, OUT_OF_ORDER }\n\nclass ProductSlot {\n    final String code;\n    final String name;\n    final double price;\n    int stock;\n\n    public ProductSlot(String code, String name, double price, int stock) {\n        this.code = code;\n        this.name = name;\n        this.price = price;\n        this.stock = stock;\n    }\n}\n\nclass CompactVendingController {\n    private VendingMachineState state = VendingMachineState.IDLE;\n    private double currentBalance = 0.0;\n    private final Map<String, ProductSlot> inventory = new HashMap<>();\n\n    public void addProduct(String code, String name, double price, int stock) {\n        inventory.put(code, new ProductSlot(code, name, price, stock));\n    }\n\n    public synchronized void insertMoney(double amount) {\n        if (state == VendingMachineState.OUT_OF_ORDER)\
    \ {\n            throw new IllegalStateException(\"Machine is out of order.\");\n        }\n        currentBalance += amount;\n        state = VendingMachineState.ACCEPTING_COINS;\n        System.out.printf(\"Inserted $%.2f. Current balance: $%.2f%n\", amount, currentBalance);\n    }\n\n    public synchronized boolean selectProduct(String code) {\n        ProductSlot slot = inventory.get(code);\n        if (slot == null || slot.stock <= 0) {\n            System.out.println(\"Product unavailable.\");\n            return false;\n        }\n        if (currentBalance < slot.price) {\n            System.out.printf(\"Insufficient funds. Required: $%.2f, balance: $%.2f%n\", slot.price, currentBalance);\n            return false;\n        }\n\n        // Dispense product\n        state = VendingMachineState.DISPENSING;\n        slot.stock--;\n        double change = currentBalance - slot.price;\n        currentBalance = 0.0;\n        state = VendingMachineState.IDLE;\n        System.out.printf(\"\
    Dispensed: %s. Change returned: $%.2f%n\", slot.name, change);\n        return true;\n    }\n\n    public synchronized double cancelTransaction() {\n        double refund = currentBalance;\n        currentBalance = 0.0;\n        state = VendingMachineState.IDLE;\n        return refund;\n    }\n}\n"
---

### Problem Statement: Design a Vending Machine

Design a complete Vending Machine system managing product catalog, inventory, multi-denomination currency inputs, state-driven transaction execution, and change return.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Vending Machine.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage State Pattern (Machine Lifecycle States), Factory Pattern (Product & Coin Creation).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
