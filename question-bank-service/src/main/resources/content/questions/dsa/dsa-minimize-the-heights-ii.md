---
slug: dsa-minimize-the-heights-ii
title: "Minimize the Heights II"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays, greedy]
est_minutes: 25
tags: [arrays, greedy, sorting, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/minimize-the-heights-ii
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      2 4
      1 5 8 10
    expectedOutput: |
      5
    description: "Towers become {3, 3, 6, 8}, diff = 8 - 3 = 5"
  - name: "Sample 2"
    input: |
      3 5
      3 9 12 16 20
    expectedOutput: |
      11
    description: "Min difference is 11"
hiddenTests:
  - name: "Large Array Sample"
    input: |
      5 10
      2 6 3 4 7 2 10 3 2 1
    expectedOutput: |
      7
    weight: 50
  - name: "Two Towers"
    input: |
      1 2
      1 2
    expectedOutput: |
      1
    weight: 50
hints:
  - "Sort the array first. Initially, ans = arr[n-1] - arr[0]."
  - "Consider each partition index i: increase arr[0..i-1] by K and decrease arr[i..n-1] by K."
  - "Ensure that subtracting K does not make a tower height negative."
constraints:
  - "1 <= K <= 10^4"
  - "1 <= N <= 10^5"
  - "1 <= arr[i] <= 10^5"
coaching:
  presentationTips:
    - "Explain why sorting guarantees that towers 0..i-1 are increased and i..n-1 are decreased."
    - "Detail why any tower with arr[i] < K cannot be decreased."
  approachHint: "Sort array and evaluate split points greedily."
editorial: |
  ### Minimize the Heights II
  1. Sort `arr`. Initial difference `diff = arr[n-1] - arr[0]`.
  2. Smallest possible value will be `arr[0] + k`, largest will be `arr[n-1] - k`.
  3. For each `i` from 1 to `n-1`:
     - If `arr[i] < k`, skipping since height cannot be negative.
     - New minimum: `minVal = min(arr[0] + k, arr[i] - k)`.
     - New maximum: `maxVal = max(arr[n-1] - k, arr[i-1] + k)`.
     - `diff = min(diff, maxVal - minVal)`.
  - **Time Complexity:** O(N log N)
  - **Space Complexity:** O(1)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement minimize the heights II
      public static int getMinDiff(int[] arr, int n, int k) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int k = sc.nextInt(), n = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          System.out.println(getMinDiff(arr, n, k));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int getMinDiff(int[] arr, int n, int k) {
          if (n <= 1) return 0;
          Arrays.sort(arr);

          int diff = arr[n - 1] - arr[0];

          for (int i = 1; i < n; i++) {
              if (arr[i] < k) continue;

              int minVal = Math.min(arr[0] + k, arr[i] - k);
              int maxVal = Math.max(arr[n - 1] - k, arr[i - 1] + k);

              diff = Math.min(diff, maxVal - minVal);
          }
          return diff;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int k = sc.nextInt(), n = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          System.out.println(getMinDiff(arr, n, k));
      }
  }
---

### Minimize the Heights II

Given an array `arr` denoting heights of `N` towers and a positive integer `K`.

For each tower, you must perform exactly one of the following operations exactly once:
- Increase the height of the tower by `K`.
- Decrease the height of the tower by `K` (only if the resulting height is non-negative).

Find the minimum possible difference between the height of the shortest and tallest towers after modifying every tower.

#### Input Format:
- Line 1: Two integers `K` and `N`.
- Line 2: `N` space-separated integers representing tower heights.

#### Output Format:
- Print a single integer representing the minimum possible difference.

#### Constraints:
- `1 <= K <= 10^4`
- `1 <= N <= 10^5`
- `1 <= arr[i] <= 10^5`
