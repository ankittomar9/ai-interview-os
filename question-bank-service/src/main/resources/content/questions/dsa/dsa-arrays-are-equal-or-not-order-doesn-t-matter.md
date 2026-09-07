---
slug: dsa-arrays-are-equal-or-not-order-doesn-t-matter
title: Arrays are Equal or Not (Order doesn't matter).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_56_Arrays_Equal_Or_Not.java
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
editorial: '### Arrays are Equal or Not (Order doesn''t matter).


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean areArraysEqual(int[] a, int[] b) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++) arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        System.out.println(areArraysEqual(arr1, arr2));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.HashMap;\npublic class Main {\n    \n    public static boolean areArraysEqual(int[] a, int[] b) {\n        // Edge cases and length check\n        if (a == null || b == null) return false;\n        if (a.length != b.length) return false;\n\n        HashMap<Integer, Integer> frequencyMap = new HashMap<>();\n\n        for (int i=0; i<a.length; i++) {\n            int currentNumber = a[i];\n            frequencyMap.put(currentNumber, frequencyMap.getOrDefault(currentNumber, 0) + 1);\n        }\n        for (int i=0; i<b.length; i++) {\n            int currentNumber = b[i];\n\n          \n            if (!frequencyMap.containsKey(currentNumber) || frequencyMap.get(currentNumber) == 0) {\n                return false;\n            }\n            frequencyMap.put(currentNumber, frequencyMap.get(currentNumber) - 1);\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++) arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        System.out.println(areArraysEqual(arr1, arr2));\n    }\n}"
---

### Arrays are Equal or Not (Order doesn't matter).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
