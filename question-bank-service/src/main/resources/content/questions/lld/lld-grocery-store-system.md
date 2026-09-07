---
slug: lld-grocery-store-system
title: Design a Grocery Store Checkout System
track: SPRING_LLD
difficulty: MEDIUM
topics: [lld]
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- strategy-pattern
- observer-pattern
- billing
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the Strategy Pattern for promotional pricing rules (Buy-One-Get-One-Free, Percentage Discount, Bulk Tier Pricing).
- Use the Observer Pattern to trigger automatic inventory decrement and low-stock reorder alerts upon checkout completion.
- Model items with both unit-based pricing (barcodes) and weight-based pricing (per pound / kilogram).
coaching:
  presentationTips:
  - Explain how the billing engine iterates through line items, applies eligible coupon/discount strategies, and computes
    sales tax.
  - 'Demonstrate extensibility: how easy is it to add a ''Buy 2 Get 1 at 50% Off'' discount without changing the Cart or Cashier
    classes?'
  - Discuss barcode scanning and weight scale integration as input adapters.
starterCode: "public class Item {\n    private final String name;\n    private final String barcode;\n    private final String\
  \ category;\n    private BigDecimal price;\n    public Item(String name, String barcode, String category, BigDecimal price)\
  \ {\n        this.name = name;\n        this.barcode = barcode;\n        this.category = category;\n        this.price =\
  \ price;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Catalog {\n    // Map of barcodes\
  \ to their corresponding items\nprivate final Map<String, Item> items = new HashMap<>();\n    public void updateItem(Item\
  \ item) {\n        items.put(item.getBarcode(), item);\n    }\n    public void removeItem(String barcode) {\n        items.remove(barcode);\n\
  \    }\n    public Item getItem(String barcode) {\n        return items.get(barcode);\n    }\n}\n\npublic class Inventory\
  \ {\n    // Map of barcodes to their stock quantities\nprivate final Map<String, Integer> stock = new HashMap<>();\n   \
  \ public void addStock(String barcode, int count) {\n        stock.put(barcode, stock.getOrDefault(barcode, 0) + count);\n\
  \    }\n    public void reduceStock(String barcode, int count) {\n        stock.put(barcode, stock.getOrDefault(barcode,\
  \ 0) - count);\n    }\n    public int getStock(String barcode) {\n        return stock.getOrDefault(barcode, 0);\n    }\n\
  }"
