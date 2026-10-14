---
slug: dsa-undirected-graph-cycle
title: "Cycle Detection in Undirected Graph"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [graphs]
est_minutes: 25
tags: [graphs, bfs, dfs, cycle-detection, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/undirected-graph-cycle
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      5 5
      0 1
      1 2
      2 3
      3 4
      4 1
    expectedOutput: |
      1
    description: "Cycle exists: 1-2-3-4-1"
  - name: "Sample 2"
    input: |
      4 3
      0 1
      1 2
      2 3
    expectedOutput: |
      0
    description: "Acyclic tree"
hiddenTests:
  - name: "Triangle Cycle"
    input: |
      3 3
      0 1
      1 2
      2 0
    expectedOutput: |
      1
    weight: 50
  - name: "Single Edge"
    input: |
      2 1
      0 1
    expectedOutput: |
      0
    weight: 50
hints:
  - "In an undirected graph, a cycle exists if during BFS/DFS you encounter an already visited vertex that is NOT the parent of the current vertex."
  - "Iterate across all vertices from 0 to V-1 to handle disconnected graph components."
constraints:
  - "1 <= V <= 10^4"
  - "0 <= E <= 10^5"
coaching:
  presentationTips:
    - "Clearly contrast undirected cycle detection (parent tracking) with directed cycle detection (recursion stack)."
    - "Handle multi-component disconnected graphs properly."
  approachHint: "BFS/DFS tracking parent node."
editorial: |
  ### Cycle Detection in Undirected Graph
  Using BFS:
  For each unvisited component, enqueue `(startNode, parent = -1)` and mark as visited.
  For each adjacent node `neighbor` of `curr`:
  - If `!visited[neighbor]`: mark visited and enqueue `(neighbor, curr)`.
  - Else if `neighbor != parent`: a cycle is detected!
  Return `1` if any component has a cycle, else `0`.
  - **Time Complexity:** O(V + E)
  - **Space Complexity:** O(V)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement cycle detection in undirected graph
      public static boolean isCycle(int v, List<List<Integer>> adj) {
          return false;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int v = sc.nextInt(), e = sc.nextInt();
          List<List<Integer>> adj = new ArrayList<>();
          for (int i = 0; i < v; i++) adj.add(new ArrayList<>());
          for (int i = 0; i < e; i++) {
              int u = sc.nextInt(), dest = sc.nextInt();
              adj.get(u).add(dest);
              adj.get(dest).add(u);
          }
          System.out.println(isCycle(v, adj) ? "1" : "0");
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      private static boolean bfsCheck(int start, List<List<Integer>> adj, boolean[] visited) {
          Queue<int[]> q = new LinkedList<>();
          visited[start] = true;
          q.offer(new int[]{start, -1});

          while (!q.isEmpty()) {
              int[] curr = q.poll();
              int node = curr[0];
              int parent = curr[1];

              for (int neighbor : adj.get(node)) {
                  if (!visited[neighbor]) {
                      visited[neighbor] = true;
                      q.offer(new int[]{neighbor, node});
                  } else if (neighbor != parent) {
                      return true;
                  }
              }
          }
          return false;
      }

      public static boolean isCycle(int v, List<List<Integer>> adj) {
          boolean[] visited = new boolean[v];
          for (int i = 0; i < v; i++) {
              if (!visited[i]) {
                  if (bfsCheck(i, adj, visited)) return true;
              }
          }
          return false;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int v = sc.nextInt(), e = sc.nextInt();
          List<List<Integer>> adj = new ArrayList<>();
          for (int i = 0; i < v; i++) adj.add(new ArrayList<>());
          for (int i = 0; i < e; i++) {
              int u = sc.nextInt(), dest = sc.nextInt();
              adj.get(u).add(dest);
              adj.get(dest).add(u);
          }
          System.out.println(isCycle(v, adj) ? "1" : "0");
      }
  }
---

### Cycle Detection in Undirected Graph

Given an undirected graph with `V` vertices labeled `0` to `V-1` and `E` edges, determine whether the graph contains any cycle.

#### Input Format:
- Line 1: Two integers `V` and `E`.
- Next `E` lines: Two integers `u` and `v` representing an undirected edge between `u` and `v`.

#### Output Format:
- Print `1` if the graph contains a cycle, or `0` otherwise.

#### Constraints:
- `1 <= V <= 10^4`
- `0 <= E <= 10^5`
