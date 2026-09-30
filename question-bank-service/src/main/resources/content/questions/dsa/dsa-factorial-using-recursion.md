---
slug: dsa-factorial-using-recursion
title: Factorial using recursion.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics:
- math
- recursion
est_minutes: 15
tags:
- 4-recursion--series-20-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_103_Factorial_Using_Recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '120'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '3628800'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '5040'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '479001600'
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
  approachHint: Utilize standard 4. Recursion & Series (20 Questions) techniques to
    solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Factorial using recursion.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static long factorialHelper(int\
  \ n) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n\
  \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n = sc.nextInt();\n        System.out.println(factorialHelper(n));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static\
  \ long factorialHelper(int n){\n        if (n<0) {\n    throw new IllegalArgumentException(\"\
  Factorial is not defined for negative numbers.\");\n        }\n        if(n==0){\
  \  return 1; }\n        if(n==1){ return 1;}\n\n        long factorial=factorialHelper(n-1)*n;\n\
  \        return factorial;\n\n    }\n\n    public static void main(String[] args)\
  \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n = sc.nextInt();\n        System.out.println(factorialHelper(n));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-factorial-using-recursion
  label: Canonical — Factorial using recursion.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Factorial using recursion..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n    public static long\
    \ factorialHelper(int n){\n        if (n<0) {\n    throw new IllegalArgumentException(\"\
    Factorial is not defined for negative numbers.\");\n        }\n        if(n==0){\
    \  return 1; }\n        if(n==1){ return 1;}\n\n        long factorial=factorialHelper(n-1)*n;\n\
    \        return factorial;\n\n    }\n\n    public static void main(String[] args)\
    \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        int n = sc.nextInt();\n        System.out.println(factorialHelper(n));\n\
    \    }\n}"
- approachId: iterative-factorial-loop
  label: Alternate — Iterative Accumulator Loop
  approachClass: ALTERNATE
  kind: CODE
  summary: Computes factorial using a linear iterative loop with O(1) auxiliary space.
  keyIdea: Forward iterative multiplication avoiding recursive call stack overhead.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - O(1) memory without stack overflow hazard on large n
  - Requires 64-bit long or BigInteger for n > 20
  whenToUse: Preferred in production environments where stack safety is essential.
  code: "import java.util.*;\n\npublic class Main {\n    public static long factorialIterative(int\
    \ n) {\n        long res = 1;\n        for (int i = 2; i <= n; i++) res *= i;\n\
    \        return res;\n    }\n\n    public static void main(String[] args) {\n\
    \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
    \        int n = sc.nextInt();\n        System.out.println(factorialIterative(n));\n\
    \    }\n}\n"
---

### Factorial using recursion.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
