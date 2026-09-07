---
slug: dsa-lc54-spiral-matrix
title: Spiral Matrix
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- matrix
- mid
- lc-54
buildProfile: judge0
source: inspired-by:operator-corpus/Q_35_Spiral_Matrix.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: 1 2 3 6 9 8 7 4 5
  description: Primary test case
- name: Sample 2
  input: '2 3

    1 0 1

    0 1 0'
  expectedOutput: 1 0 1 0 1 0
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    2 4

    6 8

    10 12'
  expectedOutput: 2 4 8 12 10 6
  weight: 25
- name: Hidden 2
  input: '2 2

    1 2

    3 4'
  expectedOutput: 1 2 4 3
  weight: 25
- name: Hidden 3
  input: '3 3

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: 9 8 7 4 1 2 3 6 5
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
editorial: '### Spiral Matrix


  This problem evaluates core techniques in Matrix. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<Integer> spiralOrder(int[][] matrix) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        List<Integer> res = spiralOrder(mat);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n    \n    public static List<Integer> spiralOrder(int[][] matrix){\n        List<Integer> result=new ArrayList<>();\n        if(matrix==null || matrix.length==0){ return result;}\n\n        int top=0;         int bottom=matrix.length-1;\n        int left=0;        int right=matrix[0].length-1;\n\n        while(top<=bottom && left<=right){\n            for(int j=left;j<=right;j++){\n                result.add(matrix[top][j]);\n            }\n            top++;\n\n            for(int i=top; i<=bottom ;i++){\n                result.add(matrix[i][right]);\n            }\n            right--;\n\n            if(top<=bottom){\n                for(int j=right;j>=left;j--){\n                    result.add(matrix[bottom][j]);\n                }\n                bottom--;\n            }\n            if(left<=right){\n                for(int i=bottom;i>=top;i--){\n                    result.add(matrix[i][left]);\n\
  \                }\n               left++;\n            }\n        }\n         return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        List<Integer> res = spiralOrder(mat);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}"
---

### Spiral Matrix

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
