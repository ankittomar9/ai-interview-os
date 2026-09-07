---
slug: dsa-nth-term-of-geometric-progression
title: Nth term of Geometric Progression.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 4-recursion--series-20-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_116_Nth_Term_GP_Recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 1 2 3
  expectedOutput: '4'
  description: Primary test case
- name: Sample 2
  input: 10 5 2
  expectedOutput: '50'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 7 7 7
  expectedOutput: '823543'
  weight: 25
- name: Hidden 2
  input: 4 8 2
  expectedOutput: '32'
  weight: 25
- name: Hidden 3
  input: 12 15 18
  expectedOutput: '1721883310909009076'
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
editorial: '### Nth term of Geometric Progression.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static long nthTermGP(int a,int r,int N) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int c = sc.nextInt();\n        System.out.println(nthTermGP(a, b, c));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static long nthTermGP(int a,int r,int N){\n        if(N==1){\n            return a;\n        }\n\n        return r*nthTermGP(a, r, N-1);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int c = sc.nextInt();\n        System.out.println(nthTermGP(a, b, c));\n    }\n}"
---

### Nth term of Geometric Progression.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
