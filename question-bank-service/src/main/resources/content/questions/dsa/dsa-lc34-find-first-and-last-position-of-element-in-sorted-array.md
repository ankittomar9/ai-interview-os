---
slug: dsa-lc34-find-first-and-last-position-of-element-in-sorted-array
title: Find First and Last Position of Element in Sorted Array
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [binary-search, arrays]
est_minutes: 25
tags:
- binary-search
- mid
- lc-34
buildProfile: judge0
source: inspired-by:operator-corpus/Q_118_Find_First_and_Last_Position.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: 0 0
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: 2 2
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: 1 1
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: 0 0
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: 1 1
  weight: 50
hints:
- Analyze the problem using Binary Search algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Binary Search techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Find First and Last Position of Element in Sorted Array


  This problem evaluates core techniques in Binary Search. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] searchRange(int[] nums,int target) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = searchRange(arr, target);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int[] searchRange(int[] nums,int target){\n        int[] result={-1,-1};\n\n        int left=0;int right=nums.length-1;\n\n        while(left<=right){\n            int mid=left+(right-left)/2;\n            if(nums[mid]==target){\n                result[0]=mid;\n                right=mid-1;\n            }else if(nums[mid]<target){\n                left=mid+1;\n            }else{\n                right=mid-1;\n            }\n        }\n\n          left=0; right=nums.length-1;\n\n        while(left<=right){\n            int mid=left+(right-left)/2;\n            if(nums[mid]==target){\n                result[1]=mid;\n                left=mid+1;\n            }else if(nums[mid]<target){\n                left=mid+1;\n            }else{\n                right=mid-1;\n            }\n        }\n        return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner\
  \ sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = searchRange(arr, target);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Find First and Last Position of Element in Sorted Array

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
