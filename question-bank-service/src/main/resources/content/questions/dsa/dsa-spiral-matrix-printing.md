---
slug: dsa-spiral-matrix-printing
title: Spiral Matrix Printing
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- matrix
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_30_Spiral_matrix_Printing.java
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
editorial: '### Spiral Matrix Printing


  This problem evaluates core techniques in Matrix. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void spiralMatrixPrinter(int arr[][]) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        spiralMatrixPrinter(mat);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void spiralMatrixPrinter(int arr[][]){\n        if(arr==null || arr.length==0){return ;}\n        //step1: take 4 variables\n        int n=arr.length;int m=arr[0].length;\n        int top=0; int bottom=n-1;int left=0;int right=m-1;\n\n        while(top<=bottom && left<=right){\n            for(int i=left;i<=right;i++){\n                System.out.print(\" \"+arr[top][i]);\n            }\n            top++;\n            for(int i=top;i<=bottom;i++){\n                System.out.print(\" \"+arr[i][right]);\n            }\n            right--;\n            \n            if(top<=bottom){\n                for(int i=right;i>=left;i--){\n                    System.out.print(\" \"+arr[bottom][i]);\n                }\n                bottom--;\n            }\n            \n            if(left<=right){\n                for(int i=bottom;i>=top;i--){\n                    System.out.print(\" \"+arr[i][left]);\n        \
  \        }\n                left++;\n            }\n\n\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        spiralMatrixPrinter(mat);\n    }\n}"
---

### Spiral Matrix Printing

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
