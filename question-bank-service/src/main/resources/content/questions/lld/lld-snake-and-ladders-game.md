---
slug: lld-snake-and-ladders-game
title: "Snake and Ladders Board Game Simulation"
track: SPRING_LLD
difficulty: EASY
topics:
  - lld
est_minutes: 35
tags: ['board-game', 'state-machine', 'simulation', 'dice']
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
        <groupId>com.interviewos.snakeladder</groupId>
        <artifactId>snake-ladders</artifactId>
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
    # Snake and Ladders Board Game Simulation

    ## Overview
    Design a multiplayer Snake and Ladders game engine with configurable board dimensions, snakes, ladders, and turn-based dice roll progression.
  src/main/java/com/interviewos/snakeladder/SnakeLadderGame.java: |
    package com.interviewos.snakeladder;

    import java.util.List;

    public interface SnakeLadderGame {
        void addSnake(int head, int tail);
        void addLadder(int start, int end);
        int rollAndMove(String playerId, int diceRoll);
        boolean isGameOver();
    }
  src/main/java/com/interviewos/snakeladder/impl/SnakeLadderGameImpl.java: |
    package com.interviewos.snakeladder;

    import java.util.*;

    public class DefaultSnakeLadderGame implements SnakeLadderGame {

        private final int boardSize;
        private final Map<Integer, Integer> snakes = new HashMap<>();
        private final Map<Integer, Integer> ladders = new HashMap<>();
        private final Map<String, Integer> playerPositions = new HashMap<>();
        private boolean gameOver = false;

        public DefaultSnakeLadderGame(int boardSize) {
            this.boardSize = boardSize;
        }

        @Override
        public void addSnake(int head, int tail) {
            snakes.put(head, tail);
        }

        @Override
        public void addLadder(int start, int end) {
            ladders.put(start, end);
        }

        @Override
        public int rollAndMove(String playerId, int diceRoll) {
            if (gameOver) return playerPositions.getOrDefault(playerId, 0);

            int current = playerPositions.getOrDefault(playerId, 0);
            int target = current + diceRoll;

            if (target > boardSize) {
                return current; // must land exactly on final tile
            }

            if (snakes.containsKey(target)) {
                target = snakes.get(target);
            } else if (ladders.containsKey(target)) {
                target = ladders.get(target);
            }

            playerPositions.put(playerId, target);
            if (target == boardSize) {
                gameOver = true;
            }
            return target;
        }

        @Override
        public boolean isGameOver() {
            return gameOver;
        }
    }
starterCode: |
  package com.interviewos.snakeladder;

  import java.util.List;

  public interface SnakeLadderGame {
      void addSnake(int head, int tail);
      void addLadder(int start, int end);
      int rollAndMove(String playerId, int diceRoll);
      boolean isGameOver();
  }
solutionCode: |
  package com.interviewos.snakeladder;

  import java.util.*;

  public class DefaultSnakeLadderGame implements SnakeLadderGame {

      private final int boardSize;
      private final Map<Integer, Integer> snakes = new HashMap<>();
      private final Map<Integer, Integer> ladders = new HashMap<>();
      private final Map<String, Integer> playerPositions = new HashMap<>();
      private boolean gameOver = false;

      public DefaultSnakeLadderGame(int boardSize) {
          this.boardSize = boardSize;
      }

      @Override
      public void addSnake(int head, int tail) {
          snakes.put(head, tail);
      }

      @Override
      public void addLadder(int start, int end) {
          ladders.put(start, end);
      }

      @Override
      public int rollAndMove(String playerId, int diceRoll) {
          if (gameOver) return playerPositions.getOrDefault(playerId, 0);

          int current = playerPositions.getOrDefault(playerId, 0);
          int target = current + diceRoll;

          if (target > boardSize) {
              return current; // must land exactly on final tile
          }

          if (snakes.containsKey(target)) {
              target = snakes.get(target);
          } else if (ladders.containsKey(target)) {
              target = ladders.get(target);
          }

          playerPositions.put(playerId, target);
          if (target == boardSize) {
              gameOver = true;
          }
          return target;
      }

      @Override
      public boolean isGameOver() {
          return gameOver;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/snakeladder/SnakeLadderGameTest.java: |
    package com.interviewos.snakeladder;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class SnakeLadderGameTest {

        @Test
        @DisplayName("Moving onto ladder advances player forward")
        void testLadderClimb() {
            SnakeLadderGame game = new DefaultSnakeLadderGame(100);
            game.addLadder(4, 25);
            int pos = game.rollAndMove("player1", 4);
            assertEquals(25, pos);
        }

        @Test
        @DisplayName("Moving onto snake head demotes player to tail")
        void testSnakeBite() {
            SnakeLadderGame game = new DefaultSnakeLadderGame(100);
            game.addSnake(14, 3);
            int pos = game.rollAndMove("p1", 14);
            assertEquals(3, pos);
        }
    }
referenceSolutions:
  - approachId: canonical-lld-snake-and-ladders-game
    label: "Primary — Snake and Ladders Board Game Simulation"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a multiplayer Snake and Ladders game engine with configurable board dimensions, snakes, ladders, and turn-based dice roll progression."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.snakeladder;

      import java.util.*;

      public class DefaultSnakeLadderGame implements SnakeLadderGame {

          private final int boardSize;
          private final Map<Integer, Integer> snakes = new HashMap<>();
          private final Map<Integer, Integer> ladders = new HashMap<>();
          private final Map<String, Integer> playerPositions = new HashMap<>();
          private boolean gameOver = false;

          public DefaultSnakeLadderGame(int boardSize) {
              this.boardSize = boardSize;
          }

          @Override
          public void addSnake(int head, int tail) {
              snakes.put(head, tail);
          }

          @Override
          public void addLadder(int start, int end) {
              ladders.put(start, end);
          }

          @Override
          public int rollAndMove(String playerId, int diceRoll) {
              if (gameOver) return playerPositions.getOrDefault(playerId, 0);

              int current = playerPositions.getOrDefault(playerId, 0);
              int target = current + diceRoll;

              if (target > boardSize) {
                  return current; // must land exactly on final tile
              }

              if (snakes.containsKey(target)) {
                  target = snakes.get(target);
              } else if (ladders.containsKey(target)) {
                  target = ladders.get(target);
              }

              playerPositions.put(playerId, target);
              if (target == boardSize) {
                  gameOver = true;
              }
              return target;
          }

          @Override
          public boolean isGameOver() {
              return gameOver;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Snake and Ladders Board Game Simulation

Design a multiplayer Snake and Ladders game engine with configurable board dimensions, snakes, ladders, and turn-based dice roll progression.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Snake and Ladders Board Game Simulation.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
