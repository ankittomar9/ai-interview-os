---
slug: dsa-minimum-platforms
title: "Minimum Platforms"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays, greedy, heap]
est_minutes: 25
tags: [arrays, greedy, intervals, heap, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/minimum-platforms
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      6
      900 940 950 1100 1500 1800
      910 1200 1120 1130 1900 2000
    expectedOutput: |
      3
    description: "Peak overlap of 3 trains"
  - name: "Sample 2"
    input: |
      3
      900 1100 1235
      1000 1200 1240
    expectedOutput: |
      1
    description: "Sequential trains needing 1 platform"
hiddenTests:
  - name: "Same Arrival and Departure Boundary"
    input: |
      2
      100 200
      200 300
    expectedOutput: |
      2
    weight: 50
  - name: "Multiple Overlapping Trains"
    input: |
      4
      1000 935 1100 1500
      1020 1200 1130 1900
    expectedOutput: |
      2
    weight: 50
hints:
  - "Sort both arrival and departure arrays independently."
  - "Use a two-pointer approach or a Min-Heap of departure times to track platform occupancy."
constraints:
  - "1 <= N <= 50000"
  - "0 <= arr[i] <= dep[i] <= 2359"
  - "Arrival and departure times are represented in 24-hour military format (e.g. 940 for 09:40)."
coaching:
  presentationTips:
    - "Explain why sorting arrivals and departures separately is valid for counting active intervals."
    - "Mention that arrival time equal to departure time requires separate platforms."
  approachHint: "Sort both arrays and simulate events linearly."
editorial: |
  ### Minimum Platforms
  Sort arrival array `arr` and departure array `dep`. Maintain two pointers `i = 1` and `j = 0` (or a Min-Heap of departures).
  If `arr[i] <= dep[j]`, a new platform is needed because a train arrives before the previous train departs; increment platform count. Otherwise, a platform is freed; increment `j`.
  Keep track of the maximum platforms required at any moment.
  - **Time Complexity:** O(N log N)
  - **Space Complexity:** O(1) auxiliary space (or O(N) for sorting/heap).
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement minimum platforms calculation
      public static int findPlatform(int[] arr, int[] dep, int n) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          int[] dep = new int[n];
          for (int i = 0; i < n; i++) dep[i] = sc.nextInt();
          System.out.println(findPlatform(arr, dep, n));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int findPlatform(int[] arr, int[] dep, int n) {
          if (n <= 0) return 0;
          Arrays.sort(arr);
          Arrays.sort(dep);

          int platforms = 1;
          int maxPlatforms = 1;
          int i = 1, j = 0;

          while (i < n && j < n) {
              // If arrival <= departure, train arrives before or at departure -> need platform
              if (arr[i] <= dep[j]) {
                  platforms++;
                  i++;
              } else {
                  platforms--;
                  j++;
              }
              if (platforms > maxPlatforms) {
                  maxPlatforms = platforms;
              }
          }
          return maxPlatforms;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          int[] dep = new int[n];
          for (int i = 0; i < n; i++) dep[i] = sc.nextInt();
          System.out.println(findPlatform(arr, dep, n));
      }
  }
---

### Minimum Platforms

Given arrival and departure times of all trains that reach a railway station, find the minimum number of platforms required for the railway station so that no train is kept waiting.

Consider that all trains arrive on the same day and depart on the same day. Arrival and departure times can never be identical for the same train, but arrival time of one train can equal the departure time of another. At any given instance of time, the same platform cannot be used for both arrival and departure simultaneously. In such cases, different platforms are required.

#### Input Format:
- Line 1: An integer `N` representing the number of trains.
- Line 2: `N` space-separated integers representing arrival times.
- Line 3: `N` space-separated integers representing departure times.

#### Output Format:
- Print a single integer representing the minimum number of platforms required.

#### Constraints:
- `1 <= N <= 50000`
- `0 <= arr[i] <= dep[i] <= 2359`
