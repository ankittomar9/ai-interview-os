---
slug: dsa-sort-first-half-in-ascending-and-second-half-in-descending-order
title: Sort first half in Ascending and second half in Descending order.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_33_Sort_Half_Asc_Half_Desc.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 1 2 5 4 3
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 2 4 3 1
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: -3 -2 1 4 2 -1
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 10 10 10
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 4 5 3 2 1
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
editorial: '### Sort first half in Ascending and second half in Descending order.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void customSortHelper(int arr[]) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        customSortHelper(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static void customSortHelper(int arr[]){\n        int n=arr.length;\n        int mid=n/2;\n        Arrays.sort(arr,0,mid);\n        Arrays.sort(arr,mid,n);\n        reverseSubArray(arr, mid, n - 1);\n    }\n    public static void reverseSubArray(int[] arr,int start,int end){\n        while(start<end){\n            int temp=arr[start];\n            arr[start]=arr[end];\n            arr[end]=temp;\n            start++;\n            end--;\n        }\n    }\n    \n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        customSortHelper(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Sort first half in Ascending and second half in Descending order.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
