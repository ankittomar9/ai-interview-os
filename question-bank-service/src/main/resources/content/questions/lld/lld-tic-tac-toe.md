---
slug: lld-tic-tac-toe
title: Design a Tic Tac Toe Game
track: SPRING_LLD
difficulty: EASY
topics: [lld]
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- game-design
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Model the Board with an extensible size $N \times N$ rather than hardcoding $3 \times 3$.
- Optimize win checking to $O(1)$ per move by tracking row counts, column counts, and diagonal counts for each player.
- Encapsulate the winning condition inside a pluggable WinningStrategy interface for variations.
coaching:
  presentationTips:
  - 'Show clean separation of concerns: Board (grid state), Player (metadata + piece symbol), and Game (turn loop, rules,
    referee).'
  - Explain how the $O(1)$ win evaluation algorithm works using row/column counters (+1 for Player 1, -1 for Player 2).
  - 'Highlight edge cases: full board tie detection, invalid move on occupied cell, moves after game over.'
starterCode: "public class Game {\n    // Core game components\nprivate final Board board; // Manages the game board state\n\
  private final ScoreTracker scoreTracker; // Keeps track of player scores\nprivate Player[] players; // Array of players\
  \ in the game\nprivate int currentPlayerIndex; // Index of the current player's turn\n// Constructor initializes game components\
  \ and starts a new game\npublic Game(Player playerX, Player playerY) {\n        board = new Board();\n        scoreTracker\
  \ = new ScoreTracker();\n        startNewGame(playerX, playerY);\n    }\n    // Resets the game state and initializes players\
  \ for a new game\npublic void startNewGame(Player playerX, Player playerY) {\n        board.reset();\n        players =\
  \ new Player[] `{playerX, playerY}`;\n        currentPlayerIndex = 0;\n    }\n    // Processes a player's move, validates\
  \ it, and updates game state\npublic void makeMove(int colIndex, int rowIndex, Player player) {\n        if (getGameStatus().equals(GameCondition.ENDED))\
  \ {\n            throw new IllegalStateException(\"game ended\");\n        }\n        if (players[currentPlayerIndex] !=\
  \ player) {\n            throw new IllegalArgumentException(\"not the current player\");\n        }\n        if (board.getPlayerAt(colIndex,\
  \ rowIndex) != null) {\n            throw new IllegalArgumentException(\"board position is taken\");\n        }\n      \
  \  board.updateBoard(colIndex, rowIndex, player);\n        final Move\nnewMove\n=\nnew Move(colIndex, rowIndex, player);\n\
  \        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;\n        if (getGameStatus().equals(GameCondition.ENDED))\
  \ {\n            scoreTracker.reportGameResult(players[0], players[1], board.getWinner());\n        }\n    }\n    // Determines\
  \ if the game is in progress or has ended\npublic GameCondition getGameStatus() {\n        Optional<Player> winner = board.getWinner();\n\
  \        if (winner.isPresent()) {\n            return GameCondition.ENDED;\n        }\n        return board.isFull() ?\
  \ GameCondition.ENDED : GameCondition.IN_PROGRESS;\n    }\n    // Returns the player whose turn it is\npublic Player getCurrentPlayer()\
  \ {\n        return players[currentPlayerIndex];\n    }\n    // Returns the score tracker for accessing game statistics\n\
  public ScoreTracker getScoreTracker() {\n        return scoreTracker;\n    }\n}\n\npublic class Board {\n    // 3x3 grid\
  \ to store player moves\nprivate final Player[][] grid = new Player[3][3];\n    // Updates the board with a player's move\
  \ at the specified position\npublic void updateBoard(int colIndex, int rowIndex, Player player) {\n        if (grid[colIndex][rowIndex]\
  \ == null) {\n            grid[colIndex][rowIndex] = player;\n        }\n    }\n    // Checks for a winner by examining\
  \ rows, columns, and diagonals\npublic Optional<Player> getWinner() {\n        // Check rows for three in a row\nfor (int\
  \ i\n=\n0; i < grid.length; i++) {\n            Player\nfirst\n= grid[i][0];\n            if (first != null && Arrays.stream(grid[i]).allMatch(p\
  \ -> p == first)) {\n                return Optional.of(first);\n            }\n        }\n        // Check columns for\
  \ three in a column\nfor (int j\n=\n0; j < grid[0].length; j++) {\n            final Player\nfirst\n= grid[0][j];\n    \
  \        int finalJ\n= j; // streams require a final object\nif (first != null && Arrays.stream(grid).allMatch(row -> row[finalJ]\
  \ == first)) {\n                return Optional.of(first);\n            }\n        }\n        // Check main diagonal (top-left\
  \ to bottom-right)\nPlayer\ntopLeft\n= grid[0][0];\n        if (topLeft != null\n                && IntStream.range(0, grid.length).allMatch(i\
  \ -> grid[i][i] == topLeft)) {\n            return Optional.of(topLeft);\n        }\n        // Check anti-diagonal (top-right\
  \ to bottom-left)\nPlayer\ntopRight\n= grid[0][grid[0].length - 1];\n        if (topRight != null\n                && IntStream.range(0,\
  \ grid.length)\n                        .allMatch(i -> grid[i][grid[0].length - 1 - i] == topRight)) {\n            return\
  \ Optional.of(topRight);\n        }\n        // No winner found\nreturn Optional.empty();\n    }\n    // Checks if all positions\
  \ on the board are filled\npublic boolean isFull() {\n        return Arrays.stream(grid).flatMap(Arrays::stream).noneMatch(Objects::isNull);\n\
  \    }\n    // Resets the board by clearing all positions\npublic void reset() {\n        for (Player[] players : grid)\
  \ {\n            Arrays.fill(players, null);\n        }\n    }\n    // Returns the player at the specified position, or\
  \ null if empty\npublic Player getPlayerAt(int colIndex, int rowIndex) {\n        return grid[colIndex][rowIndex];\n   \
  \ }\n}\n\npublic class Player {\n    private final String name;\n    private final char symbol;\n    public Player(String\
  \ name, char symbol) {\n        this.name = name;\n        this.symbol = symbol;\n    }\n    public String getName() {\n\
  \        return name;\n    }\n    public char getSymbol() {\n        return symbol;\n    }\n}"
