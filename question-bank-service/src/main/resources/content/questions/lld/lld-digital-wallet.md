---
slug: lld-digital-wallet
title: Digital Wallet
track: SPRING_LLD
difficulty: HARD
topics:
- lld
est_minutes: 45
tags:
- object-oriented-design
- lld
- java
- design-patterns
- command-pattern
- strategy-pattern
- digital-wallet
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/digital-wallet
status: PUBLISHED
hints:
- Use BigDecimal for all currency amounts to prevent IEEE 754 floating-point rounding errors.
- Enforce atomic debit-and-credit during inter-account transfers to prevent phantom funds.
- Ensure the TransactionLedger records both SUCCESS and FAILED transfer attempts for regulatory auditing.
coaching:
  presentationTips:
  - Clarify concurrency control: explain how balance updates are synchronized to prevent double-spending.
  - Discuss how the Strategy pattern isolates fee calculation rules from transfer orchestration.
  - Detail auditability: why recording failed attempts in the ledger is crucial for financial compliance.
  commonMistakes:
  - Using double or float primitives for monetary arithmetic.
  - Debiting the sender before verifying that the receiver account exists and is valid.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>digital-wallet</artifactId>
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
    # Digital Wallet

    ## Overview
    Implement an object-oriented Digital Wallet payment management platform supporting account balance management, atomic fund transfers, transaction fee policies, and an auditable transaction ledger.

    ## Key Components
    - `com.interviewos.wallet.service.WalletService`: Coordinates account operations, deposit, withdrawal, and fund transfers.
    - `com.interviewos.wallet.service.TransactionLedger`: Immutable audit ledger recording every transaction event.
    - `com.interviewos.wallet.policy.FeeCalculationPolicy`: Pluggable policy determining fee surcharges per transaction type.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/wallet/service/TransactionLedger.java`
    2. `src/main/java/com/interviewos/wallet/service/WalletService.java`
  src/main/java/com/interviewos/wallet/model/TransactionType.java: |
    package com.interviewos.wallet.model;

    public enum TransactionType {
        DEPOSIT,
        WITHDRAWAL,
        TRANSFER
    }
  src/main/java/com/interviewos/wallet/model/TransactionStatus.java: |
    package com.interviewos.wallet.model;

    public enum TransactionStatus {
        SUCCESS,
        FAILED
    }
  src/main/java/com/interviewos/wallet/model/WalletAccount.java: |
    package com.interviewos.wallet.model;

    import java.math.BigDecimal;

    public class WalletAccount {
        private final String accountId;
        private final String userId;
        private volatile BigDecimal balance;
        private final String currency;

        public WalletAccount(String accountId, String userId, BigDecimal initialBalance) {
            this(accountId, userId, initialBalance, "USD");
        }

        public WalletAccount(String accountId, String userId, BigDecimal initialBalance, String currency) {
            this.accountId = accountId;
            this.userId = userId;
            this.balance = initialBalance != null ? initialBalance : BigDecimal.ZERO;
            this.currency = currency != null ? currency : "USD";
        }

        public String getAccountId() { return accountId; }
        public String getUserId() { return userId; }
        public BigDecimal getBalance() { return balance; }
        public String getCurrency() { return currency; }

        public synchronized void credit(BigDecimal amount) {
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                this.balance = this.balance.add(amount);
            }
        }

        public synchronized boolean debit(BigDecimal amount) {
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                if (this.balance.compareTo(amount) >= 0) {
                    this.balance = this.balance.subtract(amount);
                    return true;
                }
            }
            return false;
        }
    }
  src/main/java/com/interviewos/wallet/model/WalletTransaction.java: |
    package com.interviewos.wallet.model;

    import java.math.BigDecimal;
    import java.time.Instant;

    public class WalletTransaction {
        private final String transactionId;
        private final String fromAccountId;
        private final String toAccountId;
        private final BigDecimal amount;
        private final BigDecimal fee;
        private final TransactionType type;
        private final TransactionStatus status;
        private final Instant timestamp;

        public WalletTransaction(String transactionId, String fromAccountId, String toAccountId, BigDecimal amount, BigDecimal fee, TransactionType type, TransactionStatus status) {
            this(transactionId, fromAccountId, toAccountId, amount, fee, type, status, Instant.now());
        }

        public WalletTransaction(String transactionId, String fromAccountId, String toAccountId, BigDecimal amount, BigDecimal fee, TransactionType type, TransactionStatus status, Instant timestamp) {
            this.transactionId = transactionId;
            this.fromAccountId = fromAccountId;
            this.toAccountId = toAccountId;
            this.amount = amount;
            this.fee = fee != null ? fee : BigDecimal.ZERO;
            this.type = type;
            this.status = status;
            this.timestamp = timestamp != null ? timestamp : Instant.now();
        }

        public String getTransactionId() { return transactionId; }
        public String getFromAccountId() { return fromAccountId; }
        public String getToAccountId() { return toAccountId; }
        public BigDecimal getAmount() { return amount; }
        public BigDecimal getFee() { return fee; }
        public TransactionType getType() { return type; }
        public TransactionStatus getStatus() { return status; }
        public Instant getTimestamp() { return timestamp; }
    }
  src/main/java/com/interviewos/wallet/policy/FeeCalculationPolicy.java: |
    package com.interviewos.wallet.policy;

    import com.interviewos.wallet.model.TransactionType;
    import java.math.BigDecimal;

    public interface FeeCalculationPolicy {
        BigDecimal calculateFee(BigDecimal amount, TransactionType type);
    }
  src/main/java/com/interviewos/wallet/policy/StandardFeePolicy.java: |
    package com.interviewos.wallet.policy;

    import com.interviewos.wallet.model.TransactionType;
    import java.math.BigDecimal;

    public class StandardFeePolicy implements FeeCalculationPolicy {
        private static final BigDecimal TRANSFER_FEE = new BigDecimal("0.50");

        @Override
        public BigDecimal calculateFee(BigDecimal amount, TransactionType type) {
            if (type == TransactionType.TRANSFER) {
                return TRANSFER_FEE;
            }
            return BigDecimal.ZERO;
        }
    }
  src/main/java/com/interviewos/wallet/service/TransactionLedger.java: |
    package com.interviewos.wallet.service;

    import com.interviewos.wallet.model.WalletTransaction;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class TransactionLedger {
        private final List<WalletTransaction> transactions = new CopyOnWriteArrayList<>();
        private final Map<String, WalletTransaction> transactionById = new ConcurrentHashMap<>();

        public void record(WalletTransaction tx) {
            // TODO: Store transaction in global list and index by ID
            throw new UnsupportedOperationException("TODO: Implement TransactionLedger.record");
        }

        public List<WalletTransaction> getAccountTransactions(String accountId) {
            // TODO: Filter transactions where fromAccountId or toAccountId matches
            throw new UnsupportedOperationException("TODO: Implement TransactionLedger.getAccountTransactions");
        }

        public WalletTransaction getTransaction(String txId) {
            return transactionById.get(txId);
        }

        public List<WalletTransaction> getAllTransactions() {
            return new ArrayList<>(transactions);
        }
    }
  src/main/java/com/interviewos/wallet/service/WalletService.java: |
    package com.interviewos.wallet.service;

    import com.interviewos.wallet.model.*;
    import com.interviewos.wallet.policy.FeeCalculationPolicy;
    import com.interviewos.wallet.policy.StandardFeePolicy;

    import java.math.BigDecimal;
    import java.util.Map;
    import java.util.UUID;
    import java.util.concurrent.ConcurrentHashMap;

    public class WalletService {
        private final Map<String, WalletAccount> accounts = new ConcurrentHashMap<>();
        private final TransactionLedger ledger;
        private final FeeCalculationPolicy feePolicy;

        public WalletService() {
            this(new TransactionLedger(), new StandardFeePolicy());
        }

        public WalletService(TransactionLedger ledger, FeeCalculationPolicy feePolicy) {
            this.ledger = ledger != null ? ledger : new TransactionLedger();
            this.feePolicy = feePolicy != null ? feePolicy : new StandardFeePolicy();
        }

        public WalletAccount createAccount(String accountId, String userId, BigDecimal initialBalance) {
            // TODO: Create account, register in map, record initial deposit if balance > 0
            throw new UnsupportedOperationException("TODO: Implement WalletService.createAccount");
        }

        public WalletAccount getAccount(String accountId) {
            return accounts.get(accountId);
        }

        public synchronized boolean deposit(String accountId, BigDecimal amount) {
            // TODO: Credit account, record SUCCESS transaction in ledger
            throw new UnsupportedOperationException("TODO: Implement WalletService.deposit");
        }

        public synchronized boolean withdraw(String accountId, BigDecimal amount) {
            // TODO: Debit account if funds suffice, record transaction in ledger
            throw new UnsupportedOperationException("TODO: Implement WalletService.withdraw");
        }

        public synchronized boolean transfer(String fromAccountId, String toAccountId, BigDecimal amount) {
            // TODO: Compute fee, debit source (amount + fee), credit destination, record transaction in ledger
            throw new UnsupportedOperationException("TODO: Implement WalletService.transfer");
        }

        public TransactionLedger getLedger() {
            return ledger;
        }
    }
  src/test/java/com/interviewos/wallet/WalletDepositWithdrawTest.java: |
    package com.interviewos.wallet;

    import com.interviewos.wallet.model.WalletAccount;
    import com.interviewos.wallet.service.WalletService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class WalletDepositWithdrawTest {

        @Test
        @DisplayName("Deposit increases account balance")
        void testDepositIncreasesBalance() {
            WalletService service = new WalletService();
            WalletAccount acc = service.createAccount("ACC-1", "user-1", new BigDecimal("100.00"));

            boolean deposited = service.deposit("ACC-1", new BigDecimal("50.00"));
            assertTrue(deposited);
            assertEquals(new BigDecimal("150.00"), service.getAccount("ACC-1").getBalance());
        }

        @Test
        @DisplayName("Withdrawal decreases balance but rejects overdrafts")
        void testWithdrawalOverdraftProtection() {
            WalletService service = new WalletService();
            service.createAccount("ACC-2", "user-2", new BigDecimal("80.00"));

            boolean validWithdraw = service.withdraw("ACC-2", new BigDecimal("30.00"));
            assertTrue(validWithdraw);
            assertEquals(new BigDecimal("50.00"), service.getAccount("ACC-2").getBalance());

            boolean excessiveWithdraw = service.withdraw("ACC-2", new BigDecimal("100.00"));
            assertFalse(excessiveWithdraw, "Withdrawal exceeding available balance must fail");
            assertEquals(new BigDecimal("50.00"), service.getAccount("ACC-2").getBalance());
        }
    }
  src/test/java/com/interviewos/wallet/WalletFundTransferTest.java: |
    package com.interviewos.wallet;

    import com.interviewos.wallet.model.WalletAccount;
    import com.interviewos.wallet.service.WalletService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class WalletFundTransferTest {

        @Test
        @DisplayName("Transfer debits source and credits destination including fee")
        void testSuccessfulFundTransfer() {
            WalletService service = new WalletService();
            service.createAccount("SRC-1", "alice", new BigDecimal("200.00"));
            service.createAccount("DST-1", "bob", new BigDecimal("50.00"));

            // Amount: 100.00, StandardFee: 0.50 => Source debited 100.50, Dest credited 100.00
            boolean transferred = service.transfer("SRC-1", "DST-1", new BigDecimal("100.00"));
            assertTrue(transferred);

            assertEquals(new BigDecimal("99.50"), service.getAccount("SRC-1").getBalance());
            assertEquals(new BigDecimal("150.00"), service.getAccount("DST-1").getBalance());
        }

        @Test
        @DisplayName("Transfer fails atomically when source account has insufficient funds")
        void testTransferInsufficientFundsRollback() {
            WalletService service = new WalletService();
            service.createAccount("SRC-2", "carol", new BigDecimal("40.00"));
            service.createAccount("DST-2", "dave", new BigDecimal("10.00"));

            boolean transferred = service.transfer("SRC-2", "DST-2", new BigDecimal("50.00"));
            assertFalse(transferred);

            // Balances must remain unchanged
            assertEquals(new BigDecimal("40.00"), service.getAccount("SRC-2").getBalance());
            assertEquals(new BigDecimal("10.00"), service.getAccount("DST-2").getBalance());
        }
    }
  src/test/java/com/interviewos/wallet/WalletLedgerAuditTest.java: |
    package com.interviewos.wallet;

    import com.interviewos.wallet.model.WalletTransaction;
    import com.interviewos.wallet.service.WalletService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class WalletLedgerAuditTest {

        @Test
        @DisplayName("Ledger records all successful deposit, withdrawal, and transfer events")
        void testAuditTrailCompleteness() {
            WalletService service = new WalletService();
            service.createAccount("ACT-1", "u1", new BigDecimal("100.00"));
            service.createAccount("ACT-2", "u2", new BigDecimal("50.00"));

            service.deposit("ACT-1", new BigDecimal("25.00"));
            service.withdraw("ACT-1", new BigDecimal("15.00"));
            service.transfer("ACT-1", "ACT-2", new BigDecimal("30.00"));

            List<WalletTransaction> act1History = service.getLedger().getAccountTransactions("ACT-1");
            assertNotNull(act1History);
            assertTrue(act1History.size() >= 3);
        }

        @Test
        @DisplayName("Failed withdrawal is logged as FAILED transaction in ledger")
        void testFailedTransactionAudited() {
            WalletService service = new WalletService();
            service.createAccount("ACT-FAIL", "u3", new BigDecimal("20.00"));

            boolean result = service.withdraw("ACT-FAIL", new BigDecimal("100.00"));
            assertFalse(result);

            List<WalletTransaction> history = service.getLedger().getAccountTransactions("ACT-FAIL");
            assertTrue(history.stream().anyMatch(t -> t.getStatus().name().equals("FAILED")));
        }
    }
editablePaths:
- src/main/java/com/interviewos/wallet/service/TransactionLedger.java
- src/main/java/com/interviewos/wallet/service/WalletService.java
hiddenTestFiles:
  src/test/java/com/interviewos/wallet/WalletDepositWithdrawTest.java: |
    package com.interviewos.wallet;

    import com.interviewos.wallet.model.WalletAccount;
    import com.interviewos.wallet.service.WalletService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class WalletDepositWithdrawTest {

        @Test
        @DisplayName("Deposit increases account balance")
        void testDepositIncreasesBalance() {
            WalletService service = new WalletService();
            WalletAccount acc = service.createAccount("ACC-1", "user-1", new BigDecimal("100.00"));

            boolean deposited = service.deposit("ACC-1", new BigDecimal("50.00"));
            assertTrue(deposited);
            assertEquals(new BigDecimal("150.00"), service.getAccount("ACC-1").getBalance());
        }

        @Test
        @DisplayName("Withdrawal decreases balance but rejects overdrafts")
        void testWithdrawalOverdraftProtection() {
            WalletService service = new WalletService();
            service.createAccount("ACC-2", "user-2", new BigDecimal("80.00"));

            boolean validWithdraw = service.withdraw("ACC-2", new BigDecimal("30.00"));
            assertTrue(validWithdraw);
            assertEquals(new BigDecimal("50.00"), service.getAccount("ACC-2").getBalance());

            boolean excessiveWithdraw = service.withdraw("ACC-2", new BigDecimal("100.00"));
            assertFalse(excessiveWithdraw, "Withdrawal exceeding available balance must fail");
            assertEquals(new BigDecimal("50.00"), service.getAccount("ACC-2").getBalance());
        }
    }
  src/test/java/com/interviewos/wallet/WalletFundTransferTest.java: |
    package com.interviewos.wallet;

    import com.interviewos.wallet.model.WalletAccount;
    import com.interviewos.wallet.service.WalletService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;

    import static org.junit.jupiter.api.Assertions.*;

    public class WalletFundTransferTest {

        @Test
        @DisplayName("Transfer debits source and credits destination including fee")
        void testSuccessfulFundTransfer() {
            WalletService service = new WalletService();
            service.createAccount("SRC-1", "alice", new BigDecimal("200.00"));
            service.createAccount("DST-1", "bob", new BigDecimal("50.00"));

            // Amount: 100.00, StandardFee: 0.50 => Source debited 100.50, Dest credited 100.00
            boolean transferred = service.transfer("SRC-1", "DST-1", new BigDecimal("100.00"));
            assertTrue(transferred);

            assertEquals(new BigDecimal("99.50"), service.getAccount("SRC-1").getBalance());
            assertEquals(new BigDecimal("150.00"), service.getAccount("DST-1").getBalance());
        }

        @Test
        @DisplayName("Transfer fails atomically when source account has insufficient funds")
        void testTransferInsufficientFundsRollback() {
            WalletService service = new WalletService();
            service.createAccount("SRC-2", "carol", new BigDecimal("40.00"));
            service.createAccount("DST-2", "dave", new BigDecimal("10.00"));

            boolean transferred = service.transfer("SRC-2", "DST-2", new BigDecimal("50.00"));
            assertFalse(transferred);

            // Balances must remain unchanged
            assertEquals(new BigDecimal("40.00"), service.getAccount("SRC-2").getBalance());
            assertEquals(new BigDecimal("10.00"), service.getAccount("DST-2").getBalance());
        }
    }
  src/test/java/com/interviewos/wallet/WalletLedgerAuditTest.java: |
    package com.interviewos.wallet;

    import com.interviewos.wallet.model.WalletTransaction;
    import com.interviewos.wallet.service.WalletService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.math.BigDecimal;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class WalletLedgerAuditTest {

        @Test
        @DisplayName("Ledger records all successful deposit, withdrawal, and transfer events")
        void testAuditTrailCompleteness() {
            WalletService service = new WalletService();
            service.createAccount("ACT-1", "u1", new BigDecimal("100.00"));
            service.createAccount("ACT-2", "u2", new BigDecimal("50.00"));

            service.deposit("ACT-1", new BigDecimal("25.00"));
            service.withdraw("ACT-1", new BigDecimal("15.00"));
            service.transfer("ACT-1", "ACT-2", new BigDecimal("30.00"));

            List<WalletTransaction> act1History = service.getLedger().getAccountTransactions("ACT-1");
            assertNotNull(act1History);
            assertTrue(act1History.size() >= 3);
        }

        @Test
        @DisplayName("Failed withdrawal is logged as FAILED transaction in ledger")
        void testFailedTransactionAudited() {
            WalletService service = new WalletService();
            service.createAccount("ACT-FAIL", "u3", new BigDecimal("20.00"));

            boolean result = service.withdraw("ACT-FAIL", new BigDecimal("100.00"));
            assertFalse(result);

            List<WalletTransaction> history = service.getLedger().getAccountTransactions("ACT-FAIL");
            assertTrue(history.stream().anyMatch(t -> t.getStatus().name().equals("FAILED")));
        }
    }
starterCode: |
  package com.interviewos.wallet.service;

  import com.interviewos.wallet.model.WalletTransaction;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;
  import java.util.concurrent.CopyOnWriteArrayList;

  public class TransactionLedger {
      private final List<WalletTransaction> transactions = new CopyOnWriteArrayList<>();
      private final Map<String, WalletTransaction> transactionById = new ConcurrentHashMap<>();

      public void record(WalletTransaction tx) {
          // TODO: Store transaction in global list and index by ID
          throw new UnsupportedOperationException("TODO: Implement TransactionLedger.record");
      }

      public List<WalletTransaction> getAccountTransactions(String accountId) {
          // TODO: Filter transactions where fromAccountId or toAccountId matches
          throw new UnsupportedOperationException("TODO: Implement TransactionLedger.getAccountTransactions");
      }

      public WalletTransaction getTransaction(String txId) {
          return transactionById.get(txId);
      }

      public List<WalletTransaction> getAllTransactions() {
          return new ArrayList<>(transactions);
      }
  }
solutionCode: |
  package com.interviewos.wallet.service;

  import com.interviewos.wallet.model.WalletTransaction;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;
  import java.util.concurrent.CopyOnWriteArrayList;

  public class TransactionLedger {
      private final List<WalletTransaction> transactions = new CopyOnWriteArrayList<>();
      private final Map<String, WalletTransaction> transactionById = new ConcurrentHashMap<>();

      public void record(WalletTransaction tx) {
          if (tx != null) {
              transactions.add(tx);
              transactionById.put(tx.getTransactionId(), tx);
          }
      }

      public List<WalletTransaction> getAccountTransactions(String accountId) {
          List<WalletTransaction> result = new ArrayList<>();
          if (accountId == null) return result;
          for (WalletTransaction tx : transactions) {
              if (accountId.equals(tx.getFromAccountId()) || accountId.equals(tx.getToAccountId())) {
                  result.add(tx);
              }
          }
          return result;
      }

      public WalletTransaction getTransaction(String txId) {
          return transactionById.get(txId);
      }

      public List<WalletTransaction> getAllTransactions() {
          return new ArrayList<>(transactions);
      }
  }
---

### Problem Statement: Digital Wallet

You are tasked with designing and implementing an object-oriented Digital Wallet payment management platform in Java. Modern financial applications must ensure strict monetary consistency: account balances must never dip below zero without credit arrangements, inter-account transfers must execute atomically, fee calculation policies must be pluggable, and every balance mutation must be recorded in an immutable audit ledger.

#### Functional Requirements:
1. **Wallet Account Modeling**: Model user wallet accounts with unique account identifiers, owner user identifiers, balances using BigDecimal, and currency codes.
2. **Deposit Operation**: Support crediting funds to an account, atomically increasing the balance and recording an audit trail record.
3. **Withdrawal Operation**: Support debiting funds from an account with strict overdraft checks; if balance is insufficient, the withdrawal must fail.
4. **Atomic Inter-Account Transfer**: Implement fund transfers between two accounts where the source is debited and destination is credited atomically.
5. **Pluggable Fee Policy**: Support a FeeCalculationPolicy interface (such as StandardFeePolicy) that applies surcharge fees to transactions based on transaction type.
6. **Immutable Transaction Ledger**: Maintain an append-only TransactionLedger recording every transaction attempt, including transaction identifier, accounts involved, amount, fee, status (SUCCESS or FAILED), and timestamp.
7. **Account-Centric Audit Query**: Enable querying all historical transactions associated with a given account in chronological order.
8. **Thread Safety & Consistency**: Protect account balances against race conditions and lost updates during concurrent deposits, withdrawals, and transfers.

#### Non-goals:
- Foreign exchange multi-currency conversion tables and central bank clearance rails are excluded; all operations execute in a unified base currency.
- Asynchronous credit risk scoring algorithms and external merchant webhook handlers are omitted for this core in-memory engine.
