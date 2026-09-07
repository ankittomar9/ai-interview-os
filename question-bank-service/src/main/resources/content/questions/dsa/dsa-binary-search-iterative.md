---
slug: dsa-binary-search-iterative
title: Binary Search (Iterative).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 6-sorting--searching-15-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_137_Binary_Search_Iterative.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: '2'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: '1'
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
editorial: '### Binary Search (Iterative).


  This problem evaluates core techniques in 6. Sorting & Searching (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int binarySearchHelper(int arr[],int target) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(binarySearchHelper(arr, target));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static int binarySearchHelper(int arr[],int target){\n         if(arr==null || arr.length==0){System.out.println(\"Array is null or empty\");\n         return -1;}\n\n         int low=0;         int high=arr.length-1;\n         while(low<=high){\n            int mid=low+(high-low)/2;\n            if(arr[mid]==target){\n                return mid;\n            }\n            else if(arr[mid]<target){\n                low=mid+1;\n            }else{\n                  high=mid-1;\n           }         }\n         return -1;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(binarySearchHelper(arr, target));\n    }\n}"
---

### Binary Search (Iterative).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
