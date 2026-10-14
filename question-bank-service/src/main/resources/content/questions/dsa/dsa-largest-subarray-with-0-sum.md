---
slug: dsa-largest-subarray-with-0-sum
title: "Largest Subarray with Zero Sum"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays, hashing]
est_minutes: 20
tags: [arrays, hash-map, prefix-sum, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/largest-subarray-with-0-sum
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      8
      15 -2 2 -8 1 7 10 23
    expectedOutput: |
      5
    description: "Subarray [-2, 2, -8, 1, 7] has sum 0 with length 5"
  - name: "Sample 2"
    input: |
      4
      1 2 3 4
    expectedOutput: |
      0
    description: "No subarray with sum 0"
hiddenTests:
  - name: "Entire Array Zero Sum"
    input: |
      3
      1 -1 0
    expectedOutput: |
      3
    weight: 50
  - name: "All Zeros Array"
    input: |
      5
      0 0 0 0 0
    expectedOutput: |
      5
    weight: 50
hints:
  - "Use a Hash Map to store the first occurrence of each cumulative prefix sum."
  - "If prefix sum S repeats at index i, the subarray from map[S] + 1 to i sums to 0."
  - "If cumulative sum itself is 0, the subarray from index 0 to i has sum 0."
constraints:
  - "1 <= N <= 10^5"
  - "-1000 <= arr[i] <= 1000"
coaching:
  presentationTips:
    - "Contrast O(N) hash map solution with O(N^2) brute force."
    - "Emphasize storing only the FIRST occurrence in the map to maximize subarray length."
  approachHint: "Prefix sum + HashMap storing earliest index."
editorial: |
  ### Largest Subarray with Zero Sum
  Maintain running prefix sum `sum` and a Hash Map storing `sum -> earliestIndex`.
  - If `sum == 0`, max length is `i + 1`.
  - If `sum` already exists in map, candidate length is `i - map.get(sum)`.
  - If `sum` is new, record `map.put(sum, i)`.
  - **Time Complexity:** O(N)
  - **Space Complexity:** O(N)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement largest subarray with zero sum
      public static int maxLen(int[] arr, int n) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          System.out.println(maxLen(arr, n));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int maxLen(int[] arr, int n) {
          Map<Integer, Integer> map = new HashMap<>();
          int sum = 0;
          int maxLen = 0;

          for (int i = 0; i < n; i++) {
              sum += arr[i];

              if (sum == 0) {
                  maxLen = i + 1;
              } else if (map.containsKey(sum)) {
                  maxLen = Math.max(maxLen, i - map.get(sum));
              } else {
                  map.put(sum, i);
              }
          }
          return maxLen;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          System.out.println(maxLen(arr, n));
      }
  }
---

### Largest Subarray with Zero Sum

Given an array having both positive and negative integers, compute the length of the largest subarray with sum equal to 0.

#### Input Format:
- Line 1: An integer `N` representing the array size.
- Line 2: `N` space-separated integers representing the array elements.

#### Output Format:
- Print a single integer representing the maximum length of a zero-sum subarray.

#### Constraints:
- `1 <= N <= 10^5`
- `-1000 <= arr[i] <= 1000`
