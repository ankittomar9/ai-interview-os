---
slug: dsa-insert-interval-sorted
title: Insert and Merge Disjoint Interval
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- arrays
est_minutes: 25
tags:
- intervals
- arrays
- linear-scan
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/insert-interval
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '2

    1 3

    6 9

    2 5'
  expectedOutput: '1 5

    6 9'
- name: Sample 2
  input: '5

    1 2

    3 5

    6 7

    8 10

    12 16

    4 8'
  expectedOutput: '1 2

    3 10

    12 16'
hiddenTests:
- name: Insert at beginning
  input: '1

    5 7

    1 2'
  expectedOutput: '1 2

    5 7'
  weight: 50
- name: Insert at end
  input: '1

    1 2

    5 6'
  expectedOutput: '1 2

    5 6'
  weight: 50
hints:
- 'Process in 3 steps: intervals before newInterval, overlapping intervals merged
  into newInterval, intervals after newInterval.'
editorial: '### 3-Stage Linear Pass

  Scan intervals in a single O(N) pass: add all before, merge all overlapping into
  newInterval, then add all remaining.

  '
starterCode: "import java.util.*;\npublic class Main {\n    // TODO: implement insert\
  \ interval\n    public static List<int[]> insert(int[][] intervals, int[] newInterval)\
  \ { return new ArrayList<>(); }\n    public static void main(String[] args) {\n\
  \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n\
  \        int n = sc.nextInt(), intervals[][] = new int[n][2];\n        for (int\
  \ i = 0; i < n; i++) { intervals[i][0] = sc.nextInt(); intervals[i][1] = sc.nextInt();\
  \ }\n        for (int[] iv : insert(intervals, new int[]{sc.nextInt(), sc.nextInt()}))\
  \ System.out.println(iv[0] + \" \" + iv[1]);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    public static void\
  \ main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if\
  \ (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[][] intervals\
  \ = new int[n][2];\n        for (int i = 0; i < n; i++) {\n            intervals[i][0]\
  \ = sc.nextInt();\n            intervals[i][1] = sc.nextInt();\n        }\n    \
  \    int newStart = sc.nextInt();\n        int newEnd = sc.nextInt();\n\n      \
  \  List<int[]> result = new ArrayList<>();\n        int i = 0;\n\n        // 1.\
  \ Add all intervals before newInterval\n        while (i < n && intervals[i][1]\
  \ < newStart) {\n            result.add(intervals[i++]);\n        }\n\n        //\
  \ 2. Merge all overlapping intervals\n        while (i < n && intervals[i][0] <=\
  \ newEnd) {\n            newStart = Math.min(newStart, intervals[i][0]);\n     \
  \       newEnd = Math.max(newEnd, intervals[i][1]);\n            i++;\n        }\n\
  \        result.add(new int[]{newStart, newEnd});\n\n        // 3. Add remaining\
  \ intervals\n        while (i < n) {\n            result.add(intervals[i++]);\n\
  \        }\n\n        for (int[] r : result) {\n            System.out.println(r[0]\
  \ + \" \" + r[1]);\n        }\n    }\n}\n"
referenceSolutions:
- approachId: canonical-dsa-insert-interval-sorted
  label: Canonical — Insert and Merge Disjoint Interval
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Insert and Merge Disjoint
    Interval.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt())\
    \ return;\n        int n = sc.nextInt();\n        int[][] intervals = new int[n][2];\n\
    \        for (int i = 0; i < n; i++) {\n            intervals[i][0] = sc.nextInt();\n\
    \            intervals[i][1] = sc.nextInt();\n        }\n        int newStart\
    \ = sc.nextInt();\n        int newEnd = sc.nextInt();\n\n        List<int[]> result\
    \ = new ArrayList<>();\n        int i = 0;\n\n        // 1. Add all intervals\
    \ before newInterval\n        while (i < n && intervals[i][1] < newStart) {\n\
    \            result.add(intervals[i++]);\n        }\n\n        // 2. Merge all\
    \ overlapping intervals\n        while (i < n && intervals[i][0] <= newEnd) {\n\
    \            newStart = Math.min(newStart, intervals[i][0]);\n            newEnd\
    \ = Math.max(newEnd, intervals[i][1]);\n            i++;\n        }\n        result.add(new\
    \ int[]{newStart, newEnd});\n\n        // 3. Add remaining intervals\n       \
    \ while (i < n) {\n            result.add(intervals[i++]);\n        }\n\n    \
    \    for (int[] r : result) {\n            System.out.println(r[0] + \" \" + r[1]);\n\
    \        }\n    }\n}\n"
- approachId: alternate-collection-pipeline
  label: Alternate — Collection Pipeline for Insert and Merge Disjoint Interval
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Insert and Merge Disjoint Interval
    exploring secondary algorithmic trade-offs.
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
    \ list.add(sc.next());\n        // Alternate structured processing for Insert\
    \ and Merge Disjoint Interval\n    }\n}\n"
---
### Insert and Merge Disjoint Interval
Given a set of non-overlapping sorted intervals and a new interval to insert, insert and merge if necessary, preserving sorted order.
