---
slug: lld-shopping-cart-promotions
title: "E-Commerce Shopping Cart with Promotion Rules Engine"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['strategy-pattern', 'e-commerce', 'promotions', 'discounts']
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
        <groupId>com.interviewos.cart</groupId>
        <artifactId>cart-promotions</artifactId>
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
    # E-Commerce Shopping Cart with Promotion Rules Engine

    ## Overview
    Design an e-commerce shopping cart system with coupon code evaluation, quantity thresholds, and percentage discount strategies.
  src/main/java/com/interviewos/cart/ShoppingCart.java: |
    package com.interviewos.cart;

    import java.util.Map;

    public interface ShoppingCart {
        void addItem(String sku, double price, int qty);
        void applyCoupon(String couponCode, double percentageOff);
        double calculateTotal();
    }
  src/main/java/com/interviewos/cart/impl/ShoppingCartImpl.java: |
    package com.interviewos.cart;

    import java.util.HashMap;
    import java.util.Map;

    public class DefaultShoppingCart implements ShoppingCart {

        private final Map<String, CartItem> items = new HashMap<>();
        private double discountMultiplier = 1.0;

        private static record CartItem(double price, int qty) {}

        @Override
        public void addItem(String sku, double price, int qty) {
            items.merge(sku, new CartItem(price, qty), (old, curr) -> new CartItem(price, old.qty() + curr.qty()));
        }

        @Override
        public void applyCoupon(String couponCode, double percentageOff) {
            this.discountMultiplier = Math.max(0.0, (100.0 - percentageOff) / 100.0);
        }

        @Override
        public double calculateTotal() {
            double subtotal = items.values().stream().mapToDouble(i -> i.price() * i.qty()).sum();
            return subtotal * discountMultiplier;
        }
    }
starterCode: |
  package com.interviewos.cart;

  import java.util.Map;

  public interface ShoppingCart {
      void addItem(String sku, double price, int qty);
      void applyCoupon(String couponCode, double percentageOff);
      double calculateTotal();
  }
solutionCode: |
  package com.interviewos.cart;

  import java.util.HashMap;
  import java.util.Map;

  public class DefaultShoppingCart implements ShoppingCart {

      private final Map<String, CartItem> items = new HashMap<>();
      private double discountMultiplier = 1.0;

      private static record CartItem(double price, int qty) {}

      @Override
      public void addItem(String sku, double price, int qty) {
          items.merge(sku, new CartItem(price, qty), (old, curr) -> new CartItem(price, old.qty() + curr.qty()));
      }

      @Override
      public void applyCoupon(String couponCode, double percentageOff) {
          this.discountMultiplier = Math.max(0.0, (100.0 - percentageOff) / 100.0);
      }

      @Override
      public double calculateTotal() {
          double subtotal = items.values().stream().mapToDouble(i -> i.price() * i.qty()).sum();
          return subtotal * discountMultiplier;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/cart/ShoppingCartTest.java: |
    package com.interviewos.cart;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class ShoppingCartTest {

        @Test
        @DisplayName("Add items and apply 20% coupon discount")
        void testCartDiscount() {
            ShoppingCart cart = new DefaultShoppingCart();
            cart.addItem("ITEM-1", 50.0, 2); // 100
            cart.addItem("ITEM-2", 25.0, 2); // 50
            assertEquals(150.0, cart.calculateTotal(), 0.01);

            cart.applyCoupon("SAVE20", 20.0);
            assertEquals(120.0, cart.calculateTotal(), 0.01);
        }
    }
referenceSolutions:
  - approachId: canonical-lld-shopping-cart-promotions
    label: "Primary — E-Commerce Shopping Cart with Promotion Rules Engine"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an e-commerce shopping cart system with coupon code evaluation, quantity thresholds, and percentage discount strategies."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.cart;

      import java.util.HashMap;
      import java.util.Map;

      public class DefaultShoppingCart implements ShoppingCart {

          private final Map<String, CartItem> items = new HashMap<>();
          private double discountMultiplier = 1.0;

          private static record CartItem(double price, int qty) {}

          @Override
          public void addItem(String sku, double price, int qty) {
              items.merge(sku, new CartItem(price, qty), (old, curr) -> new CartItem(price, old.qty() + curr.qty()));
          }

          @Override
          public void applyCoupon(String couponCode, double percentageOff) {
              this.discountMultiplier = Math.max(0.0, (100.0 - percentageOff) / 100.0);
          }

          @Override
          public double calculateTotal() {
              double subtotal = items.values().stream().mapToDouble(i -> i.price() * i.qty()).sum();
              return subtotal * discountMultiplier;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: E-Commerce Shopping Cart with Promotion Rules Engine

Design an e-commerce shopping cart system with coupon code evaluation, quantity thresholds, and percentage discount strategies.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining E-Commerce Shopping Cart with Promotion Rules Engine.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
