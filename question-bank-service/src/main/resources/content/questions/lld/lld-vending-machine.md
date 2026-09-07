---
slug: lld-vending-machine
title: Design a Vending Machine
track: SPRING_LLD
difficulty: MID
tags:
- object-oriented-design
- lld
- java
- design-patterns
- state-pattern
- state-machine
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the State Pattern to manage transitions between IdleState, HasMoneyState, DispensingState, and SoldOutState.
- Encapsulate state-specific behaviors inside State subclasses so the VendingMachine context delegates without nested switch
  statements.
- Maintain an Inventory manager that tracks item counts and denominations of coins/bills for exact change calculation.
coaching:
  presentationTips:
  - 'Walk through the state transition diagram clearly: insert money -> select product -> dispense -> return change -> idle.'
  - Demonstrate how invalid actions in a state (e.g., pressing dispense before inserting coins) throw clean domain exceptions.
  - Discuss greedy coin change calculation versus inventory-aware denomination dispense.
starterCode: "class Product {\n    final String productCode;\n    final String description;\n    final BigDecimal unitPrice;\n\
  \    public Product(String productCode, String description, BigDecimal unitPrice) {\n        this.productCode = productCode;\n\
  \        this.description = description;\n        this.unitPrice = unitPrice;\n    }\n}\n\npublic class InventoryManager\
  \ {\n    // Maps rack codes to their corresponding rack objects\nprivate Map<String, Rack> racks;\n    public InventoryManager()\
  \ {\n        racks = new HashMap<>();\n    }\n    // Retrieves the product from a specific rack using its code\npublic Product\
  \ getProductInRack(String rackCode) {\n        return racks.get(rackCode).getProduct();\n    }\n    // Dispenses a product\
  \ from the specified rack and decrements its count\npublic void dispenseProductFromRack(Rack rack) {\n        if (rack.getProductCount()\
  \ > 0) {\n            rack.setCount(rack.getProductCount() - 1);\n        } else {\n            throw new IllegalStateException(\"\
  Cannot dispense product. Rack is empty.\");\n        }\n    }\n    public void updateRack(Map<String, Rack> racks) {\n \
  \       this.racks = racks;\n    }\n    public Rack getRack(String name) {\n        return racks.get(name);\n    }\n}\n\n\
  public class Rack {\n    private final String rackCode;\n    private final Product product;\n    private int count;\n  \
  \  public Rack(final String rackCode, final Product product, final int count) {\n        this.rackCode = rackCode;\n   \
  \     this.product = product;\n        this.count = count;\n    }\n    public Product getProduct() {\n        return product;\n\
  \    }\n    public int getProductCount() {\n        return count;\n    }\n}"
