---
slug: dsa-solve-the-sudoku
title: "Sudoku Solver"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [recursion, matrix]
est_minutes: 35
tags: [backtracking, recursion, matrix, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/solve-the-sudoku
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      3 0 6 5 0 8 4 0 0
      5 2 0 0 0 0 0 0 0
      0 8 7 0 0 0 0 3 1
      0 0 3 0 1 0 0 8 0
      9 0 0 8 6 3 0 0 5
      0 5 0 0 9 0 6 0 0
      1 3 0 0 0 0 2 5 0
      0 0 0 0 0 0 0 7 4
      0 0 5 2 0 6 3 0 0
    expectedOutput: |
      3 1 6 5 7 8 4 9 2
      5 2 9 1 3 4 7 6 8
      4 8 7 6 2 9 5 3 1
      2 6 3 4 1 5 9 8 7
      9 7 4 8 6 3 1 2 5
      8 5 1 7 9 2 6 4 3
      1 3 8 9 4 7 2 5 6
      6 9 2 3 5 1 8 7 4
      7 4 5 2 8 6 3 1 9
    description: "Standard 9x9 sudoku board solution"
  - name: "Sample 2"
    input: |
      5 3 0 0 7 0 0 0 0
      6 0 0 1 9 5 0 0 0
      0 9 8 0 0 0 0 6 0
      8 0 0 0 6 0 0 0 3
      4 0 0 8 0 3 0 0 1
      7 0 0 0 2 0 0 0 6
      0 6 0 0 0 0 2 8 0
      0 0 0 4 1 9 0 0 5
      0 0 0 0 8 0 0 7 9
    expectedOutput: |
      5 3 4 6 7 8 9 1 2
      6 7 2 1 9 5 3 4 8
      1 9 8 3 4 2 5 6 7
      8 5 9 7 6 1 4 2 3
      4 2 6 8 5 3 7 9 1
      7 1 3 9 2 4 8 5 6
      9 6 1 5 3 7 2 8 4
      2 8 7 4 1 9 6 3 5
      3 4 5 2 8 6 1 7 9
    description: "Standard classic sudoku puzzle"
hiddenTests:
  - name: "Two Empty Cells"
    input: |
      3 1 6 5 7 8 4 9 2
      5 2 9 1 3 4 7 6 8
      4 8 7 6 2 9 5 3 1
      2 6 3 4 1 5 9 8 7
      9 7 4 8 6 3 1 2 5
      8 5 1 7 9 2 6 4 3
      1 3 8 9 4 7 2 5 6
      6 9 2 3 5 1 8 7 4
      7 4 5 2 8 6 3 0 0
    expectedOutput: |
      3 1 6 5 7 8 4 9 2
      5 2 9 1 3 4 7 6 8
      4 8 7 6 2 9 5 3 1
      2 6 3 4 1 5 9 8 7
      9 7 4 8 6 3 1 2 5
      8 5 1 7 9 2 6 4 3
      1 3 8 9 4 7 2 5 6
      6 9 2 3 5 1 8 7 4
      7 4 5 2 8 6 3 1 9
    weight: 50
  - name: "Single Empty Cell"
    input: |
      3 1 6 5 7 8 4 9 2
      5 2 9 1 3 4 7 6 8
      4 8 7 6 2 9 5 3 1
      2 6 3 4 1 5 9 8 7
      9 7 4 8 6 3 1 2 5
      8 5 1 7 9 2 6 4 3
      1 3 8 9 4 7 2 5 6
      6 9 2 3 5 1 8 7 4
      7 4 5 2 8 6 3 1 0
    expectedOutput: |
      3 1 6 5 7 8 4 9 2
      5 2 9 1 3 4 7 6 8
      4 8 7 6 2 9 5 3 1
      2 6 3 4 1 5 9 8 7
      9 7 4 8 6 3 1 2 5
      8 5 1 7 9 2 6 4 3
      1 3 8 9 4 7 2 5 6
      6 9 2 3 5 1 8 7 4
      7 4 5 2 8 6 3 1 9
    weight: 50
hints:
  - "Find an empty cell (value 0). Try placing numbers 1 through 9."
  - "A placement is valid if the digit is not already present in the same row, column, or 3x3 subgrid."
  - "Recurse to the next empty cell; if no valid digit leads to a solution, backtrack by resetting the cell to 0."
constraints:
  - "Grid dimension is 9 x 9"
  - "Values are in range [0, 9] (0 represents blank cell)"
  - "Guaranteed to have exactly one valid solution"
coaching:
  presentationTips:
    - "Explain the 3x3 box index calculation: 3 * (r / 3) + i / 3 and 3 * (c / 3) + i % 3."
    - "Detail why boolean return value from recursive solve enables early termination upon finding the solution."
  approachHint: "Recursive backtracking with validity checks."
editorial: |
  ### Sudoku Solver
  Traverse the 9x9 board:
  1. Locate any empty cell `(r, c)` where `grid[r][c] == 0`.
  2. For candidate numbers `val` from 1 to 9:
     - Check if `val` is valid in row `r`, column `c`, and the `3x3` box.
     - If valid, assign `grid[r][c] = val` and recursively solve.
     - If the recursive call succeeds, return `true`.
     - Otherwise, reset `grid[r][c] = 0` (backtrack).
  3. If all cells are filled, return `true`.
  - **Time Complexity:** O(9^(empty cells))
  - **Space Complexity:** O(1) auxiliary (recursion depth at most 81).
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement Sudoku solver
      public static boolean solveSudoku(int[][] grid) {
          return false;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int[][] grid = new int[9][9];
          for (int i = 0; i < 9; i++)
              for (int j = 0; j < 9; j++)
                  grid[i][j] = sc.nextInt();

          solveSudoku(grid);

          for (int i = 0; i < 9; i++) {
              StringBuilder sb = new StringBuilder();
              for (int j = 0; j < 9; j++) {
                  if (j > 0) sb.append(" ");
                  sb.append(grid[i][j]);
              }
              System.out.println(sb.toString());
          }
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      private static boolean isValid(int[][] grid, int r, int c, int val) {
          for (int i = 0; i < 9; i++) {
              if (grid[r][i] == val) return false;
              if (grid[i][c] == val) return false;
              int boxR = 3 * (r / 3) + i / 3;
              int boxC = 3 * (c / 3) + i % 3;
              if (grid[boxR][boxC] == val) return false;
          }
          return true;
      }

      public static boolean solveSudoku(int[][] grid) {
          for (int r = 0; r < 9; r++) {
              for (int c = 0; c < 9; c++) {
                  if (grid[r][c] == 0) {
                      for (int val = 1; val <= 9; val++) {
                          if (isValid(grid, r, c, val)) {
                              grid[r][c] = val;
                              if (solveSudoku(grid)) return true;
                              grid[r][c] = 0;
                          }
                      }
                      return false;
                  }
              }
          }
          return true;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int[][] grid = new int[9][9];
          for (int i = 0; i < 9; i++)
              for (int j = 0; j < 9; j++)
                  grid[i][j] = sc.nextInt();

          solveSudoku(grid);

          for (int i = 0; i < 9; i++) {
              StringBuilder sb = new StringBuilder();
              for (int j = 0; j < 9; j++) {
                  if (j > 0) sb.append(" ");
                  sb.append(grid[i][j]);
              }
              System.out.println(sb.toString());
          }
      }
  }
---

### Sudoku Solver

Given an incomplete Sudoku configuration in terms of a 9 x 9 2D square matrix `grid`, find the solved Sudoku. A value of 0 in the matrix denotes an empty cell.

A sudoku solution must satisfy all of the following rules:
1. Each of the digits `1-9` must occur exactly once in each row.
2. Each of the digits `1-9` must occur exactly once in each column.
3. Each of the digits `1-9` must occur exactly once in each of the 9 `3x3` sub-boxes of the grid.

Print the solved 9x9 grid with numbers separated by spaces.

#### Input Format:
- 9 lines each containing 9 space-separated integers representing the initial Sudoku board.

#### Output Format:
- 9 lines each containing 9 space-separated integers representing the completed Sudoku board.

#### Constraints:
- Grid dimension is 9 x 9
- `0 <= grid[i][j] <= 9`
- Exactly one unique solution exists.
