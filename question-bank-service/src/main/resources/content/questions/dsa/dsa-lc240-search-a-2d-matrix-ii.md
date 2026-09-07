---
slug: dsa-lc240-search-a-2d-matrix-ii
title: Search a 2D Matrix II
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- binary-search
- mid
- lc-240
buildProfile: judge0
source: inspired-by:operator-corpus/Q_97_Search_a_2D_Matrix_II.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3 5

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: 'true'
  description: Primary test case
- name: Sample 2
  input: '2 3 0

    1 0 1

    0 1 0'
  expectedOutput: 'true'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2 8

    2 4

    6 8

    10 12'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 2
  input: '2 2 3

    1 2

    3 4'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 3
  input: '3 3 99

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using Binary Search algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Binary Search techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Search a 2D Matrix II


  This problem evaluates core techniques in Binary Search. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean searchMatrix(int[][] matrix,int target) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int target = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(searchMatrix(mat, target));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static boolean searchMatrix(int[][] matrix,int target){\n        int m=matrix.length; int n=matrix[0].length;\n\n            int row=0;int col=n-1;\n\n            while(row <m && col>=0){\n                int current =matrix[row][col];\n\n                if(current==target){\n                    return true;\n                }else if(current>target){\n                    col--;\n                }else{\n                    row++;\n                }\n            }\n    \n            return false;\n        }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int target = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(searchMatrix(mat, target));\n\
  \    }\n}"
---

### Search a 2D Matrix II

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
