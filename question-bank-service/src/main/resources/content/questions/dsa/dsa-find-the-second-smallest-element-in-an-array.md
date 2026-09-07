---
slug: dsa-find-the-second-smallest-element-in-an-array
title: Find the Second Smallest element in an array.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 2-arrays-the-core--40-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_28_Second_Largest_Element.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 'First max : 5

    Second max :4

    1 2 3 4 5'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 'First max : 4

    Second max :3

    4 2 1 3'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: 'First max : 4

    Second max :2

    -2 1 -3 4 -1 2'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 'First max : 10

    Second max :-2147483648

    10 10 10'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 'First max : 5

    Second max :4

    5 4 3 2 1'
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
editorial: '### Find the Second Smallest element in an array.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void secondLargestFinder(int arr[]) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        secondLargestFinder(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void secondLargestFinder(int arr[]){\n        if(arr==null || arr.length==0){\n            System.out.println(\"Empty array\"); return;\n        }\n        int n=arr.length;\n        int max=Integer.MIN_VALUE;\n        int secondMax=max;\n\n        for(int i=0;i<n;i++){\n            if(arr[i]>max){\n               secondMax=max;\n               max=arr[i];\n            }\n\n           else if(arr[i]!=max && arr[i]>secondMax){\n                secondMax=arr[i];\n            }\n        }\n\n        System.out.println(\"First max : \"+max);\n          System.out.println(\"Second max :\"+secondMax);\n        \n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        secondLargestFinder(arr);\n        for\
  \ (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n\n\n/*TC : is O(N)\n  SC :  is O(1)  \n\n  Approach 1 : Use two Loops for max and min\n  Approach 2 : sort and last second element is second max\n  */"
---

### Find the Second Smallest element in an array.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