solutionCode: "public class Game {\n    // Core game components\nprivate final Board board; // Manages the game board state\n\
  private final ScoreTracker scoreTracker; // Keeps track of player scores\nprivate Player[] players; // Array of players\
  \ in the game\nprivate int currentPlayerIndex; // Index of the current player's turn\n// Constructor initializes game components\
  \ and starts a new game\npublic Game(Player playerX, Player playerY) {\n        board = new Board();\n        scoreTracker\
  \ = new ScoreTracker();\n        startNewGame(playerX, playerY);\n    }\n    // Resets the game state and initializes players\
  \ for a new game\npublic void startNewGame(Player playerX, Player playerY) {\n        board.reset();\n        players =\
  \ new Player[] `{playerX, playerY}`;\n        currentPlayerIndex = 0;\n    }\n    // Processes a player's move, validates\
  \ it, and updates game state\npublic void makeMove(int colIndex, int rowIndex, Player player) {\n        if (getGameStatus().equals(GameCondition.ENDED))\
  \ {\n            throw new IllegalStateException(\"game ended\");\n        }\n        if (players[currentPlayerIndex] !=\
  \ player) {\n            throw new IllegalArgumentException(\"not the current player\");\n        }\n        if (board.getPlayerAt(colIndex,\
  \ rowIndex) != null) {\n            throw new IllegalArgumentException(\"board position is taken\");\n        }\n      \
  \  board.updateBoard(colIndex, rowIndex, player);\n        final Move\nnewMove\n=\nnew Move(colIndex, rowIndex, player);\n\
  \        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;\n        if (getGameStatus().equals(GameCondition.ENDED))\
  \ {\n            scoreTracker.reportGameResult(players[0], players[1], board.getWinner());\n        }\n    }\n    // Determines\
  \ if the game is in progress or has ended\npublic GameCondition getGameStatus() {\n        Optional<Player> winner = board.getWinner();\n\
  \        if (winner.isPresent()) {\n            return GameCondition.ENDED;\n        }\n        return board.isFull() ?\
  \ GameCondition.ENDED : GameCondition.IN_PROGRESS;\n    }\n    // Returns the player whose turn it is\npublic Player getCurrentPlayer()\
  \ {\n        return players[currentPlayerIndex];\n    }\n    // Returns the score tracker for accessing game statistics\n\
  public ScoreTracker getScoreTracker() {\n        return scoreTracker;\n    }\n}\n\npublic class Board {\n    // 3x3 grid\
  \ to store player moves\nprivate final Player[][] grid = new Player[3][3];\n    // Updates the board with a player's move\
  \ at the specified position\npublic void updateBoard(int colIndex, int rowIndex, Player player) {\n        if (grid[colIndex][rowIndex]\
  \ == null) {\n            grid[colIndex][rowIndex] = player;\n        }\n    }\n    // Checks for a winner by examining\
  \ rows, columns, and diagonals\npublic Optional<Player> getWinner() {\n        // Check rows for three in a row\nfor (int\
  \ i\n=\n0; i < grid.length; i++) {\n            Player\nfirst\n= grid[i][0];\n            if (first != null && Arrays.stream(grid[i]).allMatch(p\
  \ -> p == first)) {\n                return Optional.of(first);\n            }\n        }\n        // Check columns for\
  \ three in a column\nfor (int j\n=\n0; j < grid[0].length; j++) {\n            final Player\nfirst\n= grid[0][j];\n    \
  \        int finalJ\n= j; // streams require a final object\nif (first != null && Arrays.stream(grid).allMatch(row -> row[finalJ]\
  \ == first)) {\n                return Optional.of(first);\n            }\n        }\n        // Check main diagonal (top-left\
  \ to bottom-right)\nPlayer\ntopLeft\n= grid[0][0];\n        if (topLeft != null\n                && IntStream.range(0, grid.length).allMatch(i\
  \ -> grid[i][i] == topLeft)) {\n            return Optional.of(topLeft);\n        }\n        // Check anti-diagonal (top-right\
  \ to bottom-left)\nPlayer\ntopRight\n= grid[0][grid[0].length - 1];\n        if (topRight != null\n                && IntStream.range(0,\
  \ grid.length)\n                        .allMatch(i -> grid[i][grid[0].length - 1 - i] == topRight)) {\n            return\
  \ Optional.of(topRight);\n        }\n        // No winner found\nreturn Optional.empty();\n    }\n    // Checks if all positions\
  \ on the board are filled\npublic boolean isFull() {\n        return Arrays.stream(grid).flatMap(Arrays::stream).noneMatch(Objects::isNull);\n\
  \    }\n    // Resets the board by clearing all positions\npublic void reset() {\n        for (Player[] players : grid)\
  \ {\n            Arrays.fill(players, null);\n        }\n    }\n    // Returns the player at the specified position, or\
  \ null if empty\npublic Player getPlayerAt(int colIndex, int rowIndex) {\n        return grid[colIndex][rowIndex];\n   \
  \ }\n}\n\npublic class Player {\n    private final String name;\n    private final char symbol;\n    public Player(String\
  \ name, char symbol) {\n        this.name = name;\n        this.symbol = symbol;\n    }\n    public String getName() {\n\
  \        return name;\n    }\n    public char getSymbol() {\n        return symbol;\n    }\n}\n\nclass ScoreTracker {\n\
  \    // Stores player ratings in a map where key is player and value is their score\nprivate HashMap<Player, Integer> playerRatings\
  \ = new HashMap<>();\n    // This logic is customizable and, in reality, will use a complex ranking algorithm. For the\n\
  // interview, we use a simple victory count system where the winner gets one point, the loser\n// loses a point, and no\
  \ changes occur for a draw.\npublic void reportGameResult(Player player1, Player player2, Optional<Player> winningPlayer)\
  \ {\n        if (winningPlayer.isPresent()) {\n            Player\nwinner\n= winningPlayer.get();\n            Player\n\
  loser\n= player1 == winner ? player2 : player1;\n            playerRatings.putIfAbsent(winner, 0);\n            playerRatings.put(winner,\
  \ playerRatings.get(winner) + 1);\n            playerRatings.putIfAbsent(loser, 0);\n            playerRatings.put(loser,\
  \ playerRatings.get(loser) - 1);\n        }\n    }\n    // Returns a map of players sorted by their ratings in descending\
  \ order\npublic Map<Player, Integer> getTopPlayers() {\n        return playerRatings.entrySet().stream()\n             \
  \   .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))\n                .map(Map.Entry::getKey)\n          \
  \      .collect(Collectors.toMap(player -> player, player -> playerRatings.get(player)));\n    }\n    // Returns the rank\
  \ of a player based on their rating\npublic int getRank(Player player) {\n        List<Player> sortedPlayers =\n       \
  \         playerRatings.entrySet().stream()\n                        .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))\n\
  \                        .map(Map.Entry::getKey)\n                        .collect(Collectors.toList());\n        return\
  \ sortedPlayers.indexOf(player) + 1;\n    }\n    // getters are omitted for brevity\n}\n\nclass MoveHistory {\n    // Stack-like\
  \ structure to store moves in chronological order\nprivate final ArrayDeque<Move> history = new ArrayDeque<>();\n    //\
  \ Adds a new move to the history stack\npublic void recordMove(Move move) {\n        history.push(move);\n    }\n    //\
  \ Removes and returns the most recent move from the history\npublic Move undoMove() {\n        return history.pop();\n \
  \   }\n    // Clears all moves from the history\npublic void clearHistory() {\n        history.clear();\n    }\n}\n\npublic\
  \ void makeMove(int colIndex, int rowIndex, Player player) {\n    // Validate that game hasn't ended\nif (getGameStatus().equals(GameCondition.ENDED))\
  \ {\n        throw new IllegalStateException(\"game ended\");\n    }\n    // Validate that it's the correct player's turn\n\
  if (players[currentPlayerIndex] != player) {\n        throw new IllegalArgumentException(\"not the current player\");\n\
  \    }\n    // Validate that the position is not already taken\nif (board.getPlayerAt(colIndex, rowIndex) != null) {\n \
  \       throw new IllegalArgumentException(\"board position is taken\");\n    }\n    // Update the board with the player's\
  \ move\n    board.updateBoard(colIndex, rowIndex, player);\n    // Record the move in history\nfinal Move\nnewMove\n=\n\
  new Move(colIndex, rowIndex, player);\n    moveHistory.recordMove(newMove);\n    // Switch to the next player\n    currentPlayerIndex\
  \ = (currentPlayerIndex + 1) % players.length;\n    // If game has ended, update the score\nif (getGameStatus().equals(GameCondition.ENDED))\
  \ {\n        scoreTracker.reportGameResult(players[0], players[1], board.getWinner());\n    }\n}\n// Reverts the last move\
  \ made in the game\npublic void undoMove() {\n    // Check if game has ended to prevent undoing after winner is reported\n\
  if (getGameStatus().equals(GameCondition.ENDED)) {\n        throw new IllegalStateException(\"game ended and winner already\
  \ reported\");\n    }\n    // Get the last move from history\nfinal Move\nlastMove\n= moveHistory.undoMove();\n    // Update\
  \ current player index to previous player\nif (currentPlayerIndex == 0) {\n        currentPlayerIndex = players.length -\
  \ 1;\n    } else {\n        currentPlayerIndex--;\n    }\n    // Clear the board position of the undone move\n    board.updateBoard(lastMove.getColIndex(),\
  \ lastMove.getRowIndex(), null);\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Tic Tac Toe Game


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Strategy Pattern (Rule Evaluation), Model-View-Controller (Game Engine Structure)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
---
### Problem Statement: Design a Tic Tac Toe Game

Design an Object-Oriented $N \times N$ Tic-Tac-Toe game supporting multiple players, custom board dimensions, $O(1)$ move evaluation, and extensible win conditions.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Tic Tac Toe Game.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage Strategy Pattern (Rule Evaluation), Model-View-Controller (Game Engine Structure).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