solutionCode: "class Product {\n    final String productCode;\n    final String description;\n    final BigDecimal unitPrice;\n\
  \    public Product(String productCode, String description, BigDecimal unitPrice) {\n        this.productCode = productCode;\n\
  \        this.description = description;\n        this.unitPrice = unitPrice;\n    }\n}\n\npublic class InventoryManager\
  \ {\n    // Maps rack codes to their corresponding rack objects\nprivate Map<String, Rack> racks;\n    public InventoryManager()\
  \ {\n        racks = new HashMap<>();\n    }\n    // Retrieves the product from a specific rack using its code\npublic Product\
  \ getProductInRack(String rackCode) {\n        return racks.get(rackCode).getProduct();\n    }\n    // Dispenses a product\
  \ from the specified rack and decrements its count\npublic void dispenseProductFromRack(Rack rack) {\n        if (rack.getProductCount()\
  \ > 0) {\n            rack.setCount(rack.getProductCount() - 1);\n        } else {\n            throw new IllegalStateException(\"\
  Cannot dispense product. Rack is empty.\");\n        }\n    }\n    public void updateRack(Map<String, Rack> racks) {\n \
  \       this.racks = racks;\n    }\n    public Rack getRack(String name) {\n        return racks.get(name);\n    }\n}\n\n\
  public class Rack {\n    private final String rackCode;\n    private final Product product;\n    private int count;\n  \
  \  public Rack(final String rackCode, final Product product, final int count) {\n        this.rackCode = rackCode;\n   \
  \     this.product = product;\n        this.count = count;\n    }\n    public Product getProduct() {\n        return product;\n\
  \    }\n    public int getProductCount() {\n        return count;\n    }\n}\n\npublic class PaymentProcessor {\n    // Tracks\
  \ the current balance in the payment processor\nprivate BigDecimal\ncurrentBalance\n= BigDecimal.ZERO;\n    // Adds the\
  \ specified amount to the current balance\npublic void addBalance(BigDecimal amount) {\n        currentBalance = currentBalance.add(amount);\n\
  \    }\n    // Deducts the specified amount from the current balance\npublic void charge(BigDecimal amount) {\n        currentBalance\
  \ = currentBalance.subtract(amount);\n    }\n    // Returns the current balance as change and resets the balance to zero\n\
  public BigDecimal returnChange() {\n        BigDecimal\nchange\n= currentBalance;\n        currentBalance = BigDecimal.ZERO;\n\
  \        return change;\n    }\n    // Returns the current balance\npublic BigDecimal getCurrentBalance() {\n        return\
  \ currentBalance;\n    }\n}\n\nclass VendingMachine {\n    // Stores the history of all completed transactions\nprivate\
  \ final List<Transaction> transactionHistory;\n    // Manages the inventory of products in the vending machine\nprivate\
  \ final InventoryManager inventoryManager;\n    // Handles all payment-related operations\nprivate final PaymentProcessor\
  \ paymentProcessor;\n    // Tracks the current ongoing transaction\nprivate Transaction currentTransaction;\n    // Represents\
  \ the current state of the vending machine\nprivate VendingMachineState currentState;\n    // Tracks the current balance\
  \ in the machine\nprivate double balance;\n    // Stores the currently selected product code\nprivate String selectedProduct;\n\
  \    public VendingMachine() {\n        transactionHistory = new ArrayList<>();\n        currentTransaction = new Transaction();\n\
  \        inventoryManager = new InventoryManager();\n        paymentProcessor = new PaymentProcessor();\n        this.currentState\
  \ = new NoMoneyInsertedState();\n        this.balance = 0.0;\n        this.selectedProduct = null;\n    }\n    // Updates\
  \ the rack configuration with new product racks\nvoid setRack(Map<String, Rack> rack) {\n        inventoryManager.updateRack(rack);\n\
  \    }\n    // Adds money to the payment processor\nvoid insertMoney(final BigDecimal amount) {\n        paymentProcessor.addBalance(amount);\n\
  \    }\n    // Selects a product from a specific rack\nvoid chooseProduct(String rackId) {\n        final Product\nproduct\n\
  = inventoryManager.getProductInRack(rackId);\n        currentTransaction.setRack(inventoryManager.getRack(rackId));\n  \
  \      currentTransaction.setProduct(product);\n    }\n    // Processes and completes the current transaction\n    Transaction\
  \ confirmTransaction()\nthrows InvalidTransactionException {\n        // Step 1: Validate the transaction before processing\n\
  \        validateTransaction();\n        // Step 2: Charge the customer for the product\n        paymentProcessor.charge(currentTransaction.getProduct().getUnitPrice());\n\
  \        // Step 3: Dispense the product from the rack\n        inventoryManager.dispenseProductFromRack(currentTransaction.getRack());\n\
  \        // Step 4: Return the change to the customer\n        currentTransaction.setTotalAmount(paymentProcessor.returnChange());\n\
  \        // Step 5: Add the completed transaction to the history\n        transactionHistory.add(currentTransaction);\n\
  \        Transaction\ncompletedTransaction\n= currentTransaction;\n        // Reset the current transaction for the next\
  \ purchase.\n        currentTransaction = new Transaction();\n        return completedTransaction;\n    }\n    // Validates\
  \ the current transaction for product availability and sufficient funds\nprivate void validateTransaction()\nthrows InvalidTransactionException\
  \ {\n        if (currentTransaction.getProduct() == null) {\n            throw new InvalidTransactionException(\"Invalid\
  \ product selection\");\n        } else\nif (currentTransaction.getRack().getProductCount() == 0) {\n            throw new\
  \ InvalidTransactionException(\"Insufficient inventory for product.\");\n        } else\nif (paymentProcessor\n        \
  \                .getCurrentBalance()\n                        .compareTo(currentTransaction.getProduct().getUnitPrice())\n\
  \                < 0) {\n            throw new InvalidTransactionException(\"Insufficient fund\");\n        }\n    }\n \
  \   // Returns an unmodifiable list of all completed transactions\npublic List<Transaction> getTransactionHistory() {\n\
  \        return Collections.unmodifiableList(transactionHistory);\n    }\n    // Cancels the current transaction and returns\
  \ any inserted money\npublic void cancelTransaction() {\n        paymentProcessor.returnChange();\n        currentTransaction\
  \ =\n                new Transaction(); // Reset the current transaction for the next purchase.\n    }\n    // Returns the\
  \ inventory manager instance\npublic InventoryManager getInventoryManager() {\n        return inventoryManager;\n    }\n\
  }\n\npublic interface VendingMachineState {\n    // Handles money insertion in the current state\nvoid insertMoney(VendingMachine\
  \ VM, double amount);\n    // Handles product selection in the current state\nvoid selectProductByCode(VendingMachine VM,\
  \ String productCode)\nthrows InvalidStateException;\n    // Handles product dispensing in the current state\nvoid dispenseProduct(VendingMachine\
  \ VM)\nthrows InvalidStateException;\n    // Returns a description of the current state\n    String getStateDescription();\n\
  }\n\npublic class NoMoneyInsertedState\nimplements VendingMachineState {\n    // Adds money to the machine and transitions\
  \ to MoneyInsertedState\n@Override\n    public void insertMoney(VendingMachine VM, double amount) {\n        VM.addBalance(amount);\n\
  \        VM.setState(new MoneyInsertedState());\n    }\n    // Throws exception as product selection is not allowed without\
  \ money\n@Override\n    public void selectProductByCode(VendingMachine VM, String productCode)\nthrows InvalidStateException\
  \ {\n        throw new InvalidStateException(\"Cannot select a product without inserting money.\");\n    }\n    // Throws\
  \ exception as product dispensing is not allowed without money\n@Override\n    public void dispenseProduct(VendingMachine\
  \ VM)\nthrows InvalidStateException {\n        throw new InvalidStateException(\"Cannot dispense product without inserting\
  \ money.\");\n    }\n    // Returns a description of the current state\n@Override\n    public String getStateDescription()\
  \ {\n        return \"No Money Inserted State - Please insert money to proceed\";\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Vending Machine


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (Machine Lifecycle States), Factory Pattern (Product & Coin Creation)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
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
