---
slug: dsa-leaders-in-an-array-element-all-elements-to-its-right
title: Leaders in an array (Element > all elements to its right).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_58_Leaders_In_Array.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: "5 \n1 2 3 4 5"
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: "3 4 \n4 2 1 3"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: "2 4 \n-2 1 -3 4 -1 2"
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: "10 \n10 10 10"
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: "1 2 3 4 5 \n5 4 3 2 1"
  weight: 50
hints:
- Analyze the problem using 2. Arrays (The "Core" - 40 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 2. Arrays (The "Core" - 40 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Leaders in an array (Element > all elements to its right).


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void findLeaders(int[] arr) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        findLeaders(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static void findLeaders(int[] arr) {\n        if (arr == null || arr.length == 0) return;\n\n        int n = arr.length;\n        \n        // Step 1: The rightmost element is ALWAYS a leader\n        int maxFromRight = arr[n - 1];\n        System.out.print(maxFromRight + \" \");\n\n        for (int i = n - 2; i >= 0; i--) {\n            \n            \n            if (arr[i] > maxFromRight) {\n                // Set it leader! \n                System.out.print(arr[i] + \" \");\n                maxFromRight = arr[i];\n            }\n        }\n        System.out.println(); \n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        findLeaders(arr);\n        for (int i = 0; i < arr.length;\
  \ i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Leaders in an array (Element > all elements to its right).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
