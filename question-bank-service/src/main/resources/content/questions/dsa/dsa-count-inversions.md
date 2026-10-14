---
slug: dsa-count-inversions
title: "Count Inversions"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays, recursion]
est_minutes: 30
tags: [arrays, divide-and-conquer, merge-sort, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/count-inversions
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      5
      2 4 1 3 5
    expectedOutput: |
      3
    description: "Inversion pairs: (2,1), (4,1), (4,3)"
  - name: "Sample 2"
    input: |
      5
      2 3 4 5 6
    expectedOutput: |
      0
    description: "Already sorted array"
hiddenTests:
  - name: "Identical Elements"
    input: |
      3
      10 10 10
    expectedOutput: |
      0
    weight: 50
  - name: "Reverse Sorted Array"
    input: |
      5
      5 4 3 2 1
    expectedOutput: |
      10
    weight: 50
hints:
  - "An inversion occurs when i < j and arr[i] > arr[j]."
  - "Modify Merge Sort: during the merge step, when an element from the right half is smaller than the left half, all remaining elements in the left half form inversions with it."
constraints:
  - "1 <= N <= 10^5"
  - "1 <= arr[i] <= 10^9"
coaching:
  presentationTips:
    - "Note that inversion count can exceed 32-bit integer capacity (use long)."
    - "Explain the O(N log N) merge sort modification over O(N^2) brute force."
  approachHint: "Merge Sort with inversion count tracking."
editorial: |
  ### Count Inversions
  Using modified Merge Sort:
  1. Divide array into left and right halves.
  2. Recursively count inversions in both halves.
  3. In the merge step, if `arr[i] > arr[j]` (where `i` is in left half, `j` in right half), then all elements from `i` to `mid` are greater than `arr[j]`. Add `(mid - i + 1)` to the count.
  - **Time Complexity:** O(N log N)
  - **Space Complexity:** O(N) auxiliary space.
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement inversion count using merge sort
      public static long inversionCount(long[] arr, int n) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          long[] arr = new long[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextLong();
          System.out.println(inversionCount(arr, n));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      private static long mergeAndCount(long[] arr, long[] temp, int left, int mid, int right) {
          int i = left, j = mid + 1, k = left;
          long invCount = 0;

          while (i <= mid && j <= right) {
              if (arr[i] <= arr[j]) {
                  temp[k++] = arr[i++];
              } else {
                  temp[k++] = arr[j++];
                  invCount += (mid - i + 1);
              }
          }

          while (i <= mid) temp[k++] = arr[i++];
          while (j <= right) temp[k++] = arr[j++];

          for (i = left; i <= right; i++) {
              arr[i] = temp[i];
          }

          return invCount;
      }

      private static long mergeSortAndCount(long[] arr, long[] temp, int left, int right) {
          long invCount = 0;
          if (left < right) {
              int mid = left + (right - left) / 2;
              invCount += mergeSortAndCount(arr, temp, left, mid);
              invCount += mergeSortAndCount(arr, temp, mid + 1, right);
              invCount += mergeAndCount(arr, temp, left, mid, right);
          }
          return invCount;
      }

      public static long inversionCount(long[] arr, int n) {
          long[] temp = new long[n];
          return mergeSortAndCount(arr, temp, 0, n - 1);
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          long[] arr = new long[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextLong();
          System.out.println(inversionCount(arr, n));
      }
  }
---

### Count Inversions

Given an array of integers `arr` of size `N`. Find the Inversion Count of the array. Two elements `arr[i]` and `arr[j]` form an inversion if `arr[i] > arr[j]` and `i < j`.

Inversion Count indicates how far (or close) the array is from being sorted. If the array is already sorted, the inversion count is 0. If it is sorted in reverse order, the inversion count is maximum.

#### Input Format:
- Line 1: An integer `N` representing the size of the array.
- Line 2: `N` space-separated integers representing array elements.

#### Output Format:
- Print a single integer representing the total inversion count.

#### Constraints:
- `1 <= N <= 10^5`
- `1 <= arr[i] <= 10^9`
