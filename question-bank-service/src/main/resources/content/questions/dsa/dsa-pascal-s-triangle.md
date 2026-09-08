---
slug: dsa-pascal-s-triangle
title: Pascal's Triangle.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [patterns]
est_minutes: 25
tags:
- 5-patterns--printing-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_129_Pascals_Triangle.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: "1 \n  1 1 \n 1 2 1 \n1 3 3 1 \n1 4 6 4 1"
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: "1 \n       1 1 \n      1 2 1 \n     1 3 3 1 \n    1 4 6 4 1 \n   1 5 10 10 5 1 \n  1 6 15 20 15 6 1 \n 1 7 21 35 35 21 7 1 \n1 8 28 56 70 56 28 8 1 \n1 9 36 84 126 126 84 36 9 1"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: "1 \n    1 1 \n   1 2 1 \n  1 3 3 1 \n 1 4 6 4 1 \n1 5 10 10 5 1 \n1 6 15 20 15 6 1"
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: "1 \n         1 1 \n        1 2 1 \n       1 3 3 1 \n      1 4 6 4 1 \n     1 5 10 10 5 1 \n    1 6 15 20 15 6 1 \n   1 7 21 35 35 21 7 1 \n  1 8 28 56 70 56 28 8 1 \n 1 9 36 84 126 126 84 36 9 1 \n1 10 45 120 210 252 210 120 45 10 1 \n1 11 55 165 330 462 462 330 165 55 11 1"
  weight: 50
hints:
- Analyze the problem using 5. Patterns & Printing (15 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 5. Patterns & Printing (15 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Pascal''s Triangle.


  This problem evaluates core techniques in 5. Patterns & Printing (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printPascalTriangle(int N) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printPascalTriangle(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void printPascalTriangle(int N){\n        for(int i=1;i<=N;i++){\n\n            for(int j=1;j<N-i;j++){\n                System.out.print(\" \");\n            }\n            int val=1;\n\n            for(int j=1;j<=i;j++){\n                System.out.print(val +\" \");\n            \n                val=val*(i-j)/j;\n            }\n            System.out.println();\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printPascalTriangle(n);\n    }\n}"
---

### Pascal's Triangle.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
