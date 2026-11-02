---
slug: lld-library-management-system
title: "Library Book Catalog & Reservation System"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['inventory', 'reservation', 'fine-calculation', 'oop']
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
        <groupId>com.interviewos.library</groupId>
        <artifactId>library-system</artifactId>
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
    # Library Book Catalog & Reservation System

    ## Overview
    Design an automated library management system supporting book searches, checkout limits, renewal policies, and late-return fine calculations.
  src/main/java/com/interviewos/library/LibrarySystem.java: |
    package com.interviewos.library;

    public interface LibrarySystem {
        void addBookItem(String isbn, String title);
        boolean checkoutBook(String userId, String isbn);
        double returnBook(String userId, String isbn, int daysHeld);
    }
  src/main/java/com/interviewos/library/impl/LibrarySystemImpl.java: |
    package com.interviewos.library;

    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;

    public class DefaultLibrarySystem implements LibrarySystem {

        private final Map<String, Integer> inventory = new ConcurrentHashMap<>();
        private final Map<String, Set<String>> userLoans = new ConcurrentHashMap<>();

        @Override
        public void addBookItem(String isbn, String title) {
            inventory.merge(isbn, 1, Integer::sum);
        }

        @Override
        public synchronized boolean checkoutBook(String userId, String isbn) {
            int available = inventory.getOrDefault(isbn, 0);
            if (available <= 0) return false;

            inventory.put(isbn, available - 1);
            userLoans.computeIfAbsent(userId, k -> new HashSet<>()).add(isbn);
            return true;
        }

        @Override
        public synchronized double returnBook(String userId, String isbn, int daysHeld) {
            inventory.merge(isbn, 1, Integer::sum);
            Set<String> loans = userLoans.get(userId);
            if (loans != null) loans.remove(isbn);

            int maxAllowedDays = 14;
            if (daysHeld > maxAllowedDays) {
                return (daysHeld - maxAllowedDays) * 0.50; // 50 cents fine per day
            }
            return 0.0;
        }
    }
starterCode: |
  package com.interviewos.library;

  public interface LibrarySystem {
      void addBookItem(String isbn, String title);
      boolean checkoutBook(String userId, String isbn);
      double returnBook(String userId, String isbn, int daysHeld);
  }
solutionCode: |
  package com.interviewos.library;

  import java.util.*;
  import java.util.concurrent.ConcurrentHashMap;

  public class DefaultLibrarySystem implements LibrarySystem {

      private final Map<String, Integer> inventory = new ConcurrentHashMap<>();
      private final Map<String, Set<String>> userLoans = new ConcurrentHashMap<>();

      @Override
      public void addBookItem(String isbn, String title) {
          inventory.merge(isbn, 1, Integer::sum);
      }

      @Override
      public synchronized boolean checkoutBook(String userId, String isbn) {
          int available = inventory.getOrDefault(isbn, 0);
          if (available <= 0) return false;

          inventory.put(isbn, available - 1);
          userLoans.computeIfAbsent(userId, k -> new HashSet<>()).add(isbn);
          return true;
      }

      @Override
      public synchronized double returnBook(String userId, String isbn, int daysHeld) {
          inventory.merge(isbn, 1, Integer::sum);
          Set<String> loans = userLoans.get(userId);
          if (loans != null) loans.remove(isbn);

          int maxAllowedDays = 14;
          if (daysHeld > maxAllowedDays) {
              return (daysHeld - maxAllowedDays) * 0.50; // 50 cents fine per day
          }
          return 0.0;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/library/LibrarySystemTest.java: |
    package com.interviewos.library;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class LibrarySystemTest {

        @Test
        @DisplayName("Checkout and late fee calculation")
        void testCheckoutAndFine() {
            LibrarySystem lib = new DefaultLibrarySystem();
            lib.addBookItem("ISBN-101", "Clean Architecture");
            assertTrue(lib.checkoutBook("u1", "ISBN-101"));
            assertFalse(lib.checkoutBook("u2", "ISBN-101"), "Out of stock");

            double fine = lib.returnBook("u1", "ISBN-101", 18);
            assertEquals(2.0, fine, 0.01);
        }
    }
referenceSolutions:
  - approachId: canonical-lld-library-management-system
    label: "Primary — Library Book Catalog & Reservation System"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an automated library management system supporting book searches, checkout limits, renewal policies, and late-return fine calculations."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.library;

      import java.util.*;
      import java.util.concurrent.ConcurrentHashMap;

      public class DefaultLibrarySystem implements LibrarySystem {

          private final Map<String, Integer> inventory = new ConcurrentHashMap<>();
          private final Map<String, Set<String>> userLoans = new ConcurrentHashMap<>();

          @Override
          public void addBookItem(String isbn, String title) {
              inventory.merge(isbn, 1, Integer::sum);
          }

          @Override
          public synchronized boolean checkoutBook(String userId, String isbn) {
              int available = inventory.getOrDefault(isbn, 0);
              if (available <= 0) return false;

              inventory.put(isbn, available - 1);
              userLoans.computeIfAbsent(userId, k -> new HashSet<>()).add(isbn);
              return true;
          }

          @Override
          public synchronized double returnBook(String userId, String isbn, int daysHeld) {
              inventory.merge(isbn, 1, Integer::sum);
              Set<String> loans = userLoans.get(userId);
              if (loans != null) loans.remove(isbn);

              int maxAllowedDays = 14;
              if (daysHeld > maxAllowedDays) {
                  return (daysHeld - maxAllowedDays) * 0.50; // 50 cents fine per day
              }
              return 0.0;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Library Book Catalog & Reservation System

Design an automated library management system supporting book searches, checkout limits, renewal policies, and late-return fine calculations.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Library Book Catalog & Reservation System.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
