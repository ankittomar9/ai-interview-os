---
slug: dsa-find-minimum-in-rotated-sorted-array
title: Find Minimum in Rotated Sorted Array
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [binary-search, arrays]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/binary-search-rotated
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: "5\n3 4 5 1 2"
    expectedOutput: "1"
  - name: "Sample 2"
    input: "7\n4 5 6 7 0 1 2"
    expectedOutput: "0"
hiddenTests:
  - name: "Single element"
    input: "1\n10"
    expectedOutput: "10"
    weight: 20
  - name: "No rotation"
    input: "4\n11 13 15 17"
    expectedOutput: "11"
    weight: 80
hints:
  - "Compare mid element with right element: if nums[mid] > nums[right], the minimum is in the right half."
editorial: |
  ### Binary Search on Inflection Point
  Whenever `nums[mid] > nums[right]`, we know the pivot/minimum lies strictly in `mid + 1 .. right`.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement find minimum in rotated sorted array
      public static int findMin(int[] nums) { return 0; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), nums[] = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
          System.out.println(findMin(nums));
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

          int left = 0, right = n - 1;
          while (left < right) {
              int mid = left + (right - left) / 2;
              if (nums[mid] > nums[right]) {
                  left = mid + 1;
              } else {
                  right = mid;
              }
          }
          System.out.println(nums[left]);
      }
  }
---
### Find Minimum in Rotated Sorted Array
Suppose an array of unique integers sorted in ascending order is rotated between `1` and `N` times. Find and print the minimum element in `O(log N)` time.
