---
slug: dsa-lc74-search-a-2d-matrix
title: Search a 2D Matrix
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [matrix, binary-search]
est_minutes: 25
tags:
- binary-search
- mid
- lc-74
buildProfile: judge0
source: inspired-by:operator-corpus/Q_115_Search_a_2D_Matrix.java
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
  expectedOutput: 'false'
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
editorial: '### Search a 2D Matrix


  This problem evaluates core techniques in Binary Search. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean searchMatrix(int[][] matrix,int target) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int target = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(searchMatrix(mat, target));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n public static boolean searchMatrix(int[][] matrix,int target){\n    if(matrix==null ||matrix.length==0 || matrix[0].length==0){\n        return false;\n    }\n    int m=matrix.length; int n=matrix[0].length;\n\n    int left=0; int right=m*n-1;\n    while(left<=right){\n        int mid=left+(right-left)/2;\n        int row=mid/n;\n        int col=mid%n;\n\n        if(matrix[row][col] ==target){\n            return true;\n        }else if(matrix[row][col] < target){\n            left=mid+1; \n        }else{\n            right=mid-1;\n        }\n    }\n    return false;\n }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int target = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n\
  \        System.out.println(searchMatrix(mat, target));\n    }\n}"
---

### Search a 2D Matrix

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
