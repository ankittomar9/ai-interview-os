---
slug: lld-shipping-locker-system
title: Design an Amazon-Style Shipping Locker System
track: SPRING_LLD
difficulty: HARD
topics: [lld]
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- strategy-pattern
- locker-system
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Model compartments of varying sizes (Small, Medium, Large, Extra Large) with individual state (Empty, Occupied, Closed,
  DoorOpen).
- Use a Strategy Pattern to allocate the smallest available locker compartment that fits the parcel's dimensions.
- Secure package retrieval using cryptographically secure 6-digit OTP codes or QR tokens with expiration timestamps.
coaching:
  presentationTips:
  - Discuss delivery driver deposit workflow vs customer pickup workflow and error recovery (door stuck, parcel too big).
  - 'Address parcel expiration: what happens when a customer fails to pick up a package within 3 days? (Return to depot).'
  - 'Highlight concurrency: ensure two simultaneous drop-offs cannot be assigned to the same compartment.'
starterCode: "public class Locker {\n    // Size of the locker\nprivate final LockerSize size;\n    // Currently stored package\
  \ private ShippingPackage currentPackage;\n    // Date when the current package was assigned\nprivate Date assignmentDate;\n\
  \    // Access code for retrieving the package private String accessCode;\n    public Locker(LockerSize size) {\n      \
  \  this.size = size;\n    }\n    // Assigns a package to this locker and generates an access code\npublic void assignPackage(ShippingPackage\
  \ pkg, Date date) {\n        this.currentPackage = pkg;\n        this.assignmentDate = date;\n        this.accessCode =\
  \ generateAccessCode();\n    }\n    // Releases the locker by removing the current package and its details\npublic void\
  \ releaseLocker() {\n        this.currentPackage = null;\n        this.assignmentDate = null;\n        this.accessCode =\
  \ null;\n    }\n    // Calculates storage charges based on usage duration and policy\npublic BigDecimal calculateStorageCharges()\
  \ {\n        if (currentPackage == null || assignmentDate == null) {\n            return BigDecimal.ZERO;\n        }\n \
  \       AccountLockerPolicy\npolicy\n= currentPackage.getUser().getLockerPolicy();\n        long totalDaysUsed\n=\n    \
  \            (new Date().getTime() - assignmentDate.getTime()) / (1000 * 60 * 60 * 24);\n        // Check if exceeds maximum\
  \ period\nif (totalDaysUsed > policy.getMaximumPeriodDays()) {\n            currentPackage.updateShippingStatus(ShippingStatus.EXPIRED);\n\
  \            throw new MaximumStoragePeriodExceededException(\n                    \"Package has exceeded maximum allowed\
  \ storage period of \"\n                            + policy.getMaximumPeriodDays()\n                            + \" days\"\
  );\n        }\n        // Calculate chargeable days (excluding free period)\nlong chargeableDays\n= Math.max(0, totalDaysUsed\
  \ - policy.getFreePeriodDays());\n        return size.dailyCharge.multiply(new BigDecimal(chargeableDays));\n    }\n   \
  \ // Checks if the locker is available for new packages\npublic boolean isAvailable() {\n        return currentPackage ==\
  \ null;\n    }\n    // Verifies if the provided access code matches the locker's code\npublic boolean checkAccessCode(String\
  \ code) {\n        return this.accessCode != null && accessCode.equals(code);\n    }\n    // getter and setter methods are\
  \ omitted for brevity\n}\n\npublic enum LockerSize {\n    // Small locker with 10x10x10 dimensions and $5 daily charge\n\
  \    SMALL(\n            \"Small\",\n            new BigDecimal(\"5.00\"),\n            new BigDecimal(\"10.00\"),\n   \
  \         new BigDecimal(\"10.00\"),\n            new BigDecimal(\"10.00\")),\n    // Medium locker with 20x20x20 dimensions\
  \ and $10 daily charge\n    MEDIUM(\n            \"Medium\",\n            new BigDecimal(\"10.00\"),\n            new BigDecimal(\"\
  20.00\"),\n            new BigDecimal(\"20.00\"),\n            new BigDecimal(\"20.00\")),\n    // Large locker with 30x30x30\
  \ dimensions and $15 daily charge\n    LARGE(\n            \"Large\",\n            new BigDecimal(\"15.00\"),\n        \
  \    new BigDecimal(\"30.00\"),\n            new BigDecimal(\"30.00\"),\n            new BigDecimal(\"30.00\"));\n    //\
  \ Name of the locker size\nfinal String sizeName;\n    // Daily charge for using this size locker\nfinal BigDecimal dailyCharge;\n\
  \    // Width of the locker in inches\nfinal BigDecimal width;\n    // Height of the locker in inches\nfinal BigDecimal\
  \ height;\n    // Depth of the locker in inches\nfinal BigDecimal depth;\n    // Creates a new locker size with specified\
  \ dimensions and charges\n    LockerSize(\n            String sizeName,\n            BigDecimal dailyCharge,\n         \
  \   BigDecimal width,\n            BigDecimal height,\n            BigDecimal depth) {\n        this.sizeName = sizeName;\n\
  \        this.dailyCharge = dailyCharge;\n        this.width = width;\n        this.height = height;\n        this.depth\
  \ = depth;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Site {\n    // Map of locker sizes to\
  \ sets of lockers of that size\nfinal Map<LockerSize, Set<Locker>> lockers = new HashMap<>();\n    // Creates a new site\
  \ with specified number of lockers for each size\npublic Site(Map<LockerSize, Integer> lockers) {\n        for (Map.Entry<LockerSize,\
  \ Integer> entry : lockers.entrySet()) {\n            Set<Locker> lockerSet = new HashSet<>();\n            for (int i\n\
  =\n0; i < entry.getValue(); i++) {\n                lockerSet.add(new Locker(entry.getKey()));\n            }\n        \
  \    this.lockers.put(entry.getKey(), lockerSet);\n        }\n    }\n    // Finds an available locker of the specified size\n\
  public Locker findAvailableLocker(LockerSize size) {\n        for (Locker locker : lockers.get(size)) {\n            if\
  \ (locker.isAvailable()) {\n                return locker;\n            }\n        }\n        return null;\n    }\n    //\
  \ Places a package in an available locker of appropriate size\npublic Locker placePackage(ShippingPackage pkg, Date date)\
  \ {\n        // Determine the smallest locker size that can fit this package LockerSize\nsize\n= pkg.getLockerSize();\n\
  \        Locker\nlocker\n= findAvailableLocker(size);\n        if (locker != null) {\n            locker.assignPackage(pkg,\
  \ date);\n            pkg.updateShippingStatus(ShippingStatus.IN_LOCKER);\n            return locker;\n        }\n     \
  \   throw new NoLockerAvailableException(\n                \"No locker of size \" + size + \" is currently available\");\n\
  \    }\n}"
