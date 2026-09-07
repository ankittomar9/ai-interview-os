---
slug: dsa-lc452-minimum-number-of-arrows-to-burst-balloons
title: Minimum Number of Arrows to Burst Balloons
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- intervals
- mid
- lc-452
buildProfile: judge0
source: inspired-by:operator-corpus/Q_51_Minimum_Number_of_Arrows_to_Burst_Balloons.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: '3'
  description: Primary test case
- name: Sample 2
  input: '2 3

    1 0 1

    0 1 0'
  expectedOutput: '1'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    2 4

    6 8

    10 12'
  expectedOutput: '3'
  weight: 25
- name: Hidden 2
  input: '2 2

    1 2

    3 4'
  expectedOutput: '2'
  weight: 25
- name: Hidden 3
  input: '3 3

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: '3'
  weight: 50
hints:
- Analyze the problem using Intervals algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Intervals techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Minimum Number of Arrows to Burst Balloons


  This problem evaluates core techniques in Intervals. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int findMinArrowShots(int[][] points) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(findMinArrowShots(mat));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\nimport java.util.Comparator;\n\npublic class Main  {\n    \n    public static int findMinArrowShots(int[][] points){\n        if(points==null || points.length==0){            return 0;        }\n        Arrays.sort(points,new Comparator<int[]>(){\n            public int compare(int[] a,int[] b){\n                return Integer.compare(a[1], b[1]);\n            } });\n            \n        int arrows=1;\n        int currentEnd=points[0][1];\n        \n        for(int i=1;i<points.length;i++){\n            int start=points[i][0];\n            int end=points[i][1];\n\n            if(start>currentEnd){\n                arrows++;\n                currentEnd=end;\n            }else{\n\n            }\n        }\n        return arrows;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n\
  \        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(findMinArrowShots(mat));\n    }\n}\n\n"
---

### Minimum Number of Arrows to Burst Balloons

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
