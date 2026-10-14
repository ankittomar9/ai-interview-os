---
slug: dsa-tower-of-hanoi
title: "Tower of Hanoi"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [recursion, math]
est_minutes: 15
tags: [recursion, math, classic, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/tower-of-hanoi
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      2
    expectedOutput: |
      3
    description: "2^2 - 1 = 3 moves"
  - name: "Sample 2"
    input: |
      3
    expectedOutput: |
      7
    description: "2^3 - 1 = 7 moves"
hiddenTests:
  - name: "Single Disk"
    input: |
      1
    expectedOutput: |
      1
    weight: 50
  - name: "10 Disks"
    input: |
      10
    expectedOutput: |
      1023
    weight: 50
hints:
  - "Moving N disks requires moving N-1 disks to auxiliary rod, moving 1 disk to target rod, and moving N-1 disks to target rod."
  - "Recurrence: T(N) = 2*T(N-1) + 1 = 2^N - 1."
constraints:
  - "1 <= N <= 30"
coaching:
  presentationTips:
    - "Formulate the recursive divide-and-conquer steps clearly."
    - "Derive the closed mathematical formula 2^N - 1."
  approachHint: "Recursive divide-and-conquer or 2^N - 1."
editorial: |
  ### Tower of Hanoi
  To move `N` disks from rod `from` to rod `to` using `aux`:
  1. Move `N-1` disks from `from` to `aux`.
  2. Move the N-th disk from `from` to `to`.
  3. Move `N-1` disks from `aux` to `to`.
  Total moves: `2^N - 1`.
  - **Time Complexity:** O(1) (or O(2^N) to print steps)
  - **Space Complexity:** O(1)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement tower of hanoi move count
      public static long toh(int n) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          System.out.println(toh(n));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static long toh(int n) {
          return (1L << n) - 1;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          System.out.println(toh(n));
      }
  }
---

### Tower of Hanoi

The Tower of Hanoi is a mathematical puzzle where we have three rods and `N` disks. The objective of the puzzle is to move the entire stack of disks from rod 1 to rod 3, obeying the following simple rules:
1. Only one disk can be moved at a time.
2. Each move consists of taking the upper disk from one of the stacks and placing it on top of another stack or on an empty rod.
3. No larger disk may be placed on top of a smaller disk.

Calculate the minimum number of moves required to solve the puzzle for `N` disks.

#### Input Format:
- Line 1: An integer `N` representing the number of disks.

#### Output Format:
- Print a single integer representing the total minimum moves.

#### Constraints:
- `1 <= N <= 30`
