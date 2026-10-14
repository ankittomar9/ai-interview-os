---
slug: dsa-n-queen-problem
title: "N-Queen Problem"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [recursion]
est_minutes: 35
tags: [backtracking, recursion, n-queens, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/n-queen-problem
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      4
    expectedOutput: |
      2
    description: "4-Queens has 2 distinct valid solutions"
  - name: "Sample 2"
    input: |
      1
    expectedOutput: |
      1
    description: "1-Queen has 1 solution"
hiddenTests:
  - name: "No Solution Board"
    input: |
      2
    expectedOutput: |
      0
    weight: 50
  - name: "Standard 8-Queens"
    input: |
      8
    expectedOutput: |
      92
    weight: 50
hints:
  - "Place queens column by column (or row by row)."
  - "Use boolean arrays (or bitmasks) to track occupied rows, main diagonals (r - c), and anti-diagonals (r + c) in O(1) time."
  - "Backtrack by clearing marks when returning from recursive calls."
constraints:
  - "1 <= N <= 12"
coaching:
  presentationTips:
    - "Demonstrate diagonal index formula: r + c and r - c + (N - 1)."
    - "Explain the O(N!) state pruning in backtracking."
  approachHint: "Backtracking recursion with diagonal conflict tracking."
editorial: |
  ### N-Queen Problem
  Use backtracking row-by-row:
  For each row `r`:
  Try placing a queen in column `c` from `0` to `N-1`.
  Check if `cols[c]`, `diag1[r - c + N]`, and `diag2[r + c]` are free.
  If free, mark them as used, recurse to row `r + 1`, and unmark upon returning.
  When `r == N`, increment the count of valid solutions.
  - **Time Complexity:** O(N!)
  - **Space Complexity:** O(N) for recursion and lookup arrays.
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement N-Queen solution counter
      public static int totalNQueens(int n) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          System.out.println(totalNQueens(n));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      private static int solve(int row, int n, boolean[] cols, boolean[] diag1, boolean[] diag2) {
          if (row == n) return 1;

          int count = 0;
          for (int col = 0; col < n; col++) {
              int d1 = row - col + n;
              int d2 = row + col;
              if (!cols[col] && !diag1[d1] && !diag2[d2]) {
                  cols[col] = true;
                  diag1[d1] = true;
                  diag2[d2] = true;

                  count += solve(row + 1, n, cols, diag1, diag2);

                  cols[col] = false;
                  diag1[d1] = false;
                  diag2[d2] = false;
              }
          }
          return count;
      }

      public static int totalNQueens(int n) {
          boolean[] cols = new boolean[n];
          boolean[] diag1 = new boolean[2 * n];
          boolean[] diag2 = new boolean[2 * n];
          return solve(0, n, cols, diag1, diag2);
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          System.out.println(totalNQueens(n));
      }
  }
---

### N-Queen Problem

The n-queens puzzle is the problem of placing `N` chess queens on an `N x N` chessboard so that no two queens attack each other.

Given an integer `N`, return the total number of distinct solutions to the `N`-queens puzzle.

#### Input Format:
- Line 1: An integer `N` representing the chessboard dimension.

#### Output Format:
- Print a single integer representing the total count of valid board configurations.

#### Constraints:
- `1 <= N <= 12`
