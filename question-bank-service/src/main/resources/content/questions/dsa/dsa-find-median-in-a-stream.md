---
slug: dsa-find-median-in-a-stream
title: "Find Median in a Running Stream"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [heap, design]
est_minutes: 30
tags: [heap, priority-queue, stream, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/find-median-in-a-stream
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      4
      5 15 1 3
    expectedOutput: |
      5 10 5 4
    description: "Medians after 5, 15, 1, 3: [5, 10, 5, 4]"
  - name: "Sample 2"
    input: |
      3
      1 2 3
    expectedOutput: |
      1 1 2
    description: "Medians after 1, 2, 3: [1, 1, 2]"
hiddenTests:
  - name: "Single Stream Item"
    input: |
      1
      42
    expectedOutput: |
      42
    weight: 50
  - name: "Even and Odd Elements"
    input: |
      6
      12 4 5 3 8 7
    expectedOutput: |
      12 8 5 4 5 6
    weight: 50
hints:
  - "Use two heaps: a Max-Heap for the smaller half of numbers and a Min-Heap for the larger half."
  - "Balance the heaps so their sizes differ by at most 1."
  - "If even total numbers, median is the integer average of the tops; if odd, median is the top of the larger heap."
constraints:
  - "1 <= N <= 10^4"
  - "1 <= x <= 10^5"
coaching:
  presentationTips:
    - "Explain the two-heap invariant: max-heap holds lower half, min-heap holds upper half."
    - "Detail the balancing rebalance step ensuring size difference <= 1."
  approachHint: "Two Heaps (Max-Heap + Min-Heap)."
editorial: |
  ### Find Median in a Running Stream
  Maintain:
  - `maxHeap`: stores the smaller half of elements.
  - `minHeap`: stores the larger half of elements.
  For each incoming element `x`:
  1. If `maxHeap` is empty or `x <= maxHeap.peek()`, add `x` to `maxHeap`. Otherwise, add to `minHeap`.
  2. Balance heaps so `|maxHeap.size() - minHeap.size()| <= 1`.
  3. If sizes are equal, median = `(maxHeap.peek() + minHeap.peek()) / 2`.
     Else, median = peek of whichever heap has larger size.
  - **Time Complexity:** O(N log N)
  - **Space Complexity:** O(N)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement running median stream
      public static List<Integer> runningMedians(int[] nums, int n) {
          return new ArrayList<>();
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] nums = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
          List<Integer> res = runningMedians(nums, n);
          StringBuilder sb = new StringBuilder();
          for (int i = 0; i < res.size(); i++) {
              if (i > 0) sb.append(" ");
              sb.append(res.get(i));
          }
          System.out.println(sb.toString());
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static List<Integer> runningMedians(int[] nums, int n) {
          PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
          PriorityQueue<Integer> minHeap = new PriorityQueue<>();
          List<Integer> medians = new ArrayList<>();

          for (int x : nums) {
              if (maxHeap.isEmpty() || x <= maxHeap.peek()) {
                  maxHeap.offer(x);
              } else {
                  minHeap.offer(x);
              }

              // Balance
              if (maxHeap.size() > minHeap.size() + 1) {
                  minHeap.offer(maxHeap.poll());
              } else if (minHeap.size() > maxHeap.size() + 1) {
                  maxHeap.offer(minHeap.poll());
              }

              // Calculate median (floor integer division)
              if (maxHeap.size() == minHeap.size()) {
                  medians.add((maxHeap.peek() + minHeap.peek()) / 2);
              } else if (maxHeap.size() > minHeap.size()) {
                  medians.add(maxHeap.peek());
              } else {
                  medians.add(minHeap.peek());
              }
          }
          return medians;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] nums = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
          List<Integer> res = runningMedians(nums, n);
          StringBuilder sb = new StringBuilder();
          for (int i = 0; i < res.size(); i++) {
              if (i > 0) sb.append(" ");
              sb.append(res.get(i));
          }
          System.out.println(sb.toString());
      }
  }
---

### Find Median in a Running Stream

Given an input stream of `N` integers. The task is to insert these numbers into a new stream and find the median of the stream formed by each insertion of a new number in the stream.

If the number of elements is even, the median is the floor of the average of the two middle elements.

#### Input Format:
- Line 1: An integer `N` representing the number of elements.
- Line 2: `N` space-separated integers representing the data stream.

#### Output Format:
- Print `N` space-separated integers representing the running median after each insertion.

#### Constraints:
- `1 <= N <= 10^4`
- `1 <= x <= 10^5`
