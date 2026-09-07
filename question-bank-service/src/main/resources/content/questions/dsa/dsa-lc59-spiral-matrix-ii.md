---
slug: dsa-lc59-spiral-matrix-ii
title: Spiral Matrix II
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [matrix]
est_minutes: 25
tags:
- matrix
- mid
- lc-59
buildProfile: judge0
source: inspired-by:operator-corpus/Q_31_Spiral_Matrix_II.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '[[I@4dd8dc3'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '[[I@4dd8dc3'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '[[I@4dd8dc3'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '[[I@4dd8dc3'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '[[I@4dd8dc3'
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
editorial: '### Spiral Matrix II


  This problem evaluates core techniques in Matrix. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[][] generateMatrix(int n) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(generateMatrix(n));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int[][] generateMatrix(int n){\n        int[][] matrix=new int[n][n];\n        int[] dr={0,1,0,-1};\n        int[] dc={1,0,-1,0};\n        int dir=0,row=0,col=0;\n        for(int num=1;num<=n*n ;num++){\n            matrix[row][col]=num;\n            int nextRow = row+dr[dir];\n            int nextCol = col+dc[dir];\n\n            if(nextRow<0 || nextRow>=n || nextCol<0 || nextCol >=n || matrix[nextRow][nextCol] !=0){\n                dir=(dir+1) %4;\n            }\n            row=row+dr[dir];\n            col=col+dc[dir];\n        }\n        return matrix;\n    }\n\n     private static void printMatrix(int[][] matrix) {\n        int n = matrix.length;\n        int width = String.valueOf(n * n).length() + 1;\n        for (int[] row : matrix) {\n            for (int val : row) {\n                System.out.printf(\"%\" + width + \"d\", val);\n            }\n            System.out.println();\n        }\n  \
  \  }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(generateMatrix(n));\n    }\n}"
---

### Spiral Matrix II

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
