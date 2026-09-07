---
slug: dsa-linear-search-using-recursion
title: Linear Search Using Recursion
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- recursion
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_8_Linear_Search_using_recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5 1 3

    10 20 30 40 50'
  expectedOutput: '-1'
  description: Primary test case
- name: Sample 2
  input: '4 0 2

    1 2 3 4'
  expectedOutput: '1'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 0 1

    5 10 15'
  expectedOutput: '-1'
  weight: 25
- name: Hidden 2
  input: '5 2 4

    2 4 6 8 10'
  expectedOutput: '-1'
  weight: 25
- name: Hidden 3
  input: '4 1 2

    100 200 300 400'
  expectedOutput: '-1'
  weight: 50
hints:
- Analyze the problem using Recursion algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Recursion techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Linear Search Using Recursion


  This problem evaluates core techniques in Recursion. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int linearSearchHelper(int arr[] ,int index,int target) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(linearSearchHelper(arr, a, b));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static int linearSearchHelper(int arr[] ,int index,int target){\n        //Base Case\n        if(index==arr.length){\n            return -1;\n        }\n        //Main logic\n        if(arr[index]==target){\n            return index;\n        }\n         return linearSearchHelper(arr,index+1,target);\n            }    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(linearSearchHelper(arr, a, b));\n    }\n}\n/*TC: O(N)\n  SC:O(N) \n*/"
---

### Linear Search Using Recursion

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
