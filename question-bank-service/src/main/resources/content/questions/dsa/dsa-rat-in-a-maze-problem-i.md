---
slug: dsa-rat-in-a-maze-problem-i
title: "Rat in a Maze"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [recursion, matrix]
est_minutes: 30
tags: [backtracking, recursion, matrix, dfs, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/rat-in-a-maze-problem-i
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      4
      1 0 0 0
      1 1 0 1
      0 1 0 0
      0 1 1 1
    expectedOutput: |
      DRDDRR
    description: "Standard 4x4 maze"
  - name: "Sample 2"
    input: |
      2
      1 0
      1 0
    expectedOutput: |
      -1
    description: "Blocked destination"
hiddenTests:
  - name: "Open 2x2 Maze"
    input: |
      2
      1 1
      1 1
    expectedOutput: |
      DR RD
    weight: 50
  - name: "Blocked Start Cell"
    input: |
      3
      0 1 1
      1 1 1
      1 1 1
    expectedOutput: |
      -1
    weight: 50
hints:
  - "Use recursion and backtracking to explore 4 directions: 'D', 'L', 'R', 'U'."
  - "Mark visited cells temporarily during recursion to avoid cycles, and unmark on backtrack."
  - "Explore in alphabetical order ('D', 'L', 'R', 'U') or sort the final paths."
constraints:
  - "2 <= N <= 10"
  - "m[i][j] is either 0 or 1"
coaching:
  presentationTips:
    - "Mention backtracking state cleanup (resetting visited cells)."
    - "State why checking bounds and cell value 0 up front prevents redundant recursive calls."
  approachHint: "DFS with visited boolean matrix and backtracking."
editorial: |
  ### Rat in a Maze
  Starting at `(0, 0)`, explore all 4 directions `(D, L, R, U)`. A move is valid if the cell is inside `N x N`, value is `1`, and it has not been visited on the current path.
  Collect path strings when reaching `(N-1, N-1)`. Sort paths lexicographically. If no path exists, print `-1`.
  - **Time Complexity:** O(4^(N^2))
  - **Space Complexity:** O(N^2) for recursion stack and visited array.
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement rat in a maze backtracking
      public static List<String> findPath(int[][] m, int n) {
          return new ArrayList<>();
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[][] m = new int[n][n];
          for (int i = 0; i < n; i++)
              for (int j = 0; j < n; j++)
                  m[i][j] = sc.nextInt();
          List<String> res = findPath(m, n);
          if (res.isEmpty()) {
              System.out.println("-1");
          } else {
              System.out.println(String.join(" ", res));
          }
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      private static void dfs(int r, int c, int[][] m, int n, boolean[][] visited, StringBuilder sb, List<String> res) {
          if (r == n - 1 && c == n - 1) {
              res.add(sb.toString());
              return;
          }

          int[] dr = {1, 0, 0, -1};
          int[] dc = {0, -1, 1, 0};
          char[] dir = {'D', 'L', 'R', 'U'};

          visited[r][c] = true;

          for (int i = 0; i < 4; i++) {
              int nr = r + dr[i];
              int nc = c + dc[i];
              if (nr >= 0 && nr < n && nc >= 0 && nc < n && m[nr][nc] == 1 && !visited[nr][nc]) {
                  sb.append(dir[i]);
                  dfs(nr, nc, m, n, visited, sb, res);
                  sb.deleteCharAt(sb.length() - 1);
              }
          }

          visited[r][c] = false;
      }

      public static List<String> findPath(int[][] m, int n) {
          List<String> res = new ArrayList<>();
          if (m[0][0] == 0 || m[n - 1][n - 1] == 0) return res;

          boolean[][] visited = new boolean[n][n];
          StringBuilder sb = new StringBuilder();
          dfs(0, 0, m, n, visited, sb, res);
          Collections.sort(res);
          return res;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int[][] m = new int[n][n];
          for (int i = 0; i < n; i++)
              for (int j = 0; j < n; j++)
                  m[i][j] = sc.nextInt();
          List<String> res = findPath(m, n);
          if (res.isEmpty()) {
              System.out.println("-1");
          } else {
              System.out.println(String.join(" ", res));
          }
      }
  }
---

### Rat in a Maze

Consider a rat placed at `(0, 0)` in a square matrix `m` of order `N x N`. It wants to reach the destination at `(N-1, N-1)`. Find all possible paths that the rat can take to reach from source to destination.

The directions in which the rat can move are `'U'` (up), `'D'` (down), `'L'` (left), `'R'` (right). Value 0 at a cell in the matrix represents that it is blocked and rat cannot move to it, while value 1 at a cell represents that rat can be on that cell. In a path, no cell can be visited more than once.

Print all paths separated by spaces in lexicographically increasing order. If no valid path exists, print `-1`.

#### Input Format:
- Line 1: An integer `N` representing the size of the square grid.
- Next `N` lines: `N` space-separated integers (0 or 1) representing the grid.

#### Output Format:
- Space-separated strings of moves in alphabetical order, or `-1` if no path is possible.

#### Constraints:
- `2 <= N <= 10`
- `0 <= m[i][j] <= 1`
