---
slug: dsa-ith-bit-set-unset
title: Ith Bit Set Unset
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_3_ith_bit_Set_Unset.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: Bit at index(Position) 18 is UNSET (0)
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: Bit at index(Position) 13 is UNSET (0)
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: Bit at index(Position) 25 is UNSET (0)
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: Bit at index(Position) 4 is UNSET (0)
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: Bit at index(Position) 5 is UNSET (0)
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
editorial: '### Ith Bit Set Unset


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void ithBitSetUnsetHelper(int n,int i) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        ithBitSetUnsetHelper(a, b);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void ithBitSetUnsetHelper(int n,int i){\n           if(n==0){System.out.println(\"0 is already unset\");return ;}\n\n           int mask=1<<i;\n           \n           if( (n & mask)!=0){\n              System.out.println(\"Bit at index(Position) \" + i + \" is SET (1)\");\n           }else{\n             System.out.println(\"Bit at index(Position) \" + i + \" is UNSET (0)\");\n           }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        ithBitSetUnsetHelper(a, b);\n    }\n}"
---

### Ith Bit Set Unset

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
