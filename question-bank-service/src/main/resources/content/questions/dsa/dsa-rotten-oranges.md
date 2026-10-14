---
slug: dsa-rotten-oranges
title: "Rotten Oranges"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [graphs, matrix]
est_minutes: 25
tags: [graphs, matrix, multi-source-bfs, queue, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/rotten-oranges
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      3 3
      2 1 1
      1 1 0
      0 1 1
    expectedOutput: |
      4
    description: "4 time units for all oranges to rot"
  - name: "Sample 2"
    input: |
      3 3
      2 1 1
      0 1 1
      1 0 1
    expectedOutput: |
      -1
    description: "Orange at (2,0) cannot be reached (-1)"
hiddenTests:
  - name: "No Fresh Oranges Initially"
    input: |
      1 2
      0 2
    expectedOutput: |
      0
    weight: 50
  - name: "Single Adjacent Rotten"
    input: |
      1 2
      2 1
    expectedOutput: |
      1
    weight: 50
hints:
  - "Use Multi-Source Breadth-First Search (BFS)."
  - "Initialize the queue with all initially rotten oranges (value 2) and count initial fresh oranges."
  - "Each level of BFS represents 1 minute of rotting adjacent fresh oranges in 4 directions."
  - "If fresh count > 0 after queue is empty, return -1."
constraints:
  - "1 <= R, C <= 500"
  - "grid[i][j] is 0, 1, or 2"
coaching:
  presentationTips:
    - "Explain why multi-source BFS simulates parallel rotting across time steps."
    - "Detail tracking fresh orange count to verify all oranges rotted without scanning matrix again."
  approachHint: "Multi-Source BFS queue level-by-level."
editorial: |
  ### Rotten Oranges
  1. Count all fresh oranges (`grid[r][c] == 1`) and enqueue all rotten oranges (`grid[r][c] == 2`).
  2. If fresh count == 0, return 0 immediately.
  3. Process BFS in levels:
     - For each node at current level, check 4 neighbors `(dr, dc)`.
     - If a neighbor is fresh (`1`), mark it rotten (`2`), decrement fresh count, and enqueue.
     - If any new orange was rotted in this level, increment elapsed minutes.
  4. If fresh count == 0, return elapsed minutes, otherwise return `-1`.
  - **Time Complexity:** O(R * C)
  - **Space Complexity:** O(R * C)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement rotten oranges multi-source BFS
      public static int orangesRotting(int[][] grid, int r, int c) {
          return -1;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int r = sc.nextInt(), c = sc.nextInt();
          int[][] grid = new int[r][c];
          for (int i = 0; i < r; i++)
              for (int j = 0; j < c; j++)
                  grid[i][j] = sc.nextInt();
          System.out.println(orangesRotting(grid, r, c));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int orangesRotting(int[][] grid, int r, int c) {
          Queue<int[]> q = new LinkedList<>();
          int fresh = 0;

          for (int i = 0; i < r; i++) {
              for (int j = 0; j < c; j++) {
                  if (grid[i][j] == 2) {
                      q.offer(new int[]{i, j});
                  } else if (grid[i][j] == 1) {
                      fresh++;
                  }
              }
          }

          if (fresh == 0) return 0;

          int minutes = 0;
          int[] dr = {-1, 1, 0, 0};
          int[] dc = {0, 0, -1, 1};

          while (!q.isEmpty()) {
              int size = q.size();
              boolean rottedAny = false;

              for (int i = 0; i < size; i++) {
                  int[] curr = q.poll();
                  int cr = curr[0];
                  int cc = curr[1];

                  for (int d = 0; d < 4; d++) {
                      int nr = cr + dr[d];
                      int nc = cc + dc[d];
                      if (nr >= 0 && nr < r && nc >= 0 && nc < c && grid[nr][nc] == 1) {
                          grid[nr][nc] = 2;
                          fresh--;
                          rottedAny = true;
                          q.offer(new int[]{nr, nc});
                      }
                  }
              }
              if (rottedAny) minutes++;
          }

          return fresh == 0 ? minutes : -1;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int r = sc.nextInt(), c = sc.nextInt();
          int[][] grid = new int[r][c];
          for (int i = 0; i < r; i++)
              for (int j = 0; j < c; j++)
                  grid[i][j] = sc.nextInt();
          System.out.println(orangesRotting(grid, r, c));
      }
  }
---

### Rotten Oranges

Given an `R x C` grid where each cell has one of the following three values:
- `0`: Empty cell
- `1`: Fresh orange
- `2`: Rotten orange

Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.

Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible (some fresh oranges cannot be reached), return `-1`.

#### Input Format:
- Line 1: Two space-separated integers `R` and `C`.
- Next `R` lines: `C` space-separated integers (0, 1, or 2).

#### Output Format:
- Print a single integer representing the minimum elapsed minutes, or `-1` if impossible.

#### Constraints:
- `1 <= R, C <= 500`
- `grid[i][j]` is 0, 1, or 2.
