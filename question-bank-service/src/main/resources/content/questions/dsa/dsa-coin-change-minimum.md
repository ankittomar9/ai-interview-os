---
slug: dsa-coin-change-minimum
title: Minimum Coin Combination Denominations
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [dynamic-programming, dp-tabulation, knapsack]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/dp-coin-change
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: "3 11\n1 2 5"
    expectedOutput: "3"
  - name: "Impossible amount"
    input: "1 3\n2"
    expectedOutput: "-1"
hiddenTests:
  - name: "Zero amount"
    input: "1 0\n1"
    expectedOutput: "0"
    weight: 20
  - name: "Large single coin match"
    input: "3 100\n1 25 50"
    expectedOutput: "2"
    weight: 80
hints:
  - "Build an array dp[0..amount] initialized to amount + 1. Set dp[0] = 0."
editorial: |
  ### Bottom-up Dynamic Programming
  For each amount `i` from 1 to `amount`, iterate over each coin: `dp[i] = min(dp[i], dp[i - coin] + 1)`.
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int amount = sc.nextInt();
          int[] coins = new int[n];
          for (int i = 0; i < n; i++) coins[i] = sc.nextInt();

          int[] dp = new int[amount + 1];
          Arrays.fill(dp, amount + 1);
          dp[0] = 0;

          for (int i = 1; i <= amount; i++) {
              for (int c : coins) {
                  if (i - c >= 0) {
                      dp[i] = Math.min(dp[i], dp[i - c] + 1);
                  }
              }
          }
          System.out.println(dp[amount] > amount ? -1 : dp[amount]);
      }
  }
---
### Minimum Coin Combination Denominations
Given an array of coin denominations `coins` and an integer `amount`, compute the fewest number of coins needed to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.
