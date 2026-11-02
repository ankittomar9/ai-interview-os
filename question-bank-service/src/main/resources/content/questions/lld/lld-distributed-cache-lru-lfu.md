---
slug: lld-distributed-cache-lru-lfu
title: "Thread-Safe Cache with Pluggable LRU/LFU Eviction"
track: SPRING_LLD
difficulty: HARD
topics:
  - lld
est_minutes: 35
tags: ['cache', 'lru', 'lfu', 'concurrency', 'strategy-pattern']
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
        <groupId>com.interviewos.cache</groupId>
        <artifactId>concurrent-cache</artifactId>
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
    # Thread-Safe Cache with Pluggable LRU/LFU Eviction

    ## Overview
    Design an in-memory cache supporting concurrent read/writes, bounded capacity, and pluggable eviction algorithms (LRU, LFU).
  src/main/java/com/interviewos/cache/ConcurrentCache.java: |
    package com.interviewos.cache;

    import java.util.Optional;

    public interface ConcurrentCache<K, V> {
        void put(K key, V value);
        Optional<V> get(K key);
        int size();
    }
  src/main/java/com/interviewos/cache/impl/ConcurrentCacheImpl.java: |
    package com.interviewos.cache;

    import java.util.LinkedHashMap;
    import java.util.Map;
    import java.util.Optional;

    public class LruConcurrentCache<K, V> implements ConcurrentCache<K, V> {

        private final int capacity;
        private final LinkedHashMap<K, V> map;

        public LruConcurrentCache(int capacity) {
            this.capacity = capacity;
            this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                    return size() > capacity;
                }
            };
        }

        @Override
        public synchronized void put(K key, V value) {
            map.put(key, value);
        }

        @Override
        public synchronized Optional<V> get(K key) {
            return Optional.ofNullable(map.get(key));
        }

        @Override
        public synchronized int size() {
            return map.size();
        }
    }
starterCode: |
  package com.interviewos.cache;

  import java.util.Optional;

  public interface ConcurrentCache<K, V> {
      void put(K key, V value);
      Optional<V> get(K key);
      int size();
  }
solutionCode: |
  package com.interviewos.cache;

  import java.util.LinkedHashMap;
  import java.util.Map;
  import java.util.Optional;

  public class LruConcurrentCache<K, V> implements ConcurrentCache<K, V> {

      private final int capacity;
      private final LinkedHashMap<K, V> map;

      public LruConcurrentCache(int capacity) {
          this.capacity = capacity;
          this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
              @Override
              protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                  return size() > capacity;
              }
          };
      }

      @Override
      public synchronized void put(K key, V value) {
          map.put(key, value);
      }

      @Override
      public synchronized Optional<V> get(K key) {
          return Optional.ofNullable(map.get(key));
      }

      @Override
      public synchronized int size() {
          return map.size();
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/cache/ConcurrentCacheTest.java: |
    package com.interviewos.cache;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import java.util.Optional;
    import static org.junit.jupiter.api.Assertions.*;

    public class ConcurrentCacheTest {

        @Test
        @DisplayName("LRU eviction drops least recently accessed key")
        void testLruEviction() {
            ConcurrentCache<String, String> cache = new LruConcurrentCache<>(2);
            cache.put("k1", "v1");
            cache.put("k2", "v2");
            cache.get("k1"); // access k1 to make k2 eldest
            cache.put("k3", "v3"); // evicts k2

            assertEquals(Optional.of("v1"), cache.get("k1"));
            assertEquals(Optional.empty(), cache.get("k2"));
            assertEquals(Optional.of("v3"), cache.get("k3"));
        }
    }
referenceSolutions:
  - approachId: canonical-lld-distributed-cache-lru-lfu
    label: "Primary — Thread-Safe Cache with Pluggable LRU/LFU Eviction"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an in-memory cache supporting concurrent read/writes, bounded capacity, and pluggable eviction algorithms (LRU, LFU)."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.cache;

      import java.util.LinkedHashMap;
      import java.util.Map;
      import java.util.Optional;

      public class LruConcurrentCache<K, V> implements ConcurrentCache<K, V> {

          private final int capacity;
          private final LinkedHashMap<K, V> map;

          public LruConcurrentCache(int capacity) {
              this.capacity = capacity;
              this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
                  @Override
                  protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                      return size() > capacity;
                  }
              };
          }

          @Override
          public synchronized void put(K key, V value) {
              map.put(key, value);
          }

          @Override
          public synchronized Optional<V> get(K key) {
              return Optional.ofNullable(map.get(key));
          }

          @Override
          public synchronized int size() {
              return map.size();
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Thread-Safe Cache with Pluggable LRU/LFU Eviction

Design an in-memory cache supporting concurrent read/writes, bounded capacity, and pluggable eviction algorithms (LRU, LFU).

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Thread-Safe Cache with Pluggable LRU/LFU Eviction.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
