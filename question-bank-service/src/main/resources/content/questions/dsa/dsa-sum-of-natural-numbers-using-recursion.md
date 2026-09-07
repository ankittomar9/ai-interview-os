---
slug: dsa-sum-of-natural-numbers-using-recursion
title: Sum of natural numbers using recursion.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 4-recursion--series-20-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_102_Sum_of_Natural_Numbers_Using_Recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '15'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '55'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '28'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '78'
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
editorial: '### Sum of natural numbers using recursion.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static long naturalNumberSumHelper(int n) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(naturalNumberSumHelper(n));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static long naturalNumberSumHelper(int n){\n        if(n<0){\n            throw new IllegalArgumentException(\"Negative  numbers are not natural Sum not Defined.\");\n        }\n        if(n==0){return 0 ;}\n\n        long sum=0;\n        sum=naturalNumberSumHelper(n-1)+n;\n        return  sum;\n       }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(naturalNumberSumHelper(n));\n    }\n}"
---

### Sum of natural numbers using recursion.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
