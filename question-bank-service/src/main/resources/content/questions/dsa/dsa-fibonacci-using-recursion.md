---
slug: dsa-fibonacci-using-recursion
title: Fibonacci using recursion.
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
source: inspired-by:operator-corpus/Q_104_Fibonaaci_Series_Using_Recursion.java
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
editorial: '### Fibonacci using recursion.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static long fibonacciHelper(int\
  \ n) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n\
  \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n = sc.nextInt();\n        System.out.println(fibonacciHelper(n));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static\
  \ long fibonacciHelper(int n){\n        if(n==0){return 0;}\n        if(n==1){return\
  \ 1;}\n\n        long result=fibonacciHelper(n-1)+fibonacciHelper(n-2);\n\n    \
  \    return result;\n    }   \n\n    public static void main(String[] args) {\n\
  \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n = sc.nextInt();\n        System.out.println(fibonacciHelper(n));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-fibonacci-using-recursion
  label: Canonical — Fibonacci using recursion.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Fibonacci using recursion..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n    public static long\
    \ fibonacciHelper(int n){\n        if(n==0){return 0;}\n        if(n==1){return\
    \ 1;}\n\n        long result=fibonacciHelper(n-1)+fibonacciHelper(n-2);\n\n  \
    \      return result;\n    }   \n\n    public static void main(String[] args)\
    \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        int n = sc.nextInt();\n        System.out.println(fibonacciHelper(n));\n\
    \    }\n}"
- approachId: iterative-state-fibonacci
  label: Alternate — Constant Space Iterative Rolling State
  approachClass: ALTERNATE
  kind: CODE
  summary: Computes the Nth Fibonacci number in O(N) time using two rolling state
    variables.
  keyIdea: Sliding window of two variables (a, b) eliminating exponential recursive
    branching.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Drastically drops time complexity from O(2^N) to O(N)
  - Reduces memory consumption to strictly O(1)
  whenToUse: Essential optimization when moving from naive recursion to production
    code.
  code: "import java.util.*;\n\npublic class Main {\n    public static long fibonacciIterative(int\
    \ n) {\n        if (n <= 1) return n;\n        long a = 0, b = 1;\n        for\
    \ (int i = 2; i <= n; i++) {\n            long c = a + b;\n            a = b;\n\
    \            b = c;\n        }\n        return b;\n    }\n\n    public static\
    \ void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n \
    \       if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(fibonacciIterative(n));\n\
    \    }\n}\n"
---

### Fibonacci using recursion.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
