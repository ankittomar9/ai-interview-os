---
slug: dsa-find-the-hcf-gcd-of-two-numbers
title: Find the HCF (GCD) of two numbers.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_15_HCF_GCD_Optimized.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: '6'
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: '1'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: '5'
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: '1'
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: '5'
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
editorial: '### Find the HCF (GCD) of two numbers.


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int hcd_gcd_helper(int a,int b) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(hcd_gcd_helper(a, b));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int hcd_gcd_helper(int a,int b){\n\n        while(b!=0){\n            int remainder=a%b;\n\n            a=b;\n            b=remainder;\n        }\n\n        return Math.abs(a);\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(hcd_gcd_helper(a, b));\n    }\n}"
---

### Find the HCF (GCD) of two numbers.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
