---
slug: dsa-rotate-elements-of-an-array-left-right-by-k-positions
title: Rotate elements of an array (Left/Right) by K positions.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_38_Rotate_Array_by_K_Positions_right.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5 1 3

    10 20 30 40 50'
  expectedOutput: 10 40 30 20 50
  description: Primary test case
- name: Sample 2
  input: '4 0 2

    1 2 3 4'
  expectedOutput: 3 2 1 4
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 0 1

    5 10 15'
  expectedOutput: 10 5 15
  weight: 25
- name: Hidden 2
  input: '5 2 4

    2 4 6 8 10'
  expectedOutput: 2 4 10 8 6
  weight: 25
- name: Hidden 3
  input: '4 1 2

    100 200 300 400'
  expectedOutput: 100 300 200 400
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
editorial: '### Rotate elements of an array (Left/Right) by K positions.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void reverseHelper(int arr[],int start,int end) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        reverseHelper(arr, a, b);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static void reverseHelper(int arr[],int start,int end){\n        if (arr == null || arr.length <= 1) return;  \n        int i=start; int j=end;\n        while(i<j){\n            int temp=arr[i];\n            arr[i]=arr[j];\n            arr[j]=temp;\n            i++;j--;\n        }\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        reverseHelper(arr, a, b);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Rotate elements of an array (Left/Right) by K positions.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
