---
slug: lld-atm-system
title: Design an Automated Teller Machine (ATM)
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
- chain-of-responsibility
- atm
buildProfile: maven-workspace
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the State Pattern to control ATM operations (Idle, CardInserted, PinAuthenticated, TransactionSelected, DispensingCash).
- Use the Chain of Responsibility Pattern for cash dispensing across denominations ($100 -> $50 -> $20 -> $10).
- 'Maintain transactional integrity: ensure bank balance deduction, cash dispensing, and receipt generation execute atomically or rollback.'
coaching:
  presentationTips:
  - 'Explain why the Chain of Responsibility is ideal for cash dispensing: each dispenser handles its denomination and forwards remainder to the next.'
  - 'Walk through PIN authentication security: track failed attempts and transition to CardRetainedState after 3 failures.'
  - Discuss hardware failure recovery (cash jam, network timeout during debit).
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>atm-system</artifactId>
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
    # Automated Teller Machine (ATM) System

    ## Overview
    Implement an object-oriented ATM system supporting card authentication, account queries, deposits, and cash withdrawals using the State Pattern and Chain of Responsibility.

    ## Key Components
    - `com.interviewos.atm.bank.Bank`: Manages accounts, PIN verification, and balance ledger.
    - `com.interviewos.atm.service.ATMMachine`: Central controller delegating operations to current ATM state.
    - `com.interviewos.atm.state.*`: State pattern implementations (`IdleState`, `PinEntryState`, `WithdrawAmountEntryState`, `TransactionSelectionState`).

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/atm/bank/Bank.java`
    2. `src/main/java/com/interviewos/atm/service/ATMMachine.java`
    3. `src/main/java/com/interviewos/atm/state/IdleState.java`
    4. `src/main/java/com/interviewos/atm/state/PinEntryState.java`
    5. `src/main/java/com/interviewos/atm/state/WithdrawAmountEntryState.java`
  src/main/java/com/interviewos/atm/model/AccountType.java: |
    package com.interviewos.atm.model;

    public enum AccountType {
        CHECKING,
        SAVING
    }
  src/main/java/com/interviewos/atm/model/Account.java: |
    package com.interviewos.atm.model;

    import java.math.BigDecimal;
    import java.security.MessageDigest;
    import java.security.NoSuchAlgorithmException;
    import java.util.Arrays;

    public class Account {
        private final String accountNumber;
        private final AccountType accountType;
        private final String cardNumber;
        private final byte[] cardPinHash;
        private BigDecimal balance;

        public Account(String accountNumber, AccountType type, String cardNumber, String pin) {
            this.accountNumber = accountNumber;
            this.accountType = type;
            this.cardNumber = cardNumber;
            this.cardPinHash = calculateHash(pin);
            this.balance = BigDecimal.ZERO;
        }

        public boolean validatePin(String pinNumber) {
            if (pinNumber == null) return false;
            byte[] entryPinHash = calculateHash(pinNumber);
            return Arrays.equals(cardPinHash, entryPinHash);
        }

        public void updateBalanceWithTransaction(BigDecimal delta) {
            if (delta != null) {
                this.balance = this.balance.add(delta);
            }
        }

        public String getAccountNumber() { return accountNumber; }
        public AccountType getAccountType() { return accountType; }
        public String getCardNumber() { return cardNumber; }
        public BigDecimal getBalance() { return balance; }

        private static byte[] calculateHash(String input) {
            try {
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                return md.digest(input.getBytes());
            } catch (NoSuchAlgorithmException e) {
                throw new RuntimeException("SHA-256 not available", e);
            }
        }
    }
  src/main/java/com/interviewos/atm/model/TransactionType.java: |
    package com.interviewos.atm.model;

    public enum TransactionType {
        WITHDRAW,
        DEPOSIT,
        BALANCE_INQUIRY
    }
  src/main/java/com/interviewos/atm/bank/BankInterface.java: |
    package com.interviewos.atm.bank;

    import com.interviewos.atm.model.Account;
    import com.interviewos.atm.model.AccountType;
    import java.math.BigDecimal;

    public interface BankInterface {
        void addAccount(String accountNumber, AccountType type, String cardNumber, String pin);
        boolean validateCard(String cardNumber);
        boolean checkPin(String cardNumber, String pinNumber);
        Account getAccountByAccountNumber(String accountNumber);
        Account getAccountByCard(String cardNumber);
        boolean withdrawFunds(Account account, BigDecimal amount);
    }
  src/main/java/com/interviewos/atm/bank/Bank.java: |
    package com.interviewos.atm.bank;

    import com.interviewos.atm.model.Account;
    import com.interviewos.atm.model.AccountType;
    import java.math.BigDecimal;
    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class Bank implements BankInterface {
        private final Map<String, Account> accounts = new ConcurrentHashMap<>();
        private final Map<String, Account> accountByCard = new ConcurrentHashMap<>();

        @Override
        public void addAccount(String accountNumber, AccountType type, String cardNumber, String pin) {
            // TODO: Implement account creation and indexing
            throw new UnsupportedOperationException("TODO: Implement addAccount");
        }

        @Override
        public boolean validateCard(String cardNumber) {
            // TODO: Validate card presence
            throw new UnsupportedOperationException("TODO: Implement validateCard");
        }

        @Override
        public boolean checkPin(String cardNumber, String pinNumber) {
            // TODO: Validate PIN against card account
            throw new UnsupportedOperationException("TODO: Implement checkPin");
        }

        @Override
        public Account getAccountByAccountNumber(String accountNumber) {
            // TODO: Retrieve account by number
            throw new UnsupportedOperationException("TODO: Implement getAccountByAccountNumber");
        }

        @Override
        public Account getAccountByCard(String cardNumber) {
            // TODO: Retrieve account by card
            throw new UnsupportedOperationException("TODO: Implement getAccountByCard");
        }

        @Override
        public boolean withdrawFunds(Account account, BigDecimal amount) {
            // TODO: Deduct funds if balance suffices
            throw new UnsupportedOperationException("TODO: Implement withdrawFunds");
        }
    }
  src/main/java/com/interviewos/atm/hardware/CardProcessor.java: |
    package com.interviewos.atm.hardware;

    public class CardProcessor {
        private String currentCardNumber;

        public void readCard(String cardNumber) {
            this.currentCardNumber = cardNumber;
        }

        public void clearCard() {
            this.currentCardNumber = null;
        }

        public String getCardNumber() {
            return currentCardNumber;
        }
    }
  src/main/java/com/interviewos/atm/hardware/CashDispenser.java: |
    package com.interviewos.atm.hardware;

    import java.math.BigDecimal;

    public class CashDispenser {
        private BigDecimal cashReserve;

        public CashDispenser(BigDecimal initialReserve) {
            this.cashReserve = initialReserve != null ? initialReserve : BigDecimal.ZERO;
        }

        public synchronized boolean hasSufficientCash(BigDecimal amount) {
            return amount != null && cashReserve.compareTo(amount) >= 0;
        }

        public synchronized boolean dispenseCash(BigDecimal amount) {
            if (hasSufficientCash(amount)) {
                cashReserve = cashReserve.subtract(amount);
                return true;
            }
            return false;
        }

        public synchronized BigDecimal getCashReserve() {
            return cashReserve;
        }
    }
  src/main/java/com/interviewos/atm/hardware/DepositBox.java: |
    package com.interviewos.atm.hardware;

    import java.math.BigDecimal;

    public class DepositBox {
        private BigDecimal totalDeposited = BigDecimal.ZERO;

        public synchronized void collectDeposit(BigDecimal amount) {
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                totalDeposited = totalDeposited.add(amount);
            }
        }

        public synchronized BigDecimal getTotalDeposited() {
            return totalDeposited;
        }
    }
  src/main/java/com/interviewos/atm/hardware/Display.java: |
    package com.interviewos.atm.hardware;

    public class Display {
        private String lastMessage = "";

        public void showMessage(String message) {
            this.lastMessage = message != null ? message : "";
        }

        public String getLastMessage() {
            return lastMessage;
        }
    }
  src/main/java/com/interviewos/atm/hardware/Keypad.java: |
    package com.interviewos.atm.hardware;

    public class Keypad {
        private String buffer = "";

        public void enterInput(String input) {
            this.buffer = input;
        }

        public String readInput() {
            return buffer;
        }
    }
  src/main/java/com/interviewos/atm/state/ATMState.java: |
    package com.interviewos.atm.state;

    import com.interviewos.atm.service.ATMMachine;
    import java.math.BigDecimal;

    public interface ATMState {
        void processCardInsertion(ATMMachine atm, String cardNumber);
        void processCardEjection(ATMMachine atm);
        void processPinEntry(ATMMachine atm, String pin);
        void processWithdrawalRequest(ATMMachine atm);
        void processDepositRequest(ATMMachine atm);
        void processAmountEntry(ATMMachine atm, BigDecimal amount);
        String getStateName();
    }
  src/main/java/com/interviewos/atm/state/IdleState.java: |
    package com.interviewos.atm.state;

    import com.interviewos.atm.service.ATMMachine;
    import java.math.BigDecimal;

    public class IdleState implements ATMState {
        @Override
        public void processCardInsertion(ATMMachine atm, String cardNumber) {
            // TODO: Validate card and transition to PinEntryState if valid
            throw new UnsupportedOperationException("TODO: Implement processCardInsertion");
        }

        @Override
        public void processCardEjection(ATMMachine atm) {
            atm.getDisplay().showMessage("No card to eject.");
        }

        @Override
        public void processPinEntry(ATMMachine atm, String pin) {
            atm.getDisplay().showMessage("Please insert card first.");
        }

        @Override
        public void processWithdrawalRequest(ATMMachine atm) {
            atm.getDisplay().showMessage("Please insert card first.");
        }

        @Override
        public void processDepositRequest(ATMMachine atm) {
            atm.getDisplay().showMessage("Please insert card first.");
        }

        @Override
        public void processAmountEntry(ATMMachine atm, BigDecimal amount) {
            atm.getDisplay().showMessage("Please insert card first.");
        }

        @Override
        public String getStateName() {
            return "IDLE";
        }
    }
  src/main/java/com/interviewos/atm/state/PinEntryState.java: |
    package com.interviewos.atm.state;

    import com.interviewos.atm.service.ATMMachine;
    import java.math.BigDecimal;

    public class PinEntryState implements ATMState {
        private int attempts = 0;

        @Override
        public void processCardInsertion(ATMMachine atm, String cardNumber) {
            atm.getDisplay().showMessage("Card already inserted.");
        }

        @Override
        public void processCardEjection(ATMMachine atm) {
            // TODO: Eject card and transition to IdleState
            throw new UnsupportedOperationException("TODO: Implement processCardEjection");
        }

        @Override
        public void processPinEntry(ATMMachine atm, String pin) {
            // TODO: Validate PIN with bank. If valid -> TransactionSelectionState. If invalid >= 3 times -> retain card & IdleState.
            throw new UnsupportedOperationException("TODO: Implement processPinEntry");
        }

        @Override
        public void processWithdrawalRequest(ATMMachine atm) {
            atm.getDisplay().showMessage("Please enter PIN first.");
        }

        @Override
        public void processDepositRequest(ATMMachine atm) {
            atm.getDisplay().showMessage("Please enter PIN first.");
        }

        @Override
        public void processAmountEntry(ATMMachine atm, BigDecimal amount) {
            atm.getDisplay().showMessage("Please enter PIN first.");
        }

        @Override
        public String getStateName() {
            return "PIN_ENTRY";
        }
    }
  src/main/java/com/interviewos/atm/state/TransactionSelectionState.java: |
    package com.interviewos.atm.state;

    import com.interviewos.atm.service.ATMMachine;
    import java.math.BigDecimal;

    public class TransactionSelectionState implements ATMState {
        @Override
        public void processCardInsertion(ATMMachine atm, String cardNumber) {
            atm.getDisplay().showMessage("Transaction in progress.");
        }

        @Override
        public void processCardEjection(ATMMachine atm) {
            atm.getCardProcessor().clearCard();
            atm.getDisplay().showMessage("Card ejected.");
            atm.transitionToState(new IdleState());
        }

        @Override
        public void processPinEntry(ATMMachine atm, String pin) {
            atm.getDisplay().showMessage("PIN already verified.");
        }

        @Override
        public void processWithdrawalRequest(ATMMachine atm) {
            atm.transitionToState(new WithdrawAmountEntryState());
            atm.getDisplay().showMessage("Please enter withdrawal amount.");
        }

        @Override
        public void processDepositRequest(ATMMachine atm) {
            atm.getDisplay().showMessage("Please insert deposit envelope.");
        }

        @Override
        public void processAmountEntry(ATMMachine atm, BigDecimal amount) {
            atm.getDisplay().showMessage("Select transaction type first.");
        }

        @Override
        public String getStateName() {
            return "TRANSACTION_SELECTION";
        }
    }
  src/main/java/com/interviewos/atm/state/WithdrawAmountEntryState.java: |
    package com.interviewos.atm.state;

    import com.interviewos.atm.model.Account;
    import com.interviewos.atm.service.ATMMachine;
    import java.math.BigDecimal;

    public class WithdrawAmountEntryState implements ATMState {
        @Override
        public void processCardInsertion(ATMMachine atm, String cardNumber) {
            atm.getDisplay().showMessage("Transaction in progress.");
        }

        @Override
        public void processCardEjection(ATMMachine atm) {
            atm.getCardProcessor().clearCard();
            atm.getDisplay().showMessage("Transaction cancelled, card ejected.");
            atm.transitionToState(new IdleState());
        }

        @Override
        public void processPinEntry(ATMMachine atm, String pin) {
            atm.getDisplay().showMessage("PIN already verified.");
        }

        @Override
        public void processWithdrawalRequest(ATMMachine atm) {
            atm.getDisplay().showMessage("Already in withdrawal mode.");
        }

        @Override
        public void processDepositRequest(ATMMachine atm) {
            atm.getDisplay().showMessage("Complete withdrawal or cancel first.");
        }

        @Override
        public void processAmountEntry(ATMMachine atm, BigDecimal amount) {
            // TODO: Withdraw funds from account via bank, dispense cash via dispenser, return to TransactionSelectionState
            throw new UnsupportedOperationException("TODO: Implement processAmountEntry");
        }

        @Override
        public String getStateName() {
            return "WITHDRAW_AMOUNT_ENTRY";
        }
    }
  src/main/java/com/interviewos/atm/service/ATMMachine.java: |
    package com.interviewos.atm.service;

    import com.interviewos.atm.bank.BankInterface;
    import com.interviewos.atm.hardware.*;
    import com.interviewos.atm.state.ATMState;
    import com.interviewos.atm.state.IdleState;
    import java.math.BigDecimal;

    public class ATMMachine {
        private ATMState currentState;
        private final BankInterface bank;
        private final CardProcessor cardProcessor;
        private final CashDispenser cashDispenser;
        private final DepositBox depositBox;
        private final Display display;
        private final Keypad keypad;

        public ATMMachine(BankInterface bank, CashDispenser cashDispenser) {
            this.bank = bank;
            this.cashDispenser = cashDispenser;
            this.cardProcessor = new CardProcessor();
            this.depositBox = new DepositBox();
            this.display = new Display();
            this.keypad = new Keypad();
            this.currentState = new IdleState();
        }

        public void insertCard(String cardNumber) {
            // TODO: Forward to currentState
            throw new UnsupportedOperationException("TODO: Implement insertCard");
        }

        public void ejectCard() {
            // TODO: Forward to currentState
            throw new UnsupportedOperationException("TODO: Implement ejectCard");
        }

        public void enterPin(String pin) {
            // TODO: Forward to currentState
            throw new UnsupportedOperationException("TODO: Implement enterPin");
        }

        public void requestWithdrawal() {
            // TODO: Forward to currentState
            throw new UnsupportedOperationException("TODO: Implement requestWithdrawal");
        }

        public void enterAmount(BigDecimal amount) {
            // TODO: Forward to currentState
            throw new UnsupportedOperationException("TODO: Implement enterAmount");
        }

        public void transitionToState(ATMState nextState) {
            this.currentState = nextState;
        }

        public ATMState getCurrentState() { return currentState; }
        public BankInterface getBank() { return bank; }
        public CardProcessor getCardProcessor() { return cardProcessor; }
        public CashDispenser getCashDispenser() { return cashDispenser; }
        public DepositBox getDepositBox() { return depositBox; }
        public Display getDisplay() { return display; }
        public Keypad getKeypad() { return keypad; }
    }
editablePaths:
- src/main/java/com/interviewos/atm/bank/Bank.java
- src/main/java/com/interviewos/atm/service/ATMMachine.java
- src/main/java/com/interviewos/atm/state/IdleState.java
- src/main/java/com/interviewos/atm/state/PinEntryState.java
- src/main/java/com/interviewos/atm/state/WithdrawAmountEntryState.java
hiddenTestFiles:
  src/test/java/com/interviewos/atm/AtmAuthenticationTest.java: |
    package com.interviewos.atm;

    import com.interviewos.atm.bank.Bank;
    import com.interviewos.atm.hardware.CashDispenser;
    import com.interviewos.atm.model.AccountType;
    import com.interviewos.atm.service.ATMMachine;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class AtmAuthenticationTest {
        private Bank bank;
        private ATMMachine atm;

        @BeforeEach
        void setUp() {
            bank = new Bank();
            bank.addAccount("ACCT-101", AccountType.CHECKING, "4000-1111-2222-3333", "1234");
            CashDispenser dispenser = new CashDispenser(new BigDecimal("10000"));
            atm = new ATMMachine(bank, dispenser);
        }

        @Test
        @DisplayName("Valid card insertion transitions ATM to PIN_ENTRY state")
        void testValidCardInsertion() {
            atm.insertCard("4000-1111-2222-3333");
            assertEquals("PIN_ENTRY", atm.getCurrentState().getStateName());
            assertEquals("4000-1111-2222-3333", atm.getCardProcessor().getCardNumber());
        }

        @Test
        @DisplayName("Invalid card insertion stays in IDLE state with error message")
        void testInvalidCardInsertion() {
            atm.insertCard("9999-9999-9999-9999");
            assertEquals("IDLE", atm.getCurrentState().getStateName());
            assertTrue(atm.getDisplay().getLastMessage().toLowerCase().contains("invalid"));
        }

        @Test
        @DisplayName("Correct PIN transitions ATM to TRANSACTION_SELECTION state")
        void testCorrectPinAuthentication() {
            atm.insertCard("4000-1111-2222-3333");
            atm.enterPin("1234");
            assertEquals("TRANSACTION_SELECTION", atm.getCurrentState().getStateName());
        }

        @Test
        @DisplayName("Three consecutive wrong PIN entries eject card and reset to IDLE")
        void testThreeWrongPinsRetainsOrEjectsCard() {
            atm.insertCard("4000-1111-2222-3333");
            atm.enterPin("0000");
            assertEquals("PIN_ENTRY", atm.getCurrentState().getStateName());
            atm.enterPin("0000");
            assertEquals("PIN_ENTRY", atm.getCurrentState().getStateName());
            atm.enterPin("0000");
            assertEquals("IDLE", atm.getCurrentState().getStateName());
            assertNull(atm.getCardProcessor().getCardNumber());
        }
    }
  src/test/java/com/interviewos/atm/AtmWithdrawalTest.java: |
    package com.interviewos.atm;

    import com.interviewos.atm.bank.Bank;
    import com.interviewos.atm.hardware.CashDispenser;
    import com.interviewos.atm.model.Account;
    import com.interviewos.atm.model.AccountType;
    import com.interviewos.atm.service.ATMMachine;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class AtmWithdrawalTest {
        private Bank bank;
        private ATMMachine atm;
        private CashDispenser dispenser;

        @BeforeEach
        void setUp() {
            bank = new Bank();
            bank.addAccount("ACCT-202", AccountType.CHECKING, "4000-5555-6666-7777", "4321");
            Account acc = bank.getAccountByAccountNumber("ACCT-202");
            acc.updateBalanceWithTransaction(new BigDecimal("500.00"));

            dispenser = new CashDispenser(new BigDecimal("2000.00"));
            atm = new ATMMachine(bank, dispenser);
        }

        @Test
        @DisplayName("Successful withdrawal deducts balance and dispenses cash")
        void testSuccessfulWithdrawal() {
            atm.insertCard("4000-5555-6666-7777");
            atm.enterPin("4321");
            atm.requestWithdrawal();
            assertEquals("WITHDRAW_AMOUNT_ENTRY", atm.getCurrentState().getStateName());

            atm.enterAmount(new BigDecimal("200.00"));
            Account acc = bank.getAccountByAccountNumber("ACCT-202");
            assertEquals(new BigDecimal("300.00"), acc.getBalance());
            assertEquals(new BigDecimal("1800.00"), dispenser.getCashReserve());
            assertEquals("TRANSACTION_SELECTION", atm.getCurrentState().getStateName());
        }

        @Test
        @DisplayName("Withdrawal with insufficient account funds fails gracefully")
        void testInsufficientFundsWithdrawal() {
            atm.insertCard("4000-5555-6666-7777");
            atm.enterPin("4321");
            atm.requestWithdrawal();

            atm.enterAmount(new BigDecimal("1000.00"));
            Account acc = bank.getAccountByAccountNumber("ACCT-202");
            assertEquals(new BigDecimal("500.00"), acc.getBalance());
            assertEquals(new BigDecimal("2000.00"), dispenser.getCashReserve());
            assertTrue(atm.getDisplay().getLastMessage().toLowerCase().contains("insufficient"));
        }
    }
  src/test/java/com/interviewos/atm/AtmLifecycleStateTest.java: |
    package com.interviewos.atm;

    import com.interviewos.atm.bank.Bank;
    import com.interviewos.atm.hardware.CashDispenser;
    import com.interviewos.atm.model.AccountType;
    import com.interviewos.atm.service.ATMMachine;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class AtmLifecycleStateTest {
        private Bank bank;
        private ATMMachine atm;

        @BeforeEach
        void setUp() {
            bank = new Bank();
            bank.addAccount("ACCT-303", AccountType.SAVING, "4000-8888-9999-0000", "9876");
            CashDispenser dispenser = new CashDispenser(new BigDecimal("5000"));
            atm = new ATMMachine(bank, dispenser);
        }

        @Test
        @DisplayName("Ejecting card during PIN entry returns to IDLE")
        void testEjectDuringPinEntry() {
            atm.insertCard("4000-8888-9999-0000");
            assertEquals("PIN_ENTRY", atm.getCurrentState().getStateName());

            atm.ejectCard();
            assertEquals("IDLE", atm.getCurrentState().getStateName());
            assertNull(atm.getCardProcessor().getCardNumber());
        }

        @Test
        @DisplayName("Ejecting card during transaction selection returns to IDLE")
        void testEjectDuringTxSelection() {
            atm.insertCard("4000-8888-9999-0000");
            atm.enterPin("9876");
            assertEquals("TRANSACTION_SELECTION", atm.getCurrentState().getStateName());

            atm.ejectCard();
            assertEquals("IDLE", atm.getCurrentState().getStateName());
            assertNull(atm.getCardProcessor().getCardNumber());
        }
    }

starterCode: "// Represents a bank account with balance, card details, and PIN security\npublic class Account {\n    private BigDecimal balance;\n    private final String accountNumber;\n    private final String cardNumber;\n    private final byte[] cardPinHash;\n    private final AccountType accountType;\n    // Creates a new account with initial zero balance and hashed PIN\npublic Account(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n            final String pin) {\n        this.accountNumber = accountNumber;\n        this.accountType = type;\n        this.cardNumber = cardNumber;\n        this.cardPinHash = calculateMd5(pin); // PIN is hashed for security\nthis.balance = BigDecimal.ZERO;\n    }\n    // Validates the entered PIN against stored hash\npublic boolean validatePin(String pinNumber) {\n        byte[] entryPinHash = calculateMd5(pinNumber);\n        return Arrays.equals(cardPinHash, entryPinHash);\n    }\n\
  \    // Updates account balance by adding the specified amount\npublic void updateBalanceWithTransaction(final BigDecimal balanceChange) {\n        this.balance = this.balance.add(balanceChange);\n    }\n    // getter methods omitted for brevity\n}\n// Defines the type of bank account\npublic enum AccountType {\n    // Regular checking account for daily transactions\n    CHECKING,\n    // Interest-bearing savings account\n    SAVING\n}\n\npublic interface BankInterface {\n    void addAccount(String accountNumber, AccountType type, String cardNumber, String pin);\n    boolean validateCard(String cardNumber);\n    boolean checkPin(String cardNumber, String pinNumber);\n    Account getAccountByAccountNumber(String accountNumber);\n    Account getAccountByCard(String cardNumber);\n    boolean withdrawFunds(Account account, BigDecimal amount);\n}\n// Manages bank accounts and provides banking operations like validation and transactions\npublic class Bank\nimplements BankInterface {\n    private\
  \ final Map<String, Account> accounts = new HashMap<>();\n    private final Map<String, Account> accountByCard = new HashMap<>();\n    // Creates a new account and stores it in both account and card maps\n@Override\n    public void addAccount(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n            final String pin) {\n        final Account\nnewAccount\n=\nnew Account(accountNumber, type, cardNumber, pin);\n        accounts.put(newAccount.getAccountNumber(), newAccount);\n        accountByCard.put(newAccount.getCardNumber(), newAccount);\n    }\n    // Checks if a card number exists in the bank's records\n@Override\n    public boolean validateCard(final String cardNumber) {\n        return getAccountByCard(cardNumber) != null;\n    }\n    // Verifies if the provided PIN matches the card's stored PIN\n@Override\n    public boolean checkPin(String cardNumber, String pinNumber) {\n        Account\naccount\n= getAccountByCard(cardNumber);\n\
  \        if (account != null) {\n            return account.validatePin(pinNumber);\n        }\n        return false;\n    }\n    // Retrieves account by account number\n@Override\n    public Account getAccountByAccountNumber(String accountNumber) {\n        return accounts.get(accountNumber);\n    }\n    // Retrieves account by card number\n@Override\n    public Account getAccountByCard(String cardNumber) {\n        return accountByCard.get(cardNumber);\n    }\n    // Attempts to withdraw specified amount from account if sufficient funds exist\n@Override\n    public boolean withdrawFunds(Account account, BigDecimal amount) {\n        if (account.getBalance().compareTo(amount) >= 0) {\n            account.updateBalanceWithTransaction(amount.negate());\n            return true;\n        }\n        return false;\n    }\n}\n\npublic interface Transaction {\n    TransactionType getType();\n    boolean validateTransaction();\n    void executeTransaction();\n}\n// Handles the withdrawal transaction\
  \ process for removing funds from an account\npublic class WithdrawTransaction\nimplements Transaction {\n    Account account;\n    BigDecimal amount;\n    // Returns the transaction type as WITHDRAW\n@Override\n    public TransactionType getType() {\n        return TransactionType.WITHDRAW;\n    }\n    // Validates if the account has sufficient funds for withdrawal\n@Override\n    public boolean validateTransaction() {\n        assert account != null;\n        return account.getBalance().compareTo(amount) > 0;\n    }\n    // Creates a new withdrawal transaction, throws exception if validation fails\npublic WithdrawTransaction(Account account, BigDecimal amount) {\n        if (!validateTransaction()) {\n            throw new IllegalStateException(\n                    \"Cannot complete withdrawal: Insufficient funds in account\");\n        }\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes the withdrawal by subtracting the amount from account balance\n\
  @Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount.negate());\n    }\n}\n// Handles the deposit transaction process for adding funds to an account\npublic class DepositTransaction\nimplements Transaction {\n    final Account account;\n    final BigDecimal amount;\n    // Returns the transaction type as DEPOSIT\n@Override\n    public TransactionType getType() {\n        return TransactionType.DEPOSIT;\n    }\n    // Deposit transactions are always valid\n@Override\n    public boolean validateTransaction() {\n        return true;\n    }\n    public DepositTransaction(Account account, BigDecimal amount) {\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes the deposit by adding the amount to the account balance\n@Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount);\n    }\n}"
solutionCode: "// Represents a bank account with balance, card details, and PIN security\npublic class Account {\n    private BigDecimal balance;\n    private final String accountNumber;\n    private final String cardNumber;\n    private final byte[] cardPinHash;\n    private final AccountType accountType;\n    // Creates a new account with initial zero balance and hashed PIN\npublic Account(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n            final String pin) {\n        this.accountNumber = accountNumber;\n        this.accountType = type;\n        this.cardNumber = cardNumber;\n        this.cardPinHash = calculateMd5(pin); // PIN is hashed for security\nthis.balance = BigDecimal.ZERO;\n    }\n    // Validates the entered PIN against stored hash\npublic boolean validatePin(String pinNumber) {\n        byte[] entryPinHash = calculateMd5(pinNumber);\n        return Arrays.equals(cardPinHash, entryPinHash);\n    }\n\
  \    // Updates account balance by adding the specified amount\npublic void updateBalanceWithTransaction(final BigDecimal balanceChange) {\n        this.balance = this.balance.add(balanceChange);\n    }\n    // getter methods omitted for brevity\n}\n// Defines the type of bank account\npublic enum AccountType {\n    // Regular checking account for daily transactions\n    CHECKING,\n    // Interest-bearing savings account\n    SAVING\n}\n\npublic interface BankInterface {\n    void addAccount(String accountNumber, AccountType type, String cardNumber, String pin);\n    boolean validateCard(String cardNumber);\n    boolean checkPin(String cardNumber, String pinNumber);\n    Account getAccountByAccountNumber(String accountNumber);\n    Account getAccountByCard(String cardNumber);\n    boolean withdrawFunds(Account account, BigDecimal amount);\n}\n// Manages bank accounts and provides banking operations like validation and transactions\npublic class Bank\nimplements BankInterface {\n    private\
  \ final Map<String, Account> accounts = new HashMap<>();\n    private final Map<String, Account> accountByCard = new HashMap<>();\n    // Creates a new account and stores it in both account and card maps\n@Override\n    public void addAccount(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n            final String pin) {\n        final Account\nnewAccount\n=\nnew Account(accountNumber, type, cardNumber, pin);\n        accounts.put(newAccount.getAccountNumber(), newAccount);\n        accountByCard.put(newAccount.getCardNumber(), newAccount);\n    }\n    // Checks if a card number exists in the bank's records\n@Override\n    public boolean validateCard(final String cardNumber) {\n        return getAccountByCard(cardNumber) != null;\n    }\n    // Verifies if the provided PIN matches the card's stored PIN\n@Override\n    public boolean checkPin(String cardNumber, String pinNumber) {\n        Account\naccount\n= getAccountByCard(cardNumber);\n\
  \        if (account != null) {\n            return account.validatePin(pinNumber);\n        }\n        return false;\n    }\n    // Retrieves account by account number\n@Override\n    public Account getAccountByAccountNumber(String accountNumber) {\n        return accounts.get(accountNumber);\n    }\n    // Retrieves account by card number\n@Override\n    public Account getAccountByCard(String cardNumber) {\n        return accountByCard.get(cardNumber);\n    }\n    // Attempts to withdraw specified amount from account if sufficient funds exist\n@Override\n    public boolean withdrawFunds(Account account, BigDecimal amount) {\n        if (account.getBalance().compareTo(amount) >= 0) {\n            account.updateBalanceWithTransaction(amount.negate());\n            return true;\n        }\n        return false;\n    }\n}\n\npublic interface Transaction {\n    TransactionType getType();\n    boolean validateTransaction();\n    void executeTransaction();\n}\n// Handles the withdrawal transaction\
  \ process for removing funds from an account\npublic class WithdrawTransaction\nimplements Transaction {\n    Account account;\n    BigDecimal amount;\n    // Returns the transaction type as WITHDRAW\n@Override\n    public TransactionType getType() {\n        return TransactionType.WITHDRAW;\n    }\n    // Validates if the account has sufficient funds for withdrawal\n@Override\n    public boolean validateTransaction() {\n        assert account != null;\n        return account.getBalance().compareTo(amount) > 0;\n    }\n    // Creates a new withdrawal transaction, throws exception if validation fails\npublic WithdrawTransaction(Account account, BigDecimal amount) {\n        if (!validateTransaction()) {\n            throw new IllegalStateException(\n                    \"Cannot complete withdrawal: Insufficient funds in account\");\n        }\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes the withdrawal by subtracting the amount from account balance\n\
  @Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount.negate());\n    }\n}\n// Handles the deposit transaction process for adding funds to an account\npublic class DepositTransaction\nimplements Transaction {\n    final Account account;\n    final BigDecimal amount;\n    // Returns the transaction type as DEPOSIT\n@Override\n    public TransactionType getType() {\n        return TransactionType.DEPOSIT;\n    }\n    // Deposit transactions are always valid\n@Override\n    public boolean validateTransaction() {\n        return true;\n    }\n    public DepositTransaction(Account account, BigDecimal amount) {\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes the deposit by adding the amount to the account balance\n@Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount);\n    }\n}\n\npublic class ATMState {\n    // Displays an invalid action message on the ATM\
  \ screen\nprivate static void renderDefaultAction(ATMMachine atmMachine) {\n        atmMachine.getDisplay().showMessage(\"Invalid action, please try again.\");\n    }\n    // Default implementation for card insertion\npublic void processCardInsertion(ATMMachine atmMachine, String cardNumber) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for card ejection\npublic void processCardEjection(ATMMachine atmMachine) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for PIN entry\npublic void processPinEntry(ATMMachine atmMachine, String pin) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for withdrawal request\npublic void processWithdrawalRequest(ATMMachine atmMachine) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for deposit request\npublic void processDepositRequest(ATMMachine atmMachine) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default\
  \ implementation for amount entry\npublic void processAmountEntry(ATMMachine atmMachine, BigDecimal amount) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for deposit collection\npublic void processDepositCollection(ATMMachine atmMachine, BigDecimal amount) {\n        renderDefaultAction(atmMachine);\n    }\n}\n\npublic class IdleState\nextends ATMState {\n    /**\n     * This method is called when a card is inserted into the ATM. This transitions the ATM to the\n     * PinEntryState if the card is valid.\n     */\n@Override\n    public void processCardInsertion(ATMMachine atmMachine, String cardNumber) {\n        if (atmMachine.getBankInterface().validateCard(cardNumber)) {\n            atmMachine.getDisplay().showMessage(\"Please enter your PIN\");\n            atmMachine.transitionToState(new PinEntryState());\n        } else {\n            atmMachine.getDisplay().showMessage(\"Invalid card. Please try again.\");\n        }\n    }\n}\n\npublic class\
  \ WithdrawAmountEntryState\nextends ATMState {\n    // Handles card ejection by canceling transaction and returning to idle state\n@Override\n    public void processCardEjection(ATMMachine atmMachine) {\n        atmMachine.getDisplay().showMessage(\"Transaction cancelled, card ejected\");\n        atmMachine.transitionToState(new IdleState());\n    }\n    // Processes withdrawal request by checking balance and dispensing cash if sufficient funds\n@Override\n    public void processAmountEntry(ATMMachine atmMachine, BigDecimal amount) {\n        String\ncardNumber\n= atmMachine.getCardProcessor().getCardNumber();\n        Account\naccount\n= atmMachine.getBankInterface().getAccountByCard(cardNumber);\n        boolean isSuccess\n= atmMachine.getBankInterface().withdrawFunds(account, amount);\n        if (isSuccess) {\n            atmMachine.getCashDispenser().dispenseCash(amount);\n            atmMachine.getDisplay().showMessage(\"Please take your cash.\");\n        } else {\n           \
  \ atmMachine.getDisplay().showMessage(\"Insufficient funds, please try again.\");\n        }\n        atmMachine.transitionToState(new TransactionSelectionState());\n    }\n}\n\n// Main ATM machine class that manages the state and hardware components of the ATM\npublic class ATMMachine {\n    private ATMState state;\n    private final CardProcessor cardProcessor;\n    private final DepositBox depositBox;\n    private final CashDispenser cashDispenser;\n    private final Keypad keypad;\n    private final Display display;\n    private final Bank bank;\n    // Initializes ATM with all required hardware components and bank interface public ATMMachine(\n            Bank bank,\n            CardProcessor cardProcessor,\n            DepositBox depositBox,\n            CashDispenser cashDispenser,\n            Keypad keypad,\n            Display display) {\n        this.bank = bank;\n        this.cardProcessor = cardProcessor;\n        this.depositBox = depositBox;\n        this.cashDispenser =\
  \ cashDispenser;\n        this.keypad = keypad;\n        this.display = display;\n        this.state = new IdleState();\n    }\n    // Forwards card insertion to current state for processing\npublic void insertCard(String cardNumber) {\n        state.processCardInsertion(this, cardNumber);\n    }\n    // Forwards card ejection to current state for processing\npublic void ejectCard() {\n        state.processCardEjection(this);\n    }\n    // Forwards PIN entry to current state for validation\npublic void enterPin(String pin) {\n        state.processPinEntry(this, pin);\n    }\n    // Forwards withdrawal request to current state for processing\npublic void withdrawRequest() {\n        state.processWithdrawalRequest(this);\n    }\n    // Forwards deposit request to current state for processing\npublic void depositRequest() {\n        state.processDepositRequest(this);\n    }\n    // Forwards amount entry to current state for processing\npublic void enterAmount(BigDecimal amount) {\n     \
  \   state.processAmountEntry(this, amount);\n    }\n    // Forwards deposit collection to current state for processing\npublic void collectDeposit(BigDecimal amount) {\n        state.processDepositCollection(this, amount);\n    }\n    // Returns the display component for showing messages\npublic Display getDisplay() {\n        return display;\n    }\n    // Returns the cash dispenser component for handling withdrawals\npublic CashDispenser getCashDispenser() {\n        return cashDispenser;\n    }\n    // Returns the bank interface for account operations\npublic BankInterface getBankInterface() {\n        return bank;\n    }\n    // Returns the card processor component for handling card operations\npublic CardProcessor getCardProcessor() {\n        return cardProcessor;\n    }\n    // Returns the keypad component for user input\npublic Keypad getKeypad() {\n        return keypad;\n    }\n    // Updates the current state of the ATM\npublic void transitionToState(ATMState nextState) {\n\
  \        this.state = nextState;\n    }\n    // Returns the current state of the ATM\npublic ATMState getCurrentState() {\n        return state;\n    }\n    // Returns the deposit box component for handling deposits\npublic DepositBox getDepositBox() {\n        return depositBox;\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design an Automated Teller Machine (ATM)


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **State Pattern (ATM Lifecycle), Chain of Responsibility (Multi-Denomination Dispenser), Command Pattern (Transaction Execution)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-atm-system
  label: Canonical — Design an Automated Teller Machine (ATM)
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
  code: "// Represents a bank account with balance, card details, and PIN security\npublic class Account {\n    private BigDecimal balance;\n    private final String accountNumber;\n    private final String cardNumber;\n    private final byte[] cardPinHash;\n    private final AccountType accountType;\n    // Creates a new account with initial zero balance and hashed PIN\npublic Account(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n            final String pin) {\n        this.accountNumber = accountNumber;\n        this.accountType = type;\n        this.cardNumber = cardNumber;\n        this.cardPinHash = calculateMd5(pin); // PIN is hashed for security\nthis.balance = BigDecimal.ZERO;\n    }\n    // Validates the entered PIN against stored hash\npublic boolean validatePin(String pinNumber) {\n        byte[] entryPinHash = calculateMd5(pinNumber);\n        return Arrays.equals(cardPinHash, entryPinHash);\n    }\n   \
    \ // Updates account balance by adding the specified amount\npublic void updateBalanceWithTransaction(final BigDecimal balanceChange) {\n        this.balance = this.balance.add(balanceChange);\n    }\n    // getter methods omitted for brevity\n}\n// Defines the type of bank account\npublic enum AccountType {\n    // Regular checking account for daily transactions\n    CHECKING,\n    // Interest-bearing savings account\n    SAVING\n}\n\npublic interface BankInterface {\n    void addAccount(String accountNumber, AccountType type, String cardNumber, String pin);\n    boolean validateCard(String cardNumber);\n    boolean checkPin(String cardNumber, String pinNumber);\n    Account getAccountByAccountNumber(String accountNumber);\n    Account getAccountByCard(String cardNumber);\n    boolean withdrawFunds(Account account, BigDecimal amount);\n}\n// Manages bank accounts and provides banking operations like validation and transactions\npublic class Bank\nimplements BankInterface {\n    private\
    \ final Map<String, Account> accounts = new HashMap<>();\n    private final Map<String, Account> accountByCard = new HashMap<>();\n    // Creates a new account and stores it in both account and card maps\n@Override\n    public void addAccount(\n            final String accountNumber,\n            final AccountType type,\n            final String cardNumber,\n            final String pin) {\n        final Account\nnewAccount\n=\nnew Account(accountNumber, type, cardNumber, pin);\n        accounts.put(newAccount.getAccountNumber(), newAccount);\n        accountByCard.put(newAccount.getCardNumber(), newAccount);\n    }\n    // Checks if a card number exists in the bank's records\n@Override\n    public boolean validateCard(final String cardNumber) {\n        return getAccountByCard(cardNumber) != null;\n    }\n    // Verifies if the provided PIN matches the card's stored PIN\n@Override\n    public boolean checkPin(String cardNumber, String pinNumber) {\n        Account\naccount\n= getAccountByCard(cardNumber);\n\
    \        if (account != null) {\n            return account.validatePin(pinNumber);\n        }\n        return false;\n    }\n    // Retrieves account by account number\n@Override\n    public Account getAccountByAccountNumber(String accountNumber) {\n        return accounts.get(accountNumber);\n    }\n    // Retrieves account by card number\n@Override\n    public Account getAccountByCard(String cardNumber) {\n        return accountByCard.get(cardNumber);\n    }\n    // Attempts to withdraw specified amount from account if sufficient funds exist\n@Override\n    public boolean withdrawFunds(Account account, BigDecimal amount) {\n        if (account.getBalance().compareTo(amount) >= 0) {\n            account.updateBalanceWithTransaction(amount.negate());\n            return true;\n        }\n        return false;\n    }\n}\n\npublic interface Transaction {\n    TransactionType getType();\n    boolean validateTransaction();\n    void executeTransaction();\n}\n// Handles the withdrawal transaction\
    \ process for removing funds from an account\npublic class WithdrawTransaction\nimplements Transaction {\n    Account account;\n    BigDecimal amount;\n    // Returns the transaction type as WITHDRAW\n@Override\n    public TransactionType getType() {\n        return TransactionType.WITHDRAW;\n    }\n    // Validates if the account has sufficient funds for withdrawal\n@Override\n    public boolean validateTransaction() {\n        assert account != null;\n        return account.getBalance().compareTo(amount) > 0;\n    }\n    // Creates a new withdrawal transaction, throws exception if validation fails\npublic WithdrawTransaction(Account account, BigDecimal amount) {\n        if (!validateTransaction()) {\n            throw new IllegalStateException(\n                    \"Cannot complete withdrawal: Insufficient funds in account\");\n        }\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes the withdrawal by subtracting the amount from account balance\n\
    @Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount.negate());\n    }\n}\n// Handles the deposit transaction process for adding funds to an account\npublic class DepositTransaction\nimplements Transaction {\n    final Account account;\n    final BigDecimal amount;\n    // Returns the transaction type as DEPOSIT\n@Override\n    public TransactionType getType() {\n        return TransactionType.DEPOSIT;\n    }\n    // Deposit transactions are always valid\n@Override\n    public boolean validateTransaction() {\n        return true;\n    }\n    public DepositTransaction(Account account, BigDecimal amount) {\n        this.account = account;\n        this.amount = amount;\n    }\n    // Executes the deposit by adding the amount to the account balance\n@Override\n    public void executeTransaction() {\n        account.updateBalanceWithTransaction(amount);\n    }\n}\n\npublic class ATMState {\n    // Displays an invalid action message on the\
    \ ATM screen\nprivate static void renderDefaultAction(ATMMachine atmMachine) {\n        atmMachine.getDisplay().showMessage(\"Invalid action, please try again.\");\n    }\n    // Default implementation for card insertion\npublic void processCardInsertion(ATMMachine atmMachine, String cardNumber) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for card ejection\npublic void processCardEjection(ATMMachine atmMachine) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for PIN entry\npublic void processPinEntry(ATMMachine atmMachine, String pin) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for withdrawal request\npublic void processWithdrawalRequest(ATMMachine atmMachine) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for deposit request\npublic void processDepositRequest(ATMMachine atmMachine) {\n        renderDefaultAction(atmMachine);\n    }\n    //\
    \ Default implementation for amount entry\npublic void processAmountEntry(ATMMachine atmMachine, BigDecimal amount) {\n        renderDefaultAction(atmMachine);\n    }\n    // Default implementation for deposit collection\npublic void processDepositCollection(ATMMachine atmMachine, BigDecimal amount) {\n        renderDefaultAction(atmMachine);\n    }\n}\n\npublic class IdleState\nextends ATMState {\n    /**\n     * This method is called when a card is inserted into the ATM. This transitions the ATM to the\n     * PinEntryState if the card is valid.\n     */\n@Override\n    public void processCardInsertion(ATMMachine atmMachine, String cardNumber) {\n        if (atmMachine.getBankInterface().validateCard(cardNumber)) {\n            atmMachine.getDisplay().showMessage(\"Please enter your PIN\");\n            atmMachine.transitionToState(new PinEntryState());\n        } else {\n            atmMachine.getDisplay().showMessage(\"Invalid card. Please try again.\");\n        }\n    }\n}\n\n\
    public class WithdrawAmountEntryState\nextends ATMState {\n    // Handles card ejection by canceling transaction and returning to idle state\n@Override\n    public void processCardEjection(ATMMachine atmMachine) {\n        atmMachine.getDisplay().showMessage(\"Transaction cancelled, card ejected\");\n        atmMachine.transitionToState(new IdleState());\n    }\n    // Processes withdrawal request by checking balance and dispensing cash if sufficient funds\n@Override\n    public void processAmountEntry(ATMMachine atmMachine, BigDecimal amount) {\n        String\ncardNumber\n= atmMachine.getCardProcessor().getCardNumber();\n        Account\naccount\n= atmMachine.getBankInterface().getAccountByCard(cardNumber);\n        boolean isSuccess\n= atmMachine.getBankInterface().withdrawFunds(account, amount);\n        if (isSuccess) {\n            atmMachine.getCashDispenser().dispenseCash(amount);\n            atmMachine.getDisplay().showMessage(\"Please take your cash.\");\n        } else {\n\
    \            atmMachine.getDisplay().showMessage(\"Insufficient funds, please try again.\");\n        }\n        atmMachine.transitionToState(new TransactionSelectionState());\n    }\n}\n\n// Main ATM machine class that manages the state and hardware components of the ATM\npublic class ATMMachine {\n    private ATMState state;\n    private final CardProcessor cardProcessor;\n    private final DepositBox depositBox;\n    private final CashDispenser cashDispenser;\n    private final Keypad keypad;\n    private final Display display;\n    private final Bank bank;\n    // Initializes ATM with all required hardware components and bank interface public ATMMachine(\n            Bank bank,\n            CardProcessor cardProcessor,\n            DepositBox depositBox,\n            CashDispenser cashDispenser,\n            Keypad keypad,\n            Display display) {\n        this.bank = bank;\n        this.cardProcessor = cardProcessor;\n        this.depositBox = depositBox;\n        this.cashDispenser\
    \ = cashDispenser;\n        this.keypad = keypad;\n        this.display = display;\n        this.state = new IdleState();\n    }\n    // Forwards card insertion to current state for processing\npublic void insertCard(String cardNumber) {\n        state.processCardInsertion(this, cardNumber);\n    }\n    // Forwards card ejection to current state for processing\npublic void ejectCard() {\n        state.processCardEjection(this);\n    }\n    // Forwards PIN entry to current state for validation\npublic void enterPin(String pin) {\n        state.processPinEntry(this, pin);\n    }\n    // Forwards withdrawal request to current state for processing\npublic void withdrawRequest() {\n        state.processWithdrawalRequest(this);\n    }\n    // Forwards deposit request to current state for processing\npublic void depositRequest() {\n        state.processDepositRequest(this);\n    }\n    // Forwards amount entry to current state for processing\npublic void enterAmount(BigDecimal amount) {\n \
    \       state.processAmountEntry(this, amount);\n    }\n    // Forwards deposit collection to current state for processing\npublic void collectDeposit(BigDecimal amount) {\n        state.processDepositCollection(this, amount);\n    }\n    // Returns the display component for showing messages\npublic Display getDisplay() {\n        return display;\n    }\n    // Returns the cash dispenser component for handling withdrawals\npublic CashDispenser getCashDispenser() {\n        return cashDispenser;\n    }\n    // Returns the bank interface for account operations\npublic BankInterface getBankInterface() {\n        return bank;\n    }\n    // Returns the card processor component for handling card operations\npublic CardProcessor getCardProcessor() {\n        return cardProcessor;\n    }\n    // Returns the keypad component for user input\npublic Keypad getKeypad() {\n        return keypad;\n    }\n    // Updates the current state of the ATM\npublic void transitionToState(ATMState nextState)\
    \ {\n        this.state = nextState;\n    }\n    // Returns the current state of the ATM\npublic ATMState getCurrentState() {\n        return state;\n    }\n    // Returns the deposit box component for handling deposits\npublic DepositBox getDepositBox() {\n        return depositBox;\n    }\n}"
- approachId: strategy-pattern-atm
  label: Alternate — Strategy Pattern Banking Operations & Mutex Controller
  approachClass: ALTERNATE
  kind: CODE
  summary: Decouples financial business rules from physical ATM hardware devices (CardReader, CashDispenser, Keypad). Each banking workflow is an interchangeable TransactionStrategy, facilitating extension to bill pay and fund transfer while locking hardware access through atomic operations.
  keyIdea: Encapsulate withdrawal, deposit, and balance inquiry as distinct TransactionStrategy implementations executed via a centralized hardware controller.
  timeComplexity: O(1)
  spaceComplexity: O(1)
  tradeoffs:
  - Simple to add new banking transactions without modifying ATM controller state machine
  - Requires careful synchronization across shared hardware resources
  whenToUse: When transaction types frequently evolve or vary by banking network.
  code: "// Alternate Approach: Strategy Pattern Banking Operations & Mutex Controller\nimport java.util.*;\nimport java.util.concurrent.locks.ReentrantLock;\n\nenum OperationType { WITHDRAWAL, DEPOSIT, BALANCE_INQUIRY }\n\nclass BankAccount {\n    private final String accountNumber;\n    private double balance;\n\n    public BankAccount(String accountNumber, double balance) {\n        this.accountNumber = accountNumber;\n        this.balance = balance;\n    }\n\n    public synchronized double getBalance() { return balance; }\n    public synchronized boolean withdraw(double amount) {\n        if (amount > 0 && balance >= amount) {\n            balance -= amount;\n            return true;\n        }\n        return false;\n    }\n    public synchronized void deposit(double amount) {\n        if (amount > 0) balance += amount;\n    }\n    public String getAccountNumber() { return accountNumber; }\n}\n\ninterface TransactionStrategy {\n    boolean execute(BankAccount account, double amount,\
    \ CashDispenser dispenser);\n}\n\nclass WithdrawalStrategy implements TransactionStrategy {\n    @Override\n    public boolean execute(BankAccount account, double amount, CashDispenser dispenser) {\n        if (!dispenser.hasSufficientCash(amount)) {\n            System.out.println(\"ATM has insufficient physical cash.\");\n            return false;\n        }\n        if (account.withdraw(amount)) {\n            dispenser.dispense(amount);\n            System.out.println(\"Dispensed: $\" + amount + \". New balance: $\" + account.getBalance());\n            return true;\n        }\n        System.out.println(\"Insufficient account funds.\");\n        return false;\n    }\n}\n\nclass DepositStrategy implements TransactionStrategy {\n    @Override\n    public boolean execute(BankAccount account, double amount, CashDispenser dispenser) {\n        account.deposit(amount);\n        dispenser.acceptCash(amount);\n        System.out.println(\"Deposited: $\" + amount + \". New balance: $\" +\
    \ account.getBalance());\n        return true;\n    }\n}\n\nclass BalanceInquiryStrategy implements TransactionStrategy {\n    @Override\n    public boolean execute(BankAccount account, double amount, CashDispenser dispenser) {\n        System.out.println(\"Current Account Balance: $\" + account.getBalance());\n        return true;\n    }\n}\n\nclass CashDispenser {\n    private double totalCash;\n\n    public CashDispenser(double initialCash) { this.totalCash = initialCash; }\n    public synchronized boolean hasSufficientCash(double amount) { return totalCash >= amount; }\n    public synchronized void dispense(double amount) { totalCash -= amount; }\n    public synchronized void acceptCash(double amount) { totalCash += amount; }\n}\n\nclass ATMController {\n    private final CashDispenser cashDispenser;\n    private final Map<OperationType, TransactionStrategy> strategies = new EnumMap<>(OperationType.class);\n    private final ReentrantLock hardwareLock = new ReentrantLock();\n\n \
    \   public ATMController(double initialCash) {\n        this.cashDispenser = new CashDispenser(initialCash);\n        strategies.put(OperationType.WITHDRAWAL, new WithdrawalStrategy());\n        strategies.put(OperationType.DEPOSIT, new DepositStrategy());\n        strategies.put(OperationType.BALANCE_INQUIRY, new BalanceInquiryStrategy());\n    }\n\n    public boolean performTransaction(OperationType op, BankAccount account, double amount) {\n        hardwareLock.lock();\n        try {\n            TransactionStrategy strategy = strategies.get(op);\n            if (strategy == null) {\n                System.out.println(\"Unsupported transaction operation.\");\n                return false;\n            }\n            return strategy.execute(account, amount, cashDispenser);\n        } finally {\n            hardwareLock.unlock();\n        }\n    }\n}\n"
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
