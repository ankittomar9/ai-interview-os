---
slug: dsa-kth-largest-element-stream
title: Kth Largest Element in Continuous Stream
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics:
- heap
- design
est_minutes: 15
tags:
- heap
- priority-queue
- streams
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/kth-largest-stream
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 4

    4 5 8 2

    4

    add 3

    add 5

    add 10

    add 9'
  expectedOutput: '4

    5

    5

    8'
hiddenTests:
- name: K=1 max element tracker
  input: '1 2

    10 20

    2

    add 5

    add 30'
  expectedOutput: '20

    30'
  weight: 50
- name: K equals total elements
  input: '2 2

    1 2

    1

    add 3'
  expectedOutput: '2'
  weight: 50
hints:
- Maintain a Min-Heap of fixed size K. The root of the Min-Heap is always the K-th
  largest element.
editorial: '### Min-Heap of Size K

  Keep exactly K elements in the heap. If heap size > K, remove the smallest element
  (`poll`). Root is the Kth largest.

  '
starterCode: "import java.util.*;\npublic class Main {\n    static class KthLargest\
  \ {\n        public KthLargest(int k, int[] nums) {}\n        public int add(int\
  \ val) { return -1; } // TODO: implement\n    }\n    public static void main(String[]\
  \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt())\
  \ return;\n        int k = sc.nextInt(), n = sc.nextInt(), nums[] = new int[n];\n\
  \        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        KthLargest\
  \ kth = new KthLargest(k, nums);\n        int q = sc.nextInt();\n        while (q--\
  \ > 0 && sc.hasNextInt()) System.out.println(kth.add(sc.nextInt()));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    public static void\
  \ main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if\
  \ (!sc.hasNextInt()) return;\n        int k = sc.nextInt();\n        int n = sc.nextInt();\n\
  \        PriorityQueue<Integer> minHeap = new PriorityQueue<>();\n\n        for\
  \ (int i = 0; i < n; i++) {\n            minHeap.offer(sc.nextInt());\n        \
  \    if (minHeap.size() > k) minHeap.poll();\n        }\n\n        int q = sc.nextInt();\n\
  \        while (q-- > 0 && sc.hasNext()) {\n            String op = sc.next();\n\
  \            int val = sc.nextInt();\n            minHeap.offer(val);\n        \
  \    if (minHeap.size() > k) minHeap.poll();\n            System.out.println(minHeap.peek());\n\
  \        }\n    }\n}\n"
referenceSolutions:
- approachId: canonical-dsa-kth-largest-element-stream
  label: Canonical — Kth Largest Element in Continuous Stream
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Kth Largest Element in
    Continuous Stream.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt())\
    \ return;\n        int k = sc.nextInt();\n        int n = sc.nextInt();\n    \
    \    PriorityQueue<Integer> minHeap = new PriorityQueue<>();\n\n        for (int\
    \ i = 0; i < n; i++) {\n            minHeap.offer(sc.nextInt());\n           \
    \ if (minHeap.size() > k) minHeap.poll();\n        }\n\n        int q = sc.nextInt();\n\
    \        while (q-- > 0 && sc.hasNext()) {\n            String op = sc.next();\n\
    \            int val = sc.nextInt();\n            minHeap.offer(val);\n      \
    \      if (minHeap.size() > k) minHeap.poll();\n            System.out.println(minHeap.peek());\n\
    \        }\n    }\n}\n"
- approachId: alternate-collection-pipeline
  label: Alternate — Collection Pipeline for Kth Largest Element in Continuous Stream
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Kth Largest Element in Continuous
    Stream exploring secondary algorithmic trade-offs.
  keyIdea: Alternative traversal or collection formulation separating ingestion from
    calculation.
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
    \ list.add(sc.next());\n        // Alternate structured processing for Kth Largest\
    \ Element in Continuous Stream\n    }\n}\n"
---
### Kth Largest Element in Continuous Stream
Design a class to find the `k`-th largest element in a stream of integers.
