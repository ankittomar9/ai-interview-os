---
slug: dsa-trapping-rain-water
title: Elevation Map Rainwater Retention
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags: [two-pointers, dynamic-programming, stack, monotonic-stack]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/trapping-rain-water
status: PUBLISHED
sampleTests:
  - name: "Standard Elevation Map"
    input: "12\n0 1 0 2 1 0 1 3 2 1 2 1"
    expectedOutput: "6"
  - name: "V-Shape Profile"
    input: "6\n4 2 0 3 2 5"
    expectedOutput: "9"
hiddenTests:
  - name: "Flat or strictly decreasing (0 water)"
    input: "4\n3 2 1 0"
    expectedOutput: "0"
    weight: 30
  - name: "Single basin"
    input: "3\n2 0 2"
    expectedOutput: "2"
    weight: 70
hints:
  - "Use two pointers left and right, maintaining leftMax and rightMax."
constraints:
  - "1 <= height.length <= 2 * 10^4"
  - "0 <= height[i] <= 10^5"
editorial: |
  ### Two Pointer Water Trapping
  The water trapped at index `i` is `min(max_left, max_right) - height[i]`. We can process inwards from the smaller boundary.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement trapping rain water
      public static int trap(int[] height) { return 0; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), height[] = new int[n];
          for (int i = 0; i < n; i++) height[i] = sc.nextInt();
          System.out.println(trap(height));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] height = new int[n];
          for (int i = 0; i < n; i++) height[i] = sc.nextInt();

          int left = 0, right = n - 1;
          int leftMax = 0, rightMax = 0, totalWater = 0;

          while (left < right) {
              if (height[left] < height[right]) {
                  if (height[left] >= leftMax) {
                      leftMax = height[left];
                  } else {
                      totalWater += leftMax - height[left];
                  }
                  left++;
              } else {
                  if (height[right] >= rightMax) {
                      rightMax = height[right];
                  } else {
                      totalWater += rightMax - height[right];
                  }
                  right--;
              }
          }
          System.out.println(totalWater);
      }
  }
---
### Elevation Map Rainwater Retention
Given `N` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.
