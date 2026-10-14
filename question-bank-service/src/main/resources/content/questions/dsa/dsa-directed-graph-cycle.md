---
slug: dsa-directed-graph-cycle
title: "Cycle Detection in Directed Graph"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [graphs]
est_minutes: 25
tags: [graphs, dfs, kahn-algorithm, cycle-detection, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/directed-graph-cycle
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      4 4
      0 1
      1 2
      2 3
      3 1
    expectedOutput: |
      1
    description: "Directed cycle 1->2->3->1"
  - name: "Sample 2"
    input: |
      4 3
      0 1
      1 2
      2 3
    expectedOutput: |
      0
    description: "Acyclic directed path"
hiddenTests:
  - name: "Triangle Directed Cycle"
    input: |
      3 3
      0 1
      1 2
      2 0
    expectedOutput: |
      1
    weight: 50
  - name: "No Edges"
    input: |
      2 0
    expectedOutput: |
      0
    weight: 50
hints:
  - "Use Kahn's Algorithm (BFS with in-degrees): if the number of visited nodes in topological sort < V, a cycle exists."
  - "Alternatively, DFS with a recursion-stack array (or 3-coloring: white, gray, black)."
constraints:
  - "1 <= V <= 10^4"
  - "0 <= E <= 10^5"
coaching:
  presentationTips:
    - "Explain why Kahn's algorithm naturally detects cycles when queue empties early."
    - "Detail why undirected cycle detection logic fails on directed graphs (parent != back-edge)."
  approachHint: "Kahn's BFS in-degree algorithm."
editorial: |
  ### Cycle Detection in Directed Graph
  Using Kahn's BFS Algorithm:
  1. Compute in-degree for every vertex.
  2. Push vertices with in-degree 0 into a queue.
  3. While queue is not empty:
     - Dequeue vertex `u`, increment visited count.
     - For each neighbor `v` of `u`, decrement `inDegree[v]`.
     - If `inDegree[v] == 0`, enqueue `v`.
  4. If `visitedCount != V`, then the graph has at least one cycle.
  - **Time Complexity:** O(V + E)
  - **Space Complexity:** O(V + E)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement cycle detection in directed graph
      public static boolean isCyclic(int v, List<List<Integer>> adj) {
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
          }
          System.out.println(isCyclic(v, adj) ? "1" : "0");
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static boolean isCyclic(int v, List<List<Integer>> adj) {
          int[] inDegree = new int[v];
          for (int i = 0; i < v; i++) {
              for (int dest : adj.get(i)) {
                  inDegree[dest]++;
              }
          }

          Queue<Integer> q = new LinkedList<>();
          for (int i = 0; i < v; i++) {
              if (inDegree[i] == 0) q.offer(i);
          }

          int count = 0;
          while (!q.isEmpty()) {
              int u = q.poll();
              count++;
              for (int dest : adj.get(u)) {
                  inDegree[dest]--;
                  if (inDegree[dest] == 0) {
                      q.offer(dest);
                  }
              }
          }
          return count != v;
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
          }
          System.out.println(isCyclic(v, adj) ? "1" : "0");
      }
  }
---

### Cycle Detection in Directed Graph

Given a Directed Graph with `V` vertices numbered `0` to `V-1` and `E` directed edges, check whether it contains any cycle.

#### Input Format:
- Line 1: Two integers `V` and `E`.
- Next `E` lines: Two integers `u` and `v` representing a directed edge from `u` to `v`.

#### Output Format:
- Print `1` if a directed cycle exists, or `0` otherwise.

#### Constraints:
- `1 <= V <= 10^4`
- `0 <= E <= 10^5`
