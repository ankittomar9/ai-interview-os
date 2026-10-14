---
slug: lld-online-auction-system
title: "Real-Time Online Auction & Bidding Engine"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['auction', 'concurrency', 'observer', 'bidding']
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
        <groupId>com.interviewos.auction</groupId>
        <artifactId>auction-system</artifactId>
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
    # Real-Time Online Auction & Bidding Engine

    ## Overview
    Design an online auction platform supporting time-delimited bidding windows, reserve prices, and real-time highest bidder tracking.
  src/main/java/com/interviewos/auction/AuctionEngine.java: |
    package com.interviewos.auction;

    public interface AuctionEngine {
        void createAuction(String itemId, double startingPrice, double reservePrice);
        boolean placeBid(String itemId, String bidderId, double amount);
        BidStatus getHighestBid(String itemId);
    }

    record BidStatus(String bidderId, double amount, boolean meetsReserve) {}
  src/main/java/com/interviewos/auction/impl/AuctionEngineImpl.java: |
    package com.interviewos.auction;

    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class DefaultAuctionEngine implements AuctionEngine {

        private final Map<String, AuctionItem> items = new ConcurrentHashMap<>();

        private static class AuctionItem {
            double currentHighest;
            String highestBidder;
            double reservePrice;

            AuctionItem(double startingPrice, double reservePrice) {
                this.currentHighest = startingPrice;
                this.reservePrice = reservePrice;
            }
        }

        @Override
        public void createAuction(String itemId, double startingPrice, double reservePrice) {
            items.put(itemId, new AuctionItem(startingPrice, reservePrice));
        }

        @Override
        public synchronized boolean placeBid(String itemId, String bidderId, double amount) {
            AuctionItem item = items.get(itemId);
            if (item == null || amount <= item.currentHighest) return false;

            item.currentHighest = amount;
            item.highestBidder = bidderId;
            return true;
        }

        @Override
        public BidStatus getHighestBid(String itemId) {
            AuctionItem item = items.get(itemId);
            if (item == null) return null;
            return new BidStatus(item.highestBidder, item.currentHighest, item.currentHighest >= item.reservePrice);
        }
    }
starterCode: |
  package com.interviewos.auction;

  public interface AuctionEngine {
      void createAuction(String itemId, double startingPrice, double reservePrice);
      boolean placeBid(String itemId, String bidderId, double amount);
      BidStatus getHighestBid(String itemId);
  }

  record BidStatus(String bidderId, double amount, boolean meetsReserve) {}
solutionCode: |
  package com.interviewos.auction;

  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class DefaultAuctionEngine implements AuctionEngine {

      private final Map<String, AuctionItem> items = new ConcurrentHashMap<>();

      private static class AuctionItem {
          double currentHighest;
          String highestBidder;
          double reservePrice;

          AuctionItem(double startingPrice, double reservePrice) {
              this.currentHighest = startingPrice;
              this.reservePrice = reservePrice;
          }
      }

      @Override
      public void createAuction(String itemId, double startingPrice, double reservePrice) {
          items.put(itemId, new AuctionItem(startingPrice, reservePrice));
      }

      @Override
      public synchronized boolean placeBid(String itemId, String bidderId, double amount) {
          AuctionItem item = items.get(itemId);
          if (item == null || amount <= item.currentHighest) return false;

          item.currentHighest = amount;
          item.highestBidder = bidderId;
          return true;
      }

      @Override
      public BidStatus getHighestBid(String itemId) {
          AuctionItem item = items.get(itemId);
          if (item == null) return null;
          return new BidStatus(item.highestBidder, item.currentHighest, item.currentHighest >= item.reservePrice);
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/auction/AuctionEngineTest.java: |
    package com.interviewos.auction;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class AuctionEngineTest {

        @Test
        @DisplayName("Place higher bid and check reserve status")
        void testBiddingProgression() {
            AuctionEngine engine = new DefaultAuctionEngine();
            engine.createAuction("ART-1", 100.0, 250.0);
            assertFalse(engine.placeBid("ART-1", "b1", 90.0));
            assertTrue(engine.placeBid("ART-1", "b1", 150.0));

            BidStatus status = engine.getHighestBid("ART-1");
            assertEquals("b1", status.bidderId());
            assertEquals(150.0, status.amount());
            assertFalse(status.meetsReserve());

            assertTrue(engine.placeBid("ART-1", "b2", 300.0));
            assertTrue(engine.getHighestBid("ART-1").meetsReserve());
        }
    }
referenceSolutions:
  - approachId: canonical-lld-online-auction-system
    label: "Primary — Real-Time Online Auction & Bidding Engine"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an online auction platform supporting time-delimited bidding windows, reserve prices, and real-time highest bidder tracking."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.auction;

      import java.util.Map;
      import java.util.concurrent.ConcurrentHashMap;

      public class DefaultAuctionEngine implements AuctionEngine {

          private final Map<String, AuctionItem> items = new ConcurrentHashMap<>();

          private static class AuctionItem {
              double currentHighest;
              String highestBidder;
              double reservePrice;

              AuctionItem(double startingPrice, double reservePrice) {
                  this.currentHighest = startingPrice;
                  this.reservePrice = reservePrice;
              }
          }

          @Override
          public void createAuction(String itemId, double startingPrice, double reservePrice) {
              items.put(itemId, new AuctionItem(startingPrice, reservePrice));
          }

          @Override
          public synchronized boolean placeBid(String itemId, String bidderId, double amount) {
              AuctionItem item = items.get(itemId);
              if (item == null || amount <= item.currentHighest) return false;

              item.currentHighest = amount;
              item.highestBidder = bidderId;
              return true;
          }

          @Override
          public BidStatus getHighestBid(String itemId) {
              AuctionItem item = items.get(itemId);
              if (item == null) return null;
              return new BidStatus(item.highestBidder, item.currentHighest, item.currentHighest >= item.reservePrice);
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Real-Time Online Auction & Bidding Engine

Design an online auction platform supporting time-delimited bidding windows, reserve prices, and real-time highest bidder tracking.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Real-Time Online Auction & Bidding Engine.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
