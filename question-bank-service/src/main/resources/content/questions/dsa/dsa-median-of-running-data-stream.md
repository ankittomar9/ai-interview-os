---
slug: dsa-median-of-running-data-stream
title: Real-Time Running Stream Median
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags: [heap, priority-queue, streams, design]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/stream-median
status: PUBLISHED
sampleTests:
  - name: "Sample stream"
    input: "3\nadd 1\nadd 2\nfindMedian"
    expectedOutput: "1.5"
  - name: "Odd count median"
    input: "4\nadd 1\nadd 2\nadd 3\nfindMedian"
    expectedOutput: "2.0"
hiddenTests:
  - name: "Multiple interleaved operations"
    input: "6\nadd 5\nfindMedian\nadd 15\nfindMedian\nadd 1\nfindMedian"
    expectedOutput: "5.0\n10.0\n5.0"
    weight: 100
hints:
  - "Use two heaps: a Max-Heap for the lower half and a Min-Heap for the upper half."
editorial: |
  ### Dual Heap Stream Balancing
  Maintain maxHeap size >= minHeap size. The median is either the top of maxHeap (odd) or the average of both tops (even).
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int q = sc.nextInt();

          PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
          PriorityQueue<Integer> minHeap = new PriorityQueue<>();

          while (q-- > 0 && sc.hasNext()) {
              String op = sc.next();
              if ("add".equalsIgnoreCase(op)) {
                  int num = sc.nextInt();
                  maxHeap.offer(num);
                  minHeap.offer(maxHeap.poll());
                  if (maxHeap.size() < minHeap.size()) {
                      maxHeap.offer(minHeap.poll());
                  }
              } else if ("findMedian".equalsIgnoreCase(op)) {
                  if (maxHeap.size() > minHeap.size()) {
                      System.out.printf(Locale.US, "%.1f\n", (double) maxHeap.peek());
                  } else {
                      System.out.printf(Locale.US, "%.1f\n", (maxHeap.peek() + minHeap.peek()) / 2.0);
                  }
              }
          }
      }
  }
---
### Real-Time Running Stream Median
Design a data structure that continuously receives a stream of integers and computes the median in `O(log N)` per insertion and `O(1)` per query.
