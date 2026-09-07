---
slug: dsa-unset-bits-from-right
title: Unset Bits From Right
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_11_Unset_bits_from_right.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: "Number after Unsetting\n  bit from right : 0"
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: "Number after Unsetting\n  bit from right : 0"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: "Number after Unsetting\n  bit from right : 0"
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: "Number after Unsetting\n  bit from right : 0"
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: "Number after Unsetting\n  bit from right : 0"
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
editorial: '### Unset Bits From Right


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void solve(long A,long B) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        long a = sc.nextLong();\n        long b = sc.nextLong();\n        solve(a, b);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void solve(long A,long B){\n        for(int i=0;i<B;i++){\n            long mask =1L<<i;\n            A= A & ~(mask);\n        }\n           System.out.println(\"Number after Unsetting\" );\n        System.out.println(\"  bit from right : \"+A);\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        long a = sc.nextLong();\n        long b = sc.nextLong();\n        solve(a, b);\n    }\n}"
---

### Unset Bits From Right

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
