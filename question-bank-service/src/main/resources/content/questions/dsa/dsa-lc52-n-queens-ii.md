---
slug: dsa-lc52-n-queens-ii
title: N-Queens II
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [recursion]
est_minutes: 40
tags:
- backtracking
- senior
- lc-52
buildProfile: judge0
source: inspired-by:operator-corpus/Q_105_N_Queens_II.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '10'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '724'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '40'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '14200'
  weight: 50
hints:
- Analyze the problem using Backtracking algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Backtracking techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### N-Queens II


  This problem evaluates core techniques in Backtracking. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int totalNQueens(int n) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(totalNQueens(n));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int totalNQueens(int n){\n        boolean[] col=new boolean[n];\n        boolean[] diag=new boolean[2*n-1];\n        boolean[] antiDiag=new boolean[2*n-1];\n        \n        return backtrack(0, n, col, diag, antiDiag); \n    }\n    private static int backtrack(int row,int n,\n        boolean[] col,boolean[] diag,boolean[] antiDiag){\n            if(row==n){ return 1;}\n        \n        int count=0;\n\n        for(int c=0;c<n;c++){\n            int d1=row+c; \n            int d2=row-c+n-1;\n\n            if(col[c] || diag[d1] || antiDiag[d2]){\n                continue;\n            }\n            col[c]=true;\n            diag[d1]=true;\n            antiDiag[d2]=true;\n            \n            count=count+backtrack(row+1, n, col, diag, antiDiag);\n\n            col[c]=false;\n            diag[d1]=false;\n            antiDiag[d2]=false;\n        }\n            return count;\n        }\n\n\n    public static\
  \ void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(totalNQueens(n));\n    }\n}"
---

### N-Queens II

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
