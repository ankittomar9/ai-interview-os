---
slug: dsa-lc56-merge-intervals
title: Merge Intervals
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- intervals
- mid
- lc-56
buildProfile: judge0
source: inspired-by:operator-corpus/Q_49_Merge_Intervals.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: '[[I@6d03e736'
  description: Primary test case
- name: Sample 2
  input: '2 3

    1 0 1

    0 1 0'
  expectedOutput: '[[I@6d03e736'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    2 4

    6 8

    10 12'
  expectedOutput: '[[I@6d03e736'
  weight: 25
- name: Hidden 2
  input: '2 2

    1 2

    3 4'
  expectedOutput: '[[I@6d03e736'
  weight: 25
- name: Hidden 3
  input: '3 3

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: '[[I@6d03e736'
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
editorial: '### Merge Intervals


  This problem evaluates core techniques in Intervals. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[][] merge(int[][] intervals) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(merge(mat));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.Comparator;\nimport java.util.List;\n\npublic class Main {\n    \n    public static int[][] merge(int[][] intervals){\n        if(intervals ==null || intervals.length<=1){            return intervals;        }\n\n        Arrays.sort(intervals,new Comparator<int[]>(){\n            public int compare(int[] a,int[] b){\n                return a[0]-b[0];\n            }});\n\n       List<int[]> result=new ArrayList<>();\n       int[] current=intervals[0];\n       \n       for(int i=1;i<intervals.length;i++){\n        int[] next=intervals[i];\n\n        if(next[0]<=current[1]){\n            current[1]=Math.max(current[1], next[1]);\n        }else{\n            result.add(current);\n            current=next;\n        }\n       }\n       result.add(current);\n       int[][] merged=new int[result.size()][2];\n       for(int i=0;i<result.size();i++){\n        merged[i]=result.get(i);\n   \
  \    }\n       return merged;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(merge(mat));\n    }\n}\n"
---

### Merge Intervals

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
