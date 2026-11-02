---
slug: lld-logging-framework
title: Extensible Logging Framework
track: SPRING_LLD
difficulty: MEDIUM
topics:
- lld
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- logging
- chain-of-responsibility
- observer-pattern
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/logging-framework
status: PUBLISHED
hints:
- Implement the Chain of Responsibility or Observer pattern to route log messages through configured appenders.
- Ensure thread-safe logger configuration and concurrent message appending across multiple threads.
- Filter messages based on severity levels before triggering any formatting or writing logic.
coaching:
  presentationTips:
  - Clarify the hierarchy of logging levels and explain how minimum log level thresholds filter messages.
  - Discuss how adding custom appenders (e.g., database or network) adheres to the Open/Closed Principle.
  - Explain synchronization techniques for concurrent logging to shared destinations.
  commonMistakes:
  - Formatting log messages before checking whether the severity level meets the active threshold.
  - Tight coupling between the Logger coordinator and specific I/O output streams.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>logging-framework</artifactId>
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
    # Extensible Logging Framework

    ## Overview
    Implement an extensible, object-oriented logging library capable of level-based filtering, pluggable output appenders, and centralized logger lifecycle management.

    ## Key Components
    - `com.interviewos.logging.service.Logger`: Emits structured log records and dispatches them to configured appenders.
    - `com.interviewos.logging.service.LogManager`: Central registry coordinating logger instances and shared configurations.
    - `com.interviewos.logging.appender.LogAppender`: Destination sink receiving emitted log records.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/logging/service/Logger.java`
    2. `src/main/java/com/interviewos/logging/service/LogManager.java`
  src/main/java/com/interviewos/logging/model/LogLevel.java: |
    package com.interviewos.logging.model;

    public enum LogLevel {
        DEBUG(1),
        INFO(2),
        WARN(3),
        ERROR(4),
        FATAL(5);

        private final int level;

        LogLevel(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }

        public boolean isGreaterOrEqual(LogLevel other) {
            if (other == null) return true;
            return this.level >= other.level;
        }
    }
  src/main/java/com/interviewos/logging/model/LogMessage.java: |
    package com.interviewos.logging.model;

    import java.time.Instant;

    public class LogMessage {
        private final String message;
        private final LogLevel level;
        private final Instant timestamp;
        private final String loggerName;

        public LogMessage(String message, LogLevel level, String loggerName) {
            this(message, level, loggerName, Instant.now());
        }

        public LogMessage(String message, LogLevel level, String loggerName, Instant timestamp) {
            this.message = message;
            this.level = level;
            this.loggerName = loggerName;
            this.timestamp = timestamp;
        }

        public String getMessage() { return message; }
        public LogLevel getLevel() { return level; }
        public Instant getTimestamp() { return timestamp; }
        public String getLoggerName() { return loggerName; }
    }
  src/main/java/com/interviewos/logging/appender/LogAppender.java: |
    package com.interviewos.logging.appender;

    import com.interviewos.logging.model.LogMessage;
    import java.util.List;

    public interface LogAppender {
        void append(LogMessage message);
        List<LogMessage> getAppendedMessages();
    }
  src/main/java/com/interviewos/logging/appender/ConsoleAppender.java: |
    package com.interviewos.logging.appender;

    import com.interviewos.logging.model.LogMessage;
    import java.util.ArrayList;
    import java.util.List;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class ConsoleAppender implements LogAppender {
        private final List<LogMessage> messages = new CopyOnWriteArrayList<>();

        @Override
        public void append(LogMessage message) {
            if (message != null) {
                messages.add(message);
            }
        }

        @Override
        public List<LogMessage> getAppendedMessages() {
            return new ArrayList<>(messages);
        }
    }
  src/main/java/com/interviewos/logging/formatter/LogFormatter.java: |
    package com.interviewos.logging.formatter;

    import com.interviewos.logging.model.LogMessage;

    public interface LogFormatter {
        String format(LogMessage message);
    }
  src/main/java/com/interviewos/logging/formatter/SimpleFormatter.java: |
    package com.interviewos.logging.formatter;

    import com.interviewos.logging.model.LogMessage;

    public class SimpleFormatter implements LogFormatter {
        @Override
        public String format(LogMessage message) {
            if (message == null) return "";
            return "[" + message.getLevel() + "] " + message.getLoggerName() + " - " + message.getMessage();
        }
    }
  src/main/java/com/interviewos/logging/config/LoggerConfig.java: |
    package com.interviewos.logging.config;

    import com.interviewos.logging.appender.LogAppender;
    import com.interviewos.logging.formatter.LogFormatter;
    import com.interviewos.logging.formatter.SimpleFormatter;
    import com.interviewos.logging.model.LogLevel;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class LoggerConfig {
        private volatile LogLevel minLevel;
        private final List<LogAppender> appenders = new CopyOnWriteArrayList<>();
        private volatile LogFormatter formatter;

        public LoggerConfig(LogLevel minLevel) {
            this(minLevel, new ArrayList<>(), new SimpleFormatter());
        }

        public LoggerConfig(LogLevel minLevel, List<LogAppender> appenders, LogFormatter formatter) {
            this.minLevel = minLevel;
            if (appenders != null) {
                this.appenders.addAll(appenders);
            }
            this.formatter = formatter != null ? formatter : new SimpleFormatter();
        }

        public LogLevel getMinLevel() { return minLevel; }
        public void setMinLevel(LogLevel minLevel) { this.minLevel = minLevel; }
        public List<LogAppender> getAppenders() { return appenders; }
        public void addAppender(LogAppender appender) {
            if (appender != null) {
                this.appenders.add(appender);
            }
        }
        public LogFormatter getFormatter() { return formatter; }
        public void setFormatter(LogFormatter formatter) { this.formatter = formatter; }
    }
  src/main/java/com/interviewos/logging/service/Logger.java: |
    package com.interviewos.logging.service;

    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;

    public class Logger {
        private final String name;
        private volatile LoggerConfig config;

        public Logger(String name, LoggerConfig config) {
            this.name = name;
            this.config = config;
        }

        public String getName() { return name; }
        public LoggerConfig getConfig() { return config; }
        public void setConfig(LoggerConfig config) { this.config = config; }

        public void log(LogLevel level, String message) {
            // TODO: Check level against config.getMinLevel(), create LogMessage, dispatch to appenders
            throw new UnsupportedOperationException("TODO: Implement Logger.log");
        }

        public void debug(String message) {
            log(LogLevel.DEBUG, message);
        }

        public void info(String message) {
            log(LogLevel.INFO, message);
        }

        public void warn(String message) {
            log(LogLevel.WARN, message);
        }

        public void error(String message) {
            log(LogLevel.ERROR, message);
        }
    }
  src/main/java/com/interviewos/logging/service/LogManager.java: |
    package com.interviewos.logging.service;

    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;

    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class LogManager {
        private static final LogManager INSTANCE = new LogManager();
        private final Map<String, Logger> loggers = new ConcurrentHashMap<>();
        private volatile LoggerConfig rootConfig = new LoggerConfig(LogLevel.INFO);

        private LogManager() {}

        public static LogManager getInstance() {
            return INSTANCE;
        }

        public Logger getLogger(String name) {
            // TODO: Return existing logger or create new logger with rootConfig
            throw new UnsupportedOperationException("TODO: Implement LogManager.getLogger");
        }

        public LoggerConfig getRootConfig() {
            return rootConfig;
        }

        public void setRootConfig(LoggerConfig rootConfig) {
            // TODO: Update rootConfig and update existing loggers
            throw new UnsupportedOperationException("TODO: Implement LogManager.setRootConfig");
        }
    }
  src/test/java/com/interviewos/logging/LogLevelFilteringTest.java: |
    package com.interviewos.logging;

    import com.interviewos.logging.appender.ConsoleAppender;
    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;
    import com.interviewos.logging.service.Logger;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class LogLevelFilteringTest {

        @Test
        @DisplayName("Messages below minimum threshold are filtered out")
        void testMessagesBelowThresholdDiscarded() {
            ConsoleAppender appender = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.WARN);
            config.addAppender(appender);

            Logger logger = new Logger("TestLogger", config);
            logger.debug("Debug trace");
            logger.info("General info");

            assertEquals(0, appender.getAppendedMessages().size(), "DEBUG and INFO must be discarded when threshold is WARN");
        }

        @Test
        @DisplayName("Messages at or above threshold are appended")
        void testMessagesAtOrAboveThresholdAppended() {
            ConsoleAppender appender = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.WARN);
            config.addAppender(appender);

            Logger logger = new Logger("TestLogger", config);
            logger.warn("Warning alert");
            logger.error("Error failure");

            assertEquals(2, appender.getAppendedMessages().size(), "WARN and ERROR must be recorded");
        }
    }
  src/test/java/com/interviewos/logging/LogAppenderRoutingTest.java: |
    package com.interviewos.logging;

    import com.interviewos.logging.appender.ConsoleAppender;
    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;
    import com.interviewos.logging.service.Logger;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class LogAppenderRoutingTest {

        @Test
        @DisplayName("Log dispatches to multiple registered appenders")
        void testMultipleAppendersReceiveMessage() {
            ConsoleAppender appender1 = new ConsoleAppender();
            ConsoleAppender appender2 = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.DEBUG);
            config.addAppender(appender1);
            config.addAppender(appender2);

            Logger logger = new Logger("MultiAppender", config);
            logger.info("Broadcast payload");

            assertEquals(1, appender1.getAppendedMessages().size());
            assertEquals(1, appender2.getAppendedMessages().size());
            assertEquals("Broadcast payload", appender1.getAppendedMessages().get(0).getMessage());
        }

        @Test
        @DisplayName("Convenience methods route with correct log levels")
        void testConvenienceMethodsRouteLevels() {
            ConsoleAppender appender = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.DEBUG);
            config.addAppender(appender);

            Logger logger = new Logger("LevelTest", config);
            logger.debug("D");
            logger.info("I");
            logger.warn("W");
            logger.error("E");

            assertEquals(4, appender.getAppendedMessages().size());
            assertEquals(LogLevel.DEBUG, appender.getAppendedMessages().get(0).getLevel());
            assertEquals(LogLevel.INFO, appender.getAppendedMessages().get(1).getLevel());
            assertEquals(LogLevel.WARN, appender.getAppendedMessages().get(2).getLevel());
            assertEquals(LogLevel.ERROR, appender.getAppendedMessages().get(3).getLevel());
        }
    }
  src/test/java/com/interviewos/logging/LogManagerLifecycleTest.java: |
    package com.interviewos.logging;

    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;
    import com.interviewos.logging.service.Logger;
    import com.interviewos.logging.service.LogManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class LogManagerLifecycleTest {

        @Test
        @DisplayName("LogManager returns idempotent instance for identical logger name")
        void testIdempotentLoggerRetrieval() {
            LogManager manager = LogManager.getInstance();
            Logger l1 = manager.getLogger("PaymentGateway");
            Logger l2 = manager.getLogger("PaymentGateway");

            assertNotNull(l1);
            assertSame(l1, l2, "LogManager must cache and return the same instance for identical names");
        }

        @Test
        @DisplayName("Root configuration updates propagate to active loggers")
        void testRootConfigPropagation() {
            LogManager manager = LogManager.getInstance();
            Logger l1 = manager.getLogger("OrderService");

            LoggerConfig newConfig = new LoggerConfig(LogLevel.ERROR);
            manager.setRootConfig(newConfig);

            assertEquals(LogLevel.ERROR, l1.getConfig().getMinLevel(), "Updating root configuration must propagate to existing loggers");
        }
    }
editablePaths:
- src/main/java/com/interviewos/logging/service/Logger.java
- src/main/java/com/interviewos/logging/service/LogManager.java
hiddenTestFiles:
  src/test/java/com/interviewos/logging/LogLevelFilteringTest.java: |
    package com.interviewos.logging;

    import com.interviewos.logging.appender.ConsoleAppender;
    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;
    import com.interviewos.logging.service.Logger;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class LogLevelFilteringTest {

        @Test
        @DisplayName("Messages below minimum threshold are filtered out")
        void testMessagesBelowThresholdDiscarded() {
            ConsoleAppender appender = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.WARN);
            config.addAppender(appender);

            Logger logger = new Logger("TestLogger", config);
            logger.debug("Debug trace");
            logger.info("General info");

            assertEquals(0, appender.getAppendedMessages().size(), "DEBUG and INFO must be discarded when threshold is WARN");
        }

        @Test
        @DisplayName("Messages at or above threshold are appended")
        void testMessagesAtOrAboveThresholdAppended() {
            ConsoleAppender appender = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.WARN);
            config.addAppender(appender);

            Logger logger = new Logger("TestLogger", config);
            logger.warn("Warning alert");
            logger.error("Error failure");

            assertEquals(2, appender.getAppendedMessages().size(), "WARN and ERROR must be recorded");
        }
    }
  src/test/java/com/interviewos/logging/LogAppenderRoutingTest.java: |
    package com.interviewos.logging;

    import com.interviewos.logging.appender.ConsoleAppender;
    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;
    import com.interviewos.logging.service.Logger;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class LogAppenderRoutingTest {

        @Test
        @DisplayName("Log dispatches to multiple registered appenders")
        void testMultipleAppendersReceiveMessage() {
            ConsoleAppender appender1 = new ConsoleAppender();
            ConsoleAppender appender2 = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.DEBUG);
            config.addAppender(appender1);
            config.addAppender(appender2);

            Logger logger = new Logger("MultiAppender", config);
            logger.info("Broadcast payload");

            assertEquals(1, appender1.getAppendedMessages().size());
            assertEquals(1, appender2.getAppendedMessages().size());
            assertEquals("Broadcast payload", appender1.getAppendedMessages().get(0).getMessage());
        }

        @Test
        @DisplayName("Convenience methods route with correct log levels")
        void testConvenienceMethodsRouteLevels() {
            ConsoleAppender appender = new ConsoleAppender();
            LoggerConfig config = new LoggerConfig(LogLevel.DEBUG);
            config.addAppender(appender);

            Logger logger = new Logger("LevelTest", config);
            logger.debug("D");
            logger.info("I");
            logger.warn("W");
            logger.error("E");

            assertEquals(4, appender.getAppendedMessages().size());
            assertEquals(LogLevel.DEBUG, appender.getAppendedMessages().get(0).getLevel());
            assertEquals(LogLevel.INFO, appender.getAppendedMessages().get(1).getLevel());
            assertEquals(LogLevel.WARN, appender.getAppendedMessages().get(2).getLevel());
            assertEquals(LogLevel.ERROR, appender.getAppendedMessages().get(3).getLevel());
        }
    }
  src/test/java/com/interviewos/logging/LogManagerLifecycleTest.java: |
    package com.interviewos.logging;

    import com.interviewos.logging.config.LoggerConfig;
    import com.interviewos.logging.model.LogLevel;
    import com.interviewos.logging.service.Logger;
    import com.interviewos.logging.service.LogManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class LogManagerLifecycleTest {

        @Test
        @DisplayName("LogManager returns idempotent instance for identical logger name")
        void testIdempotentLoggerRetrieval() {
            LogManager manager = LogManager.getInstance();
            Logger l1 = manager.getLogger("PaymentGateway");
            Logger l2 = manager.getLogger("PaymentGateway");

            assertNotNull(l1);
            assertSame(l1, l2, "LogManager must cache and return the same instance for identical names");
        }

        @Test
        @DisplayName("Root configuration updates propagate to active loggers")
        void testRootConfigPropagation() {
            LogManager manager = LogManager.getInstance();
            Logger l1 = manager.getLogger("OrderService");

            LoggerConfig newConfig = new LoggerConfig(LogLevel.ERROR);
            manager.setRootConfig(newConfig);

            assertEquals(LogLevel.ERROR, l1.getConfig().getMinLevel(), "Updating root configuration must propagate to existing loggers");
        }
    }
starterCode: |
  package com.interviewos.logging.service;

  import com.interviewos.logging.config.LoggerConfig;
  import com.interviewos.logging.model.LogLevel;

  public class Logger {
      private final String name;
      private volatile LoggerConfig config;

      public Logger(String name, LoggerConfig config) {
          this.name = name;
          this.config = config;
      }

      public String getName() { return name; }
      public LoggerConfig getConfig() { return config; }
      public void setConfig(LoggerConfig config) { this.config = config; }

      public void log(LogLevel level, String message) {
          // TODO: Check level against config.getMinLevel(), create LogMessage, dispatch to appenders
          throw new UnsupportedOperationException("TODO: Implement Logger.log");
      }

      public void debug(String message) {
          log(LogLevel.DEBUG, message);
      }

      public void info(String message) {
          log(LogLevel.INFO, message);
      }

      public void warn(String message) {
          log(LogLevel.WARN, message);
      }

      public void error(String message) {
          log(LogLevel.ERROR, message);
      }
  }
solutionCode: |
  package com.interviewos.logging.service;

  import com.interviewos.logging.appender.LogAppender;
  import com.interviewos.logging.config.LoggerConfig;
  import com.interviewos.logging.model.LogLevel;
  import com.interviewos.logging.model.LogMessage;

  public class Logger {
      private final String name;
      private volatile LoggerConfig config;

      public Logger(String name, LoggerConfig config) {
          this.name = name;
          this.config = config;
      }

      public String getName() { return name; }
      public LoggerConfig getConfig() { return config; }
      public void setConfig(LoggerConfig config) { this.config = config; }

      public void log(LogLevel level, String message) {
          if (config == null || level == null) return;
          if (level.isGreaterOrEqual(config.getMinLevel())) {
              LogMessage msg = new LogMessage(message, level, name);
              for (LogAppender appender : config.getAppenders()) {
                  appender.append(msg);
              }
          }
      }

      public void debug(String message) {
          log(LogLevel.DEBUG, message);
      }

      public void info(String message) {
          log(LogLevel.INFO, message);
      }

      public void warn(String message) {
          log(LogLevel.WARN, message);
      }

      public void error(String message) {
          log(LogLevel.ERROR, message);
      }
  }
---

### Problem Statement: Extensible Logging Framework

You are tasked with designing and implementing an extensible, thread-safe logging framework in Java. Modern software architectures rely on granular diagnostic trails to monitor application health, trace distributed requests, and triage production incidents. Your goal is to build a robust logging engine that decouples log message emission from downstream sink delivery, supporting configurable threshold filters and multiple concurrent destinations.

#### Functional Requirements:
1. **Hierarchical Log Levels**: Support standard severity levels including DEBUG, INFO, WARN, ERROR, and FATAL with well-defined ordinal priorities.
2. **Threshold Filtering**: Filter messages dynamically so that only messages with a severity equal to or higher than the configured minimum threshold are routed to appenders.
3. **Log Message Modeling**: Encapsulate each log event into an immutable LogMessage containing timestamp, severity level, source logger name, and textual payload.
4. **Pluggable Appenders**: Provide an extensible LogAppender interface supporting multiple sinks (such as console or file) without modifying the core Logger dispatch engine.
5. **Multi-Destination Dispatch**: Allow individual loggers to register multiple independent appenders, broadcasting each eligible log event to all attached destinations.
6. **Convenience Logging Methods**: Provide ergonomic shorthand methods (debug, info, warn, error) on the Logger coordinator that delegate directly to the underlying dispatch mechanism.
7. **Centralized Logger Management**: Provide a thread-safe LogManager registry that dispenses named Logger instances idempotently, returning the same instance for repeated name queries.
8. **Configuration Propagation**: Support setting a root LoggerConfig that establishes default thresholds and appenders, propagating updates cleanly across managed loggers.

#### Non-goals:
- Asynchronous non-blocking background queue flushers and ring buffers are out of scope for this module; all appenders are invoked synchronously during the dispatch phase.
- Network socket streaming and remote log aggregation agents are omitted; standard in-memory and console sinks fulfill the required test contracts.
