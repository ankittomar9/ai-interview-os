---
slug: dsa-lc260-single-number-iii
title: Single Number III
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [bit-manipulation]
est_minutes: 25
tags:
- bit-manipulation
- mid
- lc-260
buildProfile: judge0
source: inspired-by:operator-corpus/Q_99_Single_Number_III.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 7 6
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 4 0
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: 3 -8
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 10 0
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 7 6
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
editorial: '### Single Number III


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] singleNumber(int[] nums) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = singleNumber(arr);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int[] singleNumber(int[] nums){\n        int xorAll=0;\n\n        for(int i=0;i<nums.length;i++){\n            xorAll=xorAll^nums[i];\n        }\n\n        int diffBit=xorAll & (-xorAll);\n\n        int group1=0;\n        int group2=0;\n\n        for(int i=0;i<nums.length;i++){\n            if((nums[i] & diffBit) !=0){\n                group1=group1^nums[i];\n            }else{\n                group2=group2^nums[i];\n            }\n        }\n        return new int[]{group1,group2};\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = singleNumber(arr);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i >\
  \ 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Single Number III

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
