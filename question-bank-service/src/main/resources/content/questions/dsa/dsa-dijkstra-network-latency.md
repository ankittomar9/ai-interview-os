---
slug: dsa-dijkstra-network-latency
title: Network Delay Time & Shortest Latency
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [graphs, dijkstra, shortest-path, priority-queue]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/network-latency
status: PUBLISHED
sampleTests:
  - name: "Sample 4 nodes"
    input: "4 3 2\n2 1 1\n2 3 1\n3 4 1"
    expectedOutput: "2"
  - name: "Unreachable node"
    input: "2 1 2\n1 2 1"
    expectedOutput: "-1"
hiddenTests:
  - name: "Single node signal"
    input: "1 0 1"
    expectedOutput: "0"
    weight: 25
  - name: "Multiple paths with different weights"
    input: "3 3 1\n1 2 5\n1 3 2\n3 2 1"
    expectedOutput: "3"
    weight: 75
hints:
  - "Use Dijkstra's algorithm with a Min-Heap storing (accumulatedTime, node)."
editorial: |
  ### Dijkstra's Shortest Path Algorithm
  Compute the minimum transmission time from the source node `K` to all `N` nodes. The answer is `max(dist)`. If any node remains unreachable, return `-1`.
solutionCode: |
  import java.util.*;

  public class Main {
      static class Edge {
          int to, time;
          Edge(int to, int time) { this.to = to; this.time = time; }
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int m = sc.nextInt();
          int k = sc.nextInt();

          List<List<Edge>> adj = new ArrayList<>();
          for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());

          for (int i = 0; i < m; i++) {
              int u = sc.nextInt();
              int v = sc.nextInt();
              int w = sc.nextInt();
              adj.get(u).add(new Edge(v, w));
          }

          int[] dist = new int[n + 1];
          Arrays.fill(dist, Integer.MAX_VALUE);
          dist[k] = 0;

          PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
          pq.offer(new int[]{k, 0});

          while (!pq.isEmpty()) {
              int[] curr = pq.poll();
              int u = curr[0], d = curr[1];
              if (d > dist[u]) continue;

              for (Edge edge : adj.get(u)) {
                  if (dist[u] + edge.time < dist[edge.to]) {
                      dist[edge.to] = dist[u] + edge.time;
                      pq.offer(new int[]{edge.to, dist[edge.to]});
                  }
              }
          }

          int maxTime = 0;
          for (int i = 1; i <= n; i++) {
              if (dist[i] == Integer.MAX_VALUE) {
                  System.out.println("-1");
                  return;
              }
              maxTime = Math.max(maxTime, dist[i]);
          }
          System.out.println(maxTime);
      }
  }
---
### Network Delay Time & Shortest Latency
You are given a network of `N` nodes labeled `1` to `N`. You are given `M` directed edges represented as `u v w` where `w` is the travel time from node `u` to `v`.

A signal is sent from node `K`. How long will it take for all `N` nodes to receive the signal? If it is impossible for all nodes to receive the signal, print `-1`.
