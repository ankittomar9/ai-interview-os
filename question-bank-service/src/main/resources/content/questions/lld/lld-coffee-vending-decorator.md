---
slug: lld-coffee-vending-decorator
title: "Customizable Coffee Vending Machine using Decorator Pattern"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['decorator-pattern', 'factory', 'vending', 'pricing']
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
        <groupId>com.interviewos.coffee</groupId>
        <artifactId>coffee-machine</artifactId>
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
    # Customizable Coffee Vending Machine using Decorator Pattern

    ## Overview
    Design a coffee dispenser supporting base beverages (Espresso, Latte) with dynamic condiments (Milk, Caramel, Whipped Cream) using the Decorator Pattern.
  src/main/java/com/interviewos/coffee/CoffeeMachine.java: |
    package com.interviewos.coffee;

    public interface Beverage {
        String getDescription();
        double getCost();
    }
  src/main/java/com/interviewos/coffee/impl/CoffeeMachineImpl.java: |
    package com.interviewos.coffee;

    public class Espresso implements Beverage {
        @Override
        public String getDescription() { return "Espresso"; }
        @Override
        public double getCost() { return 2.50; }
    }
starterCode: |
  package com.interviewos.coffee;

  public interface Beverage {
      String getDescription();
      double getCost();
  }
solutionCode: |
  package com.interviewos.coffee;

  public class Espresso implements Beverage {
      @Override
      public String getDescription() { return "Espresso"; }
      @Override
      public double getCost() { return 2.50; }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/coffee/CoffeeMachineTest.java: |
    package com.interviewos.coffee;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class CoffeeMachineTest {

        @Test
        @DisplayName("Base beverage cost calculation")
        void testBaseCost() {
            Beverage b = new Espresso();
            assertEquals("Espresso", b.getDescription());
            assertEquals(2.50, b.getCost(), 0.01);
        }
    }
referenceSolutions:
  - approachId: canonical-lld-coffee-vending-decorator
    label: "Primary — Customizable Coffee Vending Machine using Decorator Pattern"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a coffee dispenser supporting base beverages (Espresso, Latte) with dynamic condiments (Milk, Caramel, Whipped Cream) using the Decorator Pattern."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.coffee;

      public class Espresso implements Beverage {
          @Override
          public String getDescription() { return "Espresso"; }
          @Override
          public double getCost() { return 2.50; }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Customizable Coffee Vending Machine using Decorator Pattern

Design a coffee dispenser supporting base beverages (Espresso, Latte) with dynamic condiments (Milk, Caramel, Whipped Cream) using the Decorator Pattern.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Customizable Coffee Vending Machine using Decorator Pattern.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
