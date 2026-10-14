---
slug: dsa-find-the-number-of-islands
title: "Number of Islands"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [graphs, matrix]
est_minutes: 25
tags: [graphs, matrix, bfs, dfs, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/find-the-number-of-islands
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      4 5
      0 1 1 1 0
      0 0 0 1 0
      0 1 0 0 0
      1 0 1 1 0
    expectedOutput: |
      2
    description: "2 distinct 8-direction islands"
  - name: "Sample 2"
    input: |
      2 2
      0 1
      1 0
    expectedOutput: |
      1
    description: "Diagonally connected island"
hiddenTests:
  - name: "Diagonal Chain Island"
    input: |
      3 3
      1 0 0
      0 1 0
      0 0 1
    expectedOutput: |
      1
    weight: 50
  - name: "All Water Grid"
    input: |
      3 3
      0 0 0
      0 0 0
      0 0 0
    expectedOutput: |
      0
    weight: 50
hints:
  - "Traverse each cell of the grid. Whenever an unvisited '1' is found, increment island count and trigger BFS/DFS."
  - "Remember that connectivity extends to all 8 directions (horizontal, vertical, and diagonal)."
constraints:
  - "1 <= R, C <= 500"
  - "grid[i][j] is 0 or 1"
coaching:
  presentationTips:
    - "Highlight 8-directional exploration using delta arrays for row and column."
    - "Either maintain a visited matrix or mark visited cells directly as 0."
  approachHint: "BFS/DFS component counting with 8 directions."
editorial: |
  ### Number of Islands (8 Directions)
  Scan the grid cell by cell. When an unvisited land cell (`1`) is encountered:
  1. Increment the island count.
  2. Run BFS or DFS to visit all reachable land cells across 8 adjacent directions `[-1, 0, 1] x [-1, 0, 1]`.
  3. Mark visited cells as `0` or keep a `visited` boolean array.
  - **Time Complexity:** O(R * C)
  - **Space Complexity:** O(R * C) for queue/visited.
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement 8-directional island counting
      public static int numIslands(int[][] grid, int r, int c) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int r = sc.nextInt(), c = sc.nextInt();
          int[][] grid = new int[r][c];
          for (int i = 0; i < r; i++)
              for (int j = 0; j < c; j++)
                  grid[i][j] = sc.nextInt();
          System.out.println(numIslands(grid, r, c));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      private static void bfs(int startR, int startC, int[][] grid, boolean[][] visited, int r, int c) {
          Queue<int[]> q = new LinkedList<>();
          q.offer(new int[]{startR, startC});
          visited[startR][startC] = true;

          int[] dr = {-1, -1, -1, 0, 0, 1, 1, 1};
          int[] dc = {-1, 0, 1, -1, 1, -1, 0, 1};

          while (!q.isEmpty()) {
              int[] curr = q.poll();
              int cr = curr[0];
              int cc = curr[1];

              for (int d = 0; d < 8; d++) {
                  int nr = cr + dr[d];
                  int nc = cc + dc[d];
                  if (nr >= 0 && nr < r && nc >= 0 && nc < c && grid[nr][nc] == 1 && !visited[nr][nc]) {
                      visited[nr][nc] = true;
                      q.offer(new int[]{nr, nc});
                  }
              }
          }
      }

      public static int numIslands(int[][] grid, int r, int c) {
          boolean[][] visited = new boolean[r][c];
          int count = 0;

          for (int i = 0; i < r; i++) {
              for (int j = 0; j < c; j++) {
                  if (grid[i][j] == 1 && !visited[i][j]) {
                      count++;
                      bfs(i, j, grid, visited, r, c);
                  }
              }
          }
          return count;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int r = sc.nextInt(), c = sc.nextInt();
          int[][] grid = new int[r][c];
          for (int i = 0; i < r; i++)
              for (int j = 0; j < c; j++)
                  grid[i][j] = sc.nextInt();
          System.out.println(numIslands(grid, r, c));
      }
  }
---

### Number of Islands

Given a grid of size `R x C` consisting of 0s (Water) and 1s (Land). Find the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally, vertically, or diagonally (8 directions).

#### Input Format:
- Line 1: Two integers `R` and `C` representing rows and columns.
- Next `R` lines: `C` space-separated integers (0 or 1).

#### Output Format:
- Print a single integer representing the total number of connected islands.

#### Constraints:
- `1 <= R, C <= 500`
- `grid[i][j] is 0 or 1`
