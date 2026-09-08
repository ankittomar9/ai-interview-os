---
slug: dsa-floyd-s-triangle
title: Floyd's Triangle.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [patterns]
est_minutes: 25
tags:
- 5-patterns--printing-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_128_Floyds_Triangle.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: "1 \n2 3 \n4 5 6 \n7 8 9 10 \n11 12 13 14 15"
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: "1 \n2 3 \n4 5 6 \n7 8 9 10 \n11 12 13 14 15 \n16 17 18 19 20 21 \n22 23 24 25 26 27 28 \n29 30 31 32 33 34 35 36 \n37 38 39 40 41 42 43 44 45 \n46 47 48 49 50 51 52 53 54 55"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: "1 \n2 3 \n4 5 6 \n7 8 9 10 \n11 12 13 14 15 \n16 17 18 19 20 21 \n22 23 24 25 26 27 28"
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: "1 \n2 3 \n4 5 6 \n7 8 9 10 \n11 12 13 14 15 \n16 17 18 19 20 21 \n22 23 24 25 26 27 28 \n29 30 31 32 33 34 35 36 \n37 38 39 40 41 42 43 44 45 \n46 47 48 49 50 51 52 53 54 55 \n56 57 58 59 60 61 62 63 64 65 66 \n67 68 69 70 71 72 73 74 75 76 77 78"
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
editorial: '### Floyd''s Triangle.


  This problem evaluates core techniques in 5. Patterns & Printing (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printFloydTriangle(int N) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printFloydTriangle(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n\n    public static void printFloydTriangle(int N){\n        int count=1;\n\n        for(int i=0;i<=N;i++){\n            for(int j=1;j<=i;j++){\n                System.out.print(count+\" \");\n                count++;\n            }\n            System.out.println();\n        }\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printFloydTriangle(n);\n    }\n}"
---

### Floyd's Triangle.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
