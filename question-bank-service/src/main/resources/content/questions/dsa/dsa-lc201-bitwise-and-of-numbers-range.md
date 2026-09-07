---
slug: dsa-lc201-bitwise-and-of-numbers-range
title: Bitwise AND of Numbers Range
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [bit-manipulation]
est_minutes: 25
tags:
- bit-manipulation
- mid
- lc-201
buildProfile: judge0
source: inspired-by:operator-corpus/Q_130_Bitwise_AND_of_Numbers_Range.java
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
  expectedOutput: '15'
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
editorial: '### Bitwise AND of Numbers Range


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int rangeBitwiseAnd(int left,int right) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(rangeBitwiseAnd(a, b));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n\n    public static int rangeBitwiseAnd(int left,int right){\n        int shift=0;\n\n        while(left<right){\n            left=left>>1;\n            right=right>>1;\n            shift++;\n        }\n        int result=left<<shift;\n        return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(rangeBitwiseAnd(a, b));\n    }\n}"
---

### Bitwise AND of Numbers Range

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
