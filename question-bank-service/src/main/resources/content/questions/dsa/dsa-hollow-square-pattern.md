---
slug: dsa-hollow-square-pattern
title: Hollow Square Pattern.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [arrays]
est_minutes: 15
tags:
- 5-patterns--printing-15-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_122_Hollow_Square_Pattern.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: "* * * * * \n*       * \n*       * \n*       * \n* * * * *"
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: "* * * * * * * * * * \n*                 * \n*                 * \n*                 * \n*                 * \n*                 * \n*                 * \n*                 * \n*                 * \n* * * * * * * * * *"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '*'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: "* * * * * * * \n*           * \n*           * \n*           * \n*           * \n*           * \n* * * * * * *"
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: "* * * * * * * * * * * * \n*                     * \n*                     * \n*                     * \n*                     * \n*                     * \n*                     * \n*                     * \n*                     * \n*                     * \n*                     * \n* * * * * * * * * * * *"
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
editorial: '### Hollow Square Pattern.


  This problem evaluates core techniques in 5. Patterns & Printing (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printHollowSquare(int N) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printHollowSquare(n);\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static void printHollowSquare(int N){\n\n\n        for(int i=0;i<N;i++){\n            for(int j=0;j<N;j++){\n\n                if( i==0 || i==N-1 || j==0 || j == N-1){\n                    System.out.print(\"* \");\n                }else{\n                    System.out.print(\"  \");\n                }\n            }\n            System.out.println();\n\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printHollowSquare(n);\n    }\n}\n"
---

### Hollow Square Pattern.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
