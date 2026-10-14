---
slug: dsa-kth-smallest-element
title: "Kth Smallest Element"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [heap, binary-search]
est_minutes: 20
tags: [heap, quickselect, priority-queue, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/kth-smallest-element
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      6 3
      7 10 4 3 20 15
    expectedOutput: |
      7
    description: "Sorted: [3, 4, 7, 10, 15, 20], 3rd smallest is 7"
  - name: "Sample 2"
    input: |
      5 4
      7 10 4 20 15
    expectedOutput: |
      15
    description: "4th smallest is 15"
hiddenTests:
  - name: "Single Element"
    input: |
      1 1
      42
    expectedOutput: |
      42
    weight: 50
  - name: "First Smallest"
    input: |
      5 1
      12 3 5 7 19
    expectedOutput: |
      3
    weight: 50
hints:
  - "Use a Max-Heap of size K. When heap size exceeds K, evict the largest element."
  - "Alternatively, Quickselect provides O(N) average time complexity."
constraints:
  - "1 <= K <= N <= 10^5"
  - "1 <= arr[i] <= 10^5"
coaching:
  presentationTips:
    - "Discuss Max-Heap vs Min-Heap vs Quickselect trade-offs."
    - "Max-Heap of size K guarantees O(N log K) time and O(K) space."
  approachHint: "Max-Heap of size K or QuickSelect."
editorial: |
  ### Kth Smallest Element
  Maintain a Max-Heap of size `K`. For each element in `arr`:
  1. Push element into the Max-Heap.
  2. If heap size > `K`, remove the maximum element (top of the heap).
  After iterating through the array, the top of the heap is the K-th smallest element.
  - **Time Complexity:** O(N log K)
  - **Space Complexity:** O(K)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement Kth smallest element finder
      public static int kthSmallest(int[] arr, int n, int k) {
          return -1;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), k = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          System.out.println(kthSmallest(arr, n, k));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int kthSmallest(int[] arr, int n, int k) {
          PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
          for (int val : arr) {
              maxHeap.offer(val);
              if (maxHeap.size() > k) {
                  maxHeap.poll();
              }
          }
          return maxHeap.peek();
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), k = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          System.out.println(kthSmallest(arr, n, k));
      }
  }
---

### Kth Smallest Element

Given an array `arr` of `N` positive integers and an integer `K`. Find the `K`-th smallest element in the given array.

#### Input Format:
- Line 1: Two integers `N` and `K`.
- Line 2: `N` space-separated integers representing the array.

#### Output Format:
- Print a single integer representing the `K`-th smallest element.

#### Constraints:
- `1 <= K <= N <= 10^5`
- `1 <= arr[i] <= 10^5`
