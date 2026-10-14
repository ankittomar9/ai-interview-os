---
slug: dsa-stock-buy-and-sell
title: "Stock Buy and Sell - Maximum Profit"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays, greedy]
est_minutes: 20
tags: [arrays, greedy, dynamic-programming, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/stock-buy-and-sell
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      7
      100 180 260 310 40 535 695
    expectedOutput: |
      865
    description: "Multiple transactions: (310-100) + (695-40) = 210 + 655 = 865"
  - name: "Sample 2"
    input: |
      5
      4 2 2 2 4
    expectedOutput: |
      2
    description: "Single upward jump"
hiddenTests:
  - name: "Decreasing Prices"
    input: |
      5
      5 4 3 2 1
    expectedOutput: |
      0
    weight: 50
  - name: "Strictly Increasing Prices"
    input: |
      5
      1 2 3 4 5
    expectedOutput: |
      4
    weight: 50
hints:
  - "You can buy and sell multiple times. Whenever price[i] > price[i-1], you can harvest that daily gain."
  - "Sum all positive differences: profit += (price[i] - price[i-1])."
constraints:
  - "1 <= N <= 10^5"
  - "0 <= price[i] <= 10^4"
coaching:
  presentationTips:
    - "Contrast multiple transactions with single transaction (Kadane vs Greedy peak-valley accumulation)."
    - "Explain why summing all local uptrends equals the total maximum profit."
  approachHint: "Greedy local peak-valley accumulation."
editorial: |
  ### Stock Buy and Sell (Multiple Transactions)
  Because you can transact on any number of days, the total maximum profit is the sum of every upward slope:
  `profit = sum(max(0, price[i] - price[i-1]))` for all `1 <= i < N`.
  - **Time Complexity:** O(N)
  - **Space Complexity:** O(1)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement stock buy and sell maximum profit
      public static int maxProfit(int[] prices, int n) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] prices = new int[n];
          for (int i = 0; i < n; i++) prices[i] = sc.nextInt();
          System.out.println(maxProfit(prices, n));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int maxProfit(int[] prices, int n) {
          int totalProfit = 0;
          for (int i = 1; i < n; i++) {
              if (prices[i] > prices[i - 1]) {
                  totalProfit += (prices[i] - prices[i - 1]);
              }
          }
          return totalProfit;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] prices = new int[n];
          for (int i = 0; i < n; i++) prices[i] = sc.nextInt();
          System.out.println(maxProfit(prices, n));
      }
  }
---

### Stock Buy and Sell - Maximum Profit

The cost of stock on each day is given in an array `price` of size `N`. Find the maximum profit you can earn by buying and selling stocks on different days. You may make as many transactions as you like (i.e., buy one and sell one share of the stock multiple times), but you must sell the stock before you can buy again.

#### Input Format:
- Line 1: An integer `N` representing the number of days.
- Line 2: `N` space-separated integers representing the stock prices.

#### Output Format:
- Print a single integer representing the maximum total profit.

#### Constraints:
- `1 <= N <= 10^5`
- `0 <= price[i] <= 10^4`
