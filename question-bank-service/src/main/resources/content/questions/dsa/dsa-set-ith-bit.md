---
slug: dsa-set-ith-bit
title: Set Ith Bit
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [bit-manipulation]
est_minutes: 15
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_4_Set_ith_Bit.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: 'Evaluating n : 12 and Position i : 18

    Number after modifying ith Bit : 262156'
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: 'Evaluating n : 7 and Position i : 13

    Number after modifying ith Bit : 8199'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: 'Evaluating n : 10 and Position i : 25

    Number after modifying ith Bit : 33554442'
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: 'Evaluating n : 3 and Position i : 4

    Number after modifying ith Bit : 19'
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: 'Evaluating n : 15 and Position i : 5

    Number after modifying ith Bit : 47'
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
editorial: '### Set Ith Bit


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void ithBitSetHelper(int n,int i) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        ithBitSetHelper(a, b);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void ithBitSetHelper(int n,int i){\n         System.out.println(\"\\nEvaluating n : \"+n+ \" and Position i : \"+i);\n        int mask=1<<i;\n\n        int result= n | mask;\n         \n        System.out.println(\"Number after modifying ith Bit : \"+result);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        ithBitSetHelper(a, b);\n    }\n}"
---

### Set Ith Bit

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
