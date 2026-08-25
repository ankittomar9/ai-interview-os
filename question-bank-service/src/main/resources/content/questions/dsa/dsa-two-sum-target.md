---
slug: dsa-two-sum-target
title: Target Sum Index Pair
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags: [arrays, hash-table, two-pointers]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/arrays-two-sum
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: "4 9\n2 7 11 15"
    expectedOutput: "0 1"
    description: "Standard pair at indices 0 and 1"
  - name: "Sample 2"
    input: "3 6\n3 2 4"
    expectedOutput: "1 2"
    description: "Pair at indices 1 and 2"
hiddenTests:
  - name: "Duplicate elements"
    input: "2 6\n3 3"
    expectedOutput: "0 1"
    weight: 25
  - name: "Negative integers"
    input: "4 -1\n-3 2 5 -4"
    expectedOutput: "0 1"
    weight: 25
  - name: "Larger array last two"
    input: "5 10\n1 2 3 4 6"
    expectedOutput: "3 4"
    weight: 50
hints:
  - "Use a hash map to store the complement (target - num) and its 0-based index as you iterate."
  - "This allows finding pairs in O(N) time with O(N) space."
coaching:
  presentationTips:
    - "Clarify if the array is guaranteed to have exactly one solution."
    - "State upfront why a hash map gives O(N) instead of O(N^2) brute force."
  approachHint: "Iterate through elements while checking if (target - num) exists in the map."
editorial: |
  ### Target Sum Index Pair
  We scan the array once using a Hash Map `num -> index`. For each item `x`, we check if `target - x` is already in the map.
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int target = sc.nextInt();
          int[] nums = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

          Map<Integer, Integer> map = new HashMap<>();
          for (int i = 0; i < n; i++) {
              int complement = target - nums[i];
              if (map.containsKey(complement)) {
                  System.out.println(map.get(complement) + " " + i);
                  return;
              }
              map.put(nums[i], i);
          }
      }
  }
---
### Target Sum Index Pair
Given an array of integers `nums` of size `N` and an integer `target`, find the two distinct indices such that their values sum to `target`.

Assume each input has exactly one valid answer, and you cannot use the same element twice. Print the smaller index first, followed by the larger index separated by a space.

#### Input Format:
- Line 1: Two integers `N` and `target`.
- Line 2: `N` space-separated integers representing `nums`.

#### Constraints:
- `2 <= N <= 10^5`
- `-10^9 <= nums[i], target <= 10^9`
