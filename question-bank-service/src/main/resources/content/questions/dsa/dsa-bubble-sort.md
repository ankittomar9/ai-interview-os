---
slug: dsa-bubble-sort
title: Bubble Sort.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- 6-sorting--searching-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_139_Bubble_Sort.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: "Array is already sorted \n1 2 3 4 5"
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: "Sorted array asc \n[1, 2, 3, 4]\n1 2 3 4"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: "Sorted array asc \n[-3, -2, -1, 1, 2, 4]\n-3 -2 -1 1 2 4"
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: "Array is already sorted \n10 10 10"
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: "Sorted array asc \n[1, 2, 3, 4, 5]\n1 2 3 4 5"
  weight: 50
hints:
- Analyze the problem using 6. Sorting & Searching (15 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 6. Sorting & Searching (15 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Bubble Sort.


  This problem evaluates core techniques in 6. Sorting & Searching (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void bubbleSort(int arr[]) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        bubbleSort(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static void bubbleSort(int arr[]){\n         if (arr==null || arr.length<=1) {    return;         }\n         int n=arr.length;boolean isSwapped=false;\n\n         for(int i=0;i<n-1;i++){\n            \n            for(int j=0;j<n-i-1;j++){\n                if(arr[j]>arr[j+1]){\n                    int temp=arr[j];\n                    arr[j]=arr[j+1];\n                    arr[j+1]=temp;\n                    isSwapped=true;\n                }\n            }\n            if(!isSwapped) break;\n         }\n         if(isSwapped==true){\n                  System.out.println(\"Sorted array asc \\n\"+Arrays.toString(arr));\n            }else{\n                  System.out.println(\"Array is already sorted \");\n            }\n            }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n\
  \        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        bubbleSort(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Bubble Sort.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
