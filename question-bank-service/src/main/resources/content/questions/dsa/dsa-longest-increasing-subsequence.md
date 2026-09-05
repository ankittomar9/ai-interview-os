---
slug: dsa-longest-increasing-subsequence
title: Longest Increasing Subsequence Length
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [dynamic-programming, binary-search, patience-sorting]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/dp-lis
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: "8\n10 9 2 5 3 7 101 18"
    expectedOutput: "4"
  - name: "Strictly increasing"
    input: "4\n0 1 0 3"
    expectedOutput: "3"
hiddenTests:
  - name: "All identical elements"
    input: "5\n7 7 7 7 7"
    expectedOutput: "1"
    weight: 30
  - name: "Reverse sorted"
    input: "4\n4 3 2 1"
    expectedOutput: "1"
    weight: 70
hints:
  - "Maintain a tails array and binary search for each element to achieve O(N log N) time complexity."
editorial: |
  ### Patience Sorting with Binary Search
  Maintain a dynamic array of smallest tail elements of all increasing subsequences of various lengths.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement length of longest increasing subsequence
      public static int lengthOfLIS(int[] nums) { return 0; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), nums[] = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
          System.out.println(lengthOfLIS(nums));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] nums = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

          List<Integer> tails = new ArrayList<>();
          for (int x : nums) {
              int idx = Collections.binarySearch(tails, x);
              if (idx < 0) idx = -(idx + 1);
              if (idx == tails.size()) {
                  tails.add(x);
              } else {
                  tails.set(idx, x);
              }
          }
          System.out.println(tails.size());
      }
  }
---
### Longest Increasing Subsequence Length
Given an integer array `nums`, find the length of the longest strictly increasing subsequence.
