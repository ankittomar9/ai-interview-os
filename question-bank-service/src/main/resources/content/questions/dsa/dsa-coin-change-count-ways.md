---
slug: dsa-coin-change-count-ways
title: "Coin Change - Count Total Ways"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [dp]
est_minutes: 25
tags: [dp, combinations, unbounded-knapsack, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/coin-change-count-ways
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      3 4
      1 2 3
    expectedOutput: |
      4
    description: "4 combinations: {1,1,1,1}, {1,1,2}, {2,2}, {1,3}"
  - name: "Sample 2"
    input: |
      4 10
      2 5 3 6
    expectedOutput: |
      5
    description: "5 combinations summing to 10"
hiddenTests:
  - name: "Prime Target"
    input: |
      3 5
      1 2 5
    expectedOutput: |
      4
    weight: 50
  - name: "Impossible Target"
    input: |
      1 5
      2
    expectedOutput: |
      0
    weight: 50
hints:
  - "This is the unbounded knapsack problem for counting combinations."
  - "Use a 1D DP table of size sum + 1 where dp[j] accumulates ways using each coin."
constraints:
  - "1 <= N <= 300"
  - "1 <= sum <= 5000"
  - "1 <= coins[i] <= 5000"
coaching:
  presentationTips:
    - "Clarify whether combinations or permutations are required (order does not matter)."
    - "Iterating coins on the outer loop guarantees combination counting without permutations."
  approachHint: "1D dynamic programming with coins on outer loop."
editorial: |
  ### Coin Change - Count Total Ways
  To count combinations (where order of coins does not matter), iterate over coins in the outer loop and target values `j` from `coin` to `sum` in the inner loop.
  Maintain `dp[j] += dp[j - coin]`, with base case `dp[0] = 1`.
  - **Time Complexity:** O(N * sum)
  - **Space Complexity:** O(sum)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement coin change count combinations
      public static long count(int[] coins, int n, int sum) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), sum = sc.nextInt();
          int[] coins = new int[n];
          for (int i = 0; i < n; i++) coins[i] = sc.nextInt();
          System.out.println(count(coins, n, sum));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static long count(int[] coins, int n, int sum) {
          long[] dp = new long[sum + 1];
          dp[0] = 1;

          for (int i = 0; i < n; i++) {
              int coin = coins[i];
              for (int j = coin; j <= sum; j++) {
                  dp[j] += dp[j - coin];
              }
          }
          return dp[sum];
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int sum = sc.nextInt();
          int[] coins = new int[n];
          for (int i = 0; i < n; i++) coins[i] = sc.nextInt();
          System.out.println(count(coins, n, sum));
      }
  }
---

### Coin Change - Count Total Ways

Given an integer array of coin denominations `coins` of size `N` and a target value `sum`, find the total number of distinct combinations of coins that make up `sum`. You have an infinite supply of each coin denomination.

#### Input Format:
- Line 1: Two integers `N` and `sum`.
- Line 2: `N` space-separated integers representing coin denominations.

#### Output Format:
- Print a single integer representing the number of ways to make the target sum.

#### Constraints:
- `1 <= N <= 300`
- `1 <= sum <= 5000`
- `1 <= coins[i] <= 5000`
