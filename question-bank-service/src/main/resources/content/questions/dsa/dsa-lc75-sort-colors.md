---
slug: dsa-lc75-sort-colors
title: Sort Colors
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [two-pointers, arrays]
est_minutes: 25
tags:
- two-pointers
- mid
- lc-75
buildProfile: judge0
source: inspired-by:operator-corpus/Q_38_Sort_Colors.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 1 3 4 5 2
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 1 2 3 4
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: 1 -3 4 -1 2 -2
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 10 10 10
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 1 3 2 4 5
  weight: 50
hints:
- Analyze the problem using Two Pointers algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Two Pointers techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Sort Colors


  This problem evaluates core techniques in Two Pointers. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void sortColors(int[] nums) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        sortColors(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static void sortColors(int[] nums){\n        if(nums==null || nums.length<=1){ return;}\n        int low=0;\n        int mid=0;\n        int high=nums.length-1;\n\n        while(mid<=high){\n            if(nums[mid]==0){\n                swap(nums, mid, low);\n                low++;mid++;\n            }else if(nums[mid]==1){\n                mid++;\n            }else{\n                swap(nums, mid, high);\n                high--;\n            }\n        }\n\n    }\n    public static void swap(int[] nums,int i,int j){\n        int temp=nums[i];\n        nums[i]=nums[j];\n        nums[j]=temp;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        sortColors(arr);\n        for (int\
  \ i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Sort Colors

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
