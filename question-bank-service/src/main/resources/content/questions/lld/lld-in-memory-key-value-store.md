---
slug: lld-in-memory-key-value-store
title: "In-Memory Key-Value Store with TTL & Transactions"
track: SPRING_LLD
difficulty: EASY
topics:
  - lld
est_minutes: 35
tags: ['hashmap', 'transactions', 'ttl', 'concurrency']
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
        <groupId>com.interviewos.kvstore</groupId>
        <artifactId>in-memory-kv-store</artifactId>
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
    # In-Memory Key-Value Store with TTL & Transactions

    ## Overview
    Implement a thread-safe in-memory key-value store supporting basic CRUD, key expiration via TTL, and multi-level transactional commits and rollbacks.
  src/main/java/com/interviewos/kvstore/KeyValueStore.java: |
    package com.interviewos.kvstore;

    import java.util.Optional;

    public interface KeyValueStore {
        void put(String key, String value);
        void putWithTtl(String key, String value, long ttlMillis);
        Optional<String> get(String key);
        boolean delete(String key);
        void beginTransaction();
        boolean commit();
        boolean rollback();
    }
  src/main/java/com/interviewos/kvstore/impl/KeyValueStoreImpl.java: |
    package com.interviewos.kvstore;

    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;

    public class InMemoryKeyValueStore implements KeyValueStore {

        private final Map<String, Entry> store = new ConcurrentHashMap<>();
        private final Deque<Map<String, Optional<String>>> txStack = new ArrayDeque<>();

        private static record Entry(String value, Long expiryTime) {
            boolean isExpired() {
                return expiryTime != null && System.currentTimeMillis() > expiryTime;
            }
        }

        @Override
        public void put(String key, String value) {
            putWithTtl(key, value, 0);
        }

        @Override
        public void putWithTtl(String key, String value, long ttlMillis) {
            Long expiry = ttlMillis > 0 ? System.currentTimeMillis() + ttlMillis : null;
            if (!txStack.isEmpty()) {
                txStack.peek().put(key, Optional.of(value));
            } else {
                store.put(key, new Entry(value, expiry));
            }
        }

        @Override
        public Optional<String> get(String key) {
            for (Map<String, Optional<String>> tx : txStack) {
                if (tx.containsKey(key)) {
                    return tx.get(key);
                }
            }
            Entry entry = store.get(key);
            if (entry == null || entry.isExpired()) {
                store.remove(key);
                return Optional.empty();
            }
            return Optional.of(entry.value());
        }

        @Override
        public boolean delete(String key) {
            if (!txStack.isEmpty()) {
                txStack.peek().put(key, Optional.empty());
                return true;
            }
            return store.remove(key) != null;
        }

        @Override
        public void beginTransaction() {
            txStack.push(new HashMap<>());
        }

        @Override
        public boolean commit() {
            if (txStack.isEmpty()) return false;
            Map<String, Optional<String>> activeTx = txStack.pop();
            if (txStack.isEmpty()) {
                for (Map.Entry<String, Optional<String>> e : activeTx.entrySet()) {
                    if (e.getValue().isPresent()) {
                        store.put(e.getKey(), new Entry(e.getValue().get(), null));
                    } else {
                        store.remove(e.getKey());
                    }
                }
            } else {
                txStack.peek().putAll(activeTx);
            }
            return true;
        }

        @Override
        public boolean rollback() {
            if (txStack.isEmpty()) return false;
            txStack.pop();
            return true;
        }
    }
starterCode: |
  package com.interviewos.kvstore;

  import java.util.Optional;

  public interface KeyValueStore {
      void put(String key, String value);
      void putWithTtl(String key, String value, long ttlMillis);
      Optional<String> get(String key);
      boolean delete(String key);
      void beginTransaction();
      boolean commit();
      boolean rollback();
  }
