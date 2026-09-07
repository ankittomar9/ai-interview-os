---
slug: dsa-merge-two-sorted-arrays
title: Merge two sorted arrays.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_41_Merge_two_Sorted_Array.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3

    1 2 3

    3

    2 3 4'
  expectedOutput: 1 2 2 3 3 4
  description: Primary test case
- name: Sample 2
  input: '4

    4 9 5 1

    3

    9 4 8'
  expectedOutput: 4 9 5 1 9 4 8
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '2

    1 3

    2

    2 4'
  expectedOutput: 1 2 3 4
  weight: 25
- name: Hidden 2
  input: '3

    1 1 1

    2

    1 2'
  expectedOutput: 1 1 1 1 2
  weight: 25
- name: Hidden 3
  input: '4

    10 20 30 40

    3

    15 25 35'
  expectedOutput: 10 15 20 25 30 35 40
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
editorial: '### Merge two sorted arrays.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] mergeArrays(int[] arr1,int[] arr2  ) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++) arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        int[] res = mergeArrays(arr1, arr2);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static int[] mergeArrays(int[] arr1,int[] arr2  ){\n        if(arr1==null || arr1.length==0)return arr2;\n        if(arr2==null || arr2.length==0)return arr1;\n        int n1=arr1.length; int n2=arr2.length;\n\n        int[] result= new int[n1+n2];\n\n        int i=0; int j=0; int k=0;\n        while(i< n1 && j < n2 ){\n            if(arr1[i]<=arr2[j]){\n                result[k]=arr1[i];\n                i++;\n            }else{\n                result[k]=arr2[j];\n                j++;\n            }\n            k++;\n        }\n        while (i < n1) {\n            result[k] = arr1[i];\n            i++;\n            k++;\n        }\n        // If arr2 has leftovers...\n        while (j < n2) {\n            result[k] = arr2[j];\n            j++;\n            k++;\n        }\n        return result;\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++) arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        int[] res = mergeArrays(arr1, arr2);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Merge two sorted arrays.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
