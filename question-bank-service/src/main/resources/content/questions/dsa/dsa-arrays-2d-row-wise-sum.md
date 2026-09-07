---
slug: dsa-arrays-2d-row-wise-sum
title: Arrays 2D Row Wise Sum
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- matrix
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_21_Arrays_2d_Row_wise_Sum.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: 6 15 24
  description: Primary test case
- name: Sample 2
  input: '2 3

    1 0 1

    0 1 0'
  expectedOutput: 2 1
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    2 4

    6 8

    10 12'
  expectedOutput: 6 14 22
  weight: 25
- name: Hidden 2
  input: '2 2

    1 2

    3 4'
  expectedOutput: 3 7
  weight: 25
- name: Hidden 3
  input: '3 3

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: 24 15 6
  weight: 50
hints:
- Analyze the problem using Matrix algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Matrix techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Arrays 2D Row Wise Sum


  This problem evaluates core techniques in Matrix. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static long[] rowWiseSumHelper(int arr[][]) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        long[] res = rowWiseSumHelper(mat);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static long[] rowWiseSumHelper(int arr[][]){\n        if(arr==null || arr.length==0){return new long[0];}\n        int n=arr.length;\n          long[] result = new long[n];\n\n        for(int i=0;i<n;i++){\n            long sum=0;\n            int currentCol=arr[i].length;\n            for(int j=0;j<currentCol;j++){\n                sum=sum+arr[i][j];\n            }\n            result[i] = sum; \n        }\n        return result;\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        long[] res = rowWiseSumHelper(mat);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i\
  \ > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Arrays 2D Row Wise Sum

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
