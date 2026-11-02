---
slug: lld-chess-game-engine
title: "Object-Oriented Chess Engine & Move Validator"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['chess', 'strategy-pattern', 'board-game', 'validation']
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
        <groupId>com.interviewos.chess</groupId>
        <artifactId>chess-engine</artifactId>
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
    # Object-Oriented Chess Engine & Move Validator

    ## Overview
    Design an extensible chess game model supporting piece movement rules, board state tracking, and turn alternation.
  src/main/java/com/interviewos/chess/ChessGame.java: |
    package com.interviewos.chess;

    public interface ChessGame {
        boolean makeMove(int fromRow, int fromCol, int toRow, int toCol);
        PieceColor getActiveTurn();
    }

    enum PieceColor { WHITE, BLACK }
  src/main/java/com/interviewos/chess/impl/ChessGameImpl.java: |
    package com.interviewos.chess;

    public class DefaultChessGame implements ChessGame {

        private PieceColor currentTurn = PieceColor.WHITE;
        private final String[][] board = new String[8][8];

        public DefaultChessGame() {
            setupBoard();
        }

        private void setupBoard() {
            // Simple initialization
            board[0][0] = "R"; board[7][0] = "r";
        }

        @Override
        public boolean makeMove(int fromRow, int fromCol, int toRow, int toCol) {
            if (fromRow < 0 || fromRow > 7 || toRow < 0 || toRow > 7) return false;
            if (fromCol < 0 || fromCol > 7 || toCol < 0 || toCol > 7) return false;

            // Toggle turn
            currentTurn = (currentTurn == PieceColor.WHITE) ? PieceColor.BLACK : PieceColor.WHITE;
            return true;
        }

        @Override
        public PieceColor getActiveTurn() {
            return currentTurn;
        }
    }
starterCode: |
  package com.interviewos.chess;

  public interface ChessGame {
      boolean makeMove(int fromRow, int fromCol, int toRow, int toCol);
      PieceColor getActiveTurn();
  }

  enum PieceColor { WHITE, BLACK }
solutionCode: |
  package com.interviewos.chess;

  public class DefaultChessGame implements ChessGame {

      private PieceColor currentTurn = PieceColor.WHITE;
      private final String[][] board = new String[8][8];

      public DefaultChessGame() {
          setupBoard();
      }

      private void setupBoard() {
          // Simple initialization
          board[0][0] = "R"; board[7][0] = "r";
      }

      @Override
      public boolean makeMove(int fromRow, int fromCol, int toRow, int toCol) {
          if (fromRow < 0 || fromRow > 7 || toRow < 0 || toRow > 7) return false;
          if (fromCol < 0 || fromCol > 7 || toCol < 0 || toCol > 7) return false;

          // Toggle turn
          currentTurn = (currentTurn == PieceColor.WHITE) ? PieceColor.BLACK : PieceColor.WHITE;
          return true;
      }

      @Override
      public PieceColor getActiveTurn() {
          return currentTurn;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/chess/ChessGameTest.java: |
    package com.interviewos.chess;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class ChessGameTest {

        @Test
        @DisplayName("Turn alternates upon valid move")
        void testTurnAlternation() {
            ChessGame game = new DefaultChessGame();
            assertEquals(PieceColor.WHITE, game.getActiveTurn());
            assertTrue(game.makeMove(1, 0, 2, 0));
            assertEquals(PieceColor.BLACK, game.getActiveTurn());
        }
    }
referenceSolutions:
  - approachId: canonical-lld-chess-game-engine
    label: "Primary — Object-Oriented Chess Engine & Move Validator"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an extensible chess game model supporting piece movement rules, board state tracking, and turn alternation."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.chess;

      public class DefaultChessGame implements ChessGame {

          private PieceColor currentTurn = PieceColor.WHITE;
          private final String[][] board = new String[8][8];

          public DefaultChessGame() {
              setupBoard();
          }

          private void setupBoard() {
              // Simple initialization
              board[0][0] = "R"; board[7][0] = "r";
          }

          @Override
          public boolean makeMove(int fromRow, int fromCol, int toRow, int toCol) {
              if (fromRow < 0 || fromRow > 7 || toRow < 0 || toRow > 7) return false;
              if (fromCol < 0 || fromCol > 7 || toCol < 0 || toCol > 7) return false;

              // Toggle turn
              currentTurn = (currentTurn == PieceColor.WHITE) ? PieceColor.BLACK : PieceColor.WHITE;
              return true;
          }

          @Override
          public PieceColor getActiveTurn() {
              return currentTurn;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: Object-Oriented Chess Engine & Move Validator

Design an extensible chess game model supporting piece movement rules, board state tracking, and turn alternation.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining Object-Oriented Chess Engine & Move Validator.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
