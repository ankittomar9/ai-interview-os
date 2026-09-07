---
slug: dsa-lc200-number-of-islands
title: Number of Islands
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [graphs]
est_minutes: 25
tags:
- graph
- mid
- lc-200
buildProfile: judge0
source: inspired-by:operator-corpus/Q_89_Number_of_Islands.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    111

    010

    111'
  expectedOutput: '1'
  description: Primary test case
- name: Sample 2
  input: '2 2

    XX

    OO'
  expectedOutput: '0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 3

    ABC

    DEF

    GHI'
  expectedOutput: '0'
  weight: 25
- name: Hidden 2
  input: '1 1

    X'
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '2 3

    101

    010'
  expectedOutput: '3'
  weight: 50
hints:
- Analyze the problem using Graph algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Graph techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Number of Islands


  This problem evaluates core techniques in Graph. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int numIslands(char[][] grid) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        char[][] mat = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) mat[i][j] = row.charAt(j); }\n        System.out.println(numIslands(mat));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static int numIslands(char[][] grid){\n        if(grid ==null || grid.length==0){return 0;}\n        int count=0;\n\n        for(int i=0;i<grid.length;i++){\n            for(int j=0;j<grid[0].length;j++){\n                if(grid[i][j]=='1'){\n                    count++;\n                    dfs(grid,i,j);\n                }\n            }\n        }\n        return count;\n    }\n    public static void dfs(char[][] grid,int i,int j){\n        if(i<0 || i>=grid.length || j<0 || j>=grid[0].length || grid[i][j]=='0'){\n            return ;\n        }\n        grid[i][j]='0';\n\n        dfs(grid, i+1, j);\n        dfs(grid, i-1, j);\n        dfs(grid, i, j+1);\n        dfs(grid, i, j-1);\n    }\n    public static void printGrid(char[][] grid){\n        for(int row=0;row<grid.length;row++){\n            for(int col=0;col<grid[0].length;col++){\n                System.out.print(grid[row][col]+ \" \");\n            }\n\
  \            System.out.println();\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        char[][] mat = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) mat[i][j] = row.charAt(j); }\n        System.out.println(numIslands(mat));\n    }\n}"
---

### Number of Islands

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
