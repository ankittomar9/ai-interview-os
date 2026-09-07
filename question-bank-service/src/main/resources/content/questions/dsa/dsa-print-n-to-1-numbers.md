---
slug: dsa-print-n-to-1-numbers
title: Print N To 1 Numbers
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [recursion]
est_minutes: 25
tags:
- recursion
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_1_Print_N_to_1_Numbers.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 5 4 3 2 1
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 10 9 8 7 6 5 4 3 2 1
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 7 6 5 4 3 2 1
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 12 11 10 9 8 7 6 5 4 3 2 1
  weight: 50
hints:
- Analyze the problem using Recursion algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Recursion techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Print N To 1 Numbers


  This problem evaluates core techniques in Recursion. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void n_to_1_print_Helper(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        n_to_1_print_Helper(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n\n    /*Print from from N to 1 */\n    \n    public static void n_to_1_print_Helper(int n){\n        if(n<=0){ // base case\n            return ;\n        }\n        System.out.print(n+\" \");\n        n_to_1_print_Helper(n-1);\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        n_to_1_print_Helper(n);\n    }\n}\n/*\nTC:O(n)\nSC:O(n) because of call stack recursion takes \n*/"
---

### Print N To 1 Numbers

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
