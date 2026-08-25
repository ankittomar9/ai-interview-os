---
slug: dsa-merge-overlapping-intervals
title: Merge Overlapping Time Intervals
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [intervals, sorting, greedy]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/merge-intervals
status: PUBLISHED
sampleTests:
  - name: "Sample 4 intervals"
    input: "4\n1 3\n2 6\n8 10\n15 18"
    expectedOutput: "1 6\n8 10\n15 18"
  - name: "Nested interval"
    input: "2\n1 4\n4 5"
    expectedOutput: "1 5"
hiddenTests:
  - name: "Single interval"
    input: "1\n5 10"
    expectedOutput: "5 10"
    weight: 20
  - name: "Fully enclosed intervals"
    input: "3\n1 10\n2 3\n4 8"
    expectedOutput: "1 10"
    weight: 80
hints:
  - "Sort intervals by start time. Merge with previous if current.start <= previous.end."
editorial: |
  ### Interval Sorting and Linear Scan
  Sort intervals by start time `O(N log N)`. If `interval[0] <= prev[1]`, merge by `prev[1] = max(prev[1], interval[1])`.
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

          Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));
          List<int[]> merged = new ArrayList<>();

          for (int[] interval : intervals) {
              if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < interval[0]) {
                  merged.add(new int[]{interval[0], interval[1]});
              } else {
                  merged.get(merged.size() - 1)[1] = Math.max(merged.get(merged.size() - 1)[1], interval[1]);
              }
          }

          for (int[] m : merged) {
              System.out.println(m[0] + " " + m[1]);
          }
      }
  }
---
### Merge Overlapping Time Intervals
Given an array of `N` meeting time intervals where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and print the non-overlapping intervals in sorted order.
