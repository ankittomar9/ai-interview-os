---
slug: dsa-print-1-to-100-without-using-loop
title: Print 1 to 100 without using loop.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [recursion]
est_minutes: 15
tags:
- 4-recursion--series-20-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_101_Print_1_to_10_Using_Recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 1 2 3 4 5
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 1 2 3 4 5 6 7 8 9 10
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 1 2 3 4 5 6 7
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 1 2 3 4 5 6 7 8 9 10 11 12
  weight: 50
hints:
- Analyze the problem using 4. Recursion & Series (20 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 4. Recursion & Series (20 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Print 1 to 100 without using loop.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void numberPrinterhelper(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        numberPrinterhelper(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void numberPrinterhelper(int n){\n        if(n==0){return ;}\n        numberPrinterhelper(n-1);\n         System.out.print(n+\" \");\n\n         //change the position of sysout if you want to print in reverse\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        numberPrinterhelper(n);\n    }\n}"
---

### Print 1 to 100 without using loop.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
