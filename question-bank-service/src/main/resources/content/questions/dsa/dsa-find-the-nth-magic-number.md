---
slug: dsa-find-the-nth-magic-number
title: Find The Nth Magic Number
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_12_Find_the_nth_magic_number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: 'Nth Magic Number: 110808'
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: 'Nth Magic Number: 2379'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: 'Nth Magic Number: 391250'
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: 'Nth Magic Number: 20'
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: 'Nth Magic Number: 780'
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
editorial: '### Find The Nth Magic Number


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void nthMagicNumberHelper(long n,long p) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        long a = sc.nextLong();\n        long b = sc.nextLong();\n        nthMagicNumberHelper(a, b);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static  void nthMagicNumberHelper(long n,long p){\n        long power=p;\n        long answer=0;\n        while(n>0){\n            if((n & 1)==1){\n                answer=power+answer;\n            }\n            power=power*p;\n            n=n>>1;\n        }\n         System.out.println(\"Nth Magic Number: \" + answer);\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        long a = sc.nextLong();\n        long b = sc.nextLong();\n        nthMagicNumberHelper(a, b);\n    }\n}"
---

### Find The Nth Magic Number

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
