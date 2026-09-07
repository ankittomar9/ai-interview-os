---
slug: dsa-fibonacci-series-using-recursion
title: Fibonacci Series Using Recursion
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [math, recursion]
est_minutes: 25
tags:
- recursion
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_10_Fibonacci_Series_using_recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '5'
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
  expectedOutput: '13'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '144'
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
editorial: '### Fibonacci Series Using Recursion


  This problem evaluates core techniques in Recursion. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int fibonacci_Helper(int n) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(fibonacci_Helper(n));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    /*calculate fibonaaci series  */\n    \n    public static int fibonacci_Helper(int n){\n        // base case\n        if (n == 0) return 0;\n        if (n == 1) return 1;\n\n         int fn_1 = fibonacci_Helper(n - 1);\n            int fn_2 = fibonacci_Helper(n - 2);\n           int myResult = fn_1 + fn_2;       \n             return myResult;\n    }\n \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(fibonacci_Helper(n));\n    }\n}"
---

### Fibonacci Series Using Recursion

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
