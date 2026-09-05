---
slug: dsa-search-in-rotated-sorted-array
title: Search Target in Rotated Sorted Array
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [binary-search, arrays]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/search-rotated
status: PUBLISHED
sampleTests:
  - name: "Found target"
    input: "7 0\n4 5 6 7 0 1 2"
    expectedOutput: "4"
  - name: "Not found target"
    input: "7 3\n4 5 6 7 0 1 2"
    expectedOutput: "-1"
hiddenTests:
  - name: "Single element found"
    input: "1 5\n5"
    expectedOutput: "0"
    weight: 30
  - name: "Target at boundary"
    input: "5 2\n3 4 5 1 2"
    expectedOutput: "4"
    weight: 70
hints:
  - "At every binary search step, at least one half (left or right) is guaranteed to be normally sorted."
constraints:
  - "1 <= nums.length <= 5000"
  - "-10^4 <= nums[i] <= 10^4"
  - "All values of nums are unique."
  - "nums is guaranteed to be rotated at some pivot."
editorial: |
  ### Partitioned Binary Search
  Identify whether `left..mid` or `mid..right` is sorted. Check if `target` falls within the sorted portion.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement search in rotated sorted array
      public static int search(int[] nums, int target) { return -1; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), target = sc.nextInt(), nums[] = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
          System.out.println(search(nums, target));
      }
  }
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

          int left = 0, right = n - 1;
          while (left <= right) {
              int mid = left + (right - left) / 2;
              if (nums[mid] == target) {
                  System.out.println(mid);
                  return;
              }

              if (nums[left] <= nums[mid]) {
                  if (target >= nums[left] && target < nums[mid]) {
                      right = mid - 1;
                  } else {
                      left = mid + 1;
                  }
              } else {
                  if (target > nums[mid] && target <= nums[right]) {
                      left = mid + 1;
                  } else {
                      right = mid - 1;
                  }
              }
          }
          System.out.println("-1");
      }
  }
---
### Search Target in Rotated Sorted Array
Given an array of unique integers sorted in ascending order and rotated at an unknown pivot, find the 0-based index of `target`. If not found, print `-1`.
