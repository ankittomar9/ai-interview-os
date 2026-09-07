---
slug: dsa-lc63-unique-paths-ii
title: Unique Paths II
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [dp]
est_minutes: 25
tags:
- dynamic-programming
- mid
- lc-63
buildProfile: judge0
source: inspired-by:operator-corpus/Q_144_Unique_Paths_II.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: '2 3

    1 0 1

    0 1 0'
  expectedOutput: '0'
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
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '3 3

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: '0'
  weight: 50
hints:
- Analyze the problem using Dynamic Programming algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Dynamic Programming techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Unique Paths II


  This problem evaluates core techniques in Dynamic Programming. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int uniquePathsWithObstacles(int[][] obstacleGrid) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(uniquePathsWithObstacles(mat));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n\n    public static int uniquePathsWithObstacles(int[][] obstacleGrid){\n        int m=obstacleGrid.length;\n        int n=obstacleGrid[0].length;\n        if(obstacleGrid[0][0]==1) return 0;\n\n        for(int j=0;j<n;j++){\n            if(obstacleGrid[0][j]==1){\n                obstacleGrid[0][j]=0;\n            }else{\n                obstacleGrid[0][j]=(j==0)?1: obstacleGrid[0][j-1];\n            }\n        }\n        \n        for(int i=1;i<m;i++){\n            if(obstacleGrid[i][0]==1){\n                obstacleGrid[i][0]=0;\n            }else{\n                obstacleGrid[i][0]=obstacleGrid[i-1][0];\n            }\n        }\n\n        for(int i=1;i<m;i++){\n            for(int j=1;j<n;j++){\n                if(obstacleGrid[i][j]==1){\n                    obstacleGrid[i][j]=0;\n                }else{\n                    obstacleGrid[i][j]=obstacleGrid[i-1][j]+obstacleGrid[i][j-1];\n       \
  \         }\n            }\n        }\n        return obstacleGrid[m-1][n-1];\n\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(uniquePathsWithObstacles(mat));\n    }\n}"
---

### Unique Paths II

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
