---
slug: lld-stock-exchange-order-book
title: "Low-Latency In-Memory Stock Order Book & Matching Engine"
track: SPRING_LLD
difficulty: HARD
topics:
  - lld
est_minutes: 35
tags: ['treemap', 'matching-engine', 'finance', 'concurrency']
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
        <groupId>com.interviewos.orderbook</groupId>
        <artifactId>order-book</artifactId>
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
    # Low-Latency In-Memory Stock Order Book & Matching Engine

    ## Overview
    Design an in-memory limit order book matching buy (bid) and sell (ask) limit orders based on price-time priority.
  src/main/java/com/interviewos/orderbook/OrderBook.java: |
    package com.interviewos.orderbook;

    public interface OrderBook {
        void placeOrder(Order order);
        int getMatchedQuantity();
    }

    enum OrderSide { BUY, SELL }
    record Order(String id, OrderSide side, double price, int quantity) {}
  src/main/java/com/interviewos/orderbook/impl/OrderBookImpl.java: |
    package com.interviewos.orderbook;

    import java.util.*;

    public class DefaultOrderBook implements OrderBook {

        private final TreeMap<Double, Queue<Order>> buyOrders = new TreeMap<>(Collections.reverseOrder());
        private final TreeMap<Double, Queue<Order>> sellOrders = new TreeMap<>();
        private int matchedQuantity = 0;

        @Override
        public synchronized void placeOrder(Order order) {
            if (order.side() == OrderSide.BUY) {
                matchBuyOrder(order);
            } else {
                matchSellOrder(order);
            }
        }

        private void matchBuyOrder(Order buyOrder) {
            int remaining = buyOrder.quantity();
            while (remaining > 0 && !sellOrders.isEmpty() && sellOrders.firstKey() <= buyOrder.price()) {
                Queue<Order> asks = sellOrders.get(sellOrders.firstKey());
                Order ask = asks.peek();
                int fill = Math.min(remaining, ask.quantity());
                matchedQuantity += fill;
                remaining -= fill;

                if (ask.quantity() == fill) {
                    asks.poll();
                    if (asks.isEmpty()) sellOrders.pollFirstEntry();
                }
            }
            if (remaining > 0) {
                buyOrders.computeIfAbsent(buyOrder.price(), k -> new LinkedList<>())
                         .offer(new Order(buyOrder.id(), buyOrder.side(), buyOrder.price(), remaining));
            }
        }

        private void matchSellOrder(Order sellOrder) {
            int remaining = sellOrder.quantity();
            while (remaining > 0 && !buyOrders.isEmpty() && buyOrders.firstKey() >= sellOrder.price()) {
                Queue<Order> bids = buyOrders.get(buyOrders.firstKey());
                Order bid = bids.peek();
                int fill = Math.min(remaining, bid.quantity());
                matchedQuantity += fill;
                remaining -= fill;

                if (bid.quantity() == fill) {
                    bids.poll();
                    if (bids.isEmpty()) buyOrders.pollFirstEntry();
                }
            }
            if (remaining > 0) {
                sellOrders.computeIfAbsent(sellOrder.price(), k -> new LinkedList<>())
                          .offer(new Order(sellOrder.id(), sellOrder.side(), sellOrder.price(), remaining));
            }
        }

        @Override
        public int getMatchedQuantity() {
            return matchedQuantity;
        }
    }
starterCode: |
  package com.interviewos.orderbook;

  public interface OrderBook {
      void placeOrder(Order order);
      int getMatchedQuantity();
  }

  enum OrderSide { BUY, SELL }
  record Order(String id, OrderSide side, double price, int quantity) {}
