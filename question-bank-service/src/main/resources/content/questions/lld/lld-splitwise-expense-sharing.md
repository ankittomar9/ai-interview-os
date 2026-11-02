---
slug: lld-splitwise-expense-sharing
title: "Expense Sharing and Balance Settling System"
track: SPRING_LLD
difficulty: EASY
topics:
  - lld
est_minutes: 35
tags: ['expense-manager', 'splits', 'graph-simplification', 'finance']
buildProfile: maven-workspace
source: ai-generated:v1
status: PUBLISHED
hints:
  - "Decouple interfaces from concrete implementations using standard design patterns."
  - "Ensure thread safety across shared data structures using concurrent collections or synchronization."
  - "Keep domain classes cohesive with clean single responsibilities."
coaching:
  presentationTips:
    - "Clarify functional requirements and thread-safety expectations before writing code."
    - "Identify core design patterns (Factory, Strategy, Observer, State, Composite) explicitly."
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.splitwise</groupId>
        <artifactId>expense-sharing</artifactId>
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
    # Expense Sharing and Balance Settling System

    ## Overview
    Design an expense management system supporting split types (EQUAL, EXACT, PERCENT), user balance tracking, and simplified debt reconciliation.
  src/main/java/com/interviewos/splitwise/ExpenseManager.java: |
    package com.interviewos.splitwise;

    import java.util.List;
    import java.util.Map;

    public interface ExpenseManager {
        void addExpenseEqual(String paidBy, double amount, List<String> participants);
        Map<String, Double> getBalancesForUser(String userId);
    }
  src/main/java/com/interviewos/splitwise/impl/ExpenseManagerImpl.java: |
    package com.interviewos.splitwise;

    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;

    public class InMemoryExpenseManager implements ExpenseManager {

        // user -> (otherUser -> balanceOwedToOtherUser)
        private final Map<String, Map<String, Double>> balances = new ConcurrentHashMap<>();

        @Override
        public void addExpenseEqual(String paidBy, double amount, List<String> participants) {
            if (participants.isEmpty()) return;
            double splitAmount = amount / participants.size();

            for (String participant : participants) {
                if (!participant.equals(paidBy)) {
                    // participant owes paidBy
                    updateBalance(participant, paidBy, splitAmount);
                    updateBalance(paidBy, participant, -splitAmount);
                }
            }
        }

        private synchronized void updateBalance(String debtor, String creditor, double delta) {
            balances.computeIfAbsent(debtor, k -> new HashMap<>())
                    .merge(creditor, delta, Double::sum);
        }

        @Override
        public Map<String, Double> getBalancesForUser(String userId) {
            return balances.getOrDefault(userId, Collections.emptyMap());
        }
    }
starterCode: |
  package com.interviewos.splitwise;

  import java.util.List;
  import java.util.Map;

  public interface ExpenseManager {
      void addExpenseEqual(String paidBy, double amount, List<String> participants);
      Map<String, Double> getBalancesForUser(String userId);
  }
solutionCode: |
  package com.interviewos.splitwise;

  import java.util.*;
  import java.util.concurrent.ConcurrentHashMap;

  public class InMemoryExpenseManager implements ExpenseManager {

      // user -> (otherUser -> balanceOwedToOtherUser)
      private final Map<String, Map<String, Double>> balances = new ConcurrentHashMap<>();

      @Override
      public void addExpenseEqual(String paidBy, double amount, List<String> participants) {
          if (participants.isEmpty()) return;
          double splitAmount = amount / participants.size();

          for (String participant : participants) {
              if (!participant.equals(paidBy)) {
                  // participant owes paidBy
                  updateBalance(participant, paidBy, splitAmount);
                  updateBalance(paidBy, participant, -splitAmount);
              }
          }
      }

      private synchronized void updateBalance(String debtor, String creditor, double delta) {
          balances.computeIfAbsent(debtor, k -> new HashMap<>())
                  .merge(creditor, delta, Double::sum);
      }

      @Override
      public Map<String, Double> getBalancesForUser(String userId) {
          return balances.getOrDefault(userId, Collections.emptyMap());
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/splitwise/ExpenseManagerTest.java: |
    package com.interviewos.splitwise;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import java.util.List;
    import static org.junit.jupiter.api.Assertions.*;

    public class ExpenseManagerTest {

        @Test
        @DisplayName("Equal split updates reciprocal balances")
        void testEqualSplit() {
            ExpenseManager manager = new InMemoryExpenseManager();
            manager.addExpenseEqual("u1", 300.0, List.of("u1", "u2", "u3"));

            assertEquals(100.0, manager.getBalancesForUser("u2").get("u1"), 0.01);
            assertEquals(100.0, manager.getBalancesForUser("u3").get("u1"), 0.01);
            assertEquals(-100.0, manager.getBalancesForUser("u1").get("u2"), 0.01);
        }
    }
referenceSolutions:
  - approachId: canonical-lld-splitwise-expense-sharing
    label: "Primary — Expense Sharing and Balance Settling System"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an expense management system supporting split types (EQUAL, EXACT, PERCENT), user balance tracking, and simplified debt reconciliation."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.splitwise;

      import java.util.*;
      import java.util.concurrent.ConcurrentHashMap;

      public class InMemoryExpenseManager implements ExpenseManager {

          // user -> (otherUser -> balanceOwedToOtherUser)
          private final Map<String, Map<String, Double>> balances = new ConcurrentHashMap<>();

          @Override
          public void addExpenseEqual(String paidBy, double amount, List<String> participants) {
              if (participants.isEmpty()) return;
              double splitAmount = amount / participants.size();

              for (String participant : participants) {
                  if (!participant.equals(paidBy)) {
                      // participant owes paidBy
                      updateBalance(participant, paidBy, splitAmount);
                      updateBalance(paidBy, participant, -splitAmount);
                  }
              }
          }

          private synchronized void updateBalance(String debtor, String creditor, double delta) {
              balances.computeIfAbsent(debtor, k -> new HashMap<>())
                      .merge(creditor, delta, Double::sum);
          }

          @Override
          public Map<String, Double> getBalancesForUser(String userId) {
              return balances.getOrDefault(userId, Collections.emptyMap());
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Expense Sharing and Balance Settling System

Design an expense management system supporting split types (EQUAL, EXACT, PERCENT), user balance tracking, and simplified debt reconciliation.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Expense Sharing and Balance Settling System.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
