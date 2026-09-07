---
slug: dsa-lc29-divide-two-integers
title: Divide Two Integers
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [bit-manipulation]
est_minutes: 25
tags:
- bit-manipulation
- mid
- lc-29
buildProfile: judge0
source: inspired-by:operator-corpus/Q_25_Divide_Two_Integers.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: '0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: '0'
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: '3'
  weight: 50
hints:
- Analyze the problem using Bit Manipulation algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Bit Manipulation techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Divide Two Integers


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int solve(int dividend ,int divisor) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(solve(a, b));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static int solve(int dividend ,int divisor){\n        if(dividend == Integer.MIN_VALUE && divisor == -1){ return Integer.MAX_VALUE;      }\n        boolean isNegative =(dividend < 0) ^ (divisor < 0);\n        long absDividend =Math.abs((long) dividend);\n        long absDivisor =Math.abs((long) divisor);\n\n        int quotient=0;\n        while(absDividend >= absDivisor){\n            long tempDivisor = absDivisor;\n            long multiple =1;\n\n            while(absDividend >= (tempDivisor << 1)){\n                tempDivisor = tempDivisor <<1;\n                multiple =multiple <<1;\n            }\n            absDividend = absDividend -tempDivisor;\n            quotient = (int) (quotient + multiple);\n        }\n        return isNegative ? -quotient : quotient;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int\
  \ a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(solve(a, b));\n    }\n}"
---

### Divide Two Integers

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
