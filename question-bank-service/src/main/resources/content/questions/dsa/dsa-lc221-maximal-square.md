---
slug: dsa-lc221-maximal-square
title: Maximal Square
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- dynamic-programming
- mid
- lc-221
buildProfile: judge0
source: inspired-by:operator-corpus/Q_150_Maximal_Square.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    111

    010

    111'
  expectedOutput: 'DP Table:

    [1, 1, 1]

    [0, 1, 0]

    [1, 1, 1]

    1'
  description: Primary test case
- name: Sample 2
  input: '2 2

    XX

    OO'
  expectedOutput: 'DP Table:

    [40, 40]

    [31, 32]

    1600'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 3

    ABC

    DEF

    GHI'
  expectedOutput: 'DP Table:

    [17, 18, 19]

    [20, 18, 19]

    [23, 19, 19]

    529'
  weight: 25
- name: Hidden 2
  input: '1 1

    X'
  expectedOutput: 'DP Table:

    [40]

    1600'
  weight: 25
- name: Hidden 3
  input: '2 3

    101

    010'
  expectedOutput: 'DP Table:

    [1, 0, 1]

    [0, 1, 0]

    1'
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
editorial: '### Maximal Square


  This problem evaluates core techniques in Dynamic Programming. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maximalSquare(char[][] matrix) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        char[][] mat = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) mat[i][j] = row.charAt(j); }\n        System.out.println(maximalSquare(mat));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int maximalSquare(char[][] matrix){\n        int m=matrix.length; int n=matrix[0].length;\n        int[][] dp=new int[m][n];\n        int maxSide=0;\n\n        for(int j=0;j<n;j++){\n            dp[0][j]=matrix[0][j]-'0';\n            maxSide=Math.max(maxSide,dp[0][j]);\n        }\n\n        for(int i=0;i<m;i++){\n            dp[i][0]=matrix[i][0]-'0';\n            maxSide=Math.max(maxSide, dp[i][0]);\n        }\n\n        for(int i=1;i<m;i++){\n            for(int j=1;j<n;j++){\n                if(matrix[i][j]=='0'){\n                    dp[i][j]=0;\n                }else{\n                    dp[i][j]= Math.min(dp[i-1][j],Math.min(dp[i][j-1], dp[i-1][j-1]))+1;\n                }\n                maxSide=Math.max(maxSide, dp[i][j]);\n            }\n        }\n         System.out.println(\"\\nDP Table:\");\n        for (int[] row : dp) System.out.println(java.util.Arrays.toString(row));\n        return maxSide*maxSide;\n\
  \    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        char[][] mat = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) mat[i][j] = row.charAt(j); }\n        System.out.println(maximalSquare(mat));\n    }\n}\n\n\n//65 32 84"
---

### Maximal Square

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
