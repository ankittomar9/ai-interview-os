---
slug: dsa-check-if-an-array-is-a-subset-of-another-array
title: Check if an array is a Subset of another array.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_55_Subset_Array.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3

    1 2 3

    3

    2 3 4'
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: '4

    4 9 5 1

    3

    9 4 8'
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '2

    1 3

    2

    2 4'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: '3

    1 1 1

    2

    1 2'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: '4

    10 20 30 40

    3

    15 25 35'
  expectedOutput: 'false'
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
editorial: '### Check if an array is a Subset of another array.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isSubset(int[] arr1, int[] arr2) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++) arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        System.out.println(isSubset(arr1, arr2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\nimport java.util.HashSet;\n\npublic class Main {\n    \n\n    public static boolean isSubset(int[] arr1, int[] arr2) {\n        // Edge Cases\n        if (arr1 == null || arr2 == null) return false;\n        if (arr2.length==0) return true; // An empty array is technically a subset of any array\n        if (arr2.length >arr1.length) return false; // arr2 can't be a subset if it's larger!\n\n        HashSet<Integer> set = new HashSet<>();\n\n        for (int i=0; i<arr1.length;i++) {\n            set.add(arr1[i]);\n        }\n        for (int i=0; i<arr2.length; i++) {\n            if (!set.contains(arr2[i])) {\n                return false; \n            }\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++)\
  \ arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        System.out.println(isSubset(arr1, arr2));\n    }\n}"
---

### Check if an array is a Subset of another array.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
