---
slug: dsa-find-the-smallest-element-in-an-array
title: Find the Smallest element in an array.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [arrays]
est_minutes: 15
tags:
- 2-arrays-the-core--40-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_26_Find_Largest_Element_Array.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '5'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '4'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '4'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '10'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '5'
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
editorial: '### Find the Smallest element in an array.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int findLargest(int arr[]) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(findLargest(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    /*Appraoch we could have done this question in Logn time only\n     if array was sorted otherwise O(n) is best time complexity */\n    \n        public static int findLargest(int arr[]){\n            if(arr==null || arr.length==0){\n            throw new IllegalArgumentException(\"Array is empty\");\n            }\n            int max=Integer.MIN_VALUE;\n            for(int i=0;i<arr.length;i++){\n                if(arr[i]>max){\n                max=arr[i];\n                }\n            }\n            \n            return max;\n        }\n   \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(findLargest(arr));\n    }\n}\n\n/*TC : is O(N)\n  SC :  is O(1)  \n*/"
---

### Find the Smallest element in an array.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