solutionCode: |
  package com.interviewos.kvstore;

  import java.util.*;
  import java.util.concurrent.ConcurrentHashMap;

  public class InMemoryKeyValueStore implements KeyValueStore {

      private final Map<String, Entry> store = new ConcurrentHashMap<>();
      private final Deque<Map<String, Optional<String>>> txStack = new ArrayDeque<>();

      private static record Entry(String value, Long expiryTime) {
          boolean isExpired() {
              return expiryTime != null && System.currentTimeMillis() > expiryTime;
          }
      }

      @Override
      public void put(String key, String value) {
          putWithTtl(key, value, 0);
      }

      @Override
      public void putWithTtl(String key, String value, long ttlMillis) {
          Long expiry = ttlMillis > 0 ? System.currentTimeMillis() + ttlMillis : null;
          if (!txStack.isEmpty()) {
              txStack.peek().put(key, Optional.of(value));
          } else {
              store.put(key, new Entry(value, expiry));
          }
      }

      @Override
      public Optional<String> get(String key) {
          for (Map<String, Optional<String>> tx : txStack) {
              if (tx.containsKey(key)) {
                  return tx.get(key);
              }
          }
          Entry entry = store.get(key);
          if (entry == null || entry.isExpired()) {
              store.remove(key);
              return Optional.empty();
          }
          return Optional.of(entry.value());
      }

      @Override
      public boolean delete(String key) {
          if (!txStack.isEmpty()) {
              txStack.peek().put(key, Optional.empty());
              return true;
          }
          return store.remove(key) != null;
      }

      @Override
      public void beginTransaction() {
          txStack.push(new HashMap<>());
      }

      @Override
      public boolean commit() {
          if (txStack.isEmpty()) return false;
          Map<String, Optional<String>> activeTx = txStack.pop();
          if (txStack.isEmpty()) {
              for (Map.Entry<String, Optional<String>> e : activeTx.entrySet()) {
                  if (e.getValue().isPresent()) {
                      store.put(e.getKey(), new Entry(e.getValue().get(), null));
                  } else {
                      store.remove(e.getKey());
                  }
              }
          } else {
              txStack.peek().putAll(activeTx);
          }
          return true;
      }

      @Override
      public boolean rollback() {
          if (txStack.isEmpty()) return false;
          txStack.pop();
          return true;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/kvstore/KeyValueStoreTest.java: |
    package com.interviewos.kvstore;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import java.util.Optional;
    import static org.junit.jupiter.api.Assertions.*;

    public class KeyValueStoreTest {

        @Test
        @DisplayName("Basic put and get operations")
        void testBasicPutGet() {
            KeyValueStore kv = new InMemoryKeyValueStore();
            kv.put("alpha", "100");
            assertEquals(Optional.of("100"), kv.get("alpha"));
            assertTrue(kv.delete("alpha"));
            assertEquals(Optional.empty(), kv.get("alpha"));
        }

        @Test
        @DisplayName("Transaction commit updates main store")
        void testTransactionCommit() {
            KeyValueStore kv = new InMemoryKeyValueStore();
            kv.put("k1", "v1");
            kv.beginTransaction();
            kv.put("k1", "v2");
            kv.put("k2", "v2");
            assertEquals(Optional.of("v2"), kv.get("k1"));
            assertTrue(kv.commit());
            assertEquals(Optional.of("v2"), kv.get("k1"));
            assertEquals(Optional.of("v2"), kv.get("k2"));
        }

        @Test
        @DisplayName("Transaction rollback discards uncommitted changes")
        void testTransactionRollback() {
            KeyValueStore kv = new InMemoryKeyValueStore();
            kv.put("k1", "v1");
            kv.beginTransaction();
            kv.put("k1", "v999");
            assertTrue(kv.rollback());
            assertEquals(Optional.of("v1"), kv.get("k1"));
        }
    }
referenceSolutions:
  - approachId: canonical-lld-in-memory-key-value-store
    label: "Primary — In-Memory Key-Value Store with TTL & Transactions"
    approachClass: PRIMARY
    kind: CODE
    summary: "Implement a thread-safe in-memory key-value store supporting basic CRUD, key expiration via TTL, and multi-level transactional commits and rollbacks."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.kvstore;

      import java.util.*;
      import java.util.concurrent.ConcurrentHashMap;

      public class InMemoryKeyValueStore implements KeyValueStore {

          private final Map<String, Entry> store = new ConcurrentHashMap<>();
          private final Deque<Map<String, Optional<String>>> txStack = new ArrayDeque<>();

          private static record Entry(String value, Long expiryTime) {
              boolean isExpired() {
                  return expiryTime != null && System.currentTimeMillis() > expiryTime;
              }
          }

          @Override
          public void put(String key, String value) {
              putWithTtl(key, value, 0);
          }

          @Override
          public void putWithTtl(String key, String value, long ttlMillis) {
              Long expiry = ttlMillis > 0 ? System.currentTimeMillis() + ttlMillis : null;
              if (!txStack.isEmpty()) {
                  txStack.peek().put(key, Optional.of(value));
              } else {
                  store.put(key, new Entry(value, expiry));
              }
          }

          @Override
          public Optional<String> get(String key) {
              for (Map<String, Optional<String>> tx : txStack) {
                  if (tx.containsKey(key)) {
                      return tx.get(key);
                  }
              }
              Entry entry = store.get(key);
              if (entry == null || entry.isExpired()) {
                  store.remove(key);
                  return Optional.empty();
              }
              return Optional.of(entry.value());
          }

          @Override
          public boolean delete(String key) {
              if (!txStack.isEmpty()) {
                  txStack.peek().put(key, Optional.empty());
                  return true;
              }
              return store.remove(key) != null;
          }

          @Override
          public void beginTransaction() {
              txStack.push(new HashMap<>());
          }

          @Override
          public boolean commit() {
              if (txStack.isEmpty()) return false;
              Map<String, Optional<String>> activeTx = txStack.pop();
              if (txStack.isEmpty()) {
                  for (Map.Entry<String, Optional<String>> e : activeTx.entrySet()) {
                      if (e.getValue().isPresent()) {
                          store.put(e.getKey(), new Entry(e.getValue().get(), null));
                      } else {
                          store.remove(e.getKey());
                      }
                  }
              } else {
                  txStack.peek().putAll(activeTx);
              }
              return true;
          }

          @Override
          public boolean rollback() {
              if (txStack.isEmpty()) return false;
              txStack.pop();
              return true;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: In-Memory Key-Value Store with TTL & Transactions

Implement a thread-safe in-memory key-value store supporting basic CRUD, key expiration via TTL, and multi-level transactional commits and rollbacks.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining In-Memory Key-Value Store with TTL & Transactions.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
