---
slug: dsa-right-triangle-number-pattern
title: Right Triangle Number Pattern.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 5-patterns--printing-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_127_Right_Triangle_Number_Pattern.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: "1 \n1 2 \n1 2 3 \n1 2 3 4 \n1 2 3 4 5"
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: "1 \n1 2 \n1 2 3 \n1 2 3 4 \n1 2 3 4 5 \n1 2 3 4 5 6 \n1 2 3 4 5 6 7 \n1 2 3 4 5 6 7 8 \n1 2 3 4 5 6 7 8 9 \n1 2 3 4 5 6 7 8 9 10"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: "1 \n1 2 \n1 2 3 \n1 2 3 4 \n1 2 3 4 5 \n1 2 3 4 5 6 \n1 2 3 4 5 6 7"
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: "1 \n1 2 \n1 2 3 \n1 2 3 4 \n1 2 3 4 5 \n1 2 3 4 5 6 \n1 2 3 4 5 6 7 \n1 2 3 4 5 6 7 8 \n1 2 3 4 5 6 7 8 9 \n1 2 3 4 5 6 7 8 9 10 \n1 2 3 4 5 6 7 8 9 10 11 \n1 2 3 4 5 6 7 8 9 10 11 12"
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
editorial: '### Right Triangle Number Pattern.


  This problem evaluates core techniques in 5. Patterns & Printing (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printNumberTriangle(int N) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printNumberTriangle(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void printNumberTriangle(int N){\n\n        for(int i=1;i<=N;i++){\n\n            for(int j=1;j<=i;j++){\n\n                System.out.print(j+ \" \");\n            }\n            System.out.println();\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printNumberTriangle(n);\n    }\n}"
---

### Right Triangle Number Pattern.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
