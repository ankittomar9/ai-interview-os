---
slug: dsa-kth-largest-element-stream
title: Kth Largest Element in Continuous Stream
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags: [heap, priority-queue, streams]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/kth-largest-stream
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: "3 4\n4 5 8 2\n4\nadd 3\nadd 5\nadd 10\nadd 9"
    expectedOutput: "4\n5\n5\n8"
hiddenTests:
  - name: "K=1 max element tracker"
    input: "1 2\n10 20\n2\nadd 5\nadd 30"
    expectedOutput: "20\n30"
    weight: 50
  - name: "K equals total elements"
    input: "2 2\n1 2\n1\nadd 3"
    expectedOutput: "2"
    weight: 50
hints:
  - "Maintain a Min-Heap of fixed size K. The root of the Min-Heap is always the K-th largest element."
editorial: |
  ### Min-Heap of Size K
  Keep exactly K elements in the heap. If heap size > K, remove the smallest element (`poll`). Root is the Kth largest.
starterCode: |
  import java.util.*;
  public class Main {
      static class KthLargest {
          public KthLargest(int k, int[] nums) {}
          public int add(int val) { return -1; } // TODO: implement
      }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int k = sc.nextInt(), n = sc.nextInt(), nums[] = new int[n];
          for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
          KthLargest kth = new KthLargest(k, nums);
          int q = sc.nextInt();
          while (q-- > 0 && sc.hasNextInt()) System.out.println(kth.add(sc.nextInt()));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int k = sc.nextInt();
          int n = sc.nextInt();
          PriorityQueue<Integer> minHeap = new PriorityQueue<>();

          for (int i = 0; i < n; i++) {
              minHeap.offer(sc.nextInt());
              if (minHeap.size() > k) minHeap.poll();
          }

          int q = sc.nextInt();
          while (q-- > 0 && sc.hasNext()) {
              String op = sc.next();
              int val = sc.nextInt();
              minHeap.offer(val);
              if (minHeap.size() > k) minHeap.poll();
              System.out.println(minHeap.peek());
          }
      }
  }
---
### Kth Largest Element in Continuous Stream
Design a class to find the `k`-th largest element in a stream of integers.
