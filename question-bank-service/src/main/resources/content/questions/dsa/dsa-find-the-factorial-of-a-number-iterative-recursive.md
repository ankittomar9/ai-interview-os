---
slug: dsa-find-the-factorial-of-a-number-iterative-recursive
title: Find the Factorial of a number (Iterative & Recursive).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [math, recursion]
est_minutes: 15
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_7_Factorial_Of_Number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 'factorial of number is : 120

    Factorial of number is : 120'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 'factorial of number is : 3628800

    Factorial of number is : 3628800'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 'factorial of number is : 1

    Factorial of number is : 1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 'factorial of number is : 5040

    Factorial of number is : 5040'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 'factorial of number is : 479001600

    Factorial of number is : 479001600'
  weight: 50
hints:
- Analyze the problem using 1. Basic Numbers & Math (The "Warm Up" - 25 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 1. Basic Numbers & Math (The "Warm Up" - 25 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Find the Factorial of a number (Iterative & Recursive).


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void factorialCalculator(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        factorialCalculator(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n\n    public static void factorialCalculator(int n){\n        if(n<0){\n            System.out.println(\"Factorial of Negative number is not defined\"); return;\n        }\n        int fact=1;\n              //Method 1 Using For Loop\n        for(int i=1;i<=n;i++){\n            fact=fact*i;\n        }\n        System.out.println(\"factorial of number is : \"+fact);\n\n        //Method 2 Using while Loop\n\n        \n        int factorial=1;\n        int j=1;\n        while(j<=n){\n            factorial=factorial*j;\n            j++;\n        }\n         System.out.println(\"Factorial of number is : \"+fact);\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        factorialCalculator(n);\n    }\n}"
---

### Find the Factorial of a number (Iterative & Recursive).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
