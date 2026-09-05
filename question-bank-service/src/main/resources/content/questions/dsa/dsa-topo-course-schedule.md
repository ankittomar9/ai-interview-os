---
slug: dsa-topo-course-schedule
title: Course Prerequisites & Deadlock Scheduler
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [graphs, topological-sort, bfs, kahn-algorithm]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/topo-sort
status: PUBLISHED
sampleTests:
  - name: "Valid 2-Course Chain"
    input: "2 1\n1 0"
    expectedOutput: "0 1"
  - name: "Cycle Deadlock"
    input: "2 2\n1 0\n0 1"
    expectedOutput: "-1"
hiddenTests:
  - name: "Single Course"
    input: "1 0"
    expectedOutput: "0"
    weight: 20
  - name: "Disconnected DAG"
    input: "4 2\n1 0\n3 2"
    expectedOutput: "0 2 1 3"
    weight: 40
  - name: "3-Node Cycle"
    input: "3 3\n0 1\n1 2\n2 0"
    expectedOutput: "-1"
    weight: 40
hints:
  - "Track in-degree of all vertices. Enqueue all vertices with in-degree 0."
constraints:
  - "1 <= numCourses <= 2000"
  - "0 <= prerequisites.length <= 5000"
  - "All prerequisite pairs are unique."
editorial: |
  ### Kahn's BFS Topological Sort
  1. Build adjacency list and array of in-degrees.
  2. Add in-degree 0 nodes to queue.
  3. Dequeue, add to topological order, and decrement neighbor in-degrees.
  4. If processed count < N, a cycle exists -> output -1.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement topological sort course schedule
      public static List<Integer> findOrder(int n, int[][] prereqs) { return new ArrayList<>(); }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), m = sc.nextInt(), prereqs[][] = new int[m][2];
          for (int i = 0; i < m; i++) { prereqs[i][0] = sc.nextInt(); prereqs[i][1] = sc.nextInt(); }
          List<Integer> order = findOrder(n, prereqs);
          System.out.println(order.isEmpty() ? "-1" : "0");
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int m = sc.nextInt();

          List<List<Integer>> adj = new ArrayList<>();
          for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
          int[] inDegree = new int[n];

          for (int i = 0; i < m; i++) {
              int dest = sc.nextInt();
              int src = sc.nextInt();
              adj.get(src).add(dest);
              inDegree[dest]++;
          }

          Queue<Integer> q = new LinkedList<>();
          for (int i = 0; i < n; i++) {
              if (inDegree[i] == 0) q.offer(i);
          }

          List<Integer> order = new ArrayList<>();
          while (!q.isEmpty()) {
              int curr = q.poll();
              order.add(curr);
              for (int neighbor : adj.get(curr)) {
                  inDegree[neighbor]--;
                  if (inDegree[neighbor] == 0) {
                      q.offer(neighbor);
                  }
              }
          }

          if (order.size() < n) {
              System.out.println("-1");
          } else {
              StringBuilder sb = new StringBuilder();
              for (int i = 0; i < order.size(); i++) {
                  if (i > 0) sb.append(" ");
                  sb.append(order.get(i));
              }
              System.out.println(sb.toString());
          }
      }
  }
---
### Course Prerequisites & Deadlock Scheduler
There are a total of `N` courses labeled from `0` to `N-1`. You are given an array of prerequisite pairs where `[a, b]` indicates you must take course `b` before course `a`.

Find a valid course ordering. If multiple valid orders exist, any valid ordering is accepted. If it is impossible to finish all courses due to a cyclic dependency, print `-1`.