solutionCode: |
  package com.interviewos.orderbook;

  import java.util.*;

  public class DefaultOrderBook implements OrderBook {

      private final TreeMap<Double, Queue<Order>> buyOrders = new TreeMap<>(Collections.reverseOrder());
      private final TreeMap<Double, Queue<Order>> sellOrders = new TreeMap<>();
      private int matchedQuantity = 0;

      @Override
      public synchronized void placeOrder(Order order) {
          if (order.side() == OrderSide.BUY) {
              matchBuyOrder(order);
          } else {
              matchSellOrder(order);
          }
      }

      private void matchBuyOrder(Order buyOrder) {
          int remaining = buyOrder.quantity();
          while (remaining > 0 && !sellOrders.isEmpty() && sellOrders.firstKey() <= buyOrder.price()) {
              Queue<Order> asks = sellOrders.get(sellOrders.firstKey());
              Order ask = asks.peek();
              int fill = Math.min(remaining, ask.quantity());
              matchedQuantity += fill;
              remaining -= fill;

              if (ask.quantity() == fill) {
                  asks.poll();
                  if (asks.isEmpty()) sellOrders.pollFirstEntry();
              }
          }
          if (remaining > 0) {
              buyOrders.computeIfAbsent(buyOrder.price(), k -> new LinkedList<>())
                       .offer(new Order(buyOrder.id(), buyOrder.side(), buyOrder.price(), remaining));
          }
      }

      private void matchSellOrder(Order sellOrder) {
          int remaining = sellOrder.quantity();
          while (remaining > 0 && !buyOrders.isEmpty() && buyOrders.firstKey() >= sellOrder.price()) {
              Queue<Order> bids = buyOrders.get(buyOrders.firstKey());
              Order bid = bids.peek();
              int fill = Math.min(remaining, bid.quantity());
              matchedQuantity += fill;
              remaining -= fill;

              if (bid.quantity() == fill) {
                  bids.poll();
                  if (bids.isEmpty()) buyOrders.pollFirstEntry();
              }
          }
          if (remaining > 0) {
              sellOrders.computeIfAbsent(sellOrder.price(), k -> new LinkedList<>())
                        .offer(new Order(sellOrder.id(), sellOrder.side(), sellOrder.price(), remaining));
          }
      }

      @Override
      public int getMatchedQuantity() {
          return matchedQuantity;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/orderbook/OrderBookTest.java: |
    package com.interviewos.orderbook;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class OrderBookTest {

        @Test
        @DisplayName("Limit orders match when buy price >= sell price")
        void testPriceTimeMatch() {
            OrderBook book = new DefaultOrderBook();
            book.placeOrder(new Order("S1", OrderSide.SELL, 100.0, 50));
            assertEquals(0, book.getMatchedQuantity());

            book.placeOrder(new Order("B1", OrderSide.BUY, 105.0, 30));
            assertEquals(30, book.getMatchedQuantity());

            book.placeOrder(new Order("B2", OrderSide.BUY, 100.0, 20));
            assertEquals(50, book.getMatchedQuantity());
        }
    }
referenceSolutions:
  - approachId: canonical-lld-stock-exchange-order-book
    label: "Primary — Low-Latency In-Memory Stock Order Book & Matching Engine"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an in-memory limit order book matching buy (bid) and sell (ask) limit orders based on price-time priority."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.orderbook;

      import java.util.*;

      public class DefaultOrderBook implements OrderBook {

          private final TreeMap<Double, Queue<Order>> buyOrders = new TreeMap<>(Collections.reverseOrder());
          private final TreeMap<Double, Queue<Order>> sellOrders = new TreeMap<>();
          private int matchedQuantity = 0;

          @Override
          public synchronized void placeOrder(Order order) {
              if (order.side() == OrderSide.BUY) {
                  matchBuyOrder(order);
              } else {
                  matchSellOrder(order);
              }
          }

          private void matchBuyOrder(Order buyOrder) {
              int remaining = buyOrder.quantity();
              while (remaining > 0 && !sellOrders.isEmpty() && sellOrders.firstKey() <= buyOrder.price()) {
                  Queue<Order> asks = sellOrders.get(sellOrders.firstKey());
                  Order ask = asks.peek();
                  int fill = Math.min(remaining, ask.quantity());
                  matchedQuantity += fill;
                  remaining -= fill;

                  if (ask.quantity() == fill) {
                      asks.poll();
                      if (asks.isEmpty()) sellOrders.pollFirstEntry();
                  }
              }
              if (remaining > 0) {
                  buyOrders.computeIfAbsent(buyOrder.price(), k -> new LinkedList<>())
                           .offer(new Order(buyOrder.id(), buyOrder.side(), buyOrder.price(), remaining));
              }
          }

          private void matchSellOrder(Order sellOrder) {
              int remaining = sellOrder.quantity();
              while (remaining > 0 && !buyOrders.isEmpty() && buyOrders.firstKey() >= sellOrder.price()) {
                  Queue<Order> bids = buyOrders.get(buyOrders.firstKey());
                  Order bid = bids.peek();
                  int fill = Math.min(remaining, bid.quantity());
                  matchedQuantity += fill;
                  remaining -= fill;

                  if (bid.quantity() == fill) {
                      bids.poll();
                      if (bids.isEmpty()) buyOrders.pollFirstEntry();
                  }
              }
              if (remaining > 0) {
                  sellOrders.computeIfAbsent(sellOrder.price(), k -> new LinkedList<>())
                            .offer(new Order(sellOrder.id(), sellOrder.side(), sellOrder.price(), remaining));
              }
          }

          @Override
          public int getMatchedQuantity() {
              return matchedQuantity;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Low-Latency In-Memory Stock Order Book & Matching Engine

Design an in-memory limit order book matching buy (bid) and sell (ask) limit orders based on price-time priority.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Low-Latency In-Memory Stock Order Book & Matching Engine.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
