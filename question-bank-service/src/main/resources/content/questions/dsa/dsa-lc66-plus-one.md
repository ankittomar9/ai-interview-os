---
slug: dsa-lc66-plus-one
title: Plus One
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [arrays]
est_minutes: 15
tags:
- arrays
- junior
- lc-66
buildProfile: judge0
source: inspired-by:operator-corpus/Q_132_Plus_One.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 1 2 3 4 6
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 4 2 1 4
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: -2 1 -3 4 -1 3
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 1 0 0 0
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 5 4 3 2 2
  weight: 50
hints:
- Analyze the problem using Arrays algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Arrays techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Plus One


  This problem evaluates core techniques in Arrays. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] plusOne(int[] digits) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = plusOne(arr);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \npublic static int[] plusOne(int[] digits){\n    int n=digits.length;\n\n    for(int i=n-1;i>=0;i--){\n        if(digits[i]<9){\n            digits[i]++;\n            return digits;\n        }\n        digits[i]=0;\n    }\n\n    int[] result =new int[n+1];\n    result[0]=1;\n    return result;\n}\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = plusOne(arr);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Plus One

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
