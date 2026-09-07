---
slug: dsa-lc88-merge-sorted-array
title: Merge Sorted Array
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [arrays]
est_minutes: 15
tags:
- arrays
- junior
- lc-88
buildProfile: judge0
source: inspired-by:operator-corpus/Q_1_Merge_Sorted_Array.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    1 2 3

    2 5 6'
  expectedOutput: 1 2 2 3 5 6
  description: Primary test case
- name: Sample 2
  input: '1 0

    1

    '
  expectedOutput: '1'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 1

    1 3 5

    2'
  expectedOutput: 1 2 3 5
  weight: 25
- name: Hidden 2
  input: '4 2

    2 4 6 8

    1 3'
  expectedOutput: 1 2 3 4 6 8
  weight: 25
- name: Hidden 3
  input: '2 3

    4 5

    1 2 3'
  expectedOutput: 1 2 3 4 5
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
editorial: '### Merge Sorted Array


  This problem evaluates core techniques in Arrays. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void MergeSortedArray(int nums1[],int m,int nums2[],int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int m = sc.nextInt();\n        int n = sc.nextInt();\n        int[] arr1 = new int[m + n];\n        for (int i = 0; i < m; i++) arr1[i] = sc.nextInt();\n        int[] arr2 = new int[n];\n        for (int i = 0; i < n; i++) arr2[i] = sc.nextInt();\n        MergeSortedArray(arr1, m, arr2, n);\n        for (int i = 0; i < arr1.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr1[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static void MergeSortedArray(int nums1[],int m,int nums2[],int n){\n        int i=m-1;\n        int j=n-1;\n        int k=m+n-1;\n\n        while(i>=0 && j>=0){\n            if(nums1[i]>nums2[j]){\n                nums1[k]=nums1[i];\n                k--;\n                i--;\n            }else{\n                nums1[k]=nums2[j];\n                k--;j--;\n            }\n        }\n        while(j>=0){\n            nums1[k]=nums2[j];\n            k--;j--;\n        }\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int m = sc.nextInt();\n        int n = sc.nextInt();\n        int[] arr1 = new int[m + n];\n        for (int i = 0; i < m; i++) arr1[i] = sc.nextInt();\n        int[] arr2 = new int[n];\n        for (int i = 0; i < n; i++) arr2[i] = sc.nextInt();\n        MergeSortedArray(arr1,\
  \ m, arr2, n);\n        for (int i = 0; i < arr1.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr1[i]);\n        System.out.println();\n    }\n}"
---

### Merge Sorted Array

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
