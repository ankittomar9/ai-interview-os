---
slug: dsa-n-meetings-in-one-room
title: "N Meetings in One Room"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [greedy, arrays]
est_minutes: 20
tags: [greedy, intervals, sorting, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/n-meetings-in-one-room
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      6
      1 3 0 5 8 5
      2 4 6 7 9 9
    expectedOutput: |
      4
    description: "4 non-overlapping meetings: (1,2), (3,4), (5,7), (8,9)"
  - name: "Sample 2"
    input: |
      3
      10 12 20
      20 25 30
    expectedOutput: |
      1
    description: "Start time cannot equal end time of previous meeting"
hiddenTests:
  - name: "Single Meeting"
    input: |
      1
      1
      2
    expectedOutput: |
      1
    weight: 50
  - name: "Chain Meetings"
    input: |
      4
      1 2 3 4
      2 3 4 5
    expectedOutput: |
      2
    weight: 50
hints:
  - "Sort all meetings by their end times in ascending order."
  - "Always pick the meeting that finishes earliest, and only pick subsequent meetings whose start time is strictly greater than the previous meeting's end time."
constraints:
  - "1 <= N <= 10^5"
  - "0 <= start[i] < end[i] <= 10^5"
coaching:
  presentationTips:
    - "Explain why sorting by finish time is the optimal greedy strategy for interval scheduling."
    - "Clarify the strict inequality constraint (start > previous end)."
  approachHint: "Greedy interval scheduling sorted by finish time."
editorial: |
  ### N Meetings in One Room
  Interval scheduling problem:
  1. Pair each meeting with `(start[i], end[i])`.
  2. Sort meetings by `end` time ascending.
  3. Select the first meeting. For subsequent meetings, if `meeting.start > lastEnd`, include it and update `lastEnd = meeting.end`.
  - **Time Complexity:** O(N log N)
  - **Space Complexity:** O(N)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement max meetings in one room
      public static int maxMeetings(int n, int[] start, int[] end) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] start = new int[n];
          for (int i = 0; i < n; i++) start[i] = sc.nextInt();
          int[] end = new int[n];
          for (int i = 0; i < n; i++) end[i] = sc.nextInt();
          System.out.println(maxMeetings(n, start, end));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      static class Meeting {
          int start, end;
          Meeting(int s, int e) { start = s; end = e; }
      }

      public static int maxMeetings(int n, int[] start, int[] end) {
          Meeting[] meetings = new Meeting[n];
          for (int i = 0; i < n; i++) {
              meetings[i] = new Meeting(start[i], end[i]);
          }

          Arrays.sort(meetings, (a, b) -> Integer.compare(a.end, b.end));

          int count = 1;
          int lastEnd = meetings[0].end;

          for (int i = 1; i < n; i++) {
              if (meetings[i].start > lastEnd) {
                  count++;
                  lastEnd = meetings[i].end;
              }
          }
          return count;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[] start = new int[n];
          for (int i = 0; i < n; i++) start[i] = sc.nextInt();
          int[] end = new int[n];
          for (int i = 0; i < n; i++) end[i] = sc.nextInt();
          System.out.println(maxMeetings(n, start, end));
      }
  }
---

### N Meetings in One Room

You are given timings of `N` meetings in the form of `(start[i], end[i])` where `start[i]` is the start time of meeting `i` and `end[i]` is the finish time of meeting `i`. Return the maximum number of meetings that can be accommodated in a single meeting room, when only one meeting can be held in the meeting room at a particular time.

Note: The start time of one chosen meeting cannot be equal to or less than the end time of the other chosen meeting (i.e. `start > previous end`).

#### Input Format:
- Line 1: An integer `N` representing the number of meetings.
- Line 2: `N` space-separated integers representing the start times.
- Line 3: `N` space-separated integers representing the end times.

#### Output Format:
- Print a single integer representing the maximum number of meetings that can be held.

#### Constraints:
- `1 <= N <= 10^5`
- `0 <= start[i] < end[i] <= 10^5`
