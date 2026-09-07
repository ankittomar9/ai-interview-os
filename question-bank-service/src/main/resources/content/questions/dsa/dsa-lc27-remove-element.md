---
slug: dsa-lc27-remove-element
title: Remove Element
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- arrays
- junior
- lc-27
buildProfile: judge0
source: inspired-by:operator-corpus/Q_2_RemoveElement.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: '3'
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: '4'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: '2'
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: '3'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: '4'
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
editorial: '### Remove Element


  This problem evaluates core techniques in Arrays. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int removeElement(int arr[],int val) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(removeElement(arr, target));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n        \n    \n    public static int removeElement(int arr[],int val){\n        if(arr==null || arr.length==0){return 0;}\n\n        int slow=0;\n\n        for(int fast=0;fast<arr.length;fast++){\n            if(arr[fast]!=val){\n                arr[slow]=arr[fast];\n                slow++;\n            }\n        }\n        return slow;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(removeElement(arr, target));\n    }\n}"
---

### Remove Element

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
