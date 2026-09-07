---
slug: lld-atm-system
title: Design an Automated Teller Machine (ATM)
track: SPRING_LLD
difficulty: SENIOR
tags:
- object-oriented-design
- lld
- java
- design-patterns
- state-pattern
- chain-of-responsibility
- atm
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the State Pattern to control ATM operations (Idle, CardInserted, PinAuthenticated, TransactionSelected, DispensingCash).
- Use the Chain of Responsibility Pattern for cash dispensing across denominations ($100 -> $50 -> $20 -> $10).
- 'Maintain transactional integrity: ensure bank balance deduction, cash dispensing, and receipt generation execute atomically
  or rollback.'
coaching:
  presentationTips:
  - 'Explain why the Chain of Responsibility is ideal for cash dispensing: each dispenser handles its denomination and forwards
    remainder to the next.'
  - 'Walk through PIN authentication security: track failed attempts and transition to CardRetainedState after 3 failures.'
  - Discuss hardware failure recovery (cash jam, network timeout during debit).
starterCode: "// Represents a bank account with balance, card details, and PIN security\npublic class Account {\n    private\
  \ BigDecimal balance;\n    private final String accountNumber;\n    private final String cardNumber;\n    private final\
  \ byte[] cardPinHash;\n    private final AccountType accountType;\n    // Creates a new account with initial zero balance\
  \ and hashed PIN\npublic Account(\n            final String accountNumber,\n            final AccountType type,\n      \
  \      final String cardNumber,\n            final String pin) {\n        this.accountNumber = accountNumber;\n        this.accountType\
  \ = type;\n        this.cardNumber = cardNumber;\n        this.cardPinHash = calculateMd5(pin); // PIN is hashed for security\n\
  this.balance = BigDecimal.ZERO;\n    }\n    // Validates the entered PIN against stored hash\npublic boolean validatePin(String\
  \ pinNumber) {\n        byte[] entryPinHash = calculateMd5(pinNumber);\n        return Arrays.equals(cardPinHash, entryPinHash);\n\
  \    }\n    // Updates account balance by adding the specified amount\npublic void updateBalanceWithTransaction(final BigDecimal\
  \ balanceChange) {\n        this.balance = this.balance.add(balanceChange);\n    }\n    // getter methods omitted for brevity\n\
  }\n// Defines the type of bank account\npublic enum AccountType {\n    // Regular checking account for daily transactions\n\
  \    CHECKING,\n    // Interest-bearing savings account\n    SAVING\n}\n\npublic interface BankInterface {\n    void addAccount(String\
  \ accountNumber, AccountType type, String cardNumber, String pin);\n    boolean validateCard(String cardNumber);\n    boolean\
  \ checkPin(String cardNumber, String pinNumber);\n    Account getAccountByAccountNumber(String accountNumber);\n    Account\
  \ getAccountByCard(String cardNumber);\n    boolean withdrawFunds(Account account, BigDecimal amount);\n}\n// Manages bank\
  \ accounts and provides banking operations like validation and transactions\npublic class Bank\nimplements BankInterface\
  \ {\n    private final Map<String, Account> accounts = new HashMap<>();\n    private final Map<String, Account> accountByCard\
  \ = new HashMap<>();\n    // Creates a new account and stores it in both account and card maps\n@Override\n    public void\
  \ addAccount(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n\
  \            final String pin) {\n        final Account\nnewAccount\n=\nnew Account(accountNumber, type, cardNumber, pin);\n\
  \        accounts.put(newAccount.getAccountNumber(), newAccount);\n        accountByCard.put(newAccount.getCardNumber(),\
  \ newAccount);\n    }\n    // Checks if a card number exists in the bank's records\n@Override\n    public boolean validateCard(final\
  \ String cardNumber) {\n        return getAccountByCard(cardNumber) != null;\n    }\n    // Verifies if the provided PIN\
  \ matches the card's stored PIN\n@Override\n    public boolean checkPin(String cardNumber, String pinNumber) {\n       \
  \ Account\naccount\n= getAccountByCard(cardNumber);\n        if (account != null) {\n            return account.validatePin(pinNumber);\n\
  \        }\n        return false;\n    }\n    // Retrieves account by account number\n@Override\n    public Account getAccountByAccountNumber(String\
  \ accountNumber) {\n        return accounts.get(accountNumber);\n    }\n    // Retrieves account by card number\n@Override\n\
  \    public Account getAccountByCard(String cardNumber) {\n        return accountByCard.get(cardNumber);\n    }\n    //\
  \ Attempts to withdraw specified amount from account if sufficient funds exist\n@Override\n    public boolean withdrawFunds(Account\
  \ account, BigDecimal amount) {\n        if (account.getBalance().compareTo(amount) >= 0) {\n            account.updateBalanceWithTransaction(amount.negate());\n\
  \            return true;\n        }\n        return false;\n    }\n}\n\npublic interface Transaction {\n    TransactionType\
  \ getType();\n    boolean validateTransaction();\n    void executeTransaction();\n}\n// Handles the withdrawal transaction\
  \ process for removing funds from an account\npublic class WithdrawTransaction\nimplements Transaction {\n    Account account;\n\
  \    BigDecimal amount;\n    // Returns the transaction type as WITHDRAW\n@Override\n    public TransactionType getType()\
  \ {\n        return TransactionType.WITHDRAW;\n    }\n    // Validates if the account has sufficient funds for withdrawal\n\
  @Override\n    public boolean validateTransaction() {\n        assert account != null;\n        return account.getBalance().compareTo(amount)\
  \ > 0;\n    }\n    // Creates a new withdrawal transaction, throws exception if validation fails\npublic WithdrawTransaction(Account\
  \ account, BigDecimal amount) {\n        if (!validateTransaction()) {\n            throw new IllegalStateException(\n \
  \                   \"Cannot complete withdrawal: Insufficient funds in account\");\n        }\n        this.account = account;\n\
  \        this.amount = amount;\n    }\n    // Executes the withdrawal by subtracting the amount from account balance\n@Override\n\
  \    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount.negate());\n    }\n}\n// Handles\
  \ the deposit transaction process for adding funds to an account\npublic class DepositTransaction\nimplements Transaction\
  \ {\n    final Account account;\n    final BigDecimal amount;\n    // Returns the transaction type as DEPOSIT\n@Override\n\
  \    public TransactionType getType() {\n        return TransactionType.DEPOSIT;\n    }\n    // Deposit transactions are\
  \ always valid\n@Override\n    public boolean validateTransaction() {\n        return true;\n    }\n    public DepositTransaction(Account\
  \ account, BigDecimal amount) {\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes\
  \ the deposit by adding the amount to the account balance\n@Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount);\n\
  \    }\n}"