solutionCode: "public class Locker {\n    // Size of the locker\nprivate final LockerSize size;\n    // Currently stored package\
  \ private ShippingPackage currentPackage;\n    // Date when the current package was assigned\nprivate Date assignmentDate;\n\
  \    // Access code for retrieving the package private String accessCode;\n    public Locker(LockerSize size) {\n      \
  \  this.size = size;\n    }\n    // Assigns a package to this locker and generates an access code\npublic void assignPackage(ShippingPackage\
  \ pkg, Date date) {\n        this.currentPackage = pkg;\n        this.assignmentDate = date;\n        this.accessCode =\
  \ generateAccessCode();\n    }\n    // Releases the locker by removing the current package and its details\npublic void\
  \ releaseLocker() {\n        this.currentPackage = null;\n        this.assignmentDate = null;\n        this.accessCode =\
  \ null;\n    }\n    // Calculates storage charges based on usage duration and policy\npublic BigDecimal calculateStorageCharges()\
  \ {\n        if (currentPackage == null || assignmentDate == null) {\n            return BigDecimal.ZERO;\n        }\n \
  \       AccountLockerPolicy\npolicy\n= currentPackage.getUser().getLockerPolicy();\n        long totalDaysUsed\n=\n    \
  \            (new Date().getTime() - assignmentDate.getTime()) / (1000 * 60 * 60 * 24);\n        // Check if exceeds maximum\
  \ period\nif (totalDaysUsed > policy.getMaximumPeriodDays()) {\n            currentPackage.updateShippingStatus(ShippingStatus.EXPIRED);\n\
  \            throw new MaximumStoragePeriodExceededException(\n                    \"Package has exceeded maximum allowed\
  \ storage period of \"\n                            + policy.getMaximumPeriodDays()\n                            + \" days\"\
  );\n        }\n        // Calculate chargeable days (excluding free period)\nlong chargeableDays\n= Math.max(0, totalDaysUsed\
  \ - policy.getFreePeriodDays());\n        return size.dailyCharge.multiply(new BigDecimal(chargeableDays));\n    }\n   \
  \ // Checks if the locker is available for new packages\npublic boolean isAvailable() {\n        return currentPackage ==\
  \ null;\n    }\n    // Verifies if the provided access code matches the locker's code\npublic boolean checkAccessCode(String\
  \ code) {\n        return this.accessCode != null && accessCode.equals(code);\n    }\n    // getter and setter methods are\
  \ omitted for brevity\n}\n\npublic enum LockerSize {\n    // Small locker with 10x10x10 dimensions and $5 daily charge\n\
  \    SMALL(\n            \"Small\",\n            new BigDecimal(\"5.00\"),\n            new BigDecimal(\"10.00\"),\n   \
  \         new BigDecimal(\"10.00\"),\n            new BigDecimal(\"10.00\")),\n    // Medium locker with 20x20x20 dimensions\
  \ and $10 daily charge\n    MEDIUM(\n            \"Medium\",\n            new BigDecimal(\"10.00\"),\n            new BigDecimal(\"\
  20.00\"),\n            new BigDecimal(\"20.00\"),\n            new BigDecimal(\"20.00\")),\n    // Large locker with 30x30x30\
  \ dimensions and $15 daily charge\n    LARGE(\n            \"Large\",\n            new BigDecimal(\"15.00\"),\n        \
  \    new BigDecimal(\"30.00\"),\n            new BigDecimal(\"30.00\"),\n            new BigDecimal(\"30.00\"));\n    //\
  \ Name of the locker size\nfinal String sizeName;\n    // Daily charge for using this size locker\nfinal BigDecimal dailyCharge;\n\
  \    // Width of the locker in inches\nfinal BigDecimal width;\n    // Height of the locker in inches\nfinal BigDecimal\
  \ height;\n    // Depth of the locker in inches\nfinal BigDecimal depth;\n    // Creates a new locker size with specified\
  \ dimensions and charges\n    LockerSize(\n            String sizeName,\n            BigDecimal dailyCharge,\n         \
  \   BigDecimal width,\n            BigDecimal height,\n            BigDecimal depth) {\n        this.sizeName = sizeName;\n\
  \        this.dailyCharge = dailyCharge;\n        this.width = width;\n        this.height = height;\n        this.depth\
  \ = depth;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Site {\n    // Map of locker sizes to\
  \ sets of lockers of that size\nfinal Map<LockerSize, Set<Locker>> lockers = new HashMap<>();\n    // Creates a new site\
  \ with specified number of lockers for each size\npublic Site(Map<LockerSize, Integer> lockers) {\n        for (Map.Entry<LockerSize,\
  \ Integer> entry : lockers.entrySet()) {\n            Set<Locker> lockerSet = new HashSet<>();\n            for (int i\n\
  =\n0; i < entry.getValue(); i++) {\n                lockerSet.add(new Locker(entry.getKey()));\n            }\n        \
  \    this.lockers.put(entry.getKey(), lockerSet);\n        }\n    }\n    // Finds an available locker of the specified size\n\
  public Locker findAvailableLocker(LockerSize size) {\n        for (Locker locker : lockers.get(size)) {\n            if\
  \ (locker.isAvailable()) {\n                return locker;\n            }\n        }\n        return null;\n    }\n    //\
  \ Places a package in an available locker of appropriate size\npublic Locker placePackage(ShippingPackage pkg, Date date)\
  \ {\n        // Determine the smallest locker size that can fit this package LockerSize\nsize\n= pkg.getLockerSize();\n\
  \        Locker\nlocker\n= findAvailableLocker(size);\n        if (locker != null) {\n            locker.assignPackage(pkg,\
  \ date);\n            pkg.updateShippingStatus(ShippingStatus.IN_LOCKER);\n            return locker;\n        }\n     \
  \   throw new NoLockerAvailableException(\n                \"No locker of size \" + size + \" is currently available\");\n\
  \    }\n}\n\npublic class BasicShippingPackage\nimplements ShippingPackage {\n    // Unique identifier for the order\nprivate\
  \ final String orderId;\n    // User account associated with this package private final Account user;\n    private final\
  \ BigDecimal width;\n    private final BigDecimal height;\n    private final BigDecimal depth;\n    // Current status of\
  \ the package private ShippingStatus status;\n    // Creates a new shipping package with specified dimensions\npublic BasicShippingPackage(\n\
  \            String orderId, Account user, BigDecimal width, BigDecimal height, BigDecimal depth) {\n        this.orderId\
  \ = orderId;\n        this.user = user;\n        this.width = width;\n        this.height = height;\n        this.depth\
  \ = depth;\n        this.status = ShippingStatus.CREATED;\n    }\n    // Returns the current package status\n@Override\n\
  \    public ShippingStatus getStatus() {\n        return status;\n    }\n    // Updates the package status\n@Override\n\
  \    public void updateShippingStatus(ShippingStatus status) {\n        this.status = status;\n    }\n    // Determines\
  \ the smallest locker size that can fit this package @Override\n    public LockerSize getLockerSize() {\n        for (LockerSize\
  \ size : LockerSize.values()) {\n            if (size.getWidth().compareTo(width) >= 0\n                    && size.getHeight().compareTo(height)\
  \ >= 0\n                    && size.getDepth().compareTo(depth) >= 0) {\n                return size;\n            }\n \
  \       }\n        throw new PackageIncompatibleException(\"No locker size available for the package\");\n    } // getter\
  \ methods are omitted for brevity\n}\n\npublic class Account {\n    private final String accountId;\n    private final String\
  \ ownerName;\n    // Policy defining locker usage rules for this account\nprivate final AccountLockerPolicy lockerPolicy;\n\
  \    // Total charges accumulated for locker usage\nprivate BigDecimal\nusageCharges\n=\nnew BigDecimal(\"0.00\");\n   \
  \ // Creates a new account with specified details and policy\npublic Account(String accountId, String ownerName, AccountLockerPolicy\
  \ lockerPolicy) {\n        this.accountId = accountId;\n        this.ownerName = ownerName;\n        this.lockerPolicy =\
  \ lockerPolicy;\n    }\n    // Adds a charge to the account's total usage charges\npublic void addUsageCharge(BigDecimal\
  \ amount) {\n        usageCharges = usageCharges.add(amount);\n    }\n    // getter methods are omitted for brevity\n}\n\
  \npublic class AccountLockerPolicy {\n    // Number of days of free storage\nfinal int freePeriodDays;\n    // Maximum number\
  \ of days a package can be stored\nfinal int maximumPeriodDays;\n    // Creates a new locker policy with specified free\
  \ and maximum periods\npublic AccountLockerPolicy(int freePeriodDays, int maximumPeriodDays) {\n        this.freePeriodDays\
  \ = freePeriodDays;\n        this.maximumPeriodDays = maximumPeriodDays;\n    }\n    // getter methods are omitted for brevity\n\
  }\n\npublic class LockerManager {\n    // The site being managed\nprivate final Site site;\n    // Service for sending notifications\n\
  private final NotificationInterface notificationService;\n    // Map of account IDs to account objects\nprivate final Map<String,\
  \ Account> accounts;\n    // Map of access codes to lockers\nprivate final Map<String, Locker> accessCodeMap = new HashMap<>();\n\
  \    // Creates a new locker manager for a site\npublic LockerManager(\n            Site site, Map<String, Account> accounts,\
  \ NotificationInterface notificationService) {\n        this.site = site;\n        this.accounts = accounts;\n        this.notificationService\
  \ = notificationService;\n    }\n    // Assigns a package to an available locker\npublic Locker assignPackage(ShippingPackage\
  \ pkg, Date date) {\n        Locker\nlocker\n= site.placePackage(pkg, date);\n        if (locker != null) {\n          \
  \  accessCodeMap.put(locker.getAccessCode(), locker);\n            notificationService.sendNotification(\n             \
  \       \"Package assigned to locker\" + locker.getAccessCode(), pkg.getUser());\n        }\n        return locker;\n  \
  \  }\n    // Processes package pickup using an access code\npublic Locker pickUpPackage(String accessCode) {\n        Locker\n\
  locker\n= accessCodeMap.get(accessCode);\n        if (locker != null && locker.checkAccessCode(accessCode)) {\n        \
  \    try {\n                BigDecimal\ncharge\n= locker.calculateStorageCharges();\n                ShippingPackage\npkg\n\
  = locker.getPackage();\n                locker.releaseLocker();\n                pkg.getUser().addUsageCharge(charge);\n\
  \                pkg.updateShippingStatus(ShippingStatus.RETRIEVED);\n                return locker;\n            } catch\
  \ (MaximumStoragePeriodExceededException e) {\n                locker.releaseLocker();\n                return locker;\n\
  \            }\n        }\n        return null;\n    }\n    // getter methods are omitted for brevity\n}\n\nclass LockerFactory\
  \ {\n    // Creates a new locker of the specified size\npublic static Locker createLocker(LockerSize size) {\n        return\
  \ switch (size) {\n            case SMALL -> new Locker(LockerSize.SMALL);\n            case MEDIUM -> new Locker(LockerSize.MEDIUM);\n\
  \            case LARGE -> new Locker(LockerSize.LARGE);\n            case XLARGE -> new Locker(LockerSize.XLARGE);\n  \
  \      };\n    }\n}\n\nclass LockerManagerChange {\n    // List of observers that will be notified of locker events\nprivate\
  \ final List<LockerEventObserver> observers = new ArrayList<>();\n    public void addObserver(LockerEventObserver observer)\
  \ {\n        observers.add(observer);\n    }\n    public void removeObserver(LockerEventObserver observer) {\n        observers.remove(observer);\n\
  \    }\n    private void notifyObservers(String message, Account account) {\n        for (LockerEventObserver observer :\
  \ observers) {\n            observer.update(message, account);\n        }\n    }\n    // Assigns a package to an available\
  \ locker and notifies observers.\npublic void assignPackage(ShippingPackage pkg) {\n        Locker\nlocker\n= assignLockerToPackage(pkg);\n\
  \        if (locker != null) {\n            notifyObservers(\"Package assigned to locker\", pkg.getUser());\n        }\n\
  \    }\n    private Locker assignLockerToPackage(ShippingPackage pkg) {\n        return null;\n    }\n}\n\n// Interface\
  \ for objects that need to be notified of locker events\npublic interface LockerEventObserver {\n    // Updates the observer\
  \ with a message and the affected account\nvoid update(String message, Account account);\n}\n\n// Implementation of LockerEventObserver\
  \ that sends email notifications\nclass EmailNotification\nimplements LockerEventObserver {\n    // Updates the observer\
  \ with a message and sends it to the account owner\npublic void update(String message, Account account) {\n        // send\
  \ email to account owner\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design an Amazon-Style Shipping Locker System


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Strategy Pattern (Locker Compartment Allocation), State Pattern (Compartment & Package States), Observer Pattern (Customer
  Notification)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
---
### Problem Statement: Design an Amazon-Style Shipping Locker System

Design an automated smart parcel delivery locker system (e.g. Amazon Hub Locker) supporting multi-size compartments, secure OTP pickup, delivery deposit, and parcel expiry handling.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design an Amazon-Style Shipping Locker System.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage Strategy Pattern (Locker Compartment Allocation), State Pattern (Compartment & Package States), Observer Pattern (Customer Notification).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
