---
slug: dsa-topological-sort
title: "Topological Sort of DAG"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [graphs]
est_minutes: 25
tags: [graphs, topological-sort, dfs, bfs, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/topological-sort
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      6 6
      5 0
      5 2
      4 0
      4 1
      2 3
      3 1
    expectedOutput: |
      4 5 0 2 3 1
    description: "Standard DAG sorted with min-heap priority"
  - name: "Sample 2"
    input: |
      4 3
      0 1
      1 2
      2 3
    expectedOutput: |
      0 1 2 3
    description: "Linear DAG chain"
hiddenTests:
  - name: "Forking into Single Sink"
    input: |
      3 2
      0 2
      1 2
    expectedOutput: |
      0 1 2
    weight: 50
  - name: "Single Isolated Vertex"
    input: |
      1 0
    expectedOutput: |
      0
    weight: 50
hints:
  - "Compute in-degrees of all vertices."
  - "Use a priority queue (min-heap) for 0-in-degree vertices to output deterministic lexicographical order."
constraints:
  - "1 <= V <= 10^4"
  - "0 <= E <= 10^5"
  - "The given graph is guaranteed to be a Directed Acyclic Graph (DAG)."
coaching:
  presentationTips:
    - "Explain Kahn's algorithm (BFS with in-degrees) vs DFS post-order reversal."
    - "Highlight why a priority queue yields a canonical unique order when multiple valid topological orders exist."
  approachHint: "Kahn's BFS algorithm using Min-PriorityQueue."
editorial: |
  ### Kahn's BFS Topological Sort
  1. Build adjacency list and compute in-degrees for all `V` vertices.
  2. Push all vertices with `inDegree == 0` into a Min-Heap `PriorityQueue`.
  3. Repeatedly extract the minimum vertex, append to output, and decrement in-degrees of all outgoing neighbors.
  4. When a neighbor's in-degree drops to 0, push it into the priority queue.
  - **Time Complexity:** O(V log V + E)
  - **Space Complexity:** O(V + E)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement topological sort using Kahn's algorithm
      public static List<Integer> topoSort(int v, List<List<Integer>> adj) {
          return new ArrayList<>();
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
          List<Integer> order = topoSort(v, adj);
          StringBuilder sb = new StringBuilder();
          for (int i = 0; i < order.size(); i++) {
              if (i > 0) sb.append(" ");
              sb.append(order.get(i));
          }
          System.out.println(sb.toString());
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static List<Integer> topoSort(int v, List<List<Integer>> adj) {
          int[] inDegree = new int[v];
          for (int i = 0; i < v; i++) {
              for (int dest : adj.get(i)) {
                  inDegree[dest]++;
              }
          }

          PriorityQueue<Integer> pq = new PriorityQueue<>();
          for (int i = 0; i < v; i++) {
              if (inDegree[i] == 0) {
                  pq.offer(i);
              }
          }

          List<Integer> order = new ArrayList<>();
          while (!pq.isEmpty()) {
              int u = pq.poll();
              order.add(u);
              for (int dest : adj.get(u)) {
                  inDegree[dest]--;
                  if (inDegree[dest] == 0) {
                      pq.offer(dest);
                  }
              }
          }
          return order;
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
          List<Integer> order = topoSort(v, adj);
          StringBuilder sb = new StringBuilder();
          for (int i = 0; i < order.size(); i++) {
              if (i > 0) sb.append(" ");
              sb.append(order.get(i));
          }
          System.out.println(sb.toString());
      }
  }
---

### Topological Sort of DAG

Given a Directed Acyclic Graph (DAG) with `V` vertices numbered `0` to `V-1` and `E` directed edges, output a topological sort of the vertices. If there are multiple valid topological sorts, output the lexicographically smallest order by choosing vertices with smaller index first.

#### Input Format:
- Line 1: Two integers `V` and `E`.
- Next `E` lines: Two integers `u` and `v` representing a directed edge from `u` to `v`.

#### Output Format:
- Print `V` space-separated integers representing the topological order.

#### Constraints:
- `1 <= V <= 10^4`
- `0 <= E <= 10^5`
- The graph is guaranteed to be a DAG.