solutionCode: "// Represents a bank account with balance, card details, and PIN security\npublic class Account {\n    private\
  \ BigDecimal balance;\n    private final String accountNumber;\n    private final String cardNumber;\n    private final\
  \ byte[] cardPinHash;\n    private final AccountType accountType;\n    // Creates a new account with initial zero balance\
  \ and hashed PIN\npublic Account(\n            final String accountNumber,\n            final AccountType type,\n      \
  \      final String cardNumber,\n            final String pin) {\n        this.accountNumber = accountNumber;\n        this.accountType\
  \ = type;\n        this.cardNumber = cardNumber;\n        this.cardPinHash = calculateMd5(pin); // PIN is hashed for security\n\
  this.balance = BigDecimal.ZERO;\n    }\n    // Validates the entered PIN against stored hash\npublic boolean validatePin(String\
  \ pinNumber) {\n        byte[] entryPinHash = calculateMd5(pinNumber);\n        return Arrays.equals(cardPinHash, entryPinHash);\n\
  \    }\n    // Updates account balance by adding the specified amount\npublic void updateBalanceWithTransaction(final BigDecimal\
  \ balanceChange) {\n        this.balance = this.balance.add(balanceChange);\n    }\n    // getter methods omitted for brevity\n\
  }\n// Defines the type of bank account\npublic enum AccountType {\n    // Regular checking account for daily transactions\n\
  \    CHECKING,\n    // Interest-bearing savings account\n    SAVING\n}\n\npublic interface BankInterface {\n    void addAccount(String\
  \ accountNumber, AccountType type, String cardNumber, String pin);\n    boolean validateCard(String cardNumber);\n    boolean\
  \ checkPin(String cardNumber, String pinNumber);\n    Account getAccountByAccountNumber(String accountNumber);\n    Account\
  \ getAccountByCard(String cardNumber);\n    boolean withdrawFunds(Account account, BigDecimal amount);\n}\n// Manages bank\
  \ accounts and provides banking operations like validation and transactions\npublic class Bank\nimplements BankInterface\
  \ {\n    private final Map<String, Account> accounts = new HashMap<>();\n    private final Map<String, Account> accountByCard\
  \ = new HashMap<>();\n    // Creates a new account and stores it in both account and card maps\n@Override\n    public void\
  \ addAccount(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n\
  \            final String pin) {\n        final Account\nnewAccount\n=\nnew Account(accountNumber, type, cardNumber, pin);\n\
  \        accounts.put(newAccount.getAccountNumber(), newAccount);\n        accountByCard.put(newAccount.getCardNumber(),\
  \ newAccount);\n    }\n    // Checks if a card number exists in the bank's records\n@Override\n    public boolean validateCard(final\
  \ String cardNumber) {\n        return getAccountByCard(cardNumber) != null;\n    }\n    // Verifies if the provided PIN\
  \ matches the card's stored PIN\n@Override\n    public boolean checkPin(String cardNumber, String pinNumber) {\n       \
  \ Account\naccount\n= getAccountByCard(cardNumber);\n        if (account != null) {\n            return account.validatePin(pinNumber);\n\
  \        }\n        return false;\n    }\n    // Retrieves account by account number\n@Override\n    public Account getAccountByAccountNumber(String\
  \ accountNumber) {\n        return accounts.get(accountNumber);\n    }\n    // Retrieves account by card number\n@Override\n\
  \    public Account getAccountByCard(String cardNumber) {\n        return accountByCard.get(cardNumber);\n    }\n    //\
  \ Attempts to withdraw specified amount from account if sufficient funds exist\n@Override\n    public boolean withdrawFunds(Account\
  \ account, BigDecimal amount) {\n        if (account.getBalance().compareTo(amount) >= 0) {\n            account.updateBalanceWithTransaction(amount.negate());\n\
  \            return true;\n        }\n        return false;\n    }\n}\n\npublic interface Transaction {\n    TransactionType\
  \ getType();\n    boolean validateTransaction();\n    void executeTransaction();\n}\n// Handles the withdrawal transaction\
  \ process for removing funds from an account\npublic class WithdrawTransaction\nimplements Transaction {\n    Account account;\n\
  \    BigDecimal amount;\n    // Returns the transaction type as WITHDRAW\n@Override\n    public TransactionType getType()\
  \ {\n        return TransactionType.WITHDRAW;\n    }\n    // Validates if the account has sufficient funds for withdrawal\n\
  @Override\n    public boolean validateTransaction() {\n        assert account != null;\n        return account.getBalance().compareTo(amount)\
  \ > 0;\n    }\n    // Creates a new withdrawal transaction, throws exception if validation fails\npublic WithdrawTransaction(Account\
  \ account, BigDecimal amount) {\n        if (!validateTransaction()) {\n            throw new IllegalStateException(\n \
  \                   \"Cannot complete withdrawal: Insufficient funds in account\");\n        }\n        this.account = account;\n\
  \        this.amount = amount;\n    }\n    // Executes the withdrawal by subtracting the amount from account balance\n@Override\n\
  \    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount.negate());\n    }\n}\n// Handles\
  \ the deposit transaction process for adding funds to an account\npublic class DepositTransaction\nimplements Transaction\
  \ {\n    final Account account;\n    final BigDecimal amount;\n    // Returns the transaction type as DEPOSIT\n@Override\n\
  \    public TransactionType getType() {\n        return TransactionType.DEPOSIT;\n    }\n    // Deposit transactions are\
  \ always valid\n@Override\n    public boolean validateTransaction() {\n        return true;\n    }\n    public DepositTransaction(Account\
  \ account, BigDecimal amount) {\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes\
  \ the deposit by adding the amount to the account balance\n@Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount);\n\
  \    }\n}\n\npublic class ATMState {\n    // Displays an invalid action message on the ATM screen\nprivate static void renderDefaultAction(ATMMachine\
  \ atmMachine) {\n        atmMachine.getDisplay().showMessage(\"Invalid action, please try again.\");\n    }\n    // Default\
  \ implementation for card insertion\npublic void processCardInsertion(ATMMachine atmMachine, String cardNumber) {\n    \
  \    renderDefaultAction(atmMachine);\n    }\n    // Default implementation for card ejection\npublic void processCardEjection(ATMMachine\
  \ atmMachine) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for PIN entry\npublic void\
  \ processPinEntry(ATMMachine atmMachine, String pin) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default\
  \ implementation for withdrawal request\npublic void processWithdrawalRequest(ATMMachine atmMachine) {\n        renderDefaultAction(atmMachine);\n\
  \    }\n    // Default implementation for deposit request\npublic void processDepositRequest(ATMMachine atmMachine) {\n\
  \        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for amount entry\npublic void processAmountEntry(ATMMachine\
  \ atmMachine, BigDecimal amount) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for deposit\
  \ collection\npublic void processDepositCollection(ATMMachine atmMachine, BigDecimal amount) {\n        renderDefaultAction(atmMachine);\n\
  \    }\n}\n\npublic class IdleState\nextends ATMState {\n    /**\n     * This method is called when a card is inserted into\
  \ the ATM. This transitions the ATM to the\n     * PinEntryState if the card is valid.\n     */\n@Override\n    public void\
  \ processCardInsertion(ATMMachine atmMachine, String cardNumber) {\n        if (atmMachine.getBankInterface().validateCard(cardNumber))\
  \ {\n            atmMachine.getDisplay().showMessage(\"Please enter your PIN\");\n            atmMachine.transitionToState(new\
  \ PinEntryState());\n        } else {\n            atmMachine.getDisplay().showMessage(\"Invalid card. Please try again.\"\
  );\n        }\n    }\n}\n\npublic class WithdrawAmountEntryState\nextends ATMState {\n    // Handles card ejection by canceling\
  \ transaction and returning to idle state\n@Override\n    public void processCardEjection(ATMMachine atmMachine) {\n   \
  \     atmMachine.getDisplay().showMessage(\"Transaction cancelled, card ejected\");\n        atmMachine.transitionToState(new\
  \ IdleState());\n    }\n    // Processes withdrawal request by checking balance and dispensing cash if sufficient funds\n\
  @Override\n    public void processAmountEntry(ATMMachine atmMachine, BigDecimal amount) {\n        String\ncardNumber\n\
  = atmMachine.getCardProcessor().getCardNumber();\n        Account\naccount\n= atmMachine.getBankInterface().getAccountByCard(cardNumber);\n\
  \        boolean isSuccess\n= atmMachine.getBankInterface().withdrawFunds(account, amount);\n        if (isSuccess) {\n\
  \            atmMachine.getCashDispenser().dispenseCash(amount);\n            atmMachine.getDisplay().showMessage(\"Please\
  \ take your cash.\");\n        } else {\n            atmMachine.getDisplay().showMessage(\"Insufficient funds, please try\
  \ again.\");\n        }\n        atmMachine.transitionToState(new TransactionSelectionState());\n    }\n}\n\n// Main ATM\
  \ machine class that manages the state and hardware components of the ATM\npublic class ATMMachine {\n    private ATMState\
  \ state;\n    private final CardProcessor cardProcessor;\n    private final DepositBox depositBox;\n    private final CashDispenser\
  \ cashDispenser;\n    private final Keypad keypad;\n    private final Display display;\n    private final Bank bank;\n \
  \   // Initializes ATM with all required hardware components and bank interface public ATMMachine(\n            Bank bank,\n\
  \            CardProcessor cardProcessor,\n            DepositBox depositBox,\n            CashDispenser cashDispenser,\n\
  \            Keypad keypad,\n            Display display) {\n        this.bank = bank;\n        this.cardProcessor = cardProcessor;\n\
  \        this.depositBox = depositBox;\n        this.cashDispenser = cashDispenser;\n        this.keypad = keypad;\n   \
  \     this.display = display;\n        this.state = new IdleState();\n    }\n    // Forwards card insertion to current state\
  \ for processing\npublic void insertCard(String cardNumber) {\n        state.processCardInsertion(this, cardNumber);\n \
  \   }\n    // Forwards card ejection to current state for processing\npublic void ejectCard() {\n        state.processCardEjection(this);\n\
  \    }\n    // Forwards PIN entry to current state for validation\npublic void enterPin(String pin) {\n        state.processPinEntry(this,\
  \ pin);\n    }\n    // Forwards withdrawal request to current state for processing\npublic void withdrawRequest() {\n  \
  \      state.processWithdrawalRequest(this);\n    }\n    // Forwards deposit request to current state for processing\npublic\
  \ void depositRequest() {\n        state.processDepositRequest(this);\n    }\n    // Forwards amount entry to current state\
  \ for processing\npublic void enterAmount(BigDecimal amount) {\n        state.processAmountEntry(this, amount);\n    }\n\
  \    // Forwards deposit collection to current state for processing\npublic void collectDeposit(BigDecimal amount) {\n \
  \       state.processDepositCollection(this, amount);\n    }\n    // Returns the display component for showing messages\n\
  public Display getDisplay() {\n        return display;\n    }\n    // Returns the cash dispenser component for handling\
  \ withdrawals\npublic CashDispenser getCashDispenser() {\n        return cashDispenser;\n    }\n    // Returns the bank\
  \ interface for account operations\npublic BankInterface getBankInterface() {\n        return bank;\n    }\n    // Returns\
  \ the card processor component for handling card operations\npublic CardProcessor getCardProcessor() {\n        return cardProcessor;\n\
  \    }\n    // Returns the keypad component for user input\npublic Keypad getKeypad() {\n        return keypad;\n    }\n\
  \    // Updates the current state of the ATM\npublic void transitionToState(ATMState nextState) {\n        this.state =\
  \ nextState;\n    }\n    // Returns the current state of the ATM\npublic ATMState getCurrentState() {\n        return state;\n\
  \    }\n    // Returns the deposit box component for handling deposits\npublic DepositBox getDepositBox() {\n        return\
  \ depositBox;\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design an Automated Teller Machine (ATM)


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (ATM Lifecycle), Chain of Responsibility (Multi-Denomination Dispenser), Command Pattern (Transaction
  Execution)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
---
### Problem Statement: Design an Automated Teller Machine (ATM)

Design an ATM Banking System handling card insertion, PIN verification, account inquiries, cash withdrawals with multi-denomination dispensing (Chain of Responsibility), and deposits.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design an Automated Teller Machine (ATM).
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage State Pattern (ATM Lifecycle), Chain of Responsibility (Multi-Denomination Dispenser), Command Pattern (Transaction Execution).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