solutionCode: "public class Item {\n    private final String name;\n    private final String barcode;\n    private final String\
  \ category;\n    private BigDecimal price;\n    public Item(String name, String barcode, String category, BigDecimal price)\
  \ {\n        this.name = name;\n        this.barcode = barcode;\n        this.category = category;\n        this.price =\
  \ price;\n    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Catalog {\n    // Map of barcodes\
  \ to their corresponding items\nprivate final Map<String, Item> items = new HashMap<>();\n    public void updateItem(Item\
  \ item) {\n        items.put(item.getBarcode(), item);\n    }\n    public void removeItem(String barcode) {\n        items.remove(barcode);\n\
  \    }\n    public Item getItem(String barcode) {\n        return items.get(barcode);\n    }\n}\n\npublic class Inventory\
  \ {\n    // Map of barcodes to their stock quantities\nprivate final Map<String, Integer> stock = new HashMap<>();\n   \
  \ public void addStock(String barcode, int count) {\n        stock.put(barcode, stock.getOrDefault(barcode, 0) + count);\n\
  \    }\n    public void reduceStock(String barcode, int count) {\n        stock.put(barcode, stock.getOrDefault(barcode,\
  \ 0) - count);\n    }\n    public int getStock(String barcode) {\n        return stock.getOrDefault(barcode, 0);\n    }\n\
  }\n\npublic class DiscountCampaign {\n    // Unique identifier for the discount campaign\nprivate final String discountId;\n\
  \    // Name of the discount campaign\nprivate final String name;\n    // Criteria that determines if the discount applies\
  \ to an item or category\nprivate final DiscountCriteria criteria;\n    // Strategy for calculating the discounted price\n\
  private final DiscountCalculationStrategy calculationStrategy;\n    // Creates a new discount campaign with the specified\
  \ details\npublic DiscountCampaign(\n            String discountId,\n            String name,\n            DiscountCriteria\
  \ criteria,\n            DiscountCalculationStrategy calculationStrategy) {\n        this.discountId = discountId;\n   \
  \     this.name = name;\n        this.criteria = criteria;\n        this.calculationStrategy = calculationStrategy;\n  \
  \  }\n    // Checks if this discount applies to the given item\npublic boolean isApplicable(Item item) {\n        return\
  \ criteria.isApplicable(item);\n    }\n    // Calculates the discounted price for the given order item\npublic BigDecimal\
  \ calculateDiscount(OrderItem item) {\n        return calculationStrategy.calculateDiscountedPrice(item.calculatePrice());\n\
  \    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class OrderItem {\n    // The item being ordered\n\
  private final Item item;\n    // Quantity of the item\nprivate final int quantity;\n    // Creates a new order item with\
  \ the specified item and quantity\npublic OrderItem(Item item, int quantity) {\n        this.item = item;\n        this.quantity\
  \ = quantity;\n    }\n    // Calculates the total price for this order item without any discount\npublic BigDecimal calculatePrice()\
  \ {\n        return item.getPrice().multiply(BigDecimal.valueOf(quantity));\n    }\n    // Calculates the total price for\
  \ this order item with the given discount\npublic BigDecimal calculatePriceWithDiscount(DiscountCampaign newDiscount) {\n\
  \        return newDiscount.calculateDiscount(this);\n    } // getter and setter methods are omitted for brevity\n}\n\n\
  public class Order {\n    // Unique identifier for the order\nprivate final String orderId;\n    // List of items in the\
  \ order\nprivate final List<OrderItem> items = new ArrayList<>();\n    // Map of items to their applied discounts\nprivate\
  \ final Map<OrderItem, DiscountCampaign> appliedDiscounts = new HashMap<>();\n    // Amount paid by the customer\nprivate\
  \ BigDecimal\npaymentAmount\n= BigDecimal.ZERO;\n    // Creates a new order with a random UUID\npublic Order() {\n     \
  \   this.orderId = String.valueOf(UUID.randomUUID());\n    }\n    // Adds an item to the order\npublic void addItem(OrderItem\
  \ item) {\n        items.add(item);\n    }\n    // Calculates the subtotal of all items without discounts\npublic BigDecimal\
  \ calculateSubtotal() {\n        return items.stream()\n                .map(OrderItem::calculatePrice)\n              \
  \  .reduce(BigDecimal.ZERO, BigDecimal::add);\n    }\n    // Calculates the total price including all applied discounts\n\
  public BigDecimal calculateTotal() {\n        return items.stream()\n                .map(\n                        item\
  \ -> {\n                            DiscountCampaign\ndiscount\n= appliedDiscounts.get(item);\n                        \
  \    return discount != null\n                                    ? item.calculatePriceWithDiscount(discount)\n        \
  \                            : item.calculatePrice();\n                        })\n                .reduce(BigDecimal.ZERO,\
  \ BigDecimal::add);\n    }\n    // Applies a discount to a specific item in the order\npublic void applyDiscount(OrderItem\
  \ item, DiscountCampaign discount) {\n        appliedDiscounts.put(item, discount);\n    }\n    // Calculates the change\
  \ to be returned to the customer\npublic BigDecimal calculateChange() {\n        return paymentAmount.subtract(calculateTotal());\n\
  \    }\n    // getter and setter methods are omitted for brevity\n}\n\npublic class Checkout {\n    // Current order being\
  \ processed\nprivate Order currentOrder;\n    // List of active discount campaigns\nprivate final List<DiscountCampaign>\
  \ activeDiscounts;\n    // Creates a new checkout with the given active discounts\npublic Checkout(List<DiscountCampaign>\
  \ activeDiscounts) {\n        this.activeDiscounts = activeDiscounts;\n        startNewOrder();\n    }\n    // Starts a\
  \ new order\npublic void startNewOrder() {\n        this.currentOrder = new Order();\n    }\n    // Processes the payment\
  \ and returns the change\npublic BigDecimal processPayment(BigDecimal paymentAmount) {\n        currentOrder.setPayment(paymentAmount);\n\
  \        return currentOrder.calculateChange();\n    }\n    // Adds an item to the current order and applies applicable\
  \ discounts\npublic void addItemToOrder(Item item, int quantity) {\n        OrderItem\norderItem\n=\nnew OrderItem(item,\
  \ quantity);\n        currentOrder.addItem(orderItem);\n        for (DiscountCampaign newDiscount : activeDiscounts) {\n\
  \            if (newDiscount.isApplicable(item)) {\n                // if there are multiple newDiscount that apply to item,\
  \ apply the higher one\nif (currentOrder.getAppliedDiscounts().containsKey(orderItem)) {\n                    DiscountCampaign\n\
  existingDiscount\n=\n                            currentOrder.getAppliedDiscounts().get(orderItem);\n                  \
  \  if (orderItem\n                                    .calculatePriceWithDiscount(newDiscount)\n                       \
  \             .compareTo(\n                                            orderItem.calculatePriceWithDiscount(existingDiscount))\n\
  \                            > 0) {\n                        currentOrder.applyDiscount(orderItem, newDiscount);\n     \
  \               }\n                } else {\n                    currentOrder.applyDiscount(orderItem, newDiscount);\n \
  \               }\n            }\n        }\n    }\n    // Generates a receipt for the current order\npublic Receipt getReceipt()\
  \ {\n        return new Receipt(currentOrder);\n    }\n    // Calculates the total amount for the current order\npublic\
  \ BigDecimal getOrderTotal() {\n        return currentOrder.calculateTotal();\n    }\n}\n\npublic class GroceryStoreSystem\
  \ {\n    // Product catalog containing all available items\nprivate final Catalog catalog;\n    // Inventory tracking system\n\
  private final Inventory inventory;\n    // List of active discount campaigns\nprivate List<DiscountCampaign> activeDiscounts\
  \ = new ArrayList<>();\n    // Checkout system for processing orders\nprivate final Checkout checkout;\n    public GroceryStoreSystem()\
  \ {\n        this.catalog = new Catalog();\n        this.inventory = new Inventory();\n        this.checkout = new Checkout(activeDiscounts);\n\
  \    }\n    // Adds or updates an item in the catalog\npublic void addOrUpdateItem(Item item) {\n        catalog.updateItem(item);\n\
  \    }\n    // Updates the inventory count for an item\npublic void updateInventory(String barcode, int count) {\n     \
  \   inventory.addStock(barcode, count);\n    }\n    // Adds a new discount campaign to the system\npublic void addDiscountCampaign(DiscountCampaign\
  \ discount) {\n        activeDiscounts.add(discount);\n    }\n    // Retrieves an item from the catalog by its barcode\n\
  public Item getItemByBarcode(String barcode) {\n        return catalog.getItem(barcode);\n    }\n    // Removes an item\
  \ from the catalog\npublic void removeItem(String barcode) {\n        catalog.removeItem(barcode);\n    }\n}\n\n// Composite\
  \ criteria that combines multiple discount criteria\npublic class CompositeCriteria\nimplements DiscountCriteria {\n   \
  \ // List of criteria to be combined\nprivate final List<DiscountCriteria> criteriaList;\n    // Creates a new composite\
  \ criteria with the given list of criteria\npublic CompositeCriteria(List<DiscountCriteria> criteriaList) {\n        this.criteriaList\
  \ = new ArrayList<>(criteriaList);\n    }\n    // Checks if the item satisfies all the criteria in the list\n@Override\n\
  \    public boolean isApplicable(Item item) {\n        return criteriaList.stream().allMatch(criteria -> criteria.isApplicable(item));\n\
  \    }\n    // Adds a new criteria to the composite\npublic void addCriteria(DiscountCriteria criteria) {\n        criteriaList.add(criteria);\n\
  \    }\n    // Removes a criteria from the composite\npublic void removeCriteria(DiscountCriteria criteria) {\n        criteriaList.remove(criteria);\n\
  \    }\n}\n\npublic class FixedDiscountDecorator\nimplements DiscountCalculationStrategy {\n    // The strategy being decorated\n\
  private final DiscountCalculationStrategy strategy;\n    // The fixed amount to be added to the discount\nprivate final\
  \ BigDecimal fixedAmount;\n    public FixedDiscountDecorator(DiscountCalculationStrategy strategy, BigDecimal fixedAmount)\
  \ {\n        this.strategy = strategy;\n        this.fixedAmount = fixedAmount;\n    }\n    // Calculates the discounted\
  \ price by applying both the base strategy and the fixed amount\n@Override\n    public BigDecimal calculateDiscountedPrice(BigDecimal\
  \ originalPrice) {\n        return strategy.calculateDiscountedPrice(originalPrice).subtract(fixedAmount);\n    }\n}\n\n\
  public class PercentageDiscountDecorator\nimplements DiscountCalculationStrategy {\n    // The strategy being decorated\n\
  private final DiscountCalculationStrategy strategy;\n    // The additional percentage to be discounted\nprivate final BigDecimal\
  \ additionalPercentage;\n    public PercentageDiscountDecorator(\n            DiscountCalculationStrategy strategy, BigDecimal\
  \ additionalPercentage) {\n        this.strategy = strategy;\n        this.additionalPercentage = additionalPercentage;\n\
  \    }\n    // Calculates the discounted price by applying both the base strategy and the additional\n// percentage\n@Override\n\
  \    public BigDecimal calculateDiscountedPrice(BigDecimal originalPrice) {\n        BigDecimal\nbaseDiscountedPrice\n=\
  \ strategy.calculateDiscountedPrice(originalPrice);\n        return baseDiscountedPrice.multiply(\n                BigDecimal.ONE.subtract(additionalPercentage.divide(BigDecimal.valueOf(100))));\n\
  \    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Grocery Store Checkout System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Strategy Pattern (Pricing & Discounts), Observer Pattern (Inventory & Loyalty Alerts), Factory Pattern (Product Types)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
---
### Problem Statement: Design a Grocery Store Checkout System

Design a Point-of-Sale (POS) Grocery Store Checkout System handling barcode scanning, weight-based produce, promotional discount strategies, inventory tracking, and payment processing.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Grocery Store Checkout System.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage Strategy Pattern (Pricing & Discounts), Observer Pattern (Inventory & Loyalty Alerts), Factory Pattern (Product Types).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
