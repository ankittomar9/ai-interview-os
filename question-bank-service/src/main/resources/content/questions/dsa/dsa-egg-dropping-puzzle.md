---
slug: dsa-egg-dropping-puzzle
title: "Egg Dropping Puzzle"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [dp]
est_minutes: 30
tags: [dp, binary-search, classic, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/egg-dropping-puzzle
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      1 2
    expectedOutput: |
      2
    description: "1 egg, 2 floors requires 2 linear drops"
  - name: "Sample 2"
    input: |
      2 10
    expectedOutput: |
      4
    description: "2 eggs, 10 floors requires 4 attempts"
hiddenTests:
  - name: "Classic 2 Eggs 100 Floors"
    input: |
      2 100
    expectedOutput: |
      14
    weight: 50
  - name: "3 Eggs 14 Floors"
    input: |
      3 14
    expectedOutput: |
      4
    weight: 50
hints:
  - "With 1 egg, you must test floors linearly from bottom to top (K attempts)."
  - "With E eggs and F floors, dropping from floor x gives: 1 + max(eggBreaks[E-1, x-1], eggSurvives[E, F-x])."
  - "Alternatively, compute the maximum floors testable with M moves and E eggs: dp[M][E] = dp[M-1][E-1] + dp[M-1][E] + 1."
constraints:
  - "1 <= N <= 200 (number of eggs)"
  - "1 <= K <= 200 (number of floors)"
coaching:
  presentationTips:
    - "Explain the worst-case minimization objective (minimax recurrence)."
    - "Highlight the dual perspective: 'find max floors with M moves' which converts O(N * K^2) to O(N * K)."
  approachHint: "DP with dual state: moves vs eggs."
editorial: |
  ### Egg Dropping Puzzle
  Let `dp[m][e]` be the maximum floors we can test using `m` moves and `e` eggs.
  When an egg is dropped from a floor:
  - If it breaks, we can test `dp[m-1][e-1]` floors below.
  - If it survives, we can test `dp[m-1][e]` floors above.
  - Total floors tested: `dp[m][e] = dp[m-1][e-1] + dp[m-1][e] + 1`.
  We increment `m` until `dp[m][n] >= k`.
  - **Time Complexity:** O(N * K)
  - **Space Complexity:** O(N * K)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement egg dropping puzzle
      public static int eggDrop(int n, int k) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), k = sc.nextInt();
          System.out.println(eggDrop(n, k));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int eggDrop(int n, int k) {
          int[][] dp = new int[k + 1][n + 1];
          int m = 0;

          while (dp[m][n] < k) {
              m++;
              for (int e = 1; e <= n; e++) {
                  dp[m][e] = dp[m - 1][e - 1] + dp[m - 1][e] + 1;
              }
          }
          return m;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int k = sc.nextInt();
          System.out.println(eggDrop(n, k));
      }
  }
---

### Egg Dropping Puzzle

You are given `N` identical eggs and you have access to a building with `K` floors labeled `1` to `K`. There exists a critical floor `f` (`0 <= f <= K`) such that any egg dropped from a floor higher than `f` will break, and any egg dropped from or below floor `f` will not break.

When an egg breaks, it cannot be used again. If an egg does not break, it can be dropped again. Find the minimum number of attempts you need in the worst case to determine the critical floor `f` with certainty.

#### Input Format:
- Line 1: Two space-separated integers `N` and `K` representing eggs and floors.

#### Output Format:
- Print a single integer representing the minimum attempts needed in the worst case.

#### Constraints:
- `1 <= N <= 200`
- `1 <= K <= 200`
