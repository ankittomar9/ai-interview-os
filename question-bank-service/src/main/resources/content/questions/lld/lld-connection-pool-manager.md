---
slug: lld-connection-pool-manager
title: "Thread-Safe Database Connection Pool Manager"
track: SPRING_LLD
difficulty: HARD
topics:
  - lld
est_minutes: 35
tags: ['blocking-queue', 'concurrency', 'resources', 'connection-pool']
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
        <groupId>com.interviewos.pool</groupId>
        <artifactId>connection-pool</artifactId>
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
    # Thread-Safe Database Connection Pool Manager

    ## Overview
    Design a bounded, thread-safe database connection pool supporting connection acquisition timeouts, release validation, and leak prevention.
  src/main/java/com/interviewos/pool/ConnectionPool.java: |
    package com.interviewos.pool;

    public interface ConnectionPool {
        PooledConnection acquire(long timeoutMillis) throws InterruptedException;
        void release(PooledConnection conn);
        int getAvailableCount();
    }

    record PooledConnection(String connectionId) {}
  src/main/java/com/interviewos/pool/impl/ConnectionPoolImpl.java: |
    package com.interviewos.pool;

    import java.util.concurrent.ArrayBlockingQueue;
    import java.util.concurrent.BlockingQueue;
    import java.util.concurrent.TimeUnit;

    public class DefaultConnectionPool implements ConnectionPool {

        private final BlockingQueue<PooledConnection> pool;

        public DefaultConnectionPool(int maxConnections) {
            this.pool = new ArrayBlockingQueue<>(maxConnections);
            for (int i = 1; i <= maxConnections; i++) {
                pool.offer(new PooledConnection("CONN-" + i));
            }
        }

        @Override
        public PooledConnection acquire(long timeoutMillis) throws InterruptedException {
            return pool.poll(timeoutMillis, TimeUnit.MILLISECONDS);
        }

        @Override
        public void release(PooledConnection conn) {
            if (conn != null) {
                pool.offer(conn);
            }
        }

        @Override
        public int getAvailableCount() {
            return pool.size();
        }
    }
starterCode: |
  package com.interviewos.pool;

  public interface ConnectionPool {
      PooledConnection acquire(long timeoutMillis) throws InterruptedException;
      void release(PooledConnection conn);
      int getAvailableCount();
  }

  record PooledConnection(String connectionId) {}
solutionCode: |
  package com.interviewos.pool;

  import java.util.concurrent.ArrayBlockingQueue;
  import java.util.concurrent.BlockingQueue;
  import java.util.concurrent.TimeUnit;

  public class DefaultConnectionPool implements ConnectionPool {

      private final BlockingQueue<PooledConnection> pool;

      public DefaultConnectionPool(int maxConnections) {
          this.pool = new ArrayBlockingQueue<>(maxConnections);
          for (int i = 1; i <= maxConnections; i++) {
              pool.offer(new PooledConnection("CONN-" + i));
          }
      }

      @Override
      public PooledConnection acquire(long timeoutMillis) throws InterruptedException {
          return pool.poll(timeoutMillis, TimeUnit.MILLISECONDS);
      }

      @Override
      public void release(PooledConnection conn) {
          if (conn != null) {
              pool.offer(conn);
          }
      }

      @Override
      public int getAvailableCount() {
          return pool.size();
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/pool/ConnectionPoolTest.java: |
    package com.interviewos.pool;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class ConnectionPoolTest {

        @Test
        @DisplayName("Acquire and release connections from bounded pool")
        void testAcquireRelease() throws InterruptedException {
            ConnectionPool pool = new DefaultConnectionPool(2);
            assertEquals(2, pool.getAvailableCount());

            PooledConnection c1 = pool.acquire(100);
            assertNotNull(c1);
            assertEquals(1, pool.getAvailableCount());

            PooledConnection c2 = pool.acquire(100);
            assertNotNull(c2);
            assertEquals(0, pool.getAvailableCount());

            PooledConnection c3 = pool.acquire(50);
            assertNull(c3, "Exhausted pool returns null on timeout");

            pool.release(c1);
            assertEquals(1, pool.getAvailableCount());
        }
    }
referenceSolutions:
  - approachId: canonical-lld-connection-pool-manager
    label: "Primary — Thread-Safe Database Connection Pool Manager"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a bounded, thread-safe database connection pool supporting connection acquisition timeouts, release validation, and leak prevention."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.pool;

      import java.util.concurrent.ArrayBlockingQueue;
      import java.util.concurrent.BlockingQueue;
      import java.util.concurrent.TimeUnit;

      public class DefaultConnectionPool implements ConnectionPool {

          private final BlockingQueue<PooledConnection> pool;

          public DefaultConnectionPool(int maxConnections) {
              this.pool = new ArrayBlockingQueue<>(maxConnections);
              for (int i = 1; i <= maxConnections; i++) {
                  pool.offer(new PooledConnection("CONN-" + i));
              }
          }

          @Override
          public PooledConnection acquire(long timeoutMillis) throws InterruptedException {
              return pool.poll(timeoutMillis, TimeUnit.MILLISECONDS);
          }

          @Override
          public void release(PooledConnection conn) {
              if (conn != null) {
                  pool.offer(conn);
              }
          }

          @Override
          public int getAvailableCount() {
              return pool.size();
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Thread-Safe Database Connection Pool Manager

Design a bounded, thread-safe database connection pool supporting connection acquisition timeouts, release validation, and leak prevention.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Thread-Safe Database Connection Pool Manager.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
