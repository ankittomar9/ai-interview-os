---
slug: dsa-insert-interval-sorted
title: Insert and Merge Disjoint Interval
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [intervals, arrays, linear-scan]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/insert-interval
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: "2\n1 3\n6 9\n2 5"
    expectedOutput: "1 5\n6 9"
  - name: "Sample 2"
    input: "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8"
    expectedOutput: "1 2\n3 10\n12 16"
hiddenTests:
  - name: "Insert at beginning"
    input: "1\n5 7\n1 2"
    expectedOutput: "1 2\n5 7"
    weight: 50
  - name: "Insert at end"
    input: "1\n1 2\n5 6"
    expectedOutput: "1 2\n5 6"
    weight: 50
hints:
  - "Process in 3 steps: intervals before newInterval, overlapping intervals merged into newInterval, intervals after newInterval."
editorial: |
  ### 3-Stage Linear Pass
  Scan intervals in a single O(N) pass: add all before, merge all overlapping into newInterval, then add all remaining.
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[][] intervals = new int[n][2];
          for (int i = 0; i < n; i++) {
              intervals[i][0] = sc.nextInt();
              intervals[i][1] = sc.nextInt();
          }
          int newStart = sc.nextInt();
          int newEnd = sc.nextInt();

          List<int[]> result = new ArrayList<>();
          int i = 0;

          // 1. Add all intervals before newInterval
          while (i < n && intervals[i][1] < newStart) {
              result.add(intervals[i++]);
          }

          // 2. Merge all overlapping intervals
          while (i < n && intervals[i][0] <= newEnd) {
              newStart = Math.min(newStart, intervals[i][0]);
              newEnd = Math.max(newEnd, intervals[i][1]);
              i++;
          }
          result.add(new int[]{newStart, newEnd});

          // 3. Add remaining intervals
          while (i < n) {
              result.add(intervals[i++]);
          }

          for (int[] r : result) {
              System.out.println(r[0] + " " + r[1]);
          }
      }
  }
---
### Insert and Merge Disjoint Interval
Given a set of non-overlapping sorted intervals and a new interval to insert, insert and merge if necessary, preserving sorted order.
