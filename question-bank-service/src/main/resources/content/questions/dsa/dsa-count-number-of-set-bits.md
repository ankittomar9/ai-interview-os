---
slug: dsa-count-number-of-set-bits
title: Count number of set bits
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [bit-manipulation]
est_minutes: 25
tags:
- bit-manipulation-8
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_8_Count_number_of_set_bits.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: "Count of Set bits are : \n2\nCount of Set bits are : \n2"
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: "Count of Set bits are : \n2\nCount of Set bits are : \n2"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: "Count of Set bits are : \n1\nCount of Set bits are : \n1"
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: "Count of Set bits are : \n3\nCount of Set bits are : \n3"
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: "Count of Set bits are : \n2\nCount of Set bits are : \n2"
  weight: 50
hints:
- Analyze the problem using Bit Manipulation 8 algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Bit Manipulation 8 techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Count number of set bits


  This problem evaluates core techniques in Bit Manipulation 8. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void countSetBitsHelper(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        countSetBitsHelper(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void countSetBitsHelper(int n){\n        int count =0;\n        //why 32 because integer has 32 \n        int n2=n;\n        for(int i=0;i<32;i++){\n           int mask=1<<i;\n            if((n & mask )!=0){\n                count++;\n            }\n        }\n          System.out.println(\"Count of Set bits are : \\n\"+count);\n          //approach 2\n            int count2=0;\n            while(n2>0){\n                if((n2 & 1)!=0){\n                    count2++;\n                }\n                n2=n2>>1;\n            }\n             System.out.println(\"Count of Set bits are : \\n\"+count2);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        countSetBitsHelper(n);\n    }\n}"
---

### Count number of set bits

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
