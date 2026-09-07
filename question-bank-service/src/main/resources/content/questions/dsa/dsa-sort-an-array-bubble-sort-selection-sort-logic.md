---
slug: dsa-sort-an-array-bubble-sort-selection-sort-logic
title: Sort an array (Bubble Sort / Selection Sort logic).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_34_Sort_an_array_without_using_inbuilt_Library.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 'Array sorted early! Breaking at pass: 1

    1 2 3 4 5'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 'Array sorted early! Breaking at pass: 3

    1 2 3 4'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: 'Array sorted early! Breaking at pass: 3

    -3 -2 -1 1 2 4'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 'Array sorted early! Breaking at pass: 1

    10 10 10'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 1 2 3 4 5
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
editorial: '### Sort an array (Bubble Sort / Selection Sort logic).


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void bubbleSortHelper(int arr[]) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        bubbleSortHelper(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static void bubbleSortHelper(int arr[]){\n       if(arr==null || arr.length==0){return;}\n         int n=arr.length;\n         for(int i=0;i<n-1;i++){\n            boolean isSwapped=false;\n            for(int j=0;j<n-1-i;j++){\n                if(arr[j]>arr[j+1]){\n                    int temp=arr[j];\n                    arr[j]=arr[j+1];\n                    arr[j+1]=temp;\n                    isSwapped=true;\n                }\n            }\n            if(isSwapped==false){\n                System.out.println(\"Array sorted early! Breaking at pass: \" + (i + 1));\n                break;\n            }\n         }   \n    }   \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n       \
  \ bubbleSortHelper(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Sort an array (Bubble Sort / Selection Sort logic).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
