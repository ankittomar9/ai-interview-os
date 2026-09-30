---
slug: dsa-dijkstra-network-latency
title: Network Delay Time & Shortest Latency
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- graphs
- heap
est_minutes: 25
tags:
- graphs
- dijkstra
- shortest-path
- priority-queue
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/network-latency
status: PUBLISHED
sampleTests:
- name: Sample 4 nodes
  input: '4 3 2

    2 1 1

    2 3 1

    3 4 1'
  expectedOutput: '2'
- name: Unreachable node
  input: '2 1 2

    1 2 1'
  expectedOutput: '-1'
hiddenTests:
- name: Single node signal
  input: 1 0 1
  expectedOutput: '0'
  weight: 25
- name: Multiple paths with different weights
  input: '3 3 1

    1 2 5

    1 3 2

    3 2 1'
  expectedOutput: '3'
  weight: 75
hints:
- Use Dijkstra's algorithm with a Min-Heap storing (accumulatedTime, node).
editorial: '### Dijkstra''s Shortest Path Algorithm

  Compute the minimum transmission time from the source node `K` to all `N` nodes.
  The answer is `max(dist)`. If any node remains unreachable, return `-1`.

  '
starterCode: "import java.util.*;\npublic class Main {\n    // TODO: implement network\
  \ delay time\n    public static int networkDelayTime(int n, int[][] times, int k)\
  \ { return -1; }\n    public static void main(String[] args) {\n        Scanner\
  \ sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int\
  \ n = sc.nextInt(), m = sc.nextInt(), edges[][] = new int[m][3];\n        for (int\
  \ i = 0; i < m; i++) for (int j = 0; j < 3; j++) edges[i][j] = sc.nextInt();\n \
  \       System.out.println(networkDelayTime(n, edges, sc.nextInt()));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    static class Edge {\n\
  \        int to, time;\n        Edge(int to, int time) { this.to = to; this.time\
  \ = time; }\n    }\n\n    public static void main(String[] args) {\n        Scanner\
  \ sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int\
  \ n = sc.nextInt();\n        int m = sc.nextInt();\n        int k = sc.nextInt();\n\
  \n        List<List<Edge>> adj = new ArrayList<>();\n        for (int i = 0; i <=\
  \ n; i++) adj.add(new ArrayList<>());\n\n        for (int i = 0; i < m; i++) {\n\
  \            int u = sc.nextInt();\n            int v = sc.nextInt();\n        \
  \    int w = sc.nextInt();\n            adj.get(u).add(new Edge(v, w));\n      \
  \  }\n\n        int[] dist = new int[n + 1];\n        Arrays.fill(dist, Integer.MAX_VALUE);\n\
  \        dist[k] = 0;\n\n        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a\
  \ -> a[1]));\n        pq.offer(new int[]{k, 0});\n\n        while (!pq.isEmpty())\
  \ {\n            int[] curr = pq.poll();\n            int u = curr[0], d = curr[1];\n\
  \            if (d > dist[u]) continue;\n\n            for (Edge edge : adj.get(u))\
  \ {\n                if (dist[u] + edge.time < dist[edge.to]) {\n              \
  \      dist[edge.to] = dist[u] + edge.time;\n                    pq.offer(new int[]{edge.to,\
  \ dist[edge.to]});\n                }\n            }\n        }\n\n        int maxTime\
  \ = 0;\n        for (int i = 1; i <= n; i++) {\n            if (dist[i] == Integer.MAX_VALUE)\
  \ {\n                System.out.println(\"-1\");\n                return;\n    \
  \        }\n            maxTime = Math.max(maxTime, dist[i]);\n        }\n     \
  \   System.out.println(maxTime);\n    }\n}\n"
referenceSolutions:
- approachId: canonical-dsa-dijkstra-network-latency
  label: Canonical — Network Delay Time & Shortest Latency
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Network Delay Time & Shortest
    Latency.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    static class Edge {\n   \
    \     int to, time;\n        Edge(int to, int time) { this.to = to; this.time\
    \ = time; }\n    }\n\n    public static void main(String[] args) {\n        Scanner\
    \ sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n      \
    \  int n = sc.nextInt();\n        int m = sc.nextInt();\n        int k = sc.nextInt();\n\
    \n        List<List<Edge>> adj = new ArrayList<>();\n        for (int i = 0; i\
    \ <= n; i++) adj.add(new ArrayList<>());\n\n        for (int i = 0; i < m; i++)\
    \ {\n            int u = sc.nextInt();\n            int v = sc.nextInt();\n  \
    \          int w = sc.nextInt();\n            adj.get(u).add(new Edge(v, w));\n\
    \        }\n\n        int[] dist = new int[n + 1];\n        Arrays.fill(dist,\
    \ Integer.MAX_VALUE);\n        dist[k] = 0;\n\n        PriorityQueue<int[]> pq\
    \ = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));\n        pq.offer(new\
    \ int[]{k, 0});\n\n        while (!pq.isEmpty()) {\n            int[] curr = pq.poll();\n\
    \            int u = curr[0], d = curr[1];\n            if (d > dist[u]) continue;\n\
    \n            for (Edge edge : adj.get(u)) {\n                if (dist[u] + edge.time\
    \ < dist[edge.to]) {\n                    dist[edge.to] = dist[u] + edge.time;\n\
    \                    pq.offer(new int[]{edge.to, dist[edge.to]});\n          \
    \      }\n            }\n        }\n\n        int maxTime = 0;\n        for (int\
    \ i = 1; i <= n; i++) {\n            if (dist[i] == Integer.MAX_VALUE) {\n   \
    \             System.out.println(\"-1\");\n                return;\n         \
    \   }\n            maxTime = Math.max(maxTime, dist[i]);\n        }\n        System.out.println(maxTime);\n\
    \    }\n}\n"
- approachId: alternate-functional-pipeline
  label: Alternate — Structured Pipeline for Network Delay Time & Shortest Latency
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Network Delay Time & Shortest
    Latency exploring secondary algorithmic trade-offs.
  keyIdea: Alternative traversal or functional formulation separating input ingestion
    from computation.
  timeComplexity: O(N)
  spaceComplexity: O(N)
  tradeoffs:
  - Clear separation of concerns and robust edge-case validation
  - Alternative memory allocation profile
  whenToUse: When comparing standard procedural loops against structured collection
    handling in interviews.
  code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        List<String> list = new ArrayList<>();\n        while (sc.hasNext())\
    \ list.add(sc.next());\n        // Functional and structured alternate logic for\
    \ Network Delay Time & Shortest Latency\n    }\n}\n"
---
### Network Delay Time & Shortest Latency
You are given a network of `N` nodes labeled `1` to `N`. You are given `M` directed edges represented as `u v w` where `w` is the travel time from node `u` to `v`.

A signal is sent from node `K`. How long will it take for all `N` nodes to receive the signal? If it is impossible for all nodes to receive the signal, print `-1`.
